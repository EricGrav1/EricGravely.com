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
  // "download" = email-gated resource | "external" = app/product link | "game" = playable experience
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

// Named email sequences (drip campaigns), managed in /admin → Sequences.
// trigger decides who gets enrolled automatically:
//   "resource_signup"   — someone grabs a free resource (leadMagnetId = that
//                         resource, or null = any resource)
//   "newsletter_signup" — someone joins through the newsletter form
//   "manual"            — nobody automatically; enroll from the admin panel
export const sequences = pgTable("sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull().default("manual"),
  leadMagnetId: integer("lead_magnet_id").references(() => leadMagnets.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sequenceEmails = pgTable("sequence_emails", {
  id: serial("id").primaryKey(),
  sequenceId: integer("sequence_id").references(() => sequences.id, { onDelete: "cascade" }),
  dayOffset: integer("day_offset").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  // Legacy: which of the two original sequences this email belonged to
  // ("resource" | "newsletter"). Only read by the one-time migration to
  // named sequences (server/emailMigration.ts).
  audience: text("audience").notNull().default("resource"),
  active: boolean("active").notNull().default(true),
  sentCount: integer("sent_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// One row per subscriber per sequence. Progress is a cursor — the last email
// sent, by (dayOffset, id) — rather than a step index, so adding, deleting or
// pausing emails never makes anyone skip or repeat one.
export const sequenceEnrollments = pgTable(
  "sequence_enrollments",
  {
    id: serial("id").primaryKey(),
    subscriberId: integer("subscriber_id").notNull().references(() => subscribers.id, { onDelete: "cascade" }),
    sequenceId: integer("sequence_id").notNull().references(() => sequences.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"), // active | stopped
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
    lastEmailId: integer("last_email_id"),
    lastDayOffset: integer("last_day_offset"),
    lastSentAt: timestamp("last_sent_at"),
    emailsSent: integer("emails_sent").notNull().default(0),
  },
  (t) => [uniqueIndex("sequence_enrollments_sub_seq_idx").on(t.subscriberId, t.sequenceId)],
);

// Broadcasts: one-off emails to a segment of the list from /admin.
// status: scheduled | sending | sent | failed | canceled | interrupted
// (interrupted = a broadcast from before per-recipient tracking that never
// finished; can't be resumed).
export const broadcasts = pgTable("broadcasts", {
  id: serial("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("sending"),
  audience: jsonb("audience"), // EmailAudience; null = everyone (legacy rows)
  scheduledAt: timestamp("scheduled_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  totalRecipients: integer("total_recipients").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  // Why sending is paused (rate limit, bad API key…); cleared on the next success
  lastError: text("last_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// The recipient list is snapshotted when a broadcast starts, then worked
// through in small batches by whichever request gets there first (cron, the
// admin page, or the in-process timer). Rows are claimed with SKIP LOCKED so
// nobody is emailed twice, and progress survives restarts — important on
// Replit Autoscale, where the server sleeps between requests.
export const broadcastRecipients = pgTable(
  "broadcast_recipients",
  {
    id: serial("id").primaryKey(),
    broadcastId: integer("broadcast_id").notNull().references(() => broadcasts.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    firstName: text("first_name"),
    status: text("status").notNull().default("pending"), // pending | sending | sent | failed | canceled
    error: text("error"),
    claimedAt: timestamp("claimed_at"),
    sentAt: timestamp("sent_at"),
  },
  (t) => [
    uniqueIndex("broadcast_recipients_bc_email_idx").on(t.broadcastId, t.email),
    index("broadcast_recipients_bc_status_idx").on(t.broadcastId, t.status),
  ],
);

// Small key/value store for operational state (e.g. when the email jobs last
// ran, so the admin panel can warn if automatic sending has stalled).
export const appState = pgTable("app_state", {
  key: text("key").primaryKey(),
  value: jsonb("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  productType: z.enum(["download", "external", "game"]),
  questionnaireFields: z.array(questionnaireFieldSchema).optional(),
  previewImages: z.array(z.string()).optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
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

export const SEQUENCE_TRIGGERS = ["resource_signup", "newsletter_signup", "manual"] as const;
export type SequenceTrigger = (typeof SEQUENCE_TRIGGERS)[number];

export const insertSequenceSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  trigger: z.enum(SEQUENCE_TRIGGERS),
  leadMagnetId: z.number().int().positive().nullable().optional(),
  active: z.boolean().default(true),
});

export const insertSequenceEmailSchema = z.object({
  sequenceId: z.number().int().positive("Pick a sequence"),
  dayOffset: z.number().int().min(0, "Day must be 0 or later"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  active: z.boolean().default(true),
});

// Who an email goes to. Shared by broadcasts and "enroll existing subscribers".
//   all        — every active subscriber
//   newsletter — joined through the newsletter form
//   resource   — grabbed a free resource (leadMagnetId null = any resource)
export const emailAudienceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("all") }),
  z.object({ type: z.literal("newsletter") }),
  z.object({ type: z.literal("resource"), leadMagnetId: z.number().int().positive().nullable() }),
]);
export type EmailAudience = z.infer<typeof emailAudienceSchema>;

export const emailContentSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200),
  body: z.string().trim().min(1, "Body is required"),
});

export const insertBroadcastSchema = emailContentSchema.extend({
  audience: emailAudienceSchema.default({ type: "all" }),
  // ISO timestamp; omitted/null = send now
  scheduledAt: z.string().datetime({ offset: true }).nullable().optional(),
});

export type Broadcast = typeof broadcasts.$inferSelect;
export type BroadcastRecipient = typeof broadcastRecipients.$inferSelect;
export type Sequence = typeof sequences.$inferSelect;
export type InsertSequence = z.infer<typeof insertSequenceSchema>;
export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;

export type LeadMagnet = typeof leadMagnets.$inferSelect;
export type InsertLeadMagnet = z.infer<typeof insertLeadMagnetSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type SequenceEmail = typeof sequenceEmails.$inferSelect;
export type InsertSequenceEmail = z.infer<typeof insertSequenceEmailSchema>;
