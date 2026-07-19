import { eq, and, sql, asc, desc } from "drizzle-orm";
import { db } from "./db";
import {
  leadMagnets, leads, subscribers, sequenceEmails, resourceFiles,
  type LeadMagnet, type InsertLeadMagnet,
  type Lead, type InsertLead,
  type Subscriber, type InsertSubscriber,
  type SequenceEmail, type InsertSequenceEmail,
  type ResourceFile,
} from "@shared/schema";

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
  // Sequence opt-in + scheduler
  setSequenceOptIn(email: string): Promise<void>;
  listSequenceSubscribers(): Promise<Subscriber[]>;
  updateSubscriberSequenceState(id: number, step: number): Promise<void>;
  // Sequence email CRUD
  listSequenceEmails(activeOnly?: boolean): Promise<SequenceEmail[]>;
  createSequenceEmail(data: InsertSequenceEmail): Promise<SequenceEmail>;
  updateSequenceEmail(id: number, updates: Partial<InsertSequenceEmail>): Promise<SequenceEmail | undefined>;
  deleteSequenceEmail(id: number): Promise<void>;
  countSequenceEmails(): Promise<number>;
  // Admin views
  listLeads(): Promise<Lead[]>;
  listSubscribers(): Promise<Subscriber[]>;
  // Resource files (DB-backed uploads from the admin panel)
  saveResourceFile(filename: string, mimeType: string, data: Buffer, isPublic?: boolean): Promise<void>;
  getResourceFile(filename: string): Promise<ResourceFile | undefined>;
  listResourceFilenames(): Promise<string[]>;
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

  async setSequenceOptIn(email: string): Promise<void> {
    // Only set the opt-in timestamp the first time — re-submitting must not
    // reset a subscriber's position in the sequence.
    await db.update(subscribers)
      .set({ sequenceOptIn: true, sequenceOptInAt: sql`COALESCE(${subscribers.sequenceOptInAt}, now())` })
      .where(eq(subscribers.email, email.toLowerCase()));
  }

  async listSequenceSubscribers(): Promise<Subscriber[]> {
    return db.select().from(subscribers)
      .where(and(eq(subscribers.sequenceOptIn, true), eq(subscribers.unsubscribed, false)));
  }

  async updateSubscriberSequenceState(id: number, step: number): Promise<void> {
    await db.update(subscribers)
      .set({ sequenceStep: step, lastSequenceSentAt: new Date() })
      .where(eq(subscribers.id, id));
  }

  async listSequenceEmails(activeOnly = false): Promise<SequenceEmail[]> {
    if (activeOnly) {
      return db.select().from(sequenceEmails)
        .where(eq(sequenceEmails.active, true))
        .orderBy(asc(sequenceEmails.dayOffset), asc(sequenceEmails.id));
    }
    return db.select().from(sequenceEmails)
      .orderBy(asc(sequenceEmails.dayOffset), asc(sequenceEmails.id));
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

  async countSequenceEmails(): Promise<number> {
    const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(sequenceEmails);
    return row?.count ?? 0;
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
}

export const storage = new DbStorage();
