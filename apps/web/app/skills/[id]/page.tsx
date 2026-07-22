"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Archive, ArrowDown, ArrowLeft, ArrowUp, Award, BellRing, BookOpen, Check, Clock3, ExternalLink, FilePenLine, Flag, Plus, RotateCcw, Settings2, Target } from "lucide-react";
import { api, formatMinutes } from "../../../lib/api";
import type { Resource, Skill } from "../../../lib/types";
import { CelebrationBurst } from "../../../components/CelebrationBurst";
import { LoadingState, StatusBadge } from "../../../components/ui";

function message(error: unknown) { return error instanceof Error ? error.message : "Something went wrong"; }

function resourceTone(status: Resource["status"]) {
  if (status === "COMPLETED") return "complete" as const;
  if (status === "IN_PROGRESS") return "warning" as const;
  return "neutral" as const;
}

function ResourceEditor({ skillId, resource, locked, refresh }: { skillId: string; resource: Resource; locked: boolean; refresh: () => void }) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError(""); setSaving(true);
    const minutes = Number(form.get("hours")) * 60 + Number(form.get("minutes"));
    try {
      await api(`/skills/${skillId}/resources/${resource.id}`, { method: "PATCH", body: JSON.stringify({ title: form.get("title"), url: form.get("url"), estimatedDurationMinutes: minutes, targetDate: form.get("targetDate") }) });
      refresh();
    } catch (err) { setError(message(err)); }
    finally { setSaving(false); }
  }
  return <details className="resource-editor">
    <summary>Edit resource details</summary>
    <form className="form" onSubmit={save}>
      {error && <div className="error">{error}</div>}
      <label>Title<input name="title" defaultValue={resource.title} required disabled={locked} /></label>
      <label>Learning URL<input name="url" type="url" defaultValue={resource.url} required disabled={locked} /></label>
      <div className="form-row"><label>Hours<input name="hours" type="number" min="0" defaultValue={Math.floor(resource.estimatedDurationMinutes / 60)} disabled={locked} /></label><label>Minutes<input name="minutes" type="number" min="0" max="59" defaultValue={resource.estimatedDurationMinutes % 60} disabled={locked} /></label></div>
      <label>Target date<input name="targetDate" type="date" defaultValue={resource.targetDate ?? ""} disabled={locked} /></label>
      <div><button disabled={locked || saving}>{saving ? "Saving…" : "Save changes"}</button></div>
    </form>
  </details>;
}

