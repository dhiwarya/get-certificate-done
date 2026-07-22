"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    (notify) => {
      window.addEventListener("progressor-theme-change", notify);
      return () => window.removeEventListener("progressor-theme-change", notify);
    },
    () => document.documentElement.dataset.theme === "light" ? "light" : "dark",
    () => "dark" as Theme,
  );

  const value = {
    theme,
    toggleTheme: () => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      try { localStorage.setItem("progressor-theme", next); } catch {}
      window.dispatchEvent(new Event("progressor-theme-change"));
    }
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
