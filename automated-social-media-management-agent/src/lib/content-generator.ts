import type { IntegrationSettings } from "@/lib/settings";

export interface GeneratedPost {
  caption: string;
  hashtags: string[];
  imagePrompt: string;
  simulated: boolean;
}

const TEMPLATE_HOOKS = [
  "Struggling to get noticed online?",
  "Your competitors are already investing here — are you?",
  "Ready to turn followers into paying customers?",
  "Growth doesn't happen by accident.",
  "Stop guessing. Start growing.",
  "Your brand deserves more than a boring feed.",
  "Traffic is great. Conversions are better.",
  "Let's turn your social media into a sales machine.",
];

const TEMPLATE_BODIES = [
  "We help brands like yours build scroll-stopping content, run high-ROI ad campaigns, and grow an audience that actually converts.",
  "From SEO to paid ads to content strategy — we handle the marketing so you can focus on running your business.",
  "Our data-driven digital marketing strategies are built to get you more leads, more sales, and more visibility.",
  "We combine creative storytelling with performance marketing to help your business stand out and scale.",
  "Whether it's Instagram growth, Facebook ads, or full-funnel strategy — our team delivers measurable results.",
];

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function templatedPost(settings: IntegrationSettings): GeneratedPost {
  const hook = pick(TEMPLATE_HOOKS);
  const body = pick(TEMPLATE_BODIES);
  const caption = `${hook}\n\n${body}\n\n${settings.callToAction}`;
  const hashtags = [
    "#DigitalMarketing",
    "#SocialMediaMarketing",
    "#MarketingAgency",
    "#GrowYourBusiness",
    "#SEO",
    "#PaidAds",
    "#BrandGrowth",
    "#ContentMarketing",
  ];
  return {
    caption,
    hashtags,
    imagePrompt: `A vibrant, modern flat-design social media graphic promoting digital marketing services for ${settings.brandName}, with bold typography, gradient background in purple/blue/orange, icons of growth charts, megaphone, smartphone, and social icons, professional marketing agency style, no realistic faces`,
    simulated: true,
  };
}

export async function generateMarketingPost(
  settings: IntegrationSettings
): Promise<GeneratedPost> {
  const apiKey = settings.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return templatedPost(settings);
  }

  try {
    const prompt = `You are a senior social media copywriter for "${settings.brandName}", an agency that offers ${settings.niche}.
Write ONE short, high-converting Instagram/Facebook caption advertising the agency's digital marketing services.
Tone: ${settings.brandVoice}.
Include a strong hook in the first line, 2-3 sentences of value/benefits, and end with this call to action verbatim: "${settings.callToAction}".
Do NOT include hashtags in the caption itself.
Then, separately, provide 8 relevant hashtags (no repeats, no spaces, each starting with #).
Also provide one short descriptive prompt (max 40 words) for an AI image generator to create an eye-catching square social media graphic to accompany this post (flat design, no text, no realistic human faces).

Respond ONLY with strict JSON in this exact shape:
{"caption": "...", "hashtags": ["#tag1", "#tag2"], "imagePrompt": "..."}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI chat error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty OpenAI response");

    const parsed = JSON.parse(raw) as {
      caption: string;
      hashtags: string[];
      imagePrompt: string;
    };

    return {
      caption: parsed.caption?.trim() || templatedPost(settings).caption,
      hashtags: parsed.hashtags?.length ? parsed.hashtags : templatedPost(settings).hashtags,
      imagePrompt:
        parsed.imagePrompt?.trim() ||
        `A vibrant flat-design social media graphic for a digital marketing agency called ${settings.brandName}`,
      simulated: false,
    };
  } catch (err) {
    console.error("Content generation failed, falling back to template:", err);
    return templatedPost(settings);
  }
}
