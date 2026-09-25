import { db } from "@/db";
import { posts, socialAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSettings, updateSettings } from "@/lib/settings";
import { generateMarketingPost } from "@/lib/content-generator";
import { generateMarketingImage, toAbsoluteUrl } from "@/lib/image-generator";
import { publishToFacebook, publishToInstagram } from "@/lib/publisher";
import { sendNotificationEmail, buildRunSummaryEmail } from "@/lib/email";
import { logPostToSheet } from "@/lib/sheets";
import { logActivity } from "@/lib/logger";

export interface AutomationRunResult {
  ran: boolean;
  reason?: string;
  postsCreated: number;
}

export async function runAutomationCycle(options?: { force?: boolean }): Promise<AutomationRunResult> {
  const settings = await getSettings();

  if (!settings.isAutomationEnabled && !options?.force) {
    return { ran: false, reason: "Automation is disabled", postsCreated: 0 };
  }

  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(eq(socialAccounts.isActive, true));

  if (accounts.length === 0) {
    await logActivity(
      "automation",
      "Automation run skipped: no active Instagram/Facebook accounts configured.",
      "error"
    );
    await updateSettings({ lastRunAt: new Date(), nextRunAt: computeNextRun(settings.postIntervalHours) });
    return { ran: false, reason: "No active accounts configured", postsCreated: 0 };
  }

  await logActivity("automation", "Starting scheduled content generation + publishing run...", "info");

  const generated = await generateMarketingPost(settings);
  const image = await generateMarketingImage(settings, generated.imagePrompt);
  const absoluteImageUrl = toAbsoluteUrl(settings, image.relativePath);

  const captionWithHashtags = `${generated.caption}\n\n${generated.hashtags.join(" ")}`;

  const runResults: Array<{
    platform: string;
    accountName: string;
    status: string;
    link?: string | null;
    errorMessage?: string | null;
  }> = [];

  const now = new Date();

  for (const account of accounts) {
    const [postRow] = await db
      .insert(posts)
      .values({
        platform: account.platform,
        accountName: account.accountName,
        content: captionWithHashtags,
        imageUrl: image.relativePath,
        link: settings.websiteLink,
        status: "draft",
        scheduledAt: now,
      })
      .returning();

    let publishResult;
    const hasCredentials = Boolean(account.accessToken && account.pageId);

    if (!hasCredentials) {
      publishResult = {
        success: false,
        errorMessage: "Missing access token / page ID — simulated only. Add real credentials in Settings.",
      };
    } else if (account.platform === "instagram") {
      publishResult = await publishToInstagram({
        pageId: account.pageId,
        accessToken: account.accessToken,
        caption: captionWithHashtags,
        imageUrl: absoluteImageUrl,
      });
    } else {
      publishResult = await publishToFacebook({
        pageId: account.pageId,
        accessToken: account.accessToken,
        caption: captionWithHashtags,
        imageUrl: absoluteImageUrl,
      });
    }

    const status = publishResult.success ? "published" : hasCredentials ? "failed" : "simulated";

    await db
      .update(posts)
      .set({
        status,
        externalPostId: publishResult.success ? publishResult.externalPostId : null,
        errorMessage: publishResult.success ? null : publishResult.errorMessage,
        publishedAt: publishResult.success ? new Date() : null,
      })
      .where(eq(posts.id, postRow.id));

    const sheetResult = await logPostToSheet(settings, {
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
      accountName: account.accountName,
      platform: account.platform,
      content: captionWithHashtags,
      link: settings.websiteLink,
      status,
    });

    await db
      .update(posts)
      .set({ sheetSynced: sheetResult.logged })
      .where(eq(posts.id, postRow.id));

    runResults.push({
      platform: account.platform,
      accountName: account.accountName,
      status,
      link: settings.websiteLink,
      errorMessage: publishResult.success ? null : publishResult.errorMessage,
    });

    await logActivity(
      "post",
      `${account.platform.toUpperCase()} (${account.accountName}): ${status}${
        publishResult.success ? "" : ` — ${publishResult.errorMessage}`
      }`,
      publishResult.success ? "success" : "error"
    );
  }

  const emailResult = await sendNotificationEmail(
    settings,
    `📣 New marketing post run for ${settings.brandName}`,
    buildRunSummaryEmail({
      brandName: settings.brandName,
      results: runResults,
      caption: captionWithHashtags,
      imageUrl: absoluteImageUrl,
      runAt: now,
    })
  );

  await logActivity(
    "email",
    emailResult.simulated
      ? "Email notification simulated (configure SMTP in Settings to send real emails)."
      : emailResult.sent
      ? `Run summary email sent to ${settings.notifyEmail}.`
      : `Failed to send run summary email: ${emailResult.errorMessage}`,
    emailResult.sent ? "success" : emailResult.simulated ? "info" : "error"
  );

  await updateSettings({
    lastRunAt: now,
    nextRunAt: computeNextRun(settings.postIntervalHours, now),
  });

  await logActivity(
    "automation",
    `Automation run complete. ${runResults.length} post(s) processed.`,
    "success"
  );

  return { ran: true, postsCreated: runResults.length };
}

export function computeNextRun(intervalHours: number, from: Date = new Date()): Date {
  return new Date(from.getTime() + intervalHours * 60 * 60 * 1000);
}
