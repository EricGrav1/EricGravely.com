import { storage } from "./storage";
import { processBroadcasts } from "./broadcast";
import { runSequenceTick } from "./sequence";

// All outgoing list email (scheduled broadcasts, broadcast batches, sequence
// steps) is sent by runEmailJobs(). It's triggered three ways:
//   1. POST /api/cron/email — an external scheduler (GitHub Actions, see
//      .github/workflows/email-cron.yml) pings it every 10 minutes. This is
//      what keeps email flowing on Replit Autoscale, where the server sleeps
//      when nobody is visiting and in-process timers don't fire.
//   2. The admin panel, while a broadcast is sending or on "Send due emails now".
//   3. An in-process timer (works in dev and on always-on deployments).
// Every step claims its work atomically, so overlapping runs never double-send.

export const LAST_RUN_KEY = "email_jobs_last_run";

export interface EmailJobsResult {
  source: string;
  activated: number;
  broadcastSent: number;
  broadcastFailed: number;
  sequenceSent: number;
  sequenceFailed: number;
  paused?: string;
  ms: number;
}

export async function runEmailJobs(source: string, budgetMs: number): Promise<EmailJobsResult> {
  const started = Date.now();
  const deadline = started + budgetMs;

  const activated = await storage.activateDueBroadcasts();
  // Broadcasts get first dibs on the time budget, sequences get the rest.
  const bc = await processBroadcasts(deadline);
  const seq = bc.paused ? { sent: 0, failed: 0, paused: undefined } : await runSequenceTick(deadline);

  const result: EmailJobsResult = {
    source,
    activated: activated.length,
    broadcastSent: bc.sent,
    broadcastFailed: bc.failed,
    sequenceSent: seq.sent,
    sequenceFailed: seq.failed,
    paused: bc.paused ?? seq.paused,
    ms: Date.now() - started,
  };
  // Heartbeat per source, so the admin panel can tell whether the external
  // cron is actually pinging (the timer runs whenever the server happens to
  // be awake, which on Autoscale proves nothing).
  if (source !== "admin") {
    await storage.setAppState(`${LAST_RUN_KEY}:${source}`, result).catch(() => {});
  }
  return result;
}

const TIMER_INTERVAL_MS = 5 * 60 * 1000;

export function startEmailScheduler(): void {
  const tick = () => {
    runEmailJobs("timer", 60_000).catch((err) =>
      console.error("[email-jobs] run failed:", err instanceof Error ? err.message : err),
    );
  };
  setTimeout(tick, 15_000);
  setInterval(tick, TIMER_INTERVAL_MS);
  console.log("[email-jobs] in-process scheduler started (every 5 min)");
}
