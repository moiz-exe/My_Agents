"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function RunNowButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const run = async () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/automation/run", { method: "POST" });
        const data = await res.json();
        if (data.ran) {
          setMessage(`✅ Run complete — ${data.postsCreated} post(s) processed.`);
        } else {
          setMessage(`⚠️ ${data.reason || "Run skipped."}`);
        }
        router.refresh();
      } catch {
        setMessage("❌ Failed to trigger run.");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={run}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <>
            <span className="h-2 w-2 animate-ping rounded-full bg-white" /> Running agent...
          </>
        ) : (
          <>🚀 Run automation now</>
        )}
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
