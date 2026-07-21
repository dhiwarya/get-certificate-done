"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
    <header className="page-head"><div><span className="eyebrow">New plan</span><h1>What will you learn?</h1><p>Start with the skill itself. You can add as many resources as you need next.</p></div></header>
    <section className="card" style={{ maxWidth: 720 }}><form className="form" onSubmit={submit}>
      {error && <p className="error">{error}</p>}
      <label>Skill name<input name="name" required maxLength={100} placeholder="e.g. Data visualization" autoFocus /></label>
      <label>Description<textarea name="description" maxLength={1000} placeholder="What does success look like?" /></label>
      <label className="check"><input type="checkbox" name="notificationsEnabled" defaultChecked /> Enable reminders for this skill</label>
      <div><button disabled={saving}>{saving ? "Creating…" : "Create learning plan"}</button></div>
    </form></section>
  </>;
}
