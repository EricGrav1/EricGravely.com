import { storage } from "./storage";
import { sendSequenceEmail } from "./email";
import { getSiteBaseUrl } from "./config";
import { SEND_DELAY_MS } from "./broadcast";
import type { SequenceEmail } from "@shared/schema";

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true,
  });
  console.log(`${formattedTime} [sequence] ${message}`);
}

const MAX_SENDS_PER_RUN = 40;
const DAY_MS = 24 * 60 * 60 * 1000;
// If someone fell behind (sending was down for a while), space their catch-up
// emails out instead of firing them all in one afternoon.
const MIN_GAP_MS = 12 * 60 * 60 * 1000;

// Next email after the cursor (lastDayOffset, lastEmailId), in send order.
function nextEmail(series: SequenceEmail[], lastDay: number | null, lastId: number | null): SequenceEmail | undefined {
  if (lastId === null || lastDay === null) return series[0];
  return series.find((e) => e.dayOffset > lastDay || (e.dayOffset === lastDay && e.id > lastId));
}

// Sends every sequence email that's due, up to the deadline. An email with
// day N is due N days after the person enrolled. Safe to run concurrently —
// each send is claimed with a compare-and-swap on the enrollment first.
export async function runSequenceTick(deadline: number): Promise<{ sent: number; failed: number; paused?: string }> {
  let sent = 0;
  let failed = 0;

  try {
    const allEmails = await storage.listSequenceEmails(true);
    if (allEmails.length === 0) return { sent, failed };

    const bySequence = new Map<number, SequenceEmail[]>();
    for (const em of allEmails) {
      if (em.sequenceId == null) continue;
      bySequence.set(em.sequenceId, [...(bySequence.get(em.sequenceId) ?? []), em]);
    }

    const candidates = await storage.listDueEnrollmentCandidates();
    const now = Date.now();
    const siteBaseUrl = getSiteBaseUrl();

    for (const { enrollment, email, firstName } of candidates) {
      if (sent + failed >= MAX_SENDS_PER_RUN || Date.now() >= deadline) break;

      const next = nextEmail(bySequence.get(enrollment.sequenceId) ?? [], enrollment.lastDayOffset, enrollment.lastEmailId);
      if (!next) continue;
      if (now < enrollment.enrolledAt.getTime() + next.dayOffset * DAY_MS) continue;
      if (
        enrollment.lastSentAt &&
        enrollment.lastDayOffset !== null &&
        next.dayOffset > enrollment.lastDayOffset &&
        now - enrollment.lastSentAt.getTime() < MIN_GAP_MS
      ) continue;

      if (!(await storage.claimEnrollmentEmail(enrollment, next))) continue;

      const result = await sendSequenceEmail(email, firstName ?? "", next.subject, next.body, siteBaseUrl);
      if (result.success) {
        await storage.incrementSequenceEmailSent(next.id);
        sent++;
        log(`sent "${next.subject}" (day ${next.dayOffset}) to ${email}`);
      } else {
        // Put the cursor back so it's retried next run.
        await storage.releaseEnrollmentEmail(enrollment, next);
        failed++;
        console.error(`[sequence] send failed for ${email}: ${result.error}`);
        if (result.systemic) return { sent, failed, paused: result.error };
      }
      await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
    }
  } catch (err) {
    console.error("[sequence] tick error:", err instanceof Error ? err.message : err);
  }

  return { sent, failed };
}
