import { pgTable, serial, text, boolean, timestamp, integer, jsonb, json, varchar, index, customType } from "drizzle-orm/pg-core";
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
  // Email sequence state
  sequenceOptIn: boolean("sequence_opt_in").notNull().default(false),
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
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const insertSequenceEmailSchema = createInsertSchema(sequenceEmails).omit({
  id: true,
  createdAt: true,
}).extend({
  dayOffset: z.number().int().min(0, "Day must be 0 or later"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  active: z.boolean().default(true),
});

export type LeadMagnet = typeof leadMagnets.$inferSelect;
export type InsertLeadMagnet = z.infer<typeof insertLeadMagnetSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type SequenceEmail = typeof sequenceEmails.$inferSelect;
export type InsertSequenceEmail = z.infer<typeof insertSequenceEmailSchema>;

// ── Read the Room (sales game) ───────────────────────────────────────────────
// One row per player, keyed by email. The leaderboard shows displayName +
// bestScore only; emails are visible in /admin.
export const gamePlayers = pgTable("game_players", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  bestScore: integer("best_score").notNull().default(0),
  // Snapshot of the run that set bestScore (accuracy, streak, deals, profile)
  bestRun: jsonb("best_run"),
  plays: integer("plays").notNull().default(0),
  lastPlayedAt: timestamp("last_played_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Every verified run (for admin analytics + fraud review).
export const gameRuns = pgTable("game_runs", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => gamePlayers.id),
  score: integer("score").notNull(),
  seed: integer("seed").notNull(),
  summary: jsonb("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type GamePlayer = typeof gamePlayers.$inferSelect;
export type GameRun = typeof gameRuns.$inferSelect;

export const gameSubmitSchema = z.object({
  seed: z.number().int().min(0).max(0x7fffffff),
  events: z
    .array(z.object({ move: z.enum(["ask", "tell", "close", "none"]), ms: z.number().finite().min(0) }))
    .min(1)
    .max(200),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(20, "Display name must be 20 characters or fewer")
    .regex(/^[A-Za-z0-9\u00C0-\u024F ._'-]+$/, "Display name can only use letters, numbers, spaces, and . _ ' -"),
  email: z.string().trim().email("Please enter a valid email address"),
  sequenceOptIn: z.boolean().optional(),
});
export type GameSubmit = z.infer<typeof gameSubmitSchema>;
