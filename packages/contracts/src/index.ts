import { z } from "zod";

export const resourceStatuses = ["PLANNED", "IN_PROGRESS", "COMPLETED"] as const;
export const resourceStatusSchema = z.enum(resourceStatuses);

const optionalUrl = z.union([z.string().url().refine((url) => /^https?:\/\//.test(url), "Use an http(s) URL"), z.literal("")]).optional().nullable();
const optionalDate = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional().nullable();

export const skillInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(1000).optional().default(""),
  notificationsEnabled: z.boolean().optional().default(true)
});
export const skillPatchSchema = skillInputSchema.partial();

export const resourceInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: z.string().url().refine((url) => /^https?:\/\//.test(url), "Use an http(s) URL"),
  estimatedDurationMinutes: z.number().int().positive().max(525600),
  targetDate: optionalDate,
  status: resourceStatusSchema.optional().default("PLANNED")
});
export const resourcePatchSchema = resourceInputSchema.partial();

export const certificationInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  url: optionalUrl,
  targetDate: optionalDate,
  proofUrl: optionalUrl
});

export const notificationSettingsSchema = z.object({
  timezone: z.string().trim().min(1).max(100),
  dueEnabled: z.boolean(),
  dueLeadDays: z.number().int().min(0).max(365),
  inactivityEnabled: z.boolean(),
  inactivityDays: z.number().int().min(1).max(365)
});

export const reorderSchema = z.object({ ids: z.array(z.string().uuid()).min(1) });

export type SkillInput = z.infer<typeof skillInputSchema>;
export type ResourceInput = z.infer<typeof resourceInputSchema>;
export type CertificationInput = z.infer<typeof certificationInputSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