export default function SkillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [celebratingResource, setCelebratingResource] = useState<string | null>(null);
  const [majorCelebration, setMajorCelebration] = useState(false);
  const load = useCallback(() => api<Skill>(`/skills/${id}`).then(setSkill).catch((err) => setError(message(err))), [id]);
  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<unknown>, success?: string, onSuccess?: () => void) => {
    setError(""); setNotice("");
    try {
      await action();
      if (success) setNotice(success);
      await load();
      onSuccess?.();
      return true;
    } catch (err) { setError(message(err)); return false; }
  };

  if (!skill) return error ? <p className="error">{error}</p> : <LoadingState label="Opening learning plan…" />;
  const activeResources = skill.resources.filter((item) => !item.archivedAt);
  const archivedResources = skill.resources.filter((item) => item.archivedAt);
  const locked = skill.certification?.state === "COMPLETED";

  async function addResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement);
    const minutes = Number(form.get("hours")) * 60 + Number(form.get("minutes"));
    const ok = await run(() => api(`/skills/${id}/resources`, { method: "POST", body: JSON.stringify({ title: form.get("title"), url: form.get("url"), estimatedDurationMinutes: minutes, targetDate: form.get("targetDate") }) }), "Resource added to the path.");
    if (ok) formElement.reset();
  }
  async function saveSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(() => api(`/skills/${id}`, { method: "PATCH", body: JSON.stringify({ name: form.get("name"), description: form.get("description"), notificationsEnabled: form.get("notificationsEnabled") === "on" }) }), "Skill updated.");
  }
  async function saveCertification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await run(() => api(`/skills/${id}/certification`, { method: "PUT", body: JSON.stringify({ title: form.get("title"), url: form.get("url"), targetDate: form.get("targetDate"), proofUrl: form.get("proofUrl") }) }), "Final challenge saved.");
  }
  async function reorder(resourceId: string, direction: -1 | 1) {
    const index = activeResources.findIndex((item) => item.id === resourceId); const swap = index + direction;
    if (swap < 0 || swap >= activeResources.length) return;
    const ids = activeResources.map((item) => item.id); [ids[index], ids[swap]] = [ids[swap]!, ids[index]!];
    await run(() => api(`/skills/${id}/resources/reorder`, { method: "PATCH", body: JSON.stringify({ ids }) }));
  }

  return <>
    {majorCelebration && <CelebrationBurst major onDone={() => setMajorCelebration(false)} />}
    <section className="detail-hero">
      <header className="page-head">
        <div className="page-head-copy"><span className="eyebrow">{skill.lifecycle.replaceAll("_", " ")}</span><h1>{skill.name}</h1><p>{skill.description || "A focused learning plan ready for its next meaningful step."}</p></div>
        <div className="actions">
          <Link className="button secondary" href="/skills"><ArrowLeft size={16} /> All skills</Link>
          {skill.archivedAt ? <button onClick={() => run(() => api(`/skills/${id}/restore`, { method: "POST" }), "Skill restored.")}><RotateCcw size={16} /> Restore</button> : <button className="danger" onClick={async () => { if (!confirm("Archive this skill?")) return; try { await api(`/skills/${id}`, { method: "DELETE" }); router.push("/skills"); } catch (err) { setError(message(err)); } }}><Archive size={16} /> Archive</button>}
        </div>
      </header>
    </section>
    {error && <p className="error">{error}</p>}{notice && <p className="success"><Check size={17} /> {notice}</p>}
    <section className="summary-grid" aria-label="Skill progress summary">
      <div className="stat"><span className="stat-icon"><Target size={17} /></span><span className="stat-label">Progress</span><strong>{skill.progress.percent}%</strong></div>
      <div className="stat"><span className="stat-icon"><BookOpen size={17} /></span><span className="stat-label">Resources</span><strong>{skill.progress.completed}/{skill.progress.total}</strong></div>
      <div className="stat"><span className="stat-icon"><Check size={17} /></span><span className="stat-label">Learned effort</span><strong>{formatMinutes(skill.progress.completedMinutes)}</strong></div>
      <div className="stat"><span className="stat-icon"><Clock3 size={17} /></span><span className="stat-label">Planned effort</span><strong>{formatMinutes(skill.progress.totalMinutes)}</strong></div>
    </section>
    <div className="detail-layout">
      <section className="card">
        <div className="card-heading"><div><h2>Resource path</h2><p className="card-kicker">Move through the steps in the order that makes sense.</p></div><Flag size={21} className="subtle" /></div>
        {activeResources.length === 0 ? <div className="empty-state"><span className="empty-icon"><BookOpen size={24} /></span><strong>No steps on this path</strong><p>Add the first course, book, or article below.</p></div> : <div className="quest-list">
          {activeResources.map((resource, index) => <div className={`resource-row ${resource.status.toLowerCase().replace("_", "-")}`} key={resource.id}>
            <span className="quest-node">{resource.status === "COMPLETED" ? <Check size={18} /> : index + 1}</span>
            <div className="resource-panel">
              {celebratingResource === resource.id && <CelebrationBurst onDone={() => setCelebratingResource(null)} />}
              <div className="row-main">
                <div className="row-copy"><a className="resource-link" href={resource.url} target="_blank" rel="noreferrer">{resource.title} <ExternalLink size={13} /></a><div className="meta">{formatMinutes(resource.estimatedDurationMinutes)}{resource.targetDate ? ` · due ${resource.targetDate}` : " · no deadline"}</div></div>
                <StatusBadge tone={resourceTone(resource.status)}>{resource.status.replaceAll("_", " ")}</StatusBadge>
              </div>
              <div className="resource-toolbar">
                <select aria-label={`Status for ${resource.title}`} value={resource.status} disabled={locked} onChange={(event) => {
                  const next = event.target.value as Resource["status"];
                  void run(() => api(`/skills/${id}/resources/${resource.id}`, { method: "PATCH", body: JSON.stringify({ status: next }) }), next === "COMPLETED" ? "Resource completed." : undefined, () => { if (next === "COMPLETED") setCelebratingResource(resource.id); });
                }}><option value="PLANNED">Planned</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select>
                <button className="icon-button" aria-label={`Move ${resource.title} up`} disabled={locked || index === 0} onClick={() => reorder(resource.id, -1)}><ArrowUp size={17} /></button>
                <button className="icon-button" aria-label={`Move ${resource.title} down`} disabled={locked || index === activeResources.length - 1} onClick={() => reorder(resource.id, 1)}><ArrowDown size={17} /></button>
                <button className="danger" disabled={locked} onClick={() => run(() => api(`/skills/${id}/resources/${resource.id}`, { method: "DELETE" }), "Resource archived.")}><Archive size={14} /> Archive</button>
              </div>
              <ResourceEditor skillId={id} resource={resource} locked={locked} refresh={load} />
            </div>
          </div>)}
        </div>}
        {!locked && !skill.archivedAt && <><div className="divider" /><div className="card-heading"><div><h2>Add a resource</h2><p className="card-kicker">Give the next step a realistic effort estimate.</p></div><Plus size={20} className="subtle" /></div><form className="form" onSubmit={addResource}>
          <label>Title<input name="title" required placeholder="Course, book, article…" /></label>
          <label>Learning URL<input name="url" type="url" required placeholder="https://" /></label>
          <div className="form-row"><label>Estimated hours<input name="hours" type="number" min="0" defaultValue="1" /></label><label>Minutes<input name="minutes" type="number" min="0" max="59" defaultValue="0" /></label></div>
          <label>Optional target date<input name="targetDate" type="date" /></label>
          <div><button><Plus size={16} /> Add to path</button></div>
        </form></>}
        {archivedResources.length > 0 && <><div className="divider" /><details><summary className="archive-summary">Archived resources ({archivedResources.length})</summary>{archivedResources.map((resource) => <div className="resource-row archived" key={resource.id}><div className="row-main"><span>{resource.title}</span><button className="secondary" disabled={locked} onClick={() => run(() => api(`/skills/${id}/resources/${resource.id}/restore`, { method: "POST" }), "Resource restored.")}><RotateCcw size={14} /> Restore</button></div></div>)}</details></>}
      </section>
      <aside className="detail-sidebar">
        <section className="card">
          <div className="card-heading"><div><h2>Final challenge</h2><p className="card-kicker">Validation after the path is complete.</p></div><Award size={21} className="subtle" /></div>
          {skill.certification ? <>
            <div className="row-main"><strong>{skill.certification.title}</strong><StatusBadge tone={skill.certification.state === "COMPLETED" ? "complete" : skill.certification.state === "READY" ? "warning" : "neutral"}>{skill.certification.state}</StatusBadge></div>
            {skill.certification.targetDate && <p className="meta">Target: {skill.certification.targetDate}</p>}
            {skill.certification.url && <p><a className="resource-link" href={skill.certification.url} target="_blank" rel="noreferrer">Certification page <ExternalLink size={13} /></a></p>}
            {skill.certification.state === "READY" && <button onClick={() => run(() => api(`/skills/${id}/certification/complete`, { method: "POST", body: JSON.stringify({ proofUrl: skill.certification?.proofUrl || null }) }), "Skill certified.", () => setMajorCelebration(true))}><Award size={16} /> Complete challenge</button>}
            {skill.certification.state === "COMPLETED" && <button className="secondary" onClick={() => { if (confirm("Reopen this certification and unlock the plan?")) void run(() => api(`/skills/${id}/certification/reopen`, { method: "POST" }), "Plan reopened."); }}><RotateCcw size={15} /> Reopen plan</button>}
          </> : <p className="subtle">Optional. Add a certificate, exam, or portfolio milestone to close the loop.</p>}
          {!locked && !skill.archivedAt && <><div className="divider" /><form className="form" onSubmit={saveCertification}>
            <label>Title<input name="title" required defaultValue={skill.certification?.title ?? ""} placeholder="Final exam or certificate" /></label>
            <label>Certification URL<input name="url" type="url" defaultValue={skill.certification?.url ?? ""} placeholder="https://" /></label>
            <label>Target date<input name="targetDate" type="date" defaultValue={skill.certification?.targetDate ?? ""} /></label>
            <label>Proof URL<input name="proofUrl" type="url" defaultValue={skill.certification?.proofUrl ?? ""} placeholder="https://" /></label>
            <button><Award size={15} /> {skill.certification ? "Update challenge" : "Add challenge"}</button>
          </form></>}
        </section>
        <section className="card">
          <div className="card-heading"><div><h2>Skill settings</h2><p className="card-kicker">Name, intent, and reminders.</p></div><Settings2 size={20} className="subtle" /></div>
          <form className="form" onSubmit={saveSkill}>
            <label>Name<input name="name" defaultValue={skill.name} required /></label>
            <label>Description<textarea name="description" defaultValue={skill.description} /></label>
            <label className="check"><input name="notificationsEnabled" type="checkbox" defaultChecked={skill.notificationsEnabled} /><span><BellRing size={14} /> Enable reminders</span></label>
            <button><FilePenLine size={15} /> Save settings</button>
          </form>
        </section>
      </aside>
    </div>
  </>;
}
