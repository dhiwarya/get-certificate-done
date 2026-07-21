"use client";
import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";

type Settings = { timezone: string; dueEnabled: boolean; dueLeadDays: number; inactivityEnabled: boolean; inactivityDays: number };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null); const [error, setError] = useState(""); const [saved, setSaved] = useState(false);
  useEffect(() => { api<Settings>("/notification-settings").then(setSettings).catch((err) => setError(err.message)); }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError(""); setSaved(false);
    try { const result = await api<Settings>("/notification-settings", { method: "PATCH", body: JSON.stringify({ timezone: form.get("timezone"), dueEnabled: form.get("dueEnabled") === "on", dueLeadDays: Number(form.get("dueLeadDays")), inactivityEnabled: form.get("inactivityEnabled") === "on", inactivityDays: Number(form.get("inactivityDays")) }) }); setSettings(result); setSaved(true); } catch (err) { setError(err instanceof Error ? err.message : "Could not save settings"); }
  }
  return <>
    <header className="page-head"><div><span className="eyebrow">Preferences</span><h1>Notification settings</h1><p>Control when the in-app inbox calls your attention to deadlines and neglected learning plans.</p></div></header>
    {!settings ? <div className="empty">{error || "Loading settings…"}</div> : <section className="card" style={{ maxWidth: 720 }}><form className="form" onSubmit={submit}>
      {error && <p className="error">{error}</p>}{saved && <p className="success">Settings saved.</p>}
      <label>Timezone<input name="timezone" defaultValue={settings.timezone} placeholder="Asia/Jakarta" required /><span className="meta">Use an IANA timezone such as Asia/Jakarta or Europe/London.</span></label>
      <div className="divider" />
      <label className="check"><input name="dueEnabled" type="checkbox" defaultChecked={settings.dueEnabled} /> Enable deadline reminders</label>
      <label>Reminder lead time (days)<input name="dueLeadDays" type="number" min="0" max="365" defaultValue={settings.dueLeadDays} required /></label>
      <div className="divider" />
      <label className="check"><input name="inactivityEnabled" type="checkbox" defaultChecked={settings.inactivityEnabled} /> Enable inactivity reminders</label>
      <label>Inactive after (days)<input name="inactivityDays" type="number" min="1" max="365" defaultValue={settings.inactivityDays} required /></label>
      <p className="meta">This threshold also controls the dashboard’s neglected-skills list. Disabling reminders only stops inbox items.</p>
      <div><button>Save settings</button></div>
    </form></section>}
  </>;
}
