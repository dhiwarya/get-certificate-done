import express from "express";
import cors from "cors";
import helmet from "helmet";
import { z } from "zod";
import {
  certificationInputSchema,
  notificationSettingsSchema,
  reorderSchema,
  resourceInputSchema,
  resourcePatchSchema,
  skillInputSchema,
  skillPatchSchema
} from "@progress/contracts";
import { env } from "./env.js";
import { AppError, errorHandler, notFound } from "./errors.js";
import { certificationState, normalizeName, parseDate, serializeSkill } from "./domain.js";
import { buildDashboard } from "./dashboard.js";
import { getSettings, prisma } from "./prisma.js";

const asyncRoute = (handler: express.RequestHandler): express.RequestHandler => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const uuid = z.string().uuid();

async function detailedSkill(id: string, includeArchivedResources = true) {
  return prisma.skill.findUnique({
    where: { id },
    include: {
      resources: { where: includeArchivedResources ? {} : { archivedAt: null }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
      certification: true
    }
  });
}

async function editableSkill(id: string) {
  const skill = await detailedSkill(id);
  if (!skill || skill.archivedAt) throw new AppError(404, "SKILL_NOT_FOUND", "Skill not found.");
  if (skill.certification?.completedAt) throw new AppError(409, "PLAN_CERTIFIED", "Reopen the certification before changing this plan.");
  return skill;
}

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(express.json({ limit: "100kb" }));

app.get("/health/live", (_req, res) => res.json({ status: "ok" }));
app.get("/health/ready", asyncRoute(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ status: "ready" });
}));

const api = express.Router();

api.get("/dashboard", asyncRoute(async (_req, res) => res.json(await buildDashboard(prisma))));

api.get("/skills", asyncRoute(async (req, res) => {
  const archived = req.query.archived === "true";
  const skills = await prisma.skill.findMany({
    where: { archivedAt: archived ? { not: null } : null },
    include: { resources: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] }, certification: true },
    orderBy: [{ position: "asc" }, { name: "asc" }]
  });
  res.json(skills.map((skill) => serializeSkill(skill)));
}));

api.post("/skills", asyncRoute(async (req, res) => {
  const input = skillInputSchema.parse(req.body);
  const max = await prisma.skill.aggregate({ _max: { position: true } });
  const skill = await prisma.skill.create({
    data: { ...input, nameKey: normalizeName(input.name), position: (max._max.position ?? -1) + 1 },
    include: { resources: true, certification: true }
  });
  res.status(201).json(serializeSkill(skill));
}));

api.patch("/skills/reorder", asyncRoute(async (req, res) => {
  const { ids } = reorderSchema.parse(req.body);
  const active = await prisma.skill.findMany({ where: { archivedAt: null }, select: { id: true } });
  if (active.length !== ids.length || active.some((skill) => !ids.includes(skill.id))) {
    throw new AppError(400, "INVALID_ORDER", "The order must contain every active skill exactly once.");
  }
  await prisma.$transaction(ids.map((id, position) => prisma.skill.update({ where: { id }, data: { position } })));
  res.status(204).end();
}));

api.get("/skills/:skillId", asyncRoute(async (req, res) => {
  const id = uuid.parse(req.params.skillId);
  const skill = await detailedSkill(id);
  if (!skill) throw new AppError(404, "SKILL_NOT_FOUND", "Skill not found.");
  res.json(serializeSkill(skill));
}));

api.patch("/skills/:skillId", asyncRoute(async (req, res) => {
  const id = uuid.parse(req.params.skillId);
  const input = skillPatchSchema.parse(req.body);
  const existing = await prisma.skill.findUnique({ where: { id } });
  if (!existing) throw new AppError(404, "SKILL_NOT_FOUND", "Skill not found.");
  const skill = await prisma.skill.update({
    where: { id },
    data: { ...input, ...(input.name ? { nameKey: normalizeName(input.name) } : {}) },
    include: { resources: { orderBy: { position: "asc" } }, certification: true }
  });
  res.json(serializeSkill(skill));
}));

