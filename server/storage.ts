import { eq, and, sql, asc, desc, type SQL } from "drizzle-orm";
import { db } from "./db";
import {
  leadMagnets, leads, subscribers, sequenceEmails, resourceFiles, broadcasts,
  sequences, sequenceEnrollments, broadcastRecipients, appState,
  type LeadMagnet, type InsertLeadMagnet,
  type Lead, type InsertLead,
  type Subscriber, type InsertSubscriber,
  type SequenceEmail, type InsertSequenceEmail,
  type ResourceFile, type Broadcast,
  type Sequence, type InsertSequence, type SequenceEnrollment,
  type EmailAudience,
} from "@shared/schema";

// SQL condition selecting the active subscribers in an audience. Written
// against the bare "subscribers" table so it drops into raw INSERT … SELECTs.
function audienceCondition(audience: EmailAudience): SQL {
  const base = sql`subscribers.unsubscribed = false`;
  switch (audience.type) {
    case "all":
      return base;
    case "newsletter":
      return sql`${base} AND subscribers.tag = 'newsletter'`;
    case "resource":
      return audience.leadMagnetId == null
        ? sql`${base} AND EXISTS (SELECT 1 FROM leads WHERE leads.email = subscribers.email)`
        : sql`${base} AND EXISTS (SELECT 1 FROM leads WHERE leads.email = subscribers.email AND leads.lead_magnet_id = ${audience.leadMagnetId})`;
  }
}

export type SignupEvent = { kind: "resource"; leadMagnetId: number } | { kind: "newsletter" };

export interface DueEnrollment {
  enrollment: SequenceEnrollment;
  email: string;
  firstName: string | null;
}

export interface SequenceStats {
  sequenceId: number;
  inProgress: number; // active subscribers enrolled
  total: number;      // every enrollment, incl. unsubscribed/stopped
}

export interface ClaimedRecipient {
  id: number;
  email: string;
  firstName: string | null;
}

export interface AnalyticsStat {
  id: number;
  title: string;
  viewCount: number;
  submissionCount: number;
  conversionRate: number;
}

