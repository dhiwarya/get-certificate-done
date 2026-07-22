"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BellRing, CheckCheck, ClockAlert, ExternalLink, Flame, Inbox } from "lucide-react";
import { api } from "../../lib/api";
import { EmptyState, LoadingState, StatusBadge } from "../../components/ui";

type Notification = { id: string; skillId: string; type: string; title: string; message: string; readAt: string | null; createdAt: string };
type Result = { items: Notification[]; total: number; unread: number; page: number; pageSize: number };

function notificationIcon(type: string) {
  if (type.includes("INACTIV")) return Flame;
  if (type.includes("OVERDUE") || type.includes("DUE")) return ClockAlert;
  return BellRing;
}

export default function NotificationsPage() {
  const [data, setData] = useState<Result | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const load = useCallback(() => api<Result>(`/notifications?page=${page}&pageSize=20`).then(setData).catch((err) => setError(err.message)), [page]);
  useEffect(() => { void load(); }, [load]);
  const markRead = async (id: string) => { await api(`/notifications/${id}/read`, { method: "PATCH" }); load(); };
  const markAll = async () => { await api("/notifications/read-all", { method: "POST" }); load(); };

  return <>
    <header className="page-head">
      <div className="page-head-copy"><span className="eyebrow">Activity inbox</span><h1>Signals worth noticing</h1><p>Deadlines and quiet plans surface here, without turning your learning into noise.</p></div>
      {data && data.unread > 0 && <button className="secondary" onClick={markAll}><CheckCheck size={17} /> Mark all read</button>}
    </header>
    {error && <p className="error">{error}</p>}
    <section className="card notification-list">
      {!data ? <LoadingState label="Checking the inbox…" /> : data.items.length === 0 ? <EmptyState icon={Inbox} title="All clear" description="There are no reminders waiting for you. Your next move is yours to choose." /> : data.items.map((item) => {
        const Icon = notificationIcon(item.type);
        return <article className={`notification ${item.readAt ? "" : "unread"}`} key={item.id}>
          <div className="notification-content">
            <span className="notification-icon" aria-hidden="true"><Icon size={18} /></span>
            <div>
              <StatusBadge tone={item.readAt ? "neutral" : "accent"}>{item.type.replaceAll("_", " ")}</StatusBadge>
              <h2>{item.title}</h2>
              <p className="subtle notification-message">{item.message}</p>
              <div className="meta">{new Date(item.createdAt).toLocaleString()}</div>
            </div>
            <div className="actions"><Link className="button secondary" href={`/skills/${item.skillId}`}>Open skill <ExternalLink size={14} /></Link>{!item.readAt && <button onClick={() => markRead(item.id)}><CheckCheck size={15} /> Mark read</button>}</div>
          </div>
        </article>;
      })}
    </section>
    {data && data.total > data.pageSize && <nav className="pagination" aria-label="Notification pages">
      <button className="secondary" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ArrowLeft size={15} /> Previous</button>
      <span className="meta">Page {page} of {Math.ceil(data.total / data.pageSize)}</span>
      <button className="secondary" aria-label="Next page" disabled={page * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>Next <ArrowRight size={15} /></button>
    </nav>}
  </>;
}
