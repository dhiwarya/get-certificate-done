"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatMinutes } from "../lib/api";
import type { Dashboard } from "../lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Dashboard>("/dashboard").then(setData).catch((err) => setError(err.message)); }, []);

  return <>
    <header className="page-head"><div><span className="eyebrow">Master dashboard</span><h1>Your learning pulse</h1><p>See where momentum is building and which skills need your attention.</p></div><Link className="button" href="/skills/new">Add a skill</Link></header>
    {error && <p className="error">{error}</p>}
    {!data ? <div className="empty">Loading your progress…</div> : <>
      <section className="summary-grid">
        <div className="stat"><span>Active skills</span><strong>{data.summary.activeSkills}</strong></div>
        <div className="stat"><span>Resources learned</span><strong>{data.summary.completedResources}</strong></div>
        <div className="stat"><span>Certifications</span><strong>{data.summary.certifications}</strong></div>
        <div className="stat"><span>Unread notices</span><strong>{data.summary.unreadNotifications}</strong></div>
      </section>
      <section className="grid-2">
        <div className="card"><h2>Progress velocity</h2><p className="meta">Resources completed in the last {data.windowDays} days</p>
          {data.ranking.length === 0 ? <div className="empty">Add your first skill to begin tracking.</div> : data.ranking.map((row, index) => <div className="rank-row" key={row.id}>
            <div className="row-main"><div><span className="meta">#{index + 1}</span> <Link href={`/skills/${row.id}`}>{row.name}</Link><div className="meta">{row.completedResources}/{row.totalResources} resources · {formatMinutes(row.completedMinutes)} learned</div></div><strong>{row.recentCompletions} <span className="meta">done</span></strong></div>
            <div className="progress"><i style={{ width: `${row.percent}%` }} /></div>
          </div>)}
        </div>
        <div className="card"><h2>Needs attention</h2><p className="meta">No progress for {data.inactivityDays}+ days</p>
          {data.neglected.length === 0 ? <div className="empty">Nothing is being neglected. Nice rhythm.</div> : data.neglected.map((row) => <div className="rank-row" key={row.id}><div className="row-main"><Link href={`/skills/${row.id}`}>{row.name}</Link><span className="pill warn">{row.daysInactive} days</span></div><div className="meta">{row.completedResources}/{row.totalResources} resources complete</div></div>)}
        </div>
      </section>
    </>}
  </>;
}
