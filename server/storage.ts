import { type Lead, type InsertLead } from "@shared/schema";

export interface IStorage {
  getLead(email: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(email: string, updates: Partial<Lead>): Promise<Lead | undefined>;
  markUnsubscribed(email: string): Promise<Lead | undefined>;
}

export class MemStorage implements IStorage {
  private leads: Map<string, Lead>;

  constructor() {
    this.leads = new Map();
  }

  async getLead(email: string): Promise<Lead | undefined> {
    return this.leads.get(email.toLowerCase());
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const email = insertLead.email.toLowerCase();
    const lead: Lead = {
      email,
      createdAt: new Date().toISOString(),
      unsubscribed: false,
    };
    this.leads.set(email, lead);
    return lead;
  }

  async updateLead(email: string, updates: Partial<Lead>): Promise<Lead | undefined> {
    const lead = this.leads.get(email.toLowerCase());
    if (!lead) return undefined;
    
    const updatedLead = { ...lead, ...updates };
    this.leads.set(email.toLowerCase(), updatedLead);
    return updatedLead;
  }

  async markUnsubscribed(email: string): Promise<Lead | undefined> {
    const lead = this.leads.get(email.toLowerCase());
    if (!lead) return undefined;
    
    const updatedLead = {
      ...lead,
      unsubscribed: true,
      unsubscribedAt: new Date().toISOString(),
    };
    this.leads.set(email.toLowerCase(), updatedLead);
    return updatedLead;
  }
}

export const storage = new MemStorage();
