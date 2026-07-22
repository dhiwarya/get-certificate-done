"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";
import { ThemeProvider } from "./ThemeProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <ThemeProvider>
    <div className="app-shell">
      <Nav />
      <main>
        <div className="page-transition" key={pathname}>{children}</div>
      </main>
    </div>
  </ThemeProvider>;
}
