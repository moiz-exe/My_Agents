import { handleIncomingDm } from "@/lib/dm-handler";

export const dynamic = "force-dynamic";

// Lets you try out the auto-reply + notification flow from the dashboard
// without needing a live Meta webhook connected yet.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const result = await handleIncomingDm({
    platform: body.platform === "facebook" ? "facebook" : "instagram",
    pageId: body.pageId || "demo-page",
    senderId: body.senderId || `demo-${Date.now()}`,
    senderName: body.senderName || "Test User",
    messageText: body.messageText || "Hi! Do you offer social media marketing packages?",
  });

  return Response.json(result);
}
