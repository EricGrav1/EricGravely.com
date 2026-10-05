import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import {
  sequences, sequenceEmails, sequenceEnrollments, subscribers, broadcasts,
} from "@shared/schema";

// One-time upgrade from the original two fixed sequences (sequence_emails.audience
// + per-subscriber step counters) to named sequences with enrollments.
//
// Runs on every boot but only does work while the sequences table is empty,
// inside a transaction — so it either fully happens once or not at all.
// Subscribers keep their exact place: someone who had received 2 of 4 emails
// gets the 3rd next, on the same schedule as before.
export async function migrateToNamedSequences(): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(sequences);
      if (count > 0) return;

      const [resourceSeq] = await tx.insert(sequences).values({
        name: "Free resource follow-up",
        trigger: "resource_signup",
        leadMagnetId: null,
      }).returning();
      const [newsletterSeq] = await tx.insert(sequences).values({
        name: "Newsletter welcome",
        trigger: "newsletter_signup",
      }).returning();
      const seqFor = (audience: string | null) => (audience === "newsletter" ? newsletterSeq.id : resourceSeq.id);

      await tx.update(sequenceEmails).set({ sequenceId: newsletterSeq.id })
        .where(and(isNull(sequenceEmails.sequenceId), eq(sequenceEmails.audience, "newsletter")));
      await tx.update(sequenceEmails).set({ sequenceId: resourceSeq.id })
        .where(isNull(sequenceEmails.sequenceId));

      // The old scheduler's step N meant "the first N active emails (by day)
      // were sent", so the cursor is the Nth active email.
      const activeEmails = await tx.select().from(sequenceEmails)
        .where(eq(sequenceEmails.active, true))
        .orderBy(asc(sequenceEmails.dayOffset), asc(sequenceEmails.id));

      const optedIn = await tx.select().from(subscribers).where(eq(subscribers.sequenceOptIn, true));
      let enrolled = 0;
      const sentCounts = new Map<number, number>();
      for (const sub of optedIn) {
        const sequenceId = seqFor(sub.sequenceAudience);
        const series = activeEmails.filter((e) => e.sequenceId === sequenceId);
        const step = Math.min(sub.sequenceStep, series.length);
        const last = step > 0 ? series[step - 1] : null;
        for (const e of series.slice(0, step)) sentCounts.set(e.id, (sentCounts.get(e.id) ?? 0) + 1);
        await tx.insert(sequenceEnrollments).values({
          subscriberId: sub.id,
          sequenceId,
          enrolledAt: sub.sequenceOptInAt ?? sub.createdAt,
          lastEmailId: last?.id ?? null,
          lastDayOffset: last?.dayOffset ?? null,
          lastSentAt: sub.lastSequenceSentAt,
          emailsSent: step,
        }).onConflictDoNothing();
        enrolled++;
      }

      for (const [id, n] of Array.from(sentCounts)) {
        await tx.update(sequenceEmails).set({ sentCount: n }).where(eq(sequenceEmails.id, id));
      }

      // Broadcasts from the old in-memory sender that never finished can't be
      // resumed (there's no record of who got them).
      await tx.update(broadcasts).set({ status: "interrupted" }).where(eq(broadcasts.status, "sending"));

      console.log(`[migrate] Created named sequences; carried over ${enrolled} subscriber(s) with their progress`);
    });
  } catch (err) {
    console.error("[migrate] Sequence migration failed (will retry next boot):", err instanceof Error ? err.message : err);
  }
}
