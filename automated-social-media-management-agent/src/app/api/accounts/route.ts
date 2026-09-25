import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { desc } from "drizzle-orm";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt));
  return Response.json({ accounts });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { platform, accountName, pageId, accessToken, isActive } = body;

  if (!platform || !accountName || !pageId) {
    return Response.json(
      { error: "platform, accountName, and pageId are required" },
      { status: 400 }
    );
  }

  const [account] = await db
    .insert(socialAccounts)
    .values({
      platform,
      accountName,
      pageId,
      accessToken: accessToken || "",
      isActive: isActive ?? true,
    })
    .returning();

  await logActivity(
    "automation",
    `Connected new ${platform} account: ${accountName}.`,
    "success"
  );

  return Response.json({ account });
}
