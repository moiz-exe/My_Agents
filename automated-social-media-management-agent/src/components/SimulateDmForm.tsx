"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function SimulateDmForm() {
  const [platform, setPlatform] = useState("instagram");
  const [senderName, setSenderName] = useState("Test User");
  const [messageText, setMessageText] = useState("Hi! Do you offer social media marketing packages?");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await fetch("/api/messages/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, senderName, messageText }),
      });
      const data = await res.json();
      setResult(data.autoReplied ? "✅ Auto-reply sent!" : `⚠️ ${data.errorMessage || "Auto-reply disabled or failed."}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Send a test DM</h2>
      <p className="text-xs text-slate-500">
        Try the auto-reply flow instantly without a live Meta webhook connection.
      </p>
      <div className="flex gap-3">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
        </select>
        <input
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          placeholder="Sender name"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <textarea
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        rows={2}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send test DM"}
      </button>
      {result && <p className="text-sm text-slate-600">{result}</p>}
    </form>
  );
}
