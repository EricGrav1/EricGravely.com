import { eq, and, sql } from "drizzle-orm";
import { db } from "./db";
import { leadMagnets, leads, type LeadMagnet, type InsertLeadMagnet, type Lead, type InsertLead } from "@shared/schema";

export interface AnalyticsStat {
  id: number;
  title: string;
  viewCount: number;
  submissionCount: number;
  conversionRate: number;
}

export interface IStorage {
  // Lead magnet operations
  getLeadMagnet(id: number): Promise<LeadMagnet | undefined>;
  listLeadMagnets(activeOnly?: boolean): Promise<LeadMagnet[]>;
  createLeadMagnet(data: InsertLeadMagnet): Promise<LeadMagnet>;
  updateLeadMagnet(id: number, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined>;
  incrementViews(id: number): Promise<void>;
  incrementSubmissions(id: number): Promise<void>;

  // Lead operations
  getLead(email: string, leadMagnetId?: number): Promise<Lead | undefined>;
  getLeadByEmail(email: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined>;
  markUnsubscribed(email: string): Promise<void>;

  // Analytics
  getAnalytics(): Promise<AnalyticsStat[]>;
}

export class DbStorage implements IStorage {
  async getLeadMagnet(id: number): Promise<LeadMagnet | undefined> {
    const [row] = await db.select().from(leadMagnets).where(eq(leadMagnets.id, id));
    return row;
  }

  async listLeadMagnets(activeOnly = false): Promise<LeadMagnet[]> {
    if (activeOnly) {
      return db.select().from(leadMagnets).where(eq(leadMagnets.active, true));
    }
    return db.select().from(leadMagnets);
  }

  async createLeadMagnet(data: InsertLeadMagnet): Promise<LeadMagnet> {
    const [row] = await db.insert(leadMagnets).values(data).returning();
    return row;
  }

  async updateLeadMagnet(id: number, updates: Partial<InsertLeadMagnet>): Promise<LeadMagnet | undefined> {
    const [row] = await db
      .update(leadMagnets)
      .set(updates)
      .where(eq(leadMagnets.id, id))
      .returning();
    return row;
  }

  async incrementViews(id: number): Promise<void> {
    await db
      .update(leadMagnets)
      .set({ viewCount: sql`${leadMagnets.viewCount} + 1` })
      .where(eq(leadMagnets.id, id));
  }

  async incrementSubmissions(id: number): Promise<void> {
    await db
      .update(leadMagnets)
      .set({ submissionCount: sql`${leadMagnets.submissionCount} + 1` })
      .where(eq(leadMagnets.id, id));
  }

  async getLead(email: string, leadMagnetId?: number): Promise<Lead | undefined> {
    const emailLower = email.toLowerCase();
    if (leadMagnetId !== undefined) {
      const [row] = await db
        .select()
        .from(leads)
        .where(and(eq(leads.email, emailLower), eq(leads.leadMagnetId, leadMagnetId)));
      return row;
    }
    const [row] = await db.select().from(leads).where(eq(leads.email, emailLower));
    return row;
  }

  async getLeadByEmail(email: string): Promise<Lead[]> {
    return db.select().from(leads).where(eq(leads.email, email.toLowerCase()));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [row] = await db
      .insert(leads)
      .values({
        email: lead.email.toLowerCase(),
        phone: lead.phone,
        leadMagnetId: lead.leadMagnetId,
        questionnaireAnswers: lead.questionnaireAnswers ?? null,
      })
      .returning();
    return row;
  }

  async updateLead(id: number, updates: Partial<Lead>): Promise<Lead | undefined> {
    const [row] = await db
      .update(leads)
      .set(updates)
      .where(eq(leads.id, id))
      .returning();
    return row;
  }

  async markUnsubscribed(email: string): Promise<void> {
    await db
      .update(leads)
      .set({ unsubscribed: true, unsubscribedAt: new Date() })
      .where(eq(leads.email, email.toLowerCase()));
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
}

export const storage = new DbStorage();
