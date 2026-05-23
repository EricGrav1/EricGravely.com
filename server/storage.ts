import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  leadMagnets, leads, subscribers,
  type LeadMagnet, type InsertLeadMagnet,
  type Lead, type InsertLead,
  type Subscriber, type InsertSubscriber,
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
}

export const storage = new DbStorage();
