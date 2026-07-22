"use client";

import { FormEvent, useEffect, useState } from "react";
import { BellRing, Check, Clock3, Globe2, Info, Save, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";
import { LoadingState } from "../../components/ui";

type Settings = { timezone: string; dueEnabled: boolean; dueLeadDays: number; inactivityEnabled: boolean; inactivityDays: number };

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => { api<Settings>("/notification-settings").then(setSettings).catch((err) => setError(err.message)); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setError(""); setSaved(false); setSaving(true);
    try {
      const result = await api<Settings>("/notification-settings", { method: "PATCH", body: JSON.stringify({ timezone: form.get("timezone"), dueEnabled: form.get("dueEnabled") === "on", dueLeadDays: Number(form.get("dueLeadDays")), inactivityEnabled: form.get("inactivityEnabled") === "on", inactivityDays: Number(form.get("inactivityDays")) }) });
      setSettings(result); setSaved(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save settings"); }
    finally { setSaving(false); }
  }

  return <>
    <header className="page-head"><div className="page-head-copy"><span className="eyebrow">Preferences</span><h1>Keep nudges useful</h1><p>Choose when Progressor should call your attention to a deadline or a learning plan gone quiet.</p></div></header>
    {!settings ? error ? <p className="error">{error}</p> : <LoadingState label="Loading preferences…" /> : <div className="settings-layout">
      <section className="card"><form className="form" onSubmit={submit}>
        {error && <p className="error">{error}</p>}{saved && <p className="success"><Check size={17} /> Preferences saved.</p>}
        <div className="setting-group">
          <div className="setting-group-head"><span className="setting-icon"><Globe2 size={18} /></span><div><h2>Local time</h2><p className="card-kicker">Dates should arrive when you expect them.</p></div></div>
          <label>Timezone<input name="timezone" defaultValue={settings.timezone} placeholder="Asia/Jakarta" required /><span className="field-help">Use an IANA timezone such as Asia/Jakarta or Europe/London.</span></label>
        </div>
        <div className="divider" />
        <div className="setting-group">
          <div className="setting-group-head"><span className="setting-icon"><Clock3 size={18} /></span><div><h2>Deadline reminders</h2><p className="card-kicker">Get notice before a resource becomes due.</p></div></div>
          <label className="check"><input name="dueEnabled" type="checkbox" defaultChecked={settings.dueEnabled} /><span>Enable deadline reminders<span className="field-help">Due and overdue updates will appear in your inbox.</span></span></label>
          <label className="spaced-field">Reminder lead time (days)<input name="dueLeadDays" type="number" min="0" max="365" defaultValue={settings.dueLeadDays} required /></label>
        </div>
        <div className="divider" />
        <div className="setting-group">
          <div className="setting-group-head"><span className="setting-icon"><BellRing size={18} /></span><div><h2>Momentum reminders</h2><p className="card-kicker">Bring quiet learning plans back into view.</p></div></div>
          <label className="check"><input name="inactivityEnabled" type="checkbox" defaultChecked={settings.inactivityEnabled} /><span>Enable inactivity reminders<span className="field-help">A notification appears after the threshold below.</span></span></label>
          <label className="spaced-field">Inactive after (days)<input name="inactivityDays" type="number" min="1" max="365" defaultValue={settings.inactivityDays} required /></label>
        </div>
        <div><button disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save preferences"}</button></div>
      </form></section>
      <aside className="card settings-aside">
        <div className="card-heading"><div><h2>Private by design</h2><p className="card-kicker">Your workspace stays on this installation.</p></div><ShieldCheck size={21} className="subtle" /></div>
        <p className="subtle">Progressor creates reminders inside the app. It does not send email, push notifications, or share learning activity with third parties.</p>
        <div className="divider" />
        <p className="meta"><Info size={14} /> The inactivity threshold also powers the dashboard’s “needs attention” list. Turning reminders off only stops inbox items.</p>
      </aside>
    </div>}
  </>;
}
