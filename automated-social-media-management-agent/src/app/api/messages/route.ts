import { db } from "@/db";
import { dmMessages } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const messages = await db.select().from(dmMessages).orderBy(desc(dmMessages.receivedAt)).limit(100);
  return Response.json({ messages });
}
