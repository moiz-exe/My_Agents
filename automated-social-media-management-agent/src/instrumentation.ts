// Starts an in-process scheduler when the Next.js server boots. Every minute
// it checks whether it's time to run the marketing automation cycle (based
// on the configured post interval, default 24h) and kicks it off
// automatically. This keeps posting fully "hands off" — content is
// generated, published to Instagram + Facebook, logged to Google Sheets, and
// a summary email is sent, without any manual trigger required.

const globalForScheduler = globalThis as typeof globalThis & {
  __marketingAgentSchedulerStarted?: boolean;
};

const CHECK_INTERVAL_MS = 60 * 1000;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (globalForScheduler.__marketingAgentSchedulerStarted) return;
  globalForScheduler.__marketingAgentSchedulerStarted = true;

  const tick = async () => {
    try {
      const { getSettings, updateSettings } = await import("@/lib/settings");
      const { runAutomationCycle, computeNextRun } = await import("@/lib/automation");

      const settings = await getSettings();
      if (!settings.isAutomationEnabled) return;

      if (!settings.nextRunAt) {
        await updateSettings({ nextRunAt: computeNextRun(settings.postIntervalHours) });
        return;
      }

      if (new Date(settings.nextRunAt).getTime() <= Date.now()) {
        await runAutomationCycle();
      }
    } catch (err) {
      console.error("Marketing agent scheduler tick failed:", err);
    }
  };

  setInterval(tick, CHECK_INTERVAL_MS);
  // Run one check shortly after boot too.
  setTimeout(tick, 15 * 1000);
}
