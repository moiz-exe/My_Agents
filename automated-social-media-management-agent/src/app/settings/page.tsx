import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/SettingsForm";
import { AccountsManager } from "@/components/AccountsManager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, accounts] = await Promise.all([
    getSettings(),
    db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure your brand, connected accounts, and every integration the agent uses.
        </p>
      </div>

      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-sm text-violet-900">
        <p className="font-semibold">📡 Webhook URL for Instagram/Facebook DM auto-replies</p>
        <p className="mt-1">
          In your Meta App Dashboard → Webhooks, subscribe your Page/Instagram to this callback URL
          using the verify token below:
        </p>
        <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-xs text-slate-800">
          {(process.env.APP_BASE_URL || "https://your-deployed-app.com") + "/api/webhooks/meta"}
        </code>
        <p className="mt-1 text-xs">
          Subscribe to the <strong>messages</strong> field for Messenger, and{" "}
          <strong>messages</strong>/<strong>comments</strong> for Instagram.
        </p>
      </div>

      <AccountsManager initial={JSON.parse(JSON.stringify(accounts))} />

      <SettingsForm
        initial={{
          brandName: settings.brandName,
          niche: settings.niche,
          websiteLink: settings.websiteLink,
          publicBaseUrl: settings.publicBaseUrl,
          brandVoice: settings.brandVoice,
          callToAction: settings.callToAction,
          isAutomationEnabled: settings.isAutomationEnabled,
          postIntervalHours: settings.postIntervalHours,
          openaiApiKey: settings.openaiApiKey,
          smtpHost: settings.smtpHost,
          smtpPort: settings.smtpPort,
          smtpUser: settings.smtpUser,
          smtpPass: settings.smtpPass,
          smtpFrom: settings.smtpFrom,
          notifyEmail: settings.notifyEmail,
          googleClientEmail: settings.googleClientEmail,
          googlePrivateKey: settings.googlePrivateKey,
          googleSheetId: settings.googleSheetId,
          metaVerifyToken: settings.metaVerifyToken,
          metaAppSecret: settings.metaAppSecret,
          autoReplyMessage: settings.autoReplyMessage,
          isAutoReplyEnabled: settings.isAutoReplyEnabled,
        }}
      />
    </div>
  );
}
