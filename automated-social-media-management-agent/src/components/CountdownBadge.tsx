"use client";

import { useEffect, useState } from "react";

function formatDuration(ms: number) {
  if (ms <= 0) return "due now";
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function CountdownBadge({ nextRunAt }: { nextRunAt: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  if (!nextRunAt) {
    return <span className="text-slate-500">Not scheduled yet</span>;
  }

  const diff = new Date(nextRunAt).getTime() - now;
  return <span>{formatDuration(diff)}</span>;
}
