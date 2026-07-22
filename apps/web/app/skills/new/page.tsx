"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BellRing, Flag } from "lucide-react";
import { api } from "../../../lib/api";
import type { Skill } from "../../../lib/types";

export default function NewSkillPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const skill = await api<Skill>("/skills", { method: "POST", body: JSON.stringify({ name: form.get("name"), description: form.get("description"), notificationsEnabled: form.get("notificationsEnabled") === "on" }) });
      router.push(`/skills/${skill.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create skill"); setSaving(false); }
  }

  return <>
    <header className="page-head"><div className="page-head-copy"><span className="eyebrow">New plan</span><h1>Choose your next pursuit</h1><p>Name the skill and define what success means. The resource path comes next.</p></div></header>
    <section className="card form-card">
      <div className="form-intro">
        <span className="form-intro-icon"><Flag size={25} /></span>
        <div><h2>Plant the first flag</h2><p className="card-kicker">Keep it specific enough that progress feels concrete.</p></div>
      </div>
      <form className="form" onSubmit={submit}>
        {error && <p className="error">{error}</p>}
        <label>Skill name<input name="name" required maxLength={100} placeholder="e.g. Data visualization" autoFocus /><span className="field-help">A craft, subject, or capability you want to build.</span></label>
        <label>Success description<textarea name="description" maxLength={1000} placeholder="What will you be able to do when this plan is complete?" /></label>
        <label className="check"><input type="checkbox" name="notificationsEnabled" defaultChecked /><span><BellRing size={15} aria-hidden="true" /> Enable reminders for this skill<span className="field-help">Get a nudge when deadlines approach or momentum slows.</span></span></label>
        <div><button disabled={saving}>{saving ? "Creating your path…" : <>Create learning plan <ArrowRight size={16} /></>}</button></div>
      </form>
    </section>
  </>;
}