api.delete("/skills/:skillId", asyncRoute(async (req, res) => {
  const id = uuid.parse(req.params.skillId);
  await prisma.skill.update({ where: { id }, data: { archivedAt: new Date() } }).catch(() => {
    throw new AppError(404, "SKILL_NOT_FOUND", "Skill not found.");
  });
  res.status(204).end();
}));

api.post("/skills/:skillId/restore", asyncRoute(async (req, res) => {
  const id = uuid.parse(req.params.skillId);
  const skill = await prisma.skill.update({
    where: { id }, data: { archivedAt: null }, include: { resources: { orderBy: { position: "asc" } }, certification: true }
  }).catch(() => { throw new AppError(404, "SKILL_NOT_FOUND", "Skill not found."); });
  res.json(serializeSkill(skill));
}));

api.post("/skills/:skillId/resources", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const input = resourceInputSchema.parse(req.body);
  const skill = await editableSkill(skillId);
  const active = skill.resources.filter((resource) => !resource.archivedAt);
  const resource = await prisma.resource.create({
    data: {
      skillId,
      title: input.title,
      url: input.url,
      estimatedDurationMinutes: input.estimatedDurationMinutes,
      targetDate: parseDate(input.targetDate),
      status: input.status,
      position: active.reduce((max, item) => Math.max(max, item.position), -1) + 1,
      startedAt: input.status === "IN_PROGRESS" ? new Date() : null,
      completedAt: input.status === "COMPLETED" ? new Date() : null
    }
  });
  res.status(201).json(resource);
}));

api.patch("/skills/:skillId/resources/reorder", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const { ids } = reorderSchema.parse(req.body);
  const skill = await editableSkill(skillId);
  const active = skill.resources.filter((resource) => !resource.archivedAt);
  if (active.length !== ids.length || active.some((resource) => !ids.includes(resource.id))) {
    throw new AppError(400, "INVALID_ORDER", "The order must contain every active resource exactly once.");
  }
  await prisma.$transaction(ids.map((id, position) => prisma.resource.update({ where: { id }, data: { position } })));
  res.status(204).end();
}));

api.patch("/skills/:skillId/resources/:resourceId", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const resourceId = uuid.parse(req.params.resourceId);
  const input = resourcePatchSchema.parse(req.body);
  const skill = await editableSkill(skillId);
  const existing = skill.resources.find((resource) => resource.id === resourceId);
  if (!existing) throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found.");
  const progressChanged = Boolean(input.status && input.status !== existing.status);
  const now = new Date();
  const data = {
    ...input,
    ...(input.targetDate !== undefined ? { targetDate: parseDate(input.targetDate) } : {}),
    ...(input.status === "PLANNED" ? { startedAt: null, completedAt: null } : {}),
    ...(input.status === "IN_PROGRESS" ? { startedAt: existing.startedAt ?? now, completedAt: null } : {}),
    ...(input.status === "COMPLETED" ? { startedAt: existing.startedAt ?? now, completedAt: now } : {})
  };
  const resource = await prisma.$transaction(async (tx) => {
    const updated = await tx.resource.update({ where: { id: resourceId }, data });
    if (progressChanged) await tx.skill.update({ where: { id: skillId }, data: { lastProgressAt: now } });
    return updated;
  });
  res.json(resource);
}));

api.delete("/skills/:skillId/resources/:resourceId", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const resourceId = uuid.parse(req.params.resourceId);
  const skill = await editableSkill(skillId);
  if (!skill.resources.some((resource) => resource.id === resourceId)) throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found.");
  await prisma.resource.update({ where: { id: resourceId }, data: { archivedAt: new Date() } });
  res.status(204).end();
}));

