import nodemailer from "nodemailer";
import type { IntegrationSettings } from "@/lib/settings";
import { isEmailConfigured } from "@/lib/settings";

export interface EmailResult {
  sent: boolean;
  simulated: boolean;
  errorMessage?: string;
}

export async function sendNotificationEmail(
  settings: IntegrationSettings,
  subject: string,
  html: string
): Promise<EmailResult> {
  if (!isEmailConfigured(settings)) {
    console.log("[email:simulated]", subject);
    return { sent: false, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost!,
      port: settings.smtpPort || 587,
      secure: (settings.smtpPort || 587) === 465,
      auth: {
        user: settings.smtpUser!,
        pass: settings.smtpPass!,
      },
    });

    await transporter.sendMail({
      from: settings.smtpFrom || settings.smtpUser!,
      to: settings.notifyEmail!,
      subject,
      html,
    });

    return { sent: true, simulated: false };
  } catch (err) {
    console.error("Failed to send notification email:", err);
    return {
      sent: false,
      simulated: false,
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }
}

export function buildRunSummaryEmail(params: {
  brandName: string;
  results: Array<{
    platform: string;
    accountName: string;
    status: string;
    link?: string | null;
    errorMessage?: string | null;
  }>;
  caption: string;
  imageUrl: string;
  runAt: Date;
}) {
  const rows = params.results
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;text-transform:capitalize;">${r.platform}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;">${r.accountName}</td>
        <td style="padding:8px 12px;border:1px solid #e2e8f0;color:${
          r.status === "published" ? "#16a34a" : "#dc2626"
        };font-weight:600;text-transform:capitalize;">${r.status}${
        r.errorMessage ? ` - ${r.errorMessage}` : ""
      }</td>
      </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
    <h2 style="margin-bottom:4px;">📣 ${params.brandName} — Automated Post Run</h2>
    <p style="color:#475569;margin-top:0;">Run completed at ${params.runAt.toLocaleString()}</p>
    <p style="white-space:pre-wrap;background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0;">${params.caption}</p>
    <img src="${params.imageUrl}" alt="post image" style="max-width:100%;border-radius:8px;margin:12px 0;" />
    <table style="border-collapse:collapse;width:100%;margin-top:12px;">
      <thead>
        <tr style="background:#f1f5f9;">
          <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;">Platform</th>
          <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;">Account</th>
          <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="color:#94a3b8;font-size:12px;margin-top:24px;">This is an automated notification from your Marketing Agent.</p>
  </div>`;
}

export function buildDmNotificationEmail(params: {
  brandName: string;
  platform: string;
  senderName?: string | null;
  messageText: string;
  replyText?: string | null;
}) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
    <h2 style="margin-bottom:4px;">💬 New ${params.platform} DM for ${params.brandName}</h2>
    <p><strong>From:</strong> ${params.senderName || "Unknown"}</p>
    <p style="background:#f8fafc;padding:12px 16px;border-radius:8px;border:1px solid #e2e8f0;">${params.messageText}</p>
    ${
      params.replyText
        ? `<p style="color:#475569;">🤖 Auto-reply sent:</p>
    <p style="background:#ecfdf5;padding:12px 16px;border-radius:8px;border:1px solid #bbf7d0;">${params.replyText}</p>`
        : ""
    }
    <p style="color:#94a3b8;font-size:12px;margin-top:24px;">This is an automated notification from your Marketing Agent.</p>
  </div>`;
}
