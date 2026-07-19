import { storage } from "./storage";
import { sendSequenceEmail } from "./email";
import { getSiteBaseUrl } from "./config";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [sequence] ${message}`);
}

const CHECK_INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes
const MAX_SENDS_PER_RUN = 25;             // stay well under Resend rate limits
const DAY_MS = 24 * 60 * 60 * 1000;

let running = false;

// A subscriber's next email is activeEmails[sequenceStep] (ordered by dayOffset).
// It is due when now >= sequenceOptInAt + dayOffset days.
export async function runSequenceTick(): Promise<{ sent: number; failed: number }> {
  if (running) return { sent: 0, failed: 0 };
  running = true;
  let sent = 0;
  let failed = 0;

  try {
    const allEmails = await storage.listSequenceEmails(true);
    if (allEmails.length === 0) return { sent, failed };

    // Each audience ("resource" | "newsletter") has its own ordered series.
    const byAudience = new Map<string, typeof allEmails>();
    for (const em of allEmails) {
      const key = em.audience ?? "resource";
      byAudience.set(key, [...(byAudience.get(key) ?? []), em]);
    }

    const subs = await storage.listSequenceSubscribers();
    const now = Date.now();
    const siteBaseUrl = getSiteBaseUrl();

    for (const sub of subs) {
      if (sent + failed >= MAX_SENDS_PER_RUN) break;
      // Legacy subscribers (opted in before audiences existed) are "resource"
      const emails = byAudience.get(sub.sequenceAudience ?? "resource") ?? [];
      if (sub.sequenceStep >= emails.length) continue;

      const next = emails[sub.sequenceStep];
      const anchor = (sub.sequenceOptInAt ?? sub.createdAt).getTime();
      if (now < anchor + next.dayOffset * DAY_MS) continue;

      // Send at most one email per subscriber per tick — if a subscriber is
      // behind (e.g. scheduler was down), they catch up gradually, not all at once.
      const result = await sendSequenceEmail(sub.email, sub.firstName ?? "", next.subject, next.body, siteBaseUrl);
      if (result.success) {
        await storage.updateSubscriberSequenceState(sub.id, sub.sequenceStep + 1);
        sent++;
        log(`sent "${next.subject}" (day ${next.dayOffset}) to ${sub.email}`);
      } else {
        failed++;
        console.error(`[sequence] send failed for ${sub.email}: ${result.error}`);
      }
    }
  } catch (err) {
    console.error("[sequence] tick error:", err instanceof Error ? err.message : err);
  } finally {
    running = false;
  }

  return { sent, failed };
}

export function startSequenceScheduler(): void {
  // First pass shortly after boot, then on an interval.
  setTimeout(() => void runSequenceTick(), 15_000);
  setInterval(() => void runSequenceTick(), CHECK_INTERVAL_MS);
  log("scheduler started (checks every 10 min)");
}
