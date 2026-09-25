import { db } from "@/db";
import { dmMessages, socialAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSettings } from "@/lib/settings";
import { sendDirectMessageReply } from "@/lib/publisher";
import { sendNotificationEmail, buildDmNotificationEmail } from "@/lib/email";
import { logActivity } from "@/lib/logger";

export interface IncomingDm {
  platform: "instagram" | "facebook";
  pageId: string;
  senderId: string;
  senderName?: string | null;
  messageText: string;
}

/**
 * Handles one incoming DM: stores it, auto-replies via the Meta Send API
 * (if credentials for the receiving page are configured), and sends an
 * email notification to the business owner.
 */
export async function handleIncomingDm(dm: IncomingDm) {
  const settings = await getSettings();

  const account = (
    await db.select().from(socialAccounts).where(eq(socialAccounts.pageId, dm.pageId)).limit(1)
  )[0];

  let autoReplied = false;
  let errorMessage: string | null = null;
  const replyText = settings.autoReplyMessage;

  if (settings.isAutoReplyEnabled) {
    if (account?.accessToken) {
      const result = await sendDirectMessageReply({
        platform: dm.platform,
        pageId: dm.pageId,
        accessToken: account.accessToken,
        recipientId: dm.senderId,
        message: replyText,
      });
      autoReplied = result.success;
      errorMessage = result.success ? null : result.errorMessage || "Unknown error";
    } else {
      errorMessage = "No matching account/access token configured for this page — reply simulated only.";
    }
  }

  await db.insert(dmMessages).values({
    platform: dm.platform,
    pageId: dm.pageId,
    senderId: dm.senderId,
    senderName: dm.senderName,
    messageText: dm.messageText,
    repliedText: settings.isAutoReplyEnabled ? replyText : null,
    autoReplied,
    errorMessage,
  });

  await logActivity(
    "dm",
    `New ${dm.platform} DM from ${dm.senderName || dm.senderId}${
      autoReplied ? " — auto-replied." : errorMessage ? ` — auto-reply failed: ${errorMessage}` : " — auto-reply disabled."
    }`,
    autoReplied ? "success" : errorMessage ? "error" : "info"
  );

  const emailResult = await sendNotificationEmail(
    settings,
    `💬 New ${dm.platform} DM for ${settings.brandName}`,
    buildDmNotificationEmail({
      brandName: settings.brandName,
      platform: dm.platform,
      senderName: dm.senderName,
      messageText: dm.messageText,
      replyText: autoReplied ? replyText : null,
    })
  );

  if (!emailResult.simulated) {
    await logActivity(
      "email",
      emailResult.sent
        ? `DM notification email sent to ${settings.notifyEmail}.`
        : `Failed to send DM notification email: ${emailResult.errorMessage}`,
      emailResult.sent ? "success" : "error"
    );
  }

  return { autoReplied, errorMessage };
}
