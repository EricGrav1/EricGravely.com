import { storage } from "./storage";
import { sendSequenceEmail } from "./email";
import { getSiteBaseUrl } from "./config";

// Delay between sends — stays under Resend's rate limit (2 req/sec).
const SEND_DELAY_MS = 600;

let sending = false;

export function isBroadcastSending(): boolean {
  return sending;
}

// Sends a broadcast to every active (non-unsubscribed) subscriber in the
// background. Progress is written to the broadcasts row so the admin UI can
// poll it. Only one broadcast can run at a time.
export async function startBroadcast(
  subject: string,
  body: string,
  siteBaseUrl: string = getSiteBaseUrl(),
): Promise<{ id: number; totalRecipients: number } | { error: string }> {
  if (sending) return { error: "A broadcast is already sending. Wait for it to finish." };

  const recipients = await storage.listActiveSubscribers();
  if (recipients.length === 0) return { error: "No active subscribers to send to." };

  const broadcast = await storage.createBroadcast(subject, body, recipients.length);
  sending = true;

  // Fire and forget — the route returns immediately, progress is polled.
  void (async () => {
    let sent = 0;
    let failed = 0;
    try {
      for (const sub of recipients) {
        const result = await sendSequenceEmail(sub.email, sub.firstName ?? "", subject, body, siteBaseUrl);
        if (result.success) sent++;
        else {
          failed++;
          console.error(`[broadcast] send failed for ${sub.email}: ${result.error}`);
        }
        // Update progress every 5 sends so the UI moves without hammering the DB
        if ((sent + failed) % 5 === 0) {
          await storage.updateBroadcast(broadcast.id, { sentCount: sent, failedCount: failed });
        }
        await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
      }
    } catch (err) {
      console.error("[broadcast] error:", err instanceof Error ? err.message : err);
    } finally {
      sending = false;
      await storage.updateBroadcast(broadcast.id, {
        sentCount: sent,
        failedCount: failed,
        status: failed === recipients.length ? "failed" : "sent",
      }).catch(() => {});
      console.log(`[broadcast] "${subject}" done: ${sent} sent, ${failed} failed of ${recipients.length}`);
    }
  })();

  return { id: broadcast.id, totalRecipients: recipients.length };
}
