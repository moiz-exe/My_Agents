import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketing Agent — Auto Social Media Posting & DM Replies",
  description:
    "An autonomous agent that generates digital marketing posts, publishes them to Instagram & Facebook every 24 hours, logs them to Google Sheets, emails you a summary, and auto-replies to DMs.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
          <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-200 bg-white md:block">
            <Nav />
          </aside>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur md:hidden">
              <span className="font-semibold">🤖 Marketing Agent</span>
            </header>
            <main className="px-4 py-6 sm:px-8 sm:py-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
