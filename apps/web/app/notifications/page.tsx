"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

type Notification = { id: string; skillId: string; type: string; title: string; message: string; readAt: string | null; createdAt: string };
type Result = { items: Notification[]; total: number; unread: number; page: number; pageSize: number };

export default function NotificationsPage() {
  const [data, setData] = useState<Result | null>(null); const [page, setPage] = useState(1); const [error, setError] = useState("");
  const load = useCallback(() => api<Result>(`/notifications?page=${page}&pageSize=20`).then(setData).catch((err) => setError(err.message)), [page]);
  useEffect(() => { void load(); }, [load]);
  const markRead = async (id: string) => { await api(`/notifications/${id}/read`, { method: "PATCH" }); load(); };
  const markAll = async () => { await api("/notifications/read-all", { method: "POST" }); load(); };
  return <>
    <header className="page-head"><div><span className="eyebrow">Inbox</span><h1>Notifications</h1><p>Deadline and inactivity reminders generated inside your private workspace.</p></div>{data && data.unread > 0 && <button className="secondary" onClick={markAll}>Mark all read</button>}</header>
    {error && <p className="error">{error}</p>}
    <section className="card">{!data ? <div className="empty">Loading inbox…</div> : data.items.length === 0 ? <div className="empty">Your inbox is clear.</div> : data.items.map((item) => <article className={`notification ${item.readAt ? "" : "unread"}`} key={item.id}>
      <div className="row-main"><div><span className="pill muted">{item.type.replaceAll("_", " ")}</span><h3 style={{ margin: "9px 0 5px" }}>{item.title}</h3><p className="subtle" style={{ margin: 0 }}>{item.message}</p><div className="meta">{new Date(item.createdAt).toLocaleString()}</div></div><div className="actions"><Link className="button secondary" href={`/skills/${item.skillId}`}>Open skill</Link>{!item.readAt && <button onClick={() => markRead(item.id)}>Mark read</button>}</div></div>
    </article>)}</section>
    {data && data.total > data.pageSize && <div className="actions" style={{ marginTop: 16 }}><button className="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="meta">Page {page} of {Math.ceil(data.total / data.pageSize)}</span><button className="secondary" disabled={page * data.pageSize >= data.total} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
  </>;
}
