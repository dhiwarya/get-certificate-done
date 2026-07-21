"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, formatMinutes } from "../../../lib/api";
import type { Resource, Skill } from "../../../lib/types";

function message(error: unknown) { return error instanceof Error ? error.message : "Something went wrong"; }

function ResourceEditor({ skillId, resource, locked, refresh }: { skillId: string; resource: Resource; locked: boolean; refresh: () => void }) {
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError("");
    const minutes = Number(form.get("hours")) * 60 + Number(form.get("minutes"));
    try { await api(`/skills/${skillId}/resources/${resource.id}`, { method: "PATCH", body: JSON.stringify({ title: form.get("title"), url: form.get("url"), estimatedDurationMinutes: minutes, targetDate: form.get("targetDate") }) }); refresh(); } catch (err) { setError(message(err)); }
  }
  return <details><summary className="meta" style={{ cursor: "pointer" }}>Edit resource</summary><form className="form" style={{ marginTop: 14 }} onSubmit={save}>
    {error && <div className="error">{error}</div>}
    <label>Title<input name="title" defaultValue={resource.title} required disabled={locked} /></label>
    <label>Learning URL<input name="url" type="url" defaultValue={resource.url} required disabled={locked} /></label>
    <div className="form-row"><label>Hours<input name="hours" type="number" min="0" defaultValue={Math.floor(resource.estimatedDurationMinutes / 60)} disabled={locked} /></label><label>Minutes<input name="minutes" type="number" min="0" max="59" defaultValue={resource.estimatedDurationMinutes % 60} disabled={locked} /></label></div>
    <label>Target date<input name="targetDate" type="date" defaultValue={resource.targetDate ?? ""} disabled={locked} /></label>
    <div><button disabled={locked}>Save changes</button></div>
  </form></details>;
}

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [skill, setSkill] = useState<Skill | null>(null); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const load = useCallback(() => api<Skill>(`/skills/${id}`).then(setSkill).catch((err) => setError(message(err))), [id]);
  useEffect(() => { void load(); }, [load]);
  const run = async (action: () => Promise<unknown>, success?: string) => { setError(""); setNotice(""); try { await action(); if (success) setNotice(success); load(); } catch (err) { setError(message(err)); } };
  if (!skill) return <div className="empty">{error || "Loading learning plan…"}</div>;
  const activeResources = skill.resources.filter((item) => !item.archivedAt);
  const archivedResources = skill.resources.filter((item) => item.archivedAt);
  const locked = skill.certification?.state === "COMPLETED";

  async function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    const minutes = Number(form.get("hours")) * 60 + Number(form.get("minutes"));
    await run(() => api(`/skills/${id}/resources`, { method: "POST", body: JSON.stringify({ title: form.get("title"), url: form.get("url"), estimatedDurationMinutes: minutes, targetDate: form.get("targetDate") }) }), "Resource added.");
    formElement.reset();
  }
  async function saveSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(() => api(`/skills/${id}`, { method: "PATCH", body: JSON.stringify({ name: form.get("name"), description: form.get("description"), notificationsEnabled: form.get("notificationsEnabled") === "on" }) }), "Skill updated.");
  }
  async function saveCertification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(() => api(`/skills/${id}/certification`, { method: "PUT", body: JSON.stringify({ title: form.get("title"), url: form.get("url"), targetDate: form.get("targetDate"), proofUrl: form.get("proofUrl") }) }), "Certification saved.");
  }
  async function reorder(resourceId: string, direction: -1 | 1) {
    const index = activeResources.findIndex((item) => item.id === resourceId); const swap = index + direction;
    if (swap < 0 || swap >= activeResources.length) return;
    const ids = activeResources.map((item) => item.id); [ids[index], ids[swap]] = [ids[swap]!, ids[index]!];
    await run(() => api(`/skills/${id}/resources/reorder`, { method: "PATCH", body: JSON.stringify({ ids }) }));
  }

  return <>
    <header className="page-head"><div><span className="eyebrow">{skill.lifecycle.replaceAll("_", " ")}</span><h1>{skill.name}</h1><p>{skill.description || "A focused learning plan."}</p></div><div className="actions"><Link className="button secondary" href="/skills">All skills</Link>{skill.archivedAt ? <button onClick={() => run(() => api(`/skills/${id}/restore`, { method: "POST" }), "Skill restored.")}>Restore</button> : <button className="danger" onClick={async () => { if (!confirm("Archive this skill?")) return; try { await api(`/skills/${id}`, { method: "DELETE" }); router.push("/skills"); } catch (err) { setError(message(err)); } }}>Archive</button>}</div></header>
    {error && <p className="error">{error}</p>}{notice && <p className="success">{notice}</p>}
    <section className="summary-grid"><div className="stat"><span>Progress</span><strong>{skill.progress.percent}%</strong></div><div className="stat"><span>Resources</span><strong>{skill.progress.completed}/{skill.progress.total}</strong></div><div className="stat"><span>Learned effort</span><strong>{formatMinutes(skill.progress.completedMinutes)}</strong></div><div className="stat"><span>Planned effort</span><strong>{formatMinutes(skill.progress.totalMinutes)}</strong></div></section>
    <div className="detail-layout">
      <div className="card"><h2>Learning resources</h2>
        {activeResources.length === 0 ? <div className="empty">No resources yet. Add the first step below.</div> : activeResources.map((resource, index) => <div className="resource-row" key={resource.id}>
          <div className="row-main"><div><a className="resource-link" href={resource.url} target="_blank" rel="noreferrer">{resource.title} ↗</a><div className="meta">{formatMinutes(resource.estimatedDurationMinutes)}{resource.targetDate ? ` · due ${resource.targetDate}` : ""}</div></div><span className={`pill ${resource.status === "PLANNED" ? "muted" : resource.status === "IN_PROGRESS" ? "warn" : ""}`}>{resource.status.replaceAll("_", " ")}</span></div>
          <div className="actions" style={{ marginTop: 12 }}><select aria-label={`Status for ${resource.title}`} value={resource.status} disabled={locked} onChange={(event) => run(() => api(`/skills/${id}/resources/${resource.id}`, { method: "PATCH", body: JSON.stringify({ status: event.target.value }) }))}><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select><button className="secondary" disabled={locked || index === 0} onClick={() => reorder(resource.id, -1)}>↑</button><button className="secondary" disabled={locked || index === activeResources.length - 1} onClick={() => reorder(resource.id, 1)}>↓</button><button className="danger" disabled={locked} onClick={() => run(() => api(`/skills/${id}/resources/${resource.id}`, { method: "DELETE" }))}>Archive</button></div>
          <ResourceEditor skillId={id} resource={resource} locked={locked} refresh={load} />
        </div>)}
        {!locked && !skill.archivedAt && <><div className="divider" /><h2>Add a resource</h2><form className="form" onSubmit={addResource}><label>Title<input name="title" required placeholder="Course, book, article…" /></label><label>Learning URL<input name="url" type="url" required placeholder="https://" /></label><div className="form-row"><label>Estimated hours<input name="hours" type="number" min="0" defaultValue="1" /></label><label>Minutes<input name="minutes" type="number" min="0" max="59" defaultValue="0" /></label></div><label>Optional target date<input name="targetDate" type="date" /></label><div><button>Add resource</button></div></form></>}
        {archivedResources.length > 0 && <><div className="divider" /><details><summary>Archived resources ({archivedResources.length})</summary>{archivedResources.map((resource) => <div className="resource-row archived" key={resource.id}><div className="row-main"><span>{resource.title}</span><button className="secondary" disabled={locked} onClick={() => run(() => api(`/skills/${id}/resources/${resource.id}/restore`, { method: "POST" }))}>Restore</button></div></div>)}</details></>}
      </div>
      <aside className="form">
        <section className="card"><h2>Final certification</h2>{skill.certification ? <>
          <div className="row-main"><strong>{skill.certification.title}</strong><span className={`pill ${skill.certification.state === "LOCKED" ? "muted" : skill.certification.state === "READY" ? "warn" : ""}`}>{skill.certification.state}</span></div>
          {skill.certification.targetDate && <p className="meta">Target: {skill.certification.targetDate}</p>}{skill.certification.url && <p><a className="resource-link" href={skill.certification.url} target="_blank" rel="noreferrer">Certification page ↗</a></p>}
          {skill.certification.state === "READY" && <button onClick={() => run(() => api(`/skills/${id}/certification/complete`, { method: "POST", body: JSON.stringify({ proofUrl: skill.certification?.proofUrl || null }) }), "Skill certified.")}>Mark certification complete</button>}
          {skill.certification.state === "COMPLETED" && <button className="secondary" onClick={() => { if (confirm("Reopen this certification and unlock the plan?")) run(() => api(`/skills/${id}/certification/reopen`, { method: "POST" })); }}>Reopen plan</button>}
        </> : <p className="subtle">Optional. This validates the plan after every resource is complete.</p>}
          {!locked && !skill.archivedAt && <><div className="divider" /><form className="form" onSubmit={saveCertification}><label>Title<input name="title" required defaultValue={skill.certification?.title ?? ""} placeholder="Final exam or certificate" /></label><label>Certification URL<input name="url" type="url" defaultValue={skill.certification?.url ?? ""} placeholder="https://" /></label><label>Target date<input name="targetDate" type="date" defaultValue={skill.certification?.targetDate ?? ""} /></label><label>Proof URL<input name="proofUrl" type="url" defaultValue={skill.certification?.proofUrl ?? ""} placeholder="https://" /></label><button>{skill.certification ? "Update milestone" : "Add milestone"}</button></form></>}
        </section>
        <section className="card"><h2>Skill settings</h2><form className="form" onSubmit={saveSkill}><label>Name<input name="name" defaultValue={skill.name} required /></label><label>Description<textarea name="description" defaultValue={skill.description} /></label><label className="check"><input name="notificationsEnabled" type="checkbox" defaultChecked={skill.notificationsEnabled} /> Enable reminders</label><button>Save settings</button></form></section>
      </aside>
    </div>
  </>;
}
