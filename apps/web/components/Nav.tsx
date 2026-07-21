"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function Nav() {
  const [unread, setUnread] = useState(0);
  useEffect(() => { api<{ unread: number }>("/notifications?pageSize=1").then((result) => setUnread(result.unread)).catch(() => {}); }, []);
  return <aside className="sidebar">
    <Link className="brand" href="/"><span className="brand-mark">P</span><span>Progressor<small>Learn with intention</small></span></Link>
    <nav>
      <Link href="/">Overview</Link>
      <Link href="/skills">Skills</Link>
      <Link href="/notifications">Notifications {unread > 0 && <b className="badge">{unread}</b>}</Link>
      <Link href="/settings">Settings</Link>
    </nav>
    <div className="local-note"><span className="status-dot" /> Private workspace</div>
  </aside>;
}
