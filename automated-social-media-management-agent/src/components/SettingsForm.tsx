"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SettingsShape {
  brandName: string;
  niche: string;
  websiteLink: string;
  publicBaseUrl: string | null;
  brandVoice: string;
  callToAction: string;
  isAutomationEnabled: boolean;
  postIntervalHours: number;
  openaiApiKey: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  notifyEmail: string | null;
  googleClientEmail: string | null;
  googlePrivateKey: string | null;
  googleSheetId: string | null;
  metaVerifyToken: string | null;
  metaAppSecret: string | null;
  autoReplyMessage: string;
  isAutoReplyEnabled: boolean;
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

const inputClass =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

function SectionShell({
  title,
  description,
  children,
  onSave,
  saving,
  saved,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-xs font-medium text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: SettingsShape }) {
  const [form, setForm] = useState<SettingsShape>(initial);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const router = useRouter();

  const set = <K extends keyof SettingsShape>(key: K, value: SettingsShape[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const save = async (section: string, fields: (keyof SettingsShape)[]) => {
    setSavingSection(section);
    setSavedSection(null);
    const patch: Record<string, unknown> = {};
    for (const f of fields) patch[f] = form[f];
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavingSection(null);
    setSavedSection(section);
    router.refresh();
    setTimeout(() => setSavedSection(null), 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionShell
        title="Business & content"
        description="Used by the AI copywriter to generate on-brand marketing captions and images."
        onSave={() => save("business", ["brandName", "niche", "websiteLink", "brandVoice", "callToAction", "publicBaseUrl"])}
        saving={savingSection === "business"}
        saved={savedSection === "business"}
      >
        <Field label="Brand name">
          <input className={inputClass} value={form.brandName} onChange={(e) => set("brandName", e.target.value)} />
        </Field>
        <Field label="Website / offer link" hint="Included with every post and logged to Sheets.">
          <input className={inputClass} value={form.websiteLink} onChange={(e) => set("websiteLink", e.target.value)} />
        </Field>
        <Field label="Niche / services" hint="Describe what you sell.">
          <textarea className={inputClass} rows={2} value={form.niche} onChange={(e) => set("niche", e.target.value)} />
        </Field>
        <Field label="Brand voice">
          <input className={inputClass} value={form.brandVoice} onChange={(e) => set("brandVoice", e.target.value)} />
        </Field>
        <Field label="Call to action">
          <input className={inputClass} value={form.callToAction} onChange={(e) => set("callToAction", e.target.value)} />
        </Field>
        <Field
          label="Public app URL"
          hint="Your deployed domain (e.g. https://yourapp.com). Required so Meta can fetch generated images."
        >
          <input
            className={inputClass}
            placeholder="https://your-deployed-app.com"
            value={form.publicBaseUrl ?? ""}
            onChange={(e) => set("publicBaseUrl", e.target.value)}
          />
        </Field>
      </SectionShell>

      <SectionShell
        title="Automation schedule"
        description="Controls how often the agent generates and publishes a new post automatically."
        onSave={() => save("automation", ["isAutomationEnabled", "postIntervalHours"])}
        saving={savingSection === "automation"}
        saved={savedSection === "automation"}
      >
        <Field label="Post every (hours)">
          <input
            type="number"
            min={1}
            className={inputClass}
            value={form.postIntervalHours}
            onChange={(e) => set("postIntervalHours", Number(e.target.value) || 24)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.isAutomationEnabled}
            onChange={(e) => set("isAutomationEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-violet-600"
          />
          Automation enabled
        </label>
      </SectionShell>

      <SectionShell
        title="OpenAI (content + image generation)"
        description="Optional. Without a key, the agent uses built-in caption templates and pre-made graphics."
        onSave={() => save("openai", ["openaiApiKey"])}
        saving={savingSection === "openai"}
        saved={savedSection === "openai"}
      >
        <Field label="OpenAI API key">
          <input
            type="password"
            className={inputClass}
            placeholder="sk-..."
            value={form.openaiApiKey ?? ""}
            onChange={(e) => set("openaiApiKey", e.target.value)}
          />
        </Field>
      </SectionShell>

      <SectionShell
        title="Email notifications (SMTP)"
        description="Get emailed a summary every time the agent publishes posts or receives a DM."
        onSave={() =>
          save("email", ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFrom", "notifyEmail"])
        }
        saving={savingSection === "email"}
        saved={savedSection === "email"}
      >
        <Field label="SMTP host" hint="e.g. smtp.gmail.com">
          <input className={inputClass} value={form.smtpHost ?? ""} onChange={(e) => set("smtpHost", e.target.value)} />
        </Field>
        <Field label="SMTP port">
          <input
            type="number"
            className={inputClass}
            value={form.smtpPort ?? 587}
            onChange={(e) => set("smtpPort", Number(e.target.value) || 587)}
          />
        </Field>
        <Field label="SMTP username">
          <input className={inputClass} value={form.smtpUser ?? ""} onChange={(e) => set("smtpUser", e.target.value)} />
        </Field>
        <Field label="SMTP password / app password">
          <input
            type="password"
            className={inputClass}
            value={form.smtpPass ?? ""}
            onChange={(e) => set("smtpPass", e.target.value)}
          />
        </Field>
        <Field label="From address">
          <input className={inputClass} value={form.smtpFrom ?? ""} onChange={(e) => set("smtpFrom", e.target.value)} />
        </Field>
        <Field label="Notify email (send summaries to)">
          <input className={inputClass} value={form.notifyEmail ?? ""} onChange={(e) => set("notifyEmail", e.target.value)} />
        </Field>
      </SectionShell>

      <SectionShell
        title="Google Sheets logging"
        description="Every post gets a row with date, time, account, platform, content, link, and status."
        onSave={() => save("sheets", ["googleClientEmail", "googlePrivateKey", "googleSheetId"])}
        saving={savingSection === "sheets"}
        saved={savedSection === "sheets"}
      >
        <Field label="Service account email">
          <input
            className={inputClass}
            placeholder="agent@project.iam.gserviceaccount.com"
            value={form.googleClientEmail ?? ""}
            onChange={(e) => set("googleClientEmail", e.target.value)}
          />
        </Field>
        <Field label="Google Sheet ID" hint="From the sheet URL between /d/ and /edit">
          <input className={inputClass} value={form.googleSheetId ?? ""} onChange={(e) => set("googleSheetId", e.target.value)} />
        </Field>
        <Field label="Service account private key" hint="Paste the full private key, including BEGIN/END lines.">
          <textarea
            className={inputClass}
            rows={4}
            value={form.googlePrivateKey ?? ""}
            onChange={(e) => set("googlePrivateKey", e.target.value)}
          />
        </Field>
      </SectionShell>

      <SectionShell
        title="Instagram & Facebook DM auto-reply"
        description="Connect a Meta webhook to /api/webhooks/meta so incoming DMs get an instant automatic reply."
        onSave={() =>
          save("dm", ["metaVerifyToken", "metaAppSecret", "autoReplyMessage", "isAutoReplyEnabled"])
        }
        saving={savingSection === "dm"}
        saved={savedSection === "dm"}
      >
        <Field label="Webhook verify token" hint="Use this exact value when registering the webhook in Meta App Dashboard.">
          <input className={inputClass} value={form.metaVerifyToken ?? ""} onChange={(e) => set("metaVerifyToken", e.target.value)} />
        </Field>
        <Field label="Meta app secret (optional)">
          <input
            type="password"
            className={inputClass}
            value={form.metaAppSecret ?? ""}
            onChange={(e) => set("metaAppSecret", e.target.value)}
          />
        </Field>
        <Field label="Auto-reply message">
          <textarea
            className={inputClass}
            rows={3}
            value={form.autoReplyMessage}
            onChange={(e) => set("autoReplyMessage", e.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={form.isAutoReplyEnabled}
            onChange={(e) => set("isAutoReplyEnabled", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-violet-600"
          />
          Auto-reply enabled
        </label>
      </SectionShell>
    </div>
  );
}
