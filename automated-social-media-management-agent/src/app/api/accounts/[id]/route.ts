import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logActivity } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["accountName", "pageId", "accessToken", "isActive"] as const;
  const patch: Record<string, unknown> = {};
  for (const field of allowed) {
    if (field in body) patch[field] = body[field];
  }

  const [updated] = await db
    .update(socialAccounts)
    .set(patch)
    .where(eq(socialAccounts.id, Number(id)))
    .returning();

  return Response.json({ account: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [deleted] = await db
    .delete(socialAccounts)
    .where(eq(socialAccounts.id, Number(id)))
    .returning();

  if (deleted) {
    await logActivity("automation", `Removed account: ${deleted.accountName}.`, "info");
  }

  return Response.json({ success: true });
}
