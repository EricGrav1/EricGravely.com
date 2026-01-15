import { z } from "zod";

export const leadSchema = z.object({
  email: z.string().email(),
  createdAt: z.string(),
  unsubscribed: z.boolean().default(false),
  unsubscribedAt: z.string().optional(),
  lastSentAt: z.string().optional(),
});

export const insertLeadSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type Lead = z.infer<typeof leadSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
