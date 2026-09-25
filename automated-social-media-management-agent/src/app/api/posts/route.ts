import { db } from "@/db";
import { posts } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const allPosts = await db.select().from(posts).orderBy(desc(posts.createdAt)).limit(100);
  return Response.json({ posts: allPosts });
}
