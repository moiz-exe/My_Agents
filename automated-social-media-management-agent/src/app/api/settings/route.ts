import { getSettings, updateSettings } from "@/lib/settings";
import { computeNextRun } from "@/lib/automation";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return Response.json({ settings });
}

export async function PUT(req: Request) {
  const body = await req.json();

  const allowedFields = [
    "brandName",
    "niche",
    "websiteLink",
    "publicBaseUrl",
    "brandVoice",
    "callToAction",
    "isAutomationEnabled",
    "postIntervalHours",
    "openaiApiKey",
    "smtpHost",
    "smtpPort",
    "smtpUser",
    "smtpPass",
    "smtpFrom",
    "notifyEmail",
    "googleClientEmail",
    "googlePrivateKey",
    "googleSheetId",
    "metaVerifyToken",
    "metaAppSecret",
    "autoReplyMessage",
    "isAutoReplyEnabled",
  ] as const;

  const patch: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) patch[field] = body[field];
  }

  const current = await getSettings();
  if (
    "postIntervalHours" in patch &&
    patch.postIntervalHours !== current.postIntervalHours
  ) {
    patch.nextRunAt = computeNextRun(Number(patch.postIntervalHours));
  }

  const updated = await updateSettings(patch);
  return Response.json({ settings: updated });
}
