"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, Bell, BookOpenCheck, CirclePlus, Compass, Flame, Trophy } from "lucide-react";
import { api, formatMinutes } from "../lib/api";
import type { Dashboard } from "../lib/types";
import { EmptyState, LoadingState, ProgressBar, StatusBadge } from "../components/ui";

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api<Dashboard>("/dashboard").then(setData).catch((err) => setError(err.message)); }, []);

  return <>
    <header className="page-head">
      <div className="page-head-copy">
        <span className="eyebrow">Guild hall</span>
        <h1>Your learning pulse</h1>
        <p>Keep momentum visible, finish the next meaningful step, and rescue plans before they gather dust.</p>
      </div>
      <Link className="button" href="/skills/new"><CirclePlus size={18} /> Add a skill</Link>
    </header>
    {error && <p className="error">{error}</p>}
    {!data ? <LoadingState label="Reading your progress…" /> : <>
      <section className="summary-grid" aria-label="Progress summary">
        <div className="stat"><span className="stat-icon"><Compass size={17} /></span><span className="stat-label">Active skills</span><strong>{data.summary.activeSkills}</strong></div>
        <div className="stat"><span className="stat-icon"><BookOpenCheck size={17} /></span><span className="stat-label">Resources learned</span><strong>{data.summary.completedResources}</strong></div>
        <div className="stat"><span className="stat-icon"><Award size={17} /></span><span className="stat-label">Certifications</span><strong>{data.summary.certifications}</strong></div>
        <div className="stat"><span className="stat-icon"><Bell size={17} /></span><span className="stat-label">Unread notices</span><strong>{data.summary.unreadNotifications}</strong></div>
      </section>
      <section className="dashboard-layout">
        <div className="card">
          <div className="card-heading">
            <div><h2>Quest board</h2><p className="card-kicker">Progress made in the last {data.windowDays} days</p></div>
            <Trophy size={21} className="subtle" aria-hidden="true" />
          </div>
          {data.ranking.length === 0 ? <EmptyState icon={Compass} title="Your board is waiting" description="Add a skill and its first resource to begin building momentum."><Link className="button secondary" href="/skills/new">Start a plan</Link></EmptyState> : data.ranking.map((row, index) => <div className="rank-row" key={row.id}>
            <div className="row-main">
              <span className={`rank-position ${index === 0 ? "top" : ""}`}>{index + 1}</span>
              <div className="row-copy">
                <Link href={`/skills/${row.id}`}>{row.name}</Link>
                <div className="meta">{row.completedResources}/{row.totalResources} resources · {formatMinutes(row.completedMinutes)} learned</div>
              </div>
              <strong className="score">{row.recentCompletions} <small>done</small></strong>
            </div>
            <ProgressBar value={row.percent} />
          </div>)}
        </div>
        <div className="card attention-card">
          <div className="card-heading">
            <div><h2>Needs attention</h2><p className="card-kicker">Quiet for {data.inactivityDays}+ days</p></div>
            <Flame size={21} className="subtle" aria-hidden="true" />
          </div>
          {data.neglected.length === 0 ? <EmptyState icon={BookOpenCheck} title="A healthy rhythm" description="Every active plan has seen recent progress. Keep the streak of good habits going." /> : data.neglected.map((row) => <div className="attention-row" key={row.id}>
            <Link className="attention-link" href={`/skills/${row.id}`}><span>{row.name}</span><StatusBadge tone="warning">{row.daysInactive} days</StatusBadge></Link>
            <div className="meta">{row.completedResources}/{row.totalResources} resources complete</div>
          </div>)}
        </div>
      </section>
    </>}
  </>;
}
