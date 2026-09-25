import { db } from "@/db";
import { dmMessages } from "@/db/schema";
import { desc } from "drizzle-orm";
import { SimulateDmForm } from "@/components/SimulateDmForm";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const messages = await db.select().from(dmMessages).orderBy(desc(dmMessages.receivedAt)).limit(100);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">DM Inbox</h1>
        <p className="mt-1 text-sm text-slate-600">
          Instagram &amp; Facebook DMs received through your Meta webhook, along with the automatic
          reply that was sent.
        </p>
      </div>

      <SimulateDmForm />

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No DMs yet. Connect your Meta webhook in Settings, or use the test form above.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((dm) => (
            <div key={dm.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-violet-100 px-2 py-1 font-medium capitalize text-violet-700">
                  {dm.platform}
                </span>
                <span>{dm.senderName || dm.senderId}</span>
                <span>{new Date(dm.receivedAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-slate-900">
                <span className="font-medium">Message: </span>
                {dm.messageText}
              </p>
              {dm.repliedText && (
                <p className="mt-1 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-700">
                  <span className="font-medium">Auto-reply: </span>
                  {dm.repliedText}
                </p>
              )}
              <p className="mt-2 text-xs font-medium">
                {dm.autoReplied ? (
                  <span className="text-emerald-600">✅ Replied automatically</span>
                ) : (
                  <span className="text-amber-600">⚠️ {dm.errorMessage || "Not replied"}</span>
                )}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
