"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, formatMinutes } from "../../lib/api";
import type { Skill } from "../../lib/types";

export default function SkillsPage() {
  const [archived, setArchived] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(() => api<Skill[]>(`/skills${archived ? "?archived=true" : ""}`).then(setSkills).catch((err) => setError(err.message)), [archived]);
  useEffect(() => { void load(); }, [load]);
  const restore = async (id: string) => { await api(`/skills/${id}/restore`, { method: "POST" }); load(); };

  return <>
    <header className="page-head"><div><span className="eyebrow">Learning plans</span><h1>Your skills</h1><p>Build focused plans from resources, deadlines, and a final validation milestone.</p></div><Link className="button" href="/skills/new">Add a skill</Link></header>
    <div className="actions" style={{ marginBottom: 18 }}><button className={!archived ? "" : "secondary"} onClick={() => setArchived(false)}>Active</button><button className={archived ? "" : "secondary"} onClick={() => setArchived(true)}>Archived</button></div>
    {error && <p className="error">{error}</p>}
    <section className="card">
      {skills.length === 0 ? <div className="empty">No {archived ? "archived" : "active"} skills.</div> : skills.map((skill) => <div className="skill-row" key={skill.id}>
        <div className="row-main"><div><Link href={`/skills/${skill.id}`}>{skill.name}</Link><div className="meta">{skill.description || "No description"}</div></div>{archived ? <button className="secondary" onClick={() => restore(skill.id)}>Restore</button> : <span className={`pill ${skill.lifecycle === "ACTIVE" ? "muted" : ""}`}>{skill.lifecycle.replaceAll("_", " ")}</span>}</div>
        <div className="meta">{skill.progress.completed}/{skill.progress.total} resources · {formatMinutes(skill.progress.completedMinutes)} of {formatMinutes(skill.progress.totalMinutes)}</div>
        <div className="progress"><i style={{ width: `${skill.progress.percent}%` }} /></div>
      </div>)}
    </section>
  </>;
}
