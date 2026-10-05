import { storage, type ClaimedRecipient } from "./storage";
import { sendSequenceEmailBatch } from "./email";
import { getSiteBaseUrl } from "./config";
import type { Broadcast, EmailAudience } from "@shared/schema";

// Delay between Resend API calls — stays under its rate limit (2 req/sec).
export const SEND_DELAY_MS = 600;
// Recipients per Resend batch call (Resend allows up to 100).
const CHUNK_SIZE = 50;
// Consecutive single-recipient failures that mean "the account is the problem,
// not these addresses" — pause and retry later instead of marking people failed.
const CIRCUIT_BREAKER = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Creates a broadcast. With no scheduledAt it's due immediately; the caller
// (route) runs activateDueBroadcasts() right after so the list is snapshotted
// in the same request.
export async function createBroadcast(input: {
  subject: string;
  body: string;
  audience: EmailAudience;
  scheduledAt?: Date | null;
}): Promise<Broadcast> {
  return storage.createScheduledBroadcast({
    subject: input.subject,
    body: input.body,
    audience: input.audience,
    scheduledAt: input.scheduledAt ?? new Date(),
  });
}

export interface BroadcastRunResult {
  sent: number;
  failed: number;
  paused?: string;
}

// Works through every sending broadcast until the deadline. Safe to run from
// several places at once — recipients are claimed atomically.
export async function processBroadcasts(deadline: number): Promise<BroadcastRunResult> {
  const result: BroadcastRunResult = { sent: 0, failed: 0 };
  const siteBaseUrl = getSiteBaseUrl();

  for (const broadcast of await storage.listSendingBroadcasts()) {
    while (Date.now() < deadline) {
      const chunk = await storage.claimBroadcastRecipients(broadcast.id, CHUNK_SIZE);
      if (chunk.length === 0) break;

      const outcome = await sendChunk(broadcast, chunk, siteBaseUrl, deadline);
      result.sent += outcome.sent;
      result.failed += outcome.failed;
      await storage.updateBroadcast(broadcast.id, { lastError: outcome.paused ?? null });
      await storage.refreshBroadcastProgress(broadcast.id);
      if (outcome.paused) {
        console.error(`[broadcast] "${broadcast.subject}" paused: ${outcome.paused}`);
        return { ...result, paused: outcome.paused };
      }
      await sleep(SEND_DELAY_MS);
    }
    // Closes out broadcasts whose last recipients were handled elsewhere (or
    // that had nobody to send to).
    await storage.refreshBroadcastProgress(broadcast.id);
    if (Date.now() >= deadline) break;
  }
  return result;
}

async function sendChunk(
  broadcast: Broadcast,
  chunk: ClaimedRecipient[],
  siteBaseUrl: string,
  deadline: number,
): Promise<BroadcastRunResult> {
  let sent = 0;
  let failed = 0;
  // Single recipients that failed, not yet known to be address-specific.
  let streak: { id: number; error: string }[] = [];
  const flushStreak = async () => {
    for (const f of streak) await storage.markBroadcastRecipients([f.id], "failed", f.error);
    failed += streak.length;
    streak = [];
  };

  // Resend rejects a whole batch if one address is bad, so a failed batch is
  // split in half until the bad address is isolated — everyone else still
  // gets the email, in a handful of API calls instead of one per person.
  const stack: ClaimedRecipient[][] = [[...chunk].sort((a, b) => a.id - b.id)];
  while (stack.length > 0) {
    if (Date.now() >= deadline) {
      await storage.markBroadcastRecipients(stack.flat().map((r) => r.id), "pending");
      break;
    }
    const group = stack.pop()!;
    const res = await sendSequenceEmailBatch(
      group.map((r) => ({ email: r.email, firstName: r.firstName ?? "" })),
      broadcast.subject,
      broadcast.body,
      siteBaseUrl,
    );

    if (res.success) {
      // A success after failures proves those failures were address-specific.
      await flushStreak();
      await storage.markBroadcastRecipients(group.map((r) => r.id), "sent");
      sent += group.length;
    } else if (!res.systemic && group.length > 1) {
      const mid = Math.ceil(group.length / 2);
      stack.push(group.slice(mid), group.slice(0, mid));
      continue; // nothing was sent, no need to wait
    } else {
      if (!res.systemic) streak.push({ id: group[0].id, error: res.error ?? "Send failed" });
      if (res.systemic || streak.length >= CIRCUIT_BREAKER) {
        // The account/config is the problem, not these people: put everyone
        // back in the queue and retry on the next run.
        const ids = [...streak.map((f) => f.id), ...(res.systemic ? group.map((r) => r.id) : []), ...stack.flat().map((r) => r.id)];
        await storage.markBroadcastRecipients(ids, "pending");
        return { sent, failed, paused: res.error ?? "Sending failed repeatedly" };
      }
    }
    await sleep(SEND_DELAY_MS);
  }
  await flushStreak();
  return { sent, failed };
}