export interface IStorage {
  getLeadMagnet(id: number): Promise<LeadMagnet | undefined>;
  listLeadMagnets(activeOnly?: boolean): Promise<LeadMagnet[]>;
  createLeadMagnet(data: InsertLeadMagnet): Promise<LeadMagnet>;
  updateLeadMagnet(id: number, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined>;
  incrementViews(id: number): Promise<void>;
  incrementSubmissions(id: number): Promise<void>;
  getLead(email: string, leadMagnetId?: number): Promise<Lead | undefined>;
  getLeadByEmail(email: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;
  markUnsubscribed(email: string): Promise<void>;
  getAnalytics(): Promise<AnalyticsStat[]>;
  createSubscriber(data: InsertSubscriber): Promise<Subscriber>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  markSubscriberUnsubscribed(email: string): Promise<void>;
  // Legacy sequence consent flag (enrollment itself lives in sequence_enrollments)
  setSequenceOptIn(email: string, audience: string): Promise<void>;
  // Sequence email CRUD
  listSequenceEmails(activeOnly?: boolean): Promise<SequenceEmail[]>;
  createSequenceEmail(data: InsertSequenceEmail): Promise<SequenceEmail>;
  updateSequenceEmail(id: number, updates: Partial<InsertSequenceEmail>): Promise<SequenceEmail | undefined>;
  deleteSequenceEmail(id: number): Promise<void>;
  // Admin views
  listLeads(): Promise<Lead[]>;
  listSubscribers(): Promise<Subscriber[]>;
  // Resource files (DB-backed uploads from the admin panel)
  saveResourceFile(filename: string, mimeType: string, data: Buffer, isPublic?: boolean): Promise<void>;
  getResourceFile(filename: string): Promise<ResourceFile | undefined>;
  listResourceFilenames(): Promise<string[]>;
  // Broadcasts
  updateBroadcast(id: number, updates: Partial<Broadcast>): Promise<void>;
  listBroadcasts(): Promise<Broadcast[]>;
  // Named sequences
  listSequences(): Promise<Sequence[]>;
  getSequence(id: number): Promise<Sequence | undefined>;
  createSequence(data: InsertSequence): Promise<Sequence>;
  updateSequence(id: number, updates: Partial<InsertSequence>): Promise<Sequence | undefined>;
  deleteSequence(id: number): Promise<void>;
  getSequenceStats(): Promise<SequenceStats[]>;
  incrementSequenceEmailSent(id: number): Promise<void>;
  // Enrollments
  enrollForSignup(email: string, event: SignupEvent): Promise<number>;
  enrollAudience(sequenceId: number, audience: EmailAudience): Promise<number>;
  listDueEnrollmentCandidates(): Promise<DueEnrollment[]>;
  claimEnrollmentEmail(enrollment: SequenceEnrollment, next: SequenceEmail): Promise<boolean>;
  releaseEnrollmentEmail(enrollment: SequenceEnrollment, next: SequenceEmail): Promise<void>;
  listEnrollmentSummaries(): Promise<{ email: string; sequenceName: string; emailsSent: number }[]>;
  // Audiences
  countAudience(audience: EmailAudience): Promise<number>;
  // Broadcast queue
  createScheduledBroadcast(data: { subject: string; body: string; audience: EmailAudience; scheduledAt: Date }): Promise<Broadcast>;
  getBroadcast(id: number): Promise<Broadcast | undefined>;
  activateDueBroadcasts(): Promise<Broadcast[]>;
  listSendingBroadcasts(): Promise<Broadcast[]>;
  claimBroadcastRecipients(broadcastId: number, limit: number): Promise<ClaimedRecipient[]>;
  markBroadcastRecipients(ids: number[], status: "sent" | "failed" | "pending", error?: string): Promise<void>;
  refreshBroadcastProgress(broadcastId: number): Promise<void>;
  cancelBroadcast(id: number): Promise<Broadcast | undefined>;
  // Operational state
  getAppState<T>(key: string): Promise<{ value: T; updatedAt: Date } | undefined>;
  setAppState(key: string, value: unknown): Promise<void>;
}

export class DbStorage implements IStorage {
  async getLeadMagnet(id: number): Promise<LeadMagnet | undefined> {
    const [row] = await db.select().from(leadMagnets).where(eq(leadMagnets.id, id));
    return row;
  }

  async listLeadMagnets(activeOnly = false): Promise<LeadMagnet[]> {
    if (activeOnly) return db.select().from(leadMagnets).where(eq(leadMagnets.active, true));
    return db.select().from(leadMagnets);
  }

  async createLeadMagnet(data: InsertLeadMagnet): Promise<LeadMagnet> {
    const [row] = await db.insert(leadMagnets).values(data).returning();
    return row;
  }

  async updateLeadMagnet(id: number, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined> {
    const [row] = await db.update(leadMagnets).set(updates).where(eq(leadMagnets.id, id)).returning();
    return row;
  }

  async incrementViews(id: number): Promise<void> {
    await db.update(leadMagnets).set({ viewCount: sql`${leadMagnets.viewCount} + 1` }).where(eq(leadMagnets.id, id));
  }

  async incrementSubmissions(id: number): Promise<void> {
    await db.update(leadMagnets).set({ submissionCount: sql`${leadMagnets.submissionCount} + 1` }).where(eq(leadMagnets.id, id));
  }

  async getLead(email: string, leadMagnetId?: number): Promise<Lead | undefined> {
    const emailLower = email.toLowerCase();
    if (leadMagnetId !== undefined) {
      const [row] = await db.select().from(leads).where(and(eq(leads.email, emailLower), eq(leads.leadMagnetId, leadMagnetId)));
      return row;
    }
    const [row] = await db.select().from(leads).where(eq(leads.email, emailLower));
    return row;
  }

  async getLeadByEmail(email: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.email, email.toLowerCase()));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [row] = await db.insert(leads).values({
      email: lead.email.toLowerCase(),
      phone: lead.phone,
      leadMagnetId: lead.leadMagnetId,
      questionnaireAnswers: lead.questionnaireAnswers ?? null,
    }).returning();
    return row;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [row] = await db.update(leads).set(updates).where(eq(leads.id, id)).returning();
    return row;
  }

  async markUnsubscribed(email: string): Promise<void> {
    const emailLower = email.toLowerCase();
    // Update both tables so any historical lead records and new subscriber records
    // are both marked unsubscribed in the same operation.
    await Promise.all([
      db.update(leads)
        .set({ unsubscribed: true, unsubscribedAt: new Date() })
        .where(eq(leads.email, emailLower)),
      db.update(subscribers)
        .set({ unsubscribed: true, unsubscribedAt: new Date() })
        .where(eq(subscribers.email, emailLower)),
    ]);
  }

  async getAnalytics(): Promise<AnalyticsStat[]> {
    const rows = await db.select().from(leadMagnets);
    return rows.map((lm) => ({
      id: lm.id,
      title: lm.title,
      viewCount: lm.viewCount,
      submissionCount: lm.submissionCount,
      conversionRate: lm.viewCount > 0 ? Math.round((lm.submissionCount / lm.viewCount) * 100) : 0,
    }));
  }

  async createSubscriber(data: InsertSubscriber): Promise<Subscriber> {
    const [row] = await db.insert(subscribers).values({
      email: data.email.toLowerCase(),
      firstName: data.firstName,
      tag: data.tag ?? "newsletter",
    }).returning();
    return row;
  }

  async getSubscriberByEmail(email: string): Promise<Subscriber | undefined> {
    const [row] = await db.select().from(subscribers).where(eq(subscribers.email, email.toLowerCase()));
    return row;
  }

  async markSubscriberUnsubscribed(email: string): Promise<void> {
    await db.update(subscribers)
      .set({ unsubscribed: true, unsubscribedAt: new Date() })
      .where(eq(subscribers.email, email.toLowerCase()));
  }

  async setSequenceOptIn(email: string, audience: string): Promise<void> {
    // First enrollment sticks: the opt-in timestamp and audience are only set
    // once — re-submitting must not reset a subscriber's sequence position or
    // move them to a different sequence mid-way.
    await db.update(subscribers)
      .set({
        sequenceOptIn: true,
        sequenceOptInAt: sql`COALESCE(${subscribers.sequenceOptInAt}, now())`,
        sequenceAudience: sql`COALESCE(${subscribers.sequenceAudience}, ${audience})`,
      })
      .where(eq(subscribers.email, email.toLowerCase()));
  }



  async listSequenceEmails(activeOnly = false): Promise<SequenceEmail[]> {
    const order = [asc(sequenceEmails.sequenceId), asc(sequenceEmails.dayOffset), asc(sequenceEmails.id)];
    if (activeOnly) {
      return db.select().from(sequenceEmails)
        .where(eq(sequenceEmails.active, true))
        .orderBy(...order);
    }
    return db.select().from(sequenceEmails).orderBy(...order);
  }

  async createSequenceEmail(data: InsertSequenceEmail): Promise<SequenceEmail> {
    const [row] = await db.insert(sequenceEmails).values(data).returning();
    return row;
  }

  async updateSequenceEmail(id: number, updates: Partial<InsertSequenceEmail>): Promise<SequenceEmail | undefined> {
    const [row] = await db.update(sequenceEmails).set(updates).where(eq(sequenceEmails.id, id)).returning();
    return row;
  }

  async deleteSequenceEmail(id: number): Promise<void> {
    await db.delete(sequenceEmails).where(eq(sequenceEmails.id, id));
  }

  async listLeads(): Promise<Lead[]> {
    return db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async listSubscribers(): Promise<Subscriber[]> {
    return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  }

  async saveResourceFile(filename: string, mimeType: string, data: Buffer, isPublic = false): Promise<void> {
    await db.insert(resourceFiles)
      .values({ filename, mimeType, size: data.length, data, isPublic })
      .onConflictDoUpdate({
        target: resourceFiles.filename,
        set: { mimeType, size: data.length, data, isPublic, createdAt: new Date() },
      });
  }

  async getResourceFile(filename: string): Promise<ResourceFile | undefined> {
    const [row] = await db.select().from(resourceFiles).where(eq(resourceFiles.filename, filename));
    return row;
  }

  async listResourceFilenames(): Promise<string[]> {
    const rows = await db.select({ filename: resourceFiles.filename }).from(resourceFiles);
    return rows.map((r) => r.filename);
  }

  async updateBroadcast(id: number, updates: Partial<Broadcast>): Promise<void> {
    await db.update(broadcasts).set(updates).where(eq(broadcasts.id, id));
  }

  async listBroadcasts(): Promise<Broadcast[]> {
    return db.select().from(broadcasts).orderBy(desc(broadcasts.createdAt));
  }

  // ── Named sequences ─────────────────────────────────────────────────────────
  async listSequences(): Promise<Sequence[]> {
    return db.select().from(sequences).orderBy(asc(sequences.id));
  }

  async getSequence(id: number): Promise<Sequence | undefined> {
    const [row] = await db.select().from(sequences).where(eq(sequences.id, id));
    return row;
  }

  async createSequence(data: InsertSequence): Promise<Sequence> {
    const [row] = await db.insert(sequences).values({
      ...data,
      leadMagnetId: data.trigger === "resource_signup" ? data.leadMagnetId ?? null : null,
    }).returning();
    return row;
  }

  async updateSequence(id: number, updates: Partial<InsertSequence>): Promise<Sequence | undefined> {
    const set: Partial<InsertSequence> = { ...updates };
    if (updates.trigger && updates.trigger !== "resource_signup") set.leadMagnetId = null;
    const [row] = await db.update(sequences).set(set).where(eq(sequences.id, id)).returning();
    return row;
  }

  async deleteSequence(id: number): Promise<void> {
    // Emails and enrollments cascade.
    await db.delete(sequences).where(eq(sequences.id, id));
  }

  async getSequenceStats(): Promise<SequenceStats[]> {
    const rows = await db
      .select({
        sequenceId: sequenceEnrollments.sequenceId,
        inProgress: sql<number>`count(*) FILTER (WHERE ${sequenceEnrollments.status} = 'active' AND ${subscribers.unsubscribed} = false)::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(sequenceEnrollments)
      .innerJoin(subscribers, eq(subscribers.id, sequenceEnrollments.subscriberId))
      .groupBy(sequenceEnrollments.sequenceId);
    return rows;
  }

  async incrementSequenceEmailSent(id: number): Promise<void> {
    await db.update(sequenceEmails)
      .set({ sentCount: sql`${sequenceEmails.sentCount} + 1` })
      .where(eq(sequenceEmails.id, id));
  }

  // ── Enrollments ─────────────────────────────────────────────────────────────
  // Enrolls a new signup into every active sequence whose trigger matches.
  // Each person enters a given sequence once — re-signing up never restarts it.
  async enrollForSignup(email: string, event: SignupEvent): Promise<number> {
    const sub = await this.getSubscriberByEmail(email);
    if (!sub || sub.unsubscribed) return 0;

    const matchCondition = event.kind === "newsletter"
      ? eq(sequences.trigger, "newsletter_signup")
      : and(
          eq(sequences.trigger, "resource_signup"),
          sql`(${sequences.leadMagnetId} IS NULL OR ${sequences.leadMagnetId} = ${event.leadMagnetId})`,
        );
    const matches = await db.select({ id: sequences.id }).from(sequences)
      .where(and(eq(sequences.active, true), matchCondition));
    if (matches.length === 0) return 0;

    const inserted = await db.insert(sequenceEnrollments)
      .values(matches.map((m) => ({ subscriberId: sub.id, sequenceId: m.id })))
      .onConflictDoNothing()
      .returning({ id: sequenceEnrollments.id });
    return inserted.length;
  }

  // Bulk-enrolls everyone in an audience (one row per email address).
  // Their day count starts now.
  async enrollAudience(sequenceId: number, audience: EmailAudience): Promise<number> {
    const result = await db.execute(sql`
      INSERT INTO sequence_enrollments (subscriber_id, sequence_id)
      SELECT DISTINCT ON (subscribers.email) subscribers.id, ${sequenceId}::int
      FROM subscribers
      WHERE ${audienceCondition(audience)}
      ORDER BY subscribers.email, subscribers.id
      ON CONFLICT (subscriber_id, sequence_id) DO NOTHING
    `);
    return result.rowCount ?? 0;
  }

  async listDueEnrollmentCandidates(): Promise<DueEnrollment[]> {
    return db
      .select({
        enrollment: sequenceEnrollments,
        email: subscribers.email,
        firstName: subscribers.firstName,
      })
      .from(sequenceEnrollments)
      .innerJoin(subscribers, eq(subscribers.id, sequenceEnrollments.subscriberId))
      .innerJoin(sequences, eq(sequences.id, sequenceEnrollments.sequenceId))
      .where(and(
        eq(sequenceEnrollments.status, "active"),
        eq(sequences.active, true),
        eq(subscribers.unsubscribed, false),
      ))
      .orderBy(asc(sequenceEnrollments.id));
  }

  // Compare-and-swap: advances the enrollment's cursor to `next` only if no
  // one else has moved it since we read it. Returns false if we lost the race.
  async claimEnrollmentEmail(enrollment: SequenceEnrollment, next: SequenceEmail): Promise<boolean> {
    const rows = await db.update(sequenceEnrollments)
      .set({
        lastEmailId: next.id,
        lastDayOffset: next.dayOffset,
        lastSentAt: new Date(),
        emailsSent: sql`${sequenceEnrollments.emailsSent} + 1`,
      })
      .where(and(
        eq(sequenceEnrollments.id, enrollment.id),
        sql`${sequenceEnrollments.lastEmailId} IS NOT DISTINCT FROM ${enrollment.lastEmailId}`,
      ))
      .returning({ id: sequenceEnrollments.id });
    return rows.length > 0;
  }

  // Undo a claim after the send failed, so the email is retried next run.
  async releaseEnrollmentEmail(enrollment: SequenceEnrollment, next: SequenceEmail): Promise<void> {
    await db.update(sequenceEnrollments)
      .set({
        lastEmailId: enrollment.lastEmailId,
        lastDayOffset: enrollment.lastDayOffset,
        lastSentAt: enrollment.lastSentAt,
        emailsSent: sql`${sequenceEnrollments.emailsSent} - 1`,
      })
      .where(and(eq(sequenceEnrollments.id, enrollment.id), eq(sequenceEnrollments.lastEmailId, next.id)));
  }

  async listEnrollmentSummaries(): Promise<{ email: string; sequenceName: string; emailsSent: number }[]> {
    return db
      .select({
        email: subscribers.email,
        sequenceName: sequences.name,
        emailsSent: sequenceEnrollments.emailsSent,
      })
      .from(sequenceEnrollments)
      .innerJoin(subscribers, eq(subscribers.id, sequenceEnrollments.subscriberId))
      .innerJoin(sequences, eq(sequences.id, sequenceEnrollments.sequenceId))
      .orderBy(asc(sequenceEnrollments.id));
  }

  // ── Audiences ───────────────────────────────────────────────────────────────
  async countAudience(audience: EmailAudience): Promise<number> {
    const result = await db.execute<{ count: number }>(sql`
      SELECT count(DISTINCT subscribers.email)::int AS count FROM subscribers WHERE ${audienceCondition(audience)}
    `);
    return result.rows[0]?.count ?? 0;
  }

  // ── Broadcast queue ─────────────────────────────────────────────────────────
  async createScheduledBroadcast(data: { subject: string; body: string; audience: EmailAudience; scheduledAt: Date }): Promise<Broadcast> {
    const [row] = await db.insert(broadcasts).values({
      subject: data.subject,
      body: data.body,
      audience: data.audience,
      scheduledAt: data.scheduledAt,
      status: "scheduled",
    }).returning();
    return row;
  }

  async getBroadcast(id: number): Promise<Broadcast | undefined> {
    const [row] = await db.select().from(broadcasts).where(eq(broadcasts.id, id));
    return row;
  }

  // Moves scheduled broadcasts whose time has come to "sending" and snapshots
  // their recipient list — all in one transaction, so a crash can't leave a
  // broadcast marked sending with a half-built list.
  async activateDueBroadcasts(): Promise<Broadcast[]> {
    return db.transaction(async (tx) => {
      const due = await tx.select().from(broadcasts)
        .where(and(eq(broadcasts.status, "scheduled"), sql`${broadcasts.scheduledAt} <= now()`))
        .for("update", { skipLocked: true });

      const activated: Broadcast[] = [];
      for (const b of due) {
        const audience = (b.audience as EmailAudience | null) ?? { type: "all" };
        const inserted = await tx.execute(sql`
          INSERT INTO broadcast_recipients (broadcast_id, email, first_name)
          SELECT DISTINCT ON (subscribers.email) ${b.id}::int, subscribers.email, subscribers.first_name
          FROM subscribers
          WHERE ${audienceCondition(audience)}
          ORDER BY subscribers.email, subscribers.id
          ON CONFLICT (broadcast_id, email) DO NOTHING
        `);
        const [row] = await tx.update(broadcasts)
          .set({ status: "sending", startedAt: new Date(), totalRecipients: inserted.rowCount ?? 0 })
          .where(eq(broadcasts.id, b.id))
          .returning();
        activated.push(row);
      }
      return activated;
    });
  }

  async listSendingBroadcasts(): Promise<Broadcast[]> {
    return db.select().from(broadcasts).where(eq(broadcasts.status, "sending")).orderBy(asc(broadcasts.id));
  }

  // Claims the next `limit` pending recipients. SKIP LOCKED means two workers
  // running at once (cron + admin page) each get different people.
  async claimBroadcastRecipients(broadcastId: number, limit: number): Promise<ClaimedRecipient[]> {
    // A claim older than 10 minutes means the worker died mid-batch — requeue.
    await db.update(broadcastRecipients)
      .set({ status: "pending", claimedAt: null })
      .where(and(
        eq(broadcastRecipients.broadcastId, broadcastId),
        eq(broadcastRecipients.status, "sending"),
        sql`${broadcastRecipients.claimedAt} < now() - interval '10 minutes'`,
      ));

    const result = await db.execute<{ id: number; email: string; first_name: string | null }>(sql`
      UPDATE broadcast_recipients SET status = 'sending', claimed_at = now()
      WHERE id IN (
        SELECT id FROM broadcast_recipients
        WHERE broadcast_id = ${broadcastId} AND status = 'pending'
        ORDER BY id
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, email, first_name
    `);
    return result.rows.map((r) => ({ id: r.id, email: r.email, firstName: r.first_name }));
  }

  async markBroadcastRecipients(ids: number[], status: "sent" | "failed" | "pending", error?: string): Promise<void> {
    if (ids.length === 0) return;
    await db.update(broadcastRecipients)
      .set({
        status,
        error: error ?? null,
        sentAt: status === "sent" ? new Date() : null,
        claimedAt: status === "pending" ? null : undefined,
      })
      .where(sql`${broadcastRecipients.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);
  }

  // Recounts sent/failed and closes the broadcast out once nobody is left.
  async refreshBroadcastProgress(broadcastId: number): Promise<void> {
    await db.execute(sql`
      UPDATE broadcasts SET
        sent_count = (SELECT count(*) FROM broadcast_recipients WHERE broadcast_id = ${broadcastId} AND status = 'sent'),
        failed_count = (SELECT count(*) FROM broadcast_recipients WHERE broadcast_id = ${broadcastId} AND status = 'failed')
      WHERE id = ${broadcastId}
    `);
    await db.execute(sql`
      UPDATE broadcasts SET
        status = CASE WHEN sent_count = 0 AND failed_count > 0 THEN 'failed' ELSE 'sent' END,
        completed_at = now()
      WHERE id = ${broadcastId} AND status = 'sending'
        AND NOT EXISTS (
          SELECT 1 FROM broadcast_recipients
          WHERE broadcast_id = ${broadcastId} AND status IN ('pending', 'sending')
        )
    `);
  }

  // Cancels a scheduled broadcast, or stops one mid-send (emails already in
  // flight still go out; everyone still waiting is skipped).
  async cancelBroadcast(id: number): Promise<Broadcast | undefined> {
    const [row] = await db.update(broadcasts)
      .set({ status: "canceled", completedAt: new Date() })
      .where(and(eq(broadcasts.id, id), sql`${broadcasts.status} IN ('scheduled', 'sending')`))
      .returning();
    if (row) {
      await db.update(broadcastRecipients)
        .set({ status: "canceled" })
        .where(and(eq(broadcastRecipients.broadcastId, id), eq(broadcastRecipients.status, "pending")));
      await this.refreshBroadcastProgress(id);
    }
    return row;
  }

  // ── Operational state ───────────────────────────────────────────────────────
  async getAppState<T>(key: string): Promise<{ value: T; updatedAt: Date } | undefined> {
    const [row] = await db.select().from(appState).where(eq(appState.key, key));
    return row ? { value: row.value as T, updatedAt: row.updatedAt } : undefined;
  }

  async setAppState(key: string, value: unknown): Promise<void> {
    await db.insert(appState)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: appState.key, set: { value, updatedAt: new Date() } });
  }
}

export const storage = new DbStorage();
