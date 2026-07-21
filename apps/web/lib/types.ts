export type Resource = {
  id: string; title: string; url: string; estimatedDurationMinutes: number; targetDate: string | null;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED"; archivedAt: string | null; position: number;
};
export type Certification = {
  id: string; title: string; url: string | null; targetDate: string | null; proofUrl: string | null;
  completedAt: string | null; state: "LOCKED" | "READY" | "COMPLETED";
};
export type Skill = {
  id: string; name: string; description: string; notificationsEnabled: boolean; archivedAt: string | null;
  lastProgressAt: string; resources: Resource[]; certification: Certification | null;
  lifecycle: "ACTIVE" | "LEARNING_COMPLETE" | "READY_TO_CERTIFY" | "CERTIFIED";
  progress: { total: number; completed: number; percent: number; totalMinutes: number; completedMinutes: number };
};
export type DashboardRow = {
  id: string; name: string; recentCompletions: number; completedResources: number; totalResources: number;
  completedMinutes: number; totalMinutes: number; percent: number; daysInactive: number; neglected: boolean; lifecycle: string;
};
export type Dashboard = {
  summary: { activeSkills: number; completedResources: number; certifications: number; unreadNotifications: number };
  windowDays: number; inactivityDays: number; ranking: DashboardRow[]; neglected: DashboardRow[];
};
