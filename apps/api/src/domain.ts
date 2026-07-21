import type { Certification, Resource } from "@prisma/client";

export function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
}

export function parseDate(value?: string | null) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export function dateString(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function certificationState(certification: Certification | null, resources: Resource[]) {
  if (!certification) return null;
  if (certification.completedAt) return "COMPLETED" as const;
  const active = resources.filter((item) => !item.archivedAt);
  return active.length > 0 && active.every((item) => item.status === "COMPLETED")
    ? "READY" as const
    : "LOCKED" as const;
}

export function serializeSkill<T extends { resources: Resource[]; certification: Certification | null }>(skill: T) {
  const active = skill.resources.filter((resource) => !resource.archivedAt);
  const completed = active.filter((resource) => resource.status === "COMPLETED").length;
  const totalMinutes = active.reduce((sum, resource) => sum + resource.estimatedDurationMinutes, 0);
  const completedMinutes = active.filter((resource) => resource.status === "COMPLETED").reduce((sum, resource) => sum + resource.estimatedDurationMinutes, 0);
  const certificationStatus = certificationState(skill.certification, active);
  const lifecycle = certificationStatus === "COMPLETED"
    ? "CERTIFIED"
    : !skill.certification && active.length > 0 && completed === active.length
      ? "LEARNING_COMPLETE"
      : certificationStatus === "READY"
        ? "READY_TO_CERTIFY"
        : "ACTIVE";

  return {
    ...skill,
    resources: skill.resources.map((resource) => ({ ...resource, targetDate: dateString(resource.targetDate) })),
    certification: skill.certification ? { ...skill.certification, targetDate: dateString(skill.certification.targetDate), state: certificationStatus } : null,
    progress: { total: active.length, completed, percent: active.length ? Math.round((completed / active.length) * 100) : 0, totalMinutes, completedMinutes },
    lifecycle
  };
}
