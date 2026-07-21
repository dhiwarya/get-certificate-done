import type { PrismaClient } from "@prisma/client";
import { getSettings } from "./prisma.js";
import { sortRanking } from "./metrics.js";

export async function buildDashboard(db: PrismaClient) {
  const settings = await getSettings();
  const since = new Date(Date.now() - 30 * 86_400_000);
  const skills = await db.skill.findMany({
    where: { archivedAt: null },
    include: { resources: { where: { archivedAt: null } }, certification: true },
    orderBy: [{ position: "asc" }, { name: "asc" }]
  });

  const rows = skills.map((skill) => {
    const completed = skill.resources.filter((resource) => resource.status === "COMPLETED");
    const recent = completed.filter((resource) => resource.completedAt && resource.completedAt >= since);
    const lastCompletionAt = recent.reduce<Date | null>((latest, resource) => !latest || resource.completedAt! > latest ? resource.completedAt : latest, null);
    const totalMinutes = skill.resources.reduce((sum, resource) => sum + resource.estimatedDurationMinutes, 0);
    const completedMinutes = completed.reduce((sum, resource) => sum + resource.estimatedDurationMinutes, 0);
    const isCertified = Boolean(skill.certification?.completedAt);
    const learningComplete = !skill.certification && skill.resources.length > 0 && completed.length === skill.resources.length;
    const daysInactive = Math.floor((Date.now() - skill.lastProgressAt.getTime()) / 86_400_000);
    const unfinished = !isCertified && !learningComplete;
    return {
      id: skill.id,
      name: skill.name,
      recentCompletions: recent.length,
      lastCompletionAt,
      completedResources: completed.length,
      totalResources: skill.resources.length,
      completedMinutes,
      totalMinutes,
      percent: skill.resources.length ? Math.round((completed.length / skill.resources.length) * 100) : 0,
      daysInactive,
      neglected: unfinished && daysInactive >= settings.inactivityDays,
      lifecycle: isCertified ? "CERTIFIED" : learningComplete ? "LEARNING_COMPLETE" : "ACTIVE"
    };
  });

  const ranking = sortRanking(rows);
  const neglected = rows.filter((row) => row.neglected).sort((a, b) => b.daysInactive - a.daysInactive || a.name.localeCompare(b.name));
  const unreadNotifications = await db.notification.count({ where: { readAt: null } });

  return {
    summary: {
      activeSkills: rows.filter((row) => row.lifecycle === "ACTIVE").length,
      completedResources: rows.reduce((sum, row) => sum + row.completedResources, 0),
      certifications: rows.filter((row) => row.lifecycle === "CERTIFIED").length,
      unreadNotifications
    },
    windowDays: 30,
    inactivityDays: settings.inactivityDays,
    ranking,
    neglected
  };
}
