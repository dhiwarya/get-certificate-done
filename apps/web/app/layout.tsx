import type { Metadata } from "next";
import { Nav } from "../components/Nav";
import "./globals.css";

export const metadata: Metadata = { title: "Progressor", description: "Personal skill progress tracker" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="app-shell"><Nav /><main>{children}</main></div></body></html>;
}
