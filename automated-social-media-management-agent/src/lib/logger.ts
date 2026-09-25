import { db } from "@/db";
import { activityLogs } from "@/db/schema";

export type ActivityType = "automation" | "email" | "sheet" | "dm" | "post" | "error";
export type ActivityLevel = "info" | "success" | "error";

export async function logActivity(
  type: ActivityType,
  message: string,
  level: ActivityLevel = "info"
) {
  try {
    await db.insert(activityLogs).values({ type, level, message });
  } catch (err) {
    // Logging should never crash the caller.
    console.error("Failed to write activity log:", err);
  }
}
