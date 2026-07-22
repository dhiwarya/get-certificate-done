import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { AppShell } from "../components/AppShell";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "Progressor", template: "%s · Progressor" },
  description: "A playful, private skill progress tracker",
};

const themeScript = `try{const t=localStorage.getItem('progressor-theme');const v=t==='light'?'light':'dark';document.documentElement.dataset.theme=v;document.documentElement.style.colorScheme=v}catch{document.documentElement.dataset.theme='dark';document.documentElement.style.colorScheme='dark'}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-theme="dark" suppressHydrationWarning className={`${display.variable} ${body.variable}`}>
    <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
    <body><AppShell>{children}</AppShell></body>
  </html>;
}
