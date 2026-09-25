"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/posts", label: "Posts", icon: "🗓️" },
  { href: "/messages", label: "DM Inbox", icon: "💬" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-full flex-col gap-1 p-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-lg text-white shadow-md">
          🤖
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight text-slate-900">Marketing Agent</p>
          <p className="text-xs leading-tight text-slate-500">Auto post + reply</p>
        </div>
      </div>
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-violet-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
