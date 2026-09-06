import { pgTable, serial, text, boolean, timestamp, integer, jsonb, json, varchar, index, uniqueIndex, customType } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// Resource files uploaded through the admin panel. Stored in Postgres (not on
// disk) so they survive Replit redeploys; /api/download checks here first and
// falls back to server/private/downloads/ on disk.
export const resourceFiles = pgTable("resource_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  data: bytea("data").notNull(),
  // Public files (preview images) are served by GET /api/files/:filename.
  // Private files (the gated resources) are only reachable via /api/download.
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ResourceFile = typeof resourceFiles.$inferSelect;

// express-session store (connect-pg-simple). Defined here so `db:push` doesn't
// offer to drop it — the shape must match connect-pg-simple's table.sql.
export const session = pgTable(
  "session",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire", { precision: 6 }).notNull(),
  },
  (t) => [index("IDX_session_expire").on(t.expire)],
);

export const leadMagnets = pgTable("lead_magnets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // "download" = free email-gated resource | "paid_download" = Stripe purchase
  // "external" = app/product link | "game" = playable experience
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
  // View-only preview images shown on the site (array of public image paths)
  previewImages: jsonb("preview_images"),
  // Optional YouTube overview video, embedded on the product detail page
  videoUrl: text("video_url"),
  nextSteps: text("next_steps"),
  // Paid digital-product fields. Price is stored in the smallest currency unit.
  priceCents: integer("price_cents"),
  currency: text("currency").default("usd"),
  stripePriceId: text("stripe_price_id"),
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
  // Email sequence state. sequenceAudience records which sequence the
  // subscriber entered ("resource" | "newsletter"); null = legacy rows,
  // treated as "resource". First enrollment sticks — progress never resets.
  sequenceOptIn: boolean("sequence_opt_in").notNull().default(false),
  sequenceAudience: text("sequence_audience"),
  sequenceOptInAt: timestamp("sequence_opt_in_at"),
  sequenceStep: integer("sequence_step").notNull().default(0),
  lastSequenceSentAt: timestamp("last_sequence_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sequenceEmails = pgTable("sequence_emails", {
  id: serial("id").primaryKey(),
  dayOffset: integer("day_offset").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  // Which signup path this email belongs to: "resource" (free resource
  // downloads) or "newsletter" (footer/newsletter signups)
  audience: text("audience").notNull().default("resource"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One-off broadcast emails sent to the whole active list from /admin
export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("sending"), // sending | sent | failed
  totalRecipients: integer("total_recipients").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Paid digital-product orders. Purchase access is intentionally separate from
// subscribers so opting out of marketing never removes something a buyer paid for.
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id").notNull().references(() => leadMagnets.id),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name"),
    stripeCheckoutSessionId: text("stripe_checkout_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    amountTotal: integer("amount_total").notNull(),
    currency: text("currency").notNull().default("usd"),
    paymentStatus: text("payment_status").notNull().default("pending"),
    fulfillmentStatus: text("fulfillment_status").notNull().default("pending"),
    downloadToken: text("download_token"),
    downloadExpiresAt: timestamp("download_expires_at"),
    downloadCount: integer("download_count").notNull().default(0),
    maxDownloads: integer("max_downloads").notNull().default(5),
    lastDownloadedAt: timestamp("last_downloaded_at"),
    paidAt: timestamp("paid_at"),
    refundedAt: timestamp("refunded_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_checkout_session_unique").on(t.stripeCheckoutSessionId),
    uniqueIndex("orders_download_token_unique").on(t.downloadToken),
    index("orders_product_idx").on(t.productId),
    index("orders_customer_email_idx").on(t.customerEmail),
  ],
);

// Stripe retries webhook events. Recording event IDs keeps fulfillment idempotent.
export const stripeEvents = pgTable("stripe_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const questionnaireFieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  required: z.boolean().default(false),
  type: z.enum(["text", "select"]).default("text"),
  options: z.array(z.string()).optional(),
});

export type QuestionnaireField = z.infer<typeof questionnaireFieldSchema>;

export const insertLeadMagnetSchema = createInsertSchema(leadMagnets).omit({
  id: true,
  viewCount: true,
  submissionCount: true,
  createdAt: true,
}).extend({
  productType: z.enum(["download", "paid_download", "external", "game"]),
  questionnaireFields: z.array(questionnaireFieldSchema).optional(),
  previewImages: z.array(z.string()).optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  nextSteps: z.string().optional(),
  externalUrl: z.string().url().optional().nullable(),
  buttonLabel: z.string().optional().nullable(),
  iconPath: z.string().optional().nullable(),
  priceCents: z.number().int().min(0).optional().nullable(),
  currency: z.string().regex(/^[a-z]{3}$/).optional().nullable(),
  stripePriceId: z.string().startsWith("price_").optional().nullable(),
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
  sequenceOptIn: true,
  sequenceOptInAt: true,
  sequenceStep: true,
  lastSequenceSentAt: true,
  createdAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required").optional(),
  tag: z.string().default("newsletter"),
});

export const insertSequenceEmailSchema = createInsertSchema(sequenceEmails).omit({
  id: true,
  createdAt: true,
}).extend({
  dayOffset: z.number().int().min(0, "Day must be 0 or later"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  audience: z.enum(["resource", "newsletter"]).default("resource"),
  active: z.boolean().default(true),
});

export const insertBroadcastSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
});

export type Broadcast = typeof broadcasts.$inferSelect;
export type Order = typeof orders.$inferSelect;

export type LeadMagnet = typeof leadMagnets.$inferSelect;
export type InsertLeadMagnet = z.infer<typeof insertLeadMagnetSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type SequenceEmail = typeof sequenceEmails.$inferSelect;
export type InsertSequenceEmail = z.infer<typeof insertSequenceEmailSchema>;
