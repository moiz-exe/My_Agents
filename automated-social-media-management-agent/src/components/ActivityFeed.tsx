"use client";

import { useEffect, useState } from "react";

interface LogRow {
  id: number;
  type: string;
  level: "info" | "success" | "error";
  message: string;
  createdAt: string;
}

const LEVEL_STYLES: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  error: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
};

const TYPE_ICON: Record<string, string> = {
  automation: "🤖",
  post: "📮",
  email: "✉️",
  sheet: "📄",
  dm: "💬",
  error: "⚠️",
};

export function ActivityFeed({ initial }: { initial: LogRow[] }) {
  const [logs, setLogs] = useState<LogRow[]>(initial);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/activity", { cache: "no-store" });
        const data = await res.json();
        setLogs(data.logs || []);
      } catch {
        // ignore transient errors
      }
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  if (logs.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No activity yet. Click &quot;Run automation now&quot; to generate your first post.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {logs.map((log) => (
        <li
          key={log.id}
          className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm ${LEVEL_STYLES[log.level] || LEVEL_STYLES.info}`}
        >
          <span>{TYPE_ICON[log.type] || "•"}</span>
          <div className="min-w-0 flex-1">
            <p className="leading-snug">{log.message}</p>
            <p className="mt-0.5 text-xs opacity-70">
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
