import { db } from "@/db";
import { integrationSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type IntegrationSettings = typeof integrationSettings.$inferSelect;

/**
 * The settings table always has a single row with id = 1. This helper makes
 * sure that row exists and returns it.
 */
export async function getSettings(): Promise<IntegrationSettings> {
  const rows = await db
    .select()
    .from(integrationSettings)
    .where(eq(integrationSettings.id, 1))
    .limit(1);

  if (rows.length > 0) {
    return rows[0];
  }

  const inserted = await db
    .insert(integrationSettings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning();

  if (inserted.length > 0) {
    return inserted[0];
  }

  // Race condition fallback: read again.
  const retry = await db
    .select()
    .from(integrationSettings)
    .where(eq(integrationSettings.id, 1))
    .limit(1);
  return retry[0];
}

export async function updateSettings(
  patch: Partial<Omit<IntegrationSettings, "id" | "createdAt" | "updatedAt">>
): Promise<IntegrationSettings> {
  await getSettings();
  const updated = await db
    .update(integrationSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(integrationSettings.id, 1))
    .returning();
  return updated[0];
}

export function isOpenAiConfigured(settings: IntegrationSettings) {
  return Boolean(settings.openaiApiKey || process.env.OPENAI_API_KEY);
}

export function isEmailConfigured(settings: IntegrationSettings) {
  return Boolean(
    settings.smtpHost && settings.smtpUser && settings.smtpPass && settings.notifyEmail
  );
}

export function isSheetsConfigured(settings: IntegrationSettings) {
  return Boolean(
    settings.googleClientEmail && settings.googlePrivateKey && settings.googleSheetId
  );
}
