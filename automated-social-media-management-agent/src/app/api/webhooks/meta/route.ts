import { getSettings } from "@/lib/settings";
import { handleIncomingDm } from "@/lib/dm-handler";

export const dynamic = "force-dynamic";

// Meta calls this once when you register the webhook in the Meta App
// Dashboard to verify ownership.
// Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started
export async function GET(req: Request) {
  const settings = await getSettings();
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === (settings.metaVerifyToken || "marketing-agent-verify")) {
    return new Response(challenge ?? "", { status: 200 });
  }

  return new Response("Verification failed", { status: 403 });
}

interface MetaMessagingEvent {
  sender?: { id?: string };
  recipient?: { id?: string };
  message?: { text?: string; is_echo?: boolean };
}

interface MetaEntry {
  id?: string;
  messaging?: MetaMessagingEvent[];
  changes?: Array<{
    field?: string;
    value?: {
      from?: { id?: string; username?: string };
      sender?: { id?: string };
      message?: string;
      text?: string;
    };
  }>;
}

interface MetaWebhookBody {
  object?: string; // 'page' | 'instagram'
  entry?: MetaEntry[];
}

// Receives real-time Instagram Direct / Facebook Messenger events and
// triggers an automatic reply.
// Docs: https://developers.facebook.com/docs/messenger-platform/webhooks
export async function POST(req: Request) {
  const body = (await req.json()) as MetaWebhookBody;
  const platform: "instagram" | "facebook" = body.object === "instagram" ? "instagram" : "facebook";

  try {
    for (const entry of body.entry || []) {
      const pageId = entry.id || "";

      for (const event of entry.messaging || []) {
        if (event.message?.is_echo) continue; // ignore our own auto-replies
        const senderId = event.sender?.id;
        const text = event.message?.text;
        if (!senderId || !text) continue;

        await handleIncomingDm({
          platform,
          pageId,
          senderId,
          messageText: text,
        });
      }

      // Instagram messaging sometimes arrives via `changes` with field "messages"
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;
        const senderId = change.value?.from?.id || change.value?.sender?.id;
        const text = change.value?.message || change.value?.text;
        if (!senderId || !text) continue;

        await handleIncomingDm({
          platform: "instagram",
          pageId,
          senderId,
          senderName: change.value?.from?.username,
          messageText: text,
        });
      }
    }
  } catch (err) {
    console.error("Error processing Meta webhook event:", err);
  }

  // Always 200 quickly so Meta doesn't retry/disable the webhook.
  return new Response("EVENT_RECEIVED", { status: 200 });
}
