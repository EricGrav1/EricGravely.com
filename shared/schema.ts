import { pgTable, serial, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const leadMagnets = pgTable("lead_magnets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // "download" = email-gated free resource | "external" = direct link (no email capture)
  productType: text("product_type").notNull().default("download"),
  resourceUrl: text("resource_url"),
  deliveryMethod: text("delivery_method").notNull().default("email"),
  // External product fields
  externalUrl: text("external_url"),
  buttonLabel: text("button_label"),
  iconPath: text("icon_path"),
  active: boolean("active").notNull().default(true),
  viewCount: integer("view_count").notNull().default(0),
  submissionCount: integer("submission_count").notNull().default(0),
  questionnaireFields: jsonb("questionnaire_fields"),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  phone: text("phone"),
  leadMagnetId: integer("lead_magnet_id").references(() => leadMagnets.id),
  questionnaireAnswers: jsonb("questionnaire_answers"),
  unsubscribed: boolean("unsubscribed").notNull().default(false),
  unsubscribedAt: timestamp("unsubscribed_at"),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  tag: text("tag").notNull().default("newsletter"),
  unsubscribed: boolean("unsubscribed").notNull().default(false),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const questionnaireFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean().default(false),
});

export type QuestionnaireField = z.infer<typeof questionnaireFieldSchema>;

export const insertLeadMagnetSchema = createInsertSchema(leadMagnets).omit({
  id: true,
  viewCount: true,
  submissionCount: true,
  createdAt: true,
}).extend({
  questionnaireFields: z.array(questionnaireFieldSchema).optional(),
  nextSteps: z.string().optional(),
  externalUrl: z.string().url().optional().nullable(),
  buttonLabel: z.string().optional().nullable(),
  iconPath: z.string().optional().nullable(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  unsubscribed: true,
  unsubscribedAt: true,
  lastSentAt: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  leadMagnetId: z.number().int().positive("Please select a resource"),
  questionnaireAnswers: z.record(z.unknown()).optional(),
});

export const insertSubscriberSchema = createInsertSchema(subscribers).omit({
  id: true,
  unsubscribed: true,
  unsubscribedAt: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required").optional(),
  tag: z.string().default("newsletter"),
});

export type LeadMagnet = typeof leadMagnets.$inferSelect;
export type InsertLeadMagnet = z.infer<typeof insertLeadMagnetSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
