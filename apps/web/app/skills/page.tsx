"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArchiveRestore, CirclePlus, LibraryBig } from "lucide-react";
import { api, formatMinutes } from "../../lib/api";
import type { Skill } from "../../lib/types";
import { EmptyState, LoadingState, ProgressBar, StatusBadge } from "../../components/ui";

function lifecycleTone(lifecycle: Skill["lifecycle"]) {
  if (lifecycle === "CERTIFIED") return "complete" as const;
  if (lifecycle === "READY_TO_CERTIFY") return "warning" as const;
  if (lifecycle === "LEARNING_COMPLETE") return "accent" as const;
  return "neutral" as const;
}

export default function SkillsPage() {
  const [archived, setArchived] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(() => {
    return api<Skill[]>(`/skills${archived ? "?archived=true" : ""}`).then(setSkills).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [archived]);
  useEffect(() => { void load(); }, [load]);
  const restore = async (id: string) => { await api(`/skills/${id}/restore`, { method: "POST" }); load(); };

  return <>
    <header className="page-head">
      <div className="page-head-copy"><span className="eyebrow">Learning plans</span><h1>Your skills</h1><p>Each plan is a path: choose the steps, keep the pace visible, and finish with proof.</p></div>
      <Link className="button" href="/skills/new"><CirclePlus size={18} /> Add a skill</Link>
    </header>
    <div className="toolbar">
      <div className="segmented" role="group" aria-label="Skill visibility">
        <button className={!archived ? "active" : ""} aria-pressed={!archived} onClick={() => { setError(""); setLoading(true); setArchived(false); }}>Active</button>
        <button className={archived ? "active" : ""} aria-pressed={archived} onClick={() => { setError(""); setLoading(true); setArchived(true); }}>Archived</button>
      </div>
      <span className="meta">{skills.length} {archived ? "archived" : "active"} {skills.length === 1 ? "skill" : "skills"}</span>
    </div>
    {error && <p className="error">{error}</p>}
    {loading ? <LoadingState label={`Loading ${archived ? "archive" : "skills"}…`} /> : skills.length === 0 ? <EmptyState icon={archived ? ArchiveRestore : LibraryBig} title={archived ? "The archive is empty" : "No learning plans yet"} description={archived ? "Archived skills will stay safely tucked away here." : "Start with one skill and turn it into a practical sequence of resources."}>{!archived && <Link className="button" href="/skills/new">Create your first plan</Link>}</EmptyState> : <section className="skills-grid">
      {skills.map((skill) => <article className="skill-card" key={skill.id}>
        <div className="skill-card-top">
          <h2><Link href={`/skills/${skill.id}`}>{skill.name}</Link></h2>
          {archived ? <button className="secondary restore-action" onClick={() => restore(skill.id)}><ArchiveRestore size={15} /> Restore</button> : <StatusBadge tone={lifecycleTone(skill.lifecycle)}>{skill.lifecycle.replaceAll("_", " ")}</StatusBadge>}
        </div>
        <p className="skill-description">{skill.description || "A focused learning plan ready for its next step."}</p>
        <div className="skill-card-bottom">
          <div className="skill-metrics"><span>{skill.progress.completed}/{skill.progress.total} resources</span><span>{formatMinutes(skill.progress.completedMinutes)} / {formatMinutes(skill.progress.totalMinutes)}</span></div>
          <ProgressBar value={skill.progress.percent} label="Plan progress" tone={skill.progress.percent === 100 ? "complete" : "accent"} />
        </div>
      </article>)}
    </section>}
  </>;
}
