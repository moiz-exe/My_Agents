const GRAPH_API_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

export interface PublishInput {
  pageId: string;
  accessToken: string;
  caption: string;
  imageUrl: string;
}

export interface PublishResult {
  success: boolean;
  externalPostId?: string;
  errorMessage?: string;
}

/**
 * Publishes a photo post with a caption to a Facebook Page using the
 * Page's access token.
 * Docs: https://developers.facebook.com/docs/pages-api/posts
 */
export async function publishToFacebook(input: PublishInput): Promise<PublishResult> {
  try {
    const url = `${GRAPH_BASE}/${input.pageId}/photos`;
    const body = new URLSearchParams({
      url: input.imageUrl,
      caption: input.caption,
      access_token: input.accessToken,
    });

    const res = await fetch(url, { method: "POST", body });
    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        errorMessage: data?.error?.message || `Facebook API error (${res.status})`,
      };
    }

    return { success: true, externalPostId: data.post_id || data.id };
  } catch (err) {
    return { success: false, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Publishes a photo post with a caption to an Instagram Business account.
 * Two-step process: create a media container, then publish it.
 * Docs: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/content-publishing
 */
export async function publishToInstagram(input: PublishInput): Promise<PublishResult> {
  try {
    const createUrl = `${GRAPH_BASE}/${input.pageId}/media`;
    const createBody = new URLSearchParams({
      image_url: input.imageUrl,
      caption: input.caption,
      access_token: input.accessToken,
    });

    const createRes = await fetch(createUrl, { method: "POST", body: createBody });
    const createData = await createRes.json();

    if (!createRes.ok || !createData.id) {
      return {
        success: false,
        errorMessage: createData?.error?.message || `Instagram container error (${createRes.status})`,
      };
    }

    const publishUrl = `${GRAPH_BASE}/${input.pageId}/media_publish`;
    const publishBody = new URLSearchParams({
      creation_id: createData.id,
      access_token: input.accessToken,
    });

    const publishRes = await fetch(publishUrl, { method: "POST", body: publishBody });
    const publishData = await publishRes.json();

    if (!publishRes.ok || !publishData.id) {
      return {
        success: false,
        errorMessage: publishData?.error?.message || `Instagram publish error (${publishRes.status})`,
      };
    }

    return { success: true, externalPostId: publishData.id };
  } catch (err) {
    return { success: false, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Sends a direct message reply via the Meta Send API. Works for both
 * Facebook Messenger and Instagram Direct when using a Page access token
 * that has the relevant messaging permissions.
 * Docs: https://developers.facebook.com/docs/messenger-platform/reference/send-api
 */
export async function sendDirectMessageReply(input: {
  platform: string;
  pageId: string;
  accessToken: string;
  recipientId: string;
  message: string;
}): Promise<PublishResult> {
  try {
    const url =
      input.platform === "instagram"
        ? `${GRAPH_BASE}/me/messages?platform=instagram`
        : `${GRAPH_BASE}/me/messages`;

    const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(input.accessToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: input.recipientId },
        message: { text: input.message },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        errorMessage: data?.error?.message || `Send API error (${res.status})`,
      };
    }

    return { success: true, externalPostId: data.message_id };
  } catch (err) {
    return { success: false, errorMessage: err instanceof Error ? err.message : String(err) };
  }
}