api.post("/skills/:skillId/resources/:resourceId/restore", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const resourceId = uuid.parse(req.params.resourceId);
  const skill = await editableSkill(skillId);
  const resource = skill.resources.find((item) => item.id === resourceId);
  if (!resource) throw new AppError(404, "RESOURCE_NOT_FOUND", "Resource not found.");
  const maxPosition = skill.resources.filter((item) => !item.archivedAt).reduce((max, item) => Math.max(max, item.position), -1);
  res.json(await prisma.resource.update({ where: { id: resourceId }, data: { archivedAt: null, position: maxPosition + 1 } }));
}));

api.put("/skills/:skillId/certification", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const input = certificationInputSchema.parse(req.body);
  await editableSkill(skillId);
  const data = { title: input.title, url: input.url || null, targetDate: parseDate(input.targetDate), proofUrl: input.proofUrl || null };
  const certification = await prisma.certification.upsert({ where: { skillId }, update: data, create: { ...data, skillId } });
  res.json(certification);
}));

api.post("/skills/:skillId/certification/complete", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const body = z.object({ proofUrl: z.string().url().refine((url) => /^https?:\/\//.test(url)).optional().nullable() }).parse(req.body ?? {});
  const skill = await detailedSkill(skillId);
  if (!skill || skill.archivedAt || !skill.certification) throw new AppError(404, "CERTIFICATION_NOT_FOUND", "Certification not found.");
  if (certificationState(skill.certification, skill.resources) !== "READY") {
    throw new AppError(409, "CERTIFICATION_LOCKED", "Complete every active resource before completing the certification.");
  }
  const now = new Date();
  const certification = await prisma.$transaction(async (tx) => {
    const updated = await tx.certification.update({ where: { skillId }, data: { completedAt: now, proofUrl: body.proofUrl || skill.certification!.proofUrl } });
    await tx.skill.update({ where: { id: skillId }, data: { lastProgressAt: now } });
    return updated;
  });
  res.json(certification);
}));

api.post("/skills/:skillId/certification/reopen", asyncRoute(async (req, res) => {
  const skillId = uuid.parse(req.params.skillId);
  const skill = await detailedSkill(skillId);
  if (!skill || !skill.certification) throw new AppError(404, "CERTIFICATION_NOT_FOUND", "Certification not found.");
  const now = new Date();
  const certification = await prisma.$transaction(async (tx) => {
    const updated = await tx.certification.update({ where: { skillId }, data: { completedAt: null, proofUrl: null } });
    await tx.skill.update({ where: { id: skillId }, data: { lastProgressAt: now } });
    return updated;
  });
  res.json(certification);
}));

api.get("/notification-settings", asyncRoute(async (_req, res) => res.json(await getSettings())));
api.patch("/notification-settings", asyncRoute(async (req, res) => {
  const input = notificationSettingsSchema.parse(req.body);
  try { new Intl.DateTimeFormat("en-US", { timeZone: input.timezone }); } catch { throw new AppError(400, "INVALID_TIMEZONE", "Use a valid IANA timezone."); }
  res.json(await prisma.notificationSettings.upsert({ where: { id: 1 }, update: input, create: { id: 1, ...input } }));
}));

api.get("/notifications", asyncRoute(async (req, res) => {
  const query = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20) }).parse(req.query);
  const [items, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({ skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { createdAt: "desc" } }),
    prisma.notification.count(),
    prisma.notification.count({ where: { readAt: null } })
  ]);
  res.json({ items, total, unread, page: query.page, pageSize: query.pageSize });
}));

api.patch("/notifications/:notificationId/read", asyncRoute(async (req, res) => {
  const id = uuid.parse(req.params.notificationId);
  const notification = await prisma.notification.update({ where: { id }, data: { readAt: new Date() } })
    .catch(() => { throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification not found."); });
  res.json(notification);
}));

api.post("/notifications/read-all", asyncRoute(async (_req, res) => {
  const result = await prisma.notification.updateMany({ where: { readAt: null }, data: { readAt: new Date() } });
  res.json({ updated: result.count });
}));

app.use("/api/v1", api);
app.use(notFound);
app.use(errorHandler);
