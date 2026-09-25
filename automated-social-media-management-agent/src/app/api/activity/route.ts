import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const logs = await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(50);
  return Response.json({ logs });
}
