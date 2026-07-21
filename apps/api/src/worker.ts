import { Queue, Worker } from "bullmq";
import type { Prisma } from "@prisma/client";
import { env } from "./env.js";
import { dateString } from "./domain.js";
import { getSettings, prisma } from "./prisma.js";
import { daysBetween, zonedDateKey } from "./scheduling.js";

async function scanNotifications(now = new Date()) {
  const settings = await getSettings();
  const today = zonedDateKey(now, settings.timezone);
  const notifications: Prisma.NotificationCreateManyInput[] = [];

  if (settings.dueEnabled) {
    const resources = await prisma.resource.findMany({
      where: { archivedAt: null, status: { not: "COMPLETED" }, targetDate: { not: null }, skill: { archivedAt: null, notificationsEnabled: true } },
      include: { skill: true }
    });
    for (const resource of resources) {
      const target = dateString(resource.targetDate)!;
      const remaining = daysBetween(today, target);
      if (remaining <= settings.dueLeadDays) {
        const overdue = remaining < 0;
        notifications.push({
          type: "RESOURCE_DUE",
          skillId: resource.skillId,
          resourceId: resource.id,
          title: overdue ? "Resource overdue" : "Resource due soon",
          message: `${resource.title} in ${resource.skill.name} ${overdue ? `was due ${Math.abs(remaining)} day(s) ago` : remaining === 0 ? "is due today" : `is due in ${remaining} day(s)`}.`,
          dedupeKey: `resource-due:${resource.id}:${target}:${settings.dueLeadDays}`
        });
      }
    }

    const certifications = await prisma.certification.findMany({
      where: { completedAt: null, targetDate: { not: null }, skill: { archivedAt: null, notificationsEnabled: true } },
      include: { skill: true }
    });
    for (const certification of certifications) {
      const target = dateString(certification.targetDate)!;
      const remaining = daysBetween(today, target);
      if (remaining <= settings.dueLeadDays) {
        const overdue = remaining < 0;
        notifications.push({
          type: "CERTIFICATION_DUE",
          skillId: certification.skillId,
          certificationId: certification.id,
          title: overdue ? "Certification overdue" : "Certification due soon",
          message: `${certification.title} in ${certification.skill.name} ${overdue ? `was due ${Math.abs(remaining)} day(s) ago` : remaining === 0 ? "is due today" : `is due in ${remaining} day(s)`}.`,
          dedupeKey: `certification-due:${certification.id}:${target}:${settings.dueLeadDays}`
        });
      }
    }
  }

  if (settings.inactivityEnabled) {
    const cutoff = new Date(now.getTime() - settings.inactivityDays * 86_400_000);
    const skills = await prisma.skill.findMany({
      where: { archivedAt: null, notificationsEnabled: true, lastProgressAt: { lte: cutoff } },
      include: { resources: { where: { archivedAt: null } }, certification: true }
    });
    for (const skill of skills) {
      const completedResources = skill.resources.filter((resource) => resource.status === "COMPLETED").length;
      const learningComplete = !skill.certification && skill.resources.length > 0 && completedResources === skill.resources.length;
      if (skill.certification?.completedAt || learningComplete) continue;
      notifications.push({
        type: "SKILL_INACTIVE",
        skillId: skill.id,
        title: "Skill needs attention",
        message: `${skill.name} has had no learning progress for at least ${settings.inactivityDays} days.`,
        dedupeKey: `skill-inactive:${skill.id}:${skill.lastProgressAt.toISOString()}:${settings.inactivityDays}`
      });
    }
  }

  if (notifications.length) await prisma.notification.createMany({ data: notifications, skipDuplicates: true });
  return notifications.length;
}

const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username ? decodeURIComponent(redisUrl.username) : undefined,
  password: redisUrl.password ? decodeURIComponent(redisUrl.password) : undefined,
  db: redisUrl.pathname.length > 1 ? Number(redisUrl.pathname.slice(1)) : 0,
  maxRetriesPerRequest: null,
  ...(redisUrl.protocol === "rediss:" ? { tls: {} } : {})
};
const queue = new Queue("notification-scan", { connection });
await queue.add("scan", {}, { repeat: { every: 60 * 60 * 1000 }, jobId: "scheduled-notification-scan", removeOnComplete: 50, removeOnFail: 100 });
await queue.add("scan", {}, { jobId: `startup-${Date.now()}`, removeOnComplete: true });

const worker = new Worker("notification-scan", async () => scanNotifications(), { connection, concurrency: 1 });
worker.on("completed", (job) => console.log(`Notification scan ${job.id} completed`));
worker.on("failed", (job, error) => console.error(`Notification scan ${job?.id} failed`, error));

async function shutdown() {
  await worker.close();
  await queue.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
