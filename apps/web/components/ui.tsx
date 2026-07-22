import type { LucideIcon } from "lucide-react";

export function ProgressBar({ value, label, tone = "accent" }: { value: number; label?: string; tone?: "accent" | "warning" | "complete" }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return <div className="progress-wrap">
    {label && <div className="progress-label"><span>{label}</span><strong>{safeValue}%</strong></div>}
    <div className="progress" role="progressbar" aria-label={label ?? "Progress"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeValue}>
      <i className={`progress-fill progress-${tone}`} style={{ width: `${safeValue}%` }} />
    </div>
  </div>;
}

export function StatusBadge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "accent" | "warning" | "complete" | "danger" }) {
  return <span className={`status-badge status-${tone}`}><span className="status-marker" aria-hidden="true" />{children}</span>;
}

export function EmptyState({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children?: React.ReactNode }) {
  return <div className="empty-state">
    <span className="empty-icon" aria-hidden="true"><Icon size={24} /></span>
    <strong>{title}</strong>
    <p>{description}</p>
    {children}
  </div>;
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="loading-state" aria-live="polite" aria-busy="true">
    <span className="loading-orbit" aria-hidden="true" />
    <span>{label}</span>
  </div>;
}
