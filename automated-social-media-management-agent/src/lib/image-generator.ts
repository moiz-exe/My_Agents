import { promises as fs } from "fs";
import path from "path";
import type { IntegrationSettings } from "@/lib/settings";

const FALLBACK_TEMPLATES = [
  "/images/templates/template-1.jpg",
  "/images/templates/template-2.jpg",
  "/images/templates/template-3.jpg",
  "/images/templates/template-4.jpg",
];

export interface GeneratedImage {
  /** Path relative to the public/ folder, e.g. /images/generated/xyz.png */
  relativePath: string;
  simulated: boolean;
}

/**
 * Generates a marketing image. Uses OpenAI's image API when an API key is
 * configured, otherwise falls back to a rotating set of pre-made template
 * graphics that ship with the app so the pipeline always has an image to
 * post.
 */
export async function generateMarketingImage(
  settings: IntegrationSettings,
  imagePrompt: string
): Promise<GeneratedImage> {
  const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: imagePrompt,
          size: "1024x1024",
          n: 1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI image error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json as string | undefined;
      if (!b64) throw new Error("No image data returned from OpenAI");

      const dir = path.join(process.cwd(), "public", "images", "generated");
      await fs.mkdir(dir, { recursive: true });
      const fileName = `post-${Date.now()}-${Math.round(Math.random() * 1e6)}.png`;
      const filePath = path.join(dir, fileName);
      await fs.writeFile(filePath, Buffer.from(b64, "base64"));

      return { relativePath: `/images/generated/${fileName}`, simulated: false };
    } catch (err) {
      console.error("Image generation failed, falling back to template image:", err);
    }
  }

  const fallback = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
  return { relativePath: fallback, simulated: true };
}

export function toAbsoluteUrl(settings: IntegrationSettings, relativePath: string): string {
  const base =
    settings.publicBaseUrl?.trim().replace(/\/$/, "") ||
    process.env.APP_BASE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}${relativePath}`;
}
