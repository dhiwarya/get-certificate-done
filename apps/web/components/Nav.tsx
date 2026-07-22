"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, LayoutDashboard, LibraryBig, Moon, Settings, Sparkles, Sun } from "lucide-react";
import { api } from "../lib/api";
import { useTheme } from "./ThemeProvider";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/skills", label: "Skills", icon: LibraryBig },
  { href: "/notifications", label: "Inbox", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Nav() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  useEffect(() => { api<{ unread: number }>("/notifications?pageSize=1").then((result) => setUnread(result.unread)).catch(() => {}); }, []);
  return <aside className="sidebar">
    <div className="sidebar-head">
      <Link className="brand" href="/" aria-label="Progressor dashboard">
        <span className="brand-mark"><Sparkles size={20} /></span>
        <span className="brand-copy">Progressor<small>Learn with intention</small></span>
      </Link>
      <button className="theme-toggle mobile-theme" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
    <nav aria-label="Primary navigation">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link href={href} key={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
          <Icon size={19} aria-hidden="true" />
          <span>{label}</span>
          {href === "/notifications" && unread > 0 && <b className="badge" aria-label={`${unread} unread`}>{unread > 99 ? "99+" : unread}</b>}
        </Link>;
      })}
    </nav>
    <div className="sidebar-footer">
      <div className="local-note"><span className="status-dot" /> Private workspace</div>
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        <span className="theme-icon">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</span>
        <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
      </button>
    </div>
  </aside>;
}
