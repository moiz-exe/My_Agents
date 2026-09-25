import { db } from "@/db";
import { activityLogs, dmMessages, posts, socialAccounts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSettings, isEmailConfigured, isOpenAiConfigured, isSheetsConfigured } from "@/lib/settings";
import { RunNowButton } from "@/components/RunNowButton";
import { ActivityFeed } from "@/components/ActivityFeed";
import { CountdownBadge } from "@/components/CountdownBadge";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700",
  simulated: "bg-amber-100 text-amber-700",
  failed: "bg-rose-100 text-rose-700",
  draft: "bg-slate-100 text-slate-600",
};

export default async function DashboardPage() {
  const [settings, accounts, recentPosts, recentDms, logs] = await Promise.all([
    getSettings(),
    db.select().from(socialAccounts),
    db.select().from(posts).orderBy(desc(posts.createdAt)).limit(5),
    db.select().from(dmMessages).orderBy(desc(dmMessages.receivedAt)).limit(5),
    db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(50),
  ]);

  const activeAccounts = accounts.filter((a) => a.isActive);
  const checklist = [
    { label: "Instagram/Facebook account connected", ok: activeAccounts.length > 0, href: "/settings" },
    { label: "OpenAI content generation (optional)", ok: isOpenAiConfigured(settings), href: "/settings" },
    { label: "Email notifications (SMTP)", ok: isEmailConfigured(settings), href: "/settings" },
    { label: "Google Sheets logging", ok: isSheetsConfigured(settings), href: "/settings" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Fully autonomous digital marketing agent — generates a post, publishes it to Instagram &
            Facebook, logs it to Google Sheets, emails you a summary, and auto-replies to DMs.
          </p>
        </div>
        <RunNowButton />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Automation status"
          value={settings.isAutomationEnabled ? "Enabled" : "Paused"}
          tone={settings.isAutomationEnabled ? "good" : "warn"}
          hint={`Posts every ${settings.postIntervalHours}h`}
        />
        <StatCard
          label="Next run"
          value={<CountdownBadge nextRunAt={settings.nextRunAt ? settings.nextRunAt.toString() : null} />}
          tone="neutral"
          hint={settings.nextRunAt ? new Date(settings.nextRunAt).toLocaleString() : "—"}
        />
        <StatCard
          label="Connected accounts"
          value={String(activeAccounts.length)}
          tone={activeAccounts.length > 0 ? "good" : "warn"}
          hint="Instagram + Facebook"
        />
        <StatCard
          label="Posts published"
          value={String(recentPosts.filter((p) => p.status === "published").length)}
          tone="neutral"
          hint="Most recent 5 shown below"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card title="Recent posts" action={<Link href="/posts" className="text-sm font-medium text-violet-600 hover:underline">View all →</Link>}>
            {recentPosts.length === 0 ? (
              <EmptyState text="No posts generated yet. Run the automation to create your first one." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-2 pr-3">Platform</th>
                      <th className="pb-2 pr-3">Account</th>
                      <th className="pb-2 pr-3">Status</th>
                      <th className="pb-2 pr-3">Scheduled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentPosts.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-3 capitalize">{p.platform}</td>
                        <td className="py-2 pr-3">{p.accountName}</td>
                        <td className="py-2 pr-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[p.status] || STATUS_STYLES.draft}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-slate-500">{new Date(p.scheduledAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Recent DMs" action={<Link href="/messages" className="text-sm font-medium text-violet-600 hover:underline">View all →</Link>}>
            {recentDms.length === 0 ? (
              <EmptyState text="No DMs received yet. Connect the Meta webhook in Settings, or send a test DM from the Messages page." />
            ) : (
              <ul className="flex flex-col gap-3">
                {recentDms.map((dm) => (
                  <li key={dm.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="capitalize">{dm.platform} · {dm.senderName || dm.senderId}</span>
                      <span>{new Date(dm.receivedAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-800">{dm.messageText}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-600">
                      {dm.autoReplied ? "✅ Auto-replied" : "⏳ Not replied"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card title="Setup checklist">
            <ul className="flex flex-col gap-2.5">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span>{item.ok ? "✅" : "⬜"}</span>
                    {item.label}
                  </span>
                  {!item.ok && (
                    <Link href={item.href} className="text-xs font-medium text-violet-600 hover:underline">
                      Configure
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              The agent works in simulation mode for anything not yet configured, so you can try the
              full flow immediately.
            </p>
          </Card>

          <Card title="Live activity">
            <ActivityFeed initial={JSON.parse(JSON.stringify(logs))} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone: "good" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "good" ? "text-emerald-600" : tone === "warn" ? "text-amber-600" : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">{text}</p>;
}
