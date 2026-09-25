"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Account {
  id: number;
  platform: string;
  accountName: string;
  pageId: string;
  accessToken: string;
  isActive: boolean;
}

export function AccountsManager({ initial }: { initial: Account[] }) {
  const [accounts, setAccounts] = useState<Account[]>(initial);
  const [platform, setPlatform] = useState("instagram");
  const [accountName, setAccountName] = useState("");
  const [pageId, setPageId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !pageId) return;
    setSubmitting(true);
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, accountName, pageId, accessToken }),
    });
    const data = await res.json();
    setAccounts((prev) => [data.account, ...prev]);
    setAccountName("");
    setPageId("");
    setAccessToken("");
    setSubmitting(false);
    router.refresh();
  };

  const toggleActive = async (id: number, isActive: boolean) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, isActive } : a)));
    await fetch(`/api/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    router.refresh();
  };

  const removeAccount = async (id: number) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Connected Instagram &amp; Facebook accounts</h2>
      <p className="mt-1 text-xs text-slate-500">
        Add a Facebook Page (Page ID + Page Access Token) and/or an Instagram Business Account (IG User
        ID + Page Access Token with instagram_content_publish permission). The agent posts to every
        active account on each run.
      </p>

      <form onSubmit={addAccount} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
        </select>
        <input
          placeholder="Account name (e.g. @myagency)"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Page ID / IG Business Account ID"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Access token"
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="sm:col-span-2 self-start rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {submitting ? "Adding..." : "+ Add account"}
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-2">
        {accounts.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
            No accounts connected yet — the agent will run in simulation mode until you add one.
          </p>
        )}
        {accounts.map((account) => (
          <div
            key={account.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm"
          >
            <div>
              <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-medium capitalize text-violet-700">
                {account.platform}
              </span>
              <span className="ml-2 font-medium text-slate-900">{account.accountName}</span>
              <span className="ml-2 text-xs text-slate-500">ID: {account.pageId}</span>
              {!account.accessToken && (
                <span className="ml-2 text-xs font-medium text-amber-600">No token — simulated only</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={account.isActive}
                  onChange={(e) => toggleActive(account.id, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600"
                />
                Active
              </label>
              <button
                onClick={() => removeAccount(account.id)}
                className="text-xs font-medium text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
