import type { Express } from "express";
import { type Server } from "http";
import { existsSync } from "fs";
import { join, basename, extname } from "path";
import { z } from "zod";
import multer from "multer";
import { storage } from "./storage";
import { slugify } from "@shared/slug";
import {
  insertSubscriberSchema,
  insertLeadSchema,
  insertLeadMagnetSchema,
  insertSequenceEmailSchema,
} from "@shared/schema";
import {
  sendLeadMagnetEmail,
  sendNewsletterConfirmationEmail,
  validateUnsubscribeToken,
  validateDownloadToken,
  buildDownloadUrl,
} from "./email";
import { subscribeToConvertKit } from "./convertkit";
import { getSiteBaseUrl, PRODUCT_CK_TAGS } from "./config";
import { setupAdminAuth, requireAdmin } from "./adminAuth";
import { ensureGameTables, registerGameRoutes } from "./game";

// Legacy tag → resource title map (homepage lead capture used tags historically).
// Resolved against the DB so delivery always goes through the tokenized flow.
const LEAD_MAGNET_TAG_MAP: Record<string, string> = {
  "lead-magnet-ask-close": "The Ask & Close Playbook",
  "ask-close-playbook": "The Ask & Close Playbook",
  "coaching-matrix": "Sales Rep Self-Coaching Tool",
  "lead-magnet": "The Ask & Close Playbook",
  "lead-magnet-playbook": "The Ask & Close Playbook",
};

// Resource files live OUTSIDE the public web root — they are only reachable
// through the tokenized /api/download endpoint (email-only delivery).
export function privateFilePath(resourceUrl: string): string {
  return join(process.cwd(), "server", "private", "downloads", basename(resourceUrl));
}

// A resource is deliverable if its file is in Postgres (admin upload) or on
// disk. The DB check is guarded so the app still works before `db:push` has
// created the resource_files table.
async function resourceFileAvailable(resourceUrl: string | null): Promise<boolean> {
  if (!resourceUrl) return false;
  const filename = basename(resourceUrl);
  try {
    if (await storage.getResourceFile(filename)) return true;
  } catch {
    // resource_files table missing — fall through to disk
  }
  return existsSync(privateFilePath(resourceUrl));
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  ".pdf", ".xlsx", ".xls", ".csv", ".docx", ".pptx", ".zip", ".png", ".jpg", ".jpeg",
]);

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const subscribeExtrasSchema = z.object({
  questionnaireAnswers: z.record(z.string()).optional(),
  sequenceOptIn: z.boolean().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  await setupAdminAuth(app);

  // ── Read the Room (sales game): leaderboard + verified score submission ─────
  await ensureGameTables();
  registerGameRoutes(app);

  // ── Main subscribe endpoint ──────────────────────────────────────────────────
  // Accepts:
  //   { email, firstName, tag }                                  — newsletter
  //   { email, firstName, leadMagnetId,
  //     questionnaireAnswers?, sequenceOptIn? }                  — resource request
  app.post("/api/subscribe", async (req, res) => {
    try {
      const result = insertSubscriberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid submission" });
      }
      const extras = subscribeExtrasSchema.safeParse(req.body);
      if (!extras.success) {
        return res.status(400).json({ message: "Invalid submission" });
      }

      const { email, firstName } = result.data;
      const { questionnaireAnswers, sequenceOptIn } = extras.data;
      let leadMagnetId = req.body.leadMagnetId ? Number(req.body.leadMagnetId) : undefined;
      const siteBaseUrl = getSiteBaseUrl(req as any);
      let resolvedTag = result.data.tag || "newsletter";

      // Legacy tag → resolve to a DB record so everything uses the same flow
      if (!leadMagnetId && resolvedTag && LEAD_MAGNET_TAG_MAP[resolvedTag]) {
        const all = await storage.listLeadMagnets(true);
        const match = all.find((m) => m.title === LEAD_MAGNET_TAG_MAP[resolvedTag]);
        if (match) leadMagnetId = match.id;
      }

      let magnet: Awaited<ReturnType<typeof storage.getLeadMagnet>> = undefined;
      if (leadMagnetId && !isNaN(leadMagnetId)) {
        magnet = await storage.getLeadMagnet(leadMagnetId);
        if (!magnet) return res.status(404).json({ message: "Product not found." });

        if (!(await resourceFileAvailable(magnet.resourceUrl))) {
          console.warn(`[subscribe] File missing for "${magnet.title}" — email not sent`);
          return res.status(503).json({
            message: "This resource isn't available yet. Check back soon.",
          });
        }

        resolvedTag = PRODUCT_CK_TAGS[magnet.id] ?? `lead-magnet-product-${magnet.id}`;
      }

      // Suppression check
      const existing = await storage.getSubscriberByEmail(email);
      if (existing?.unsubscribed) {
        return res.json({ success: true });
      }

      // Idempotent subscriber creation
      if (!existing) {
        await storage.createSubscriber({ email, firstName, tag: resolvedTag });
      }

      // Nurture sequence opt-in (never resets progress on re-submit)
      if (sequenceOptIn) {
        await storage.setSequenceOptIn(email);
      }

      // Store the lead + questionnaire answers per resource
      if (magnet) {
        const existingLead = await storage.getLead(email, magnet.id);
        if (!existingLead) {
          await storage.createLead({
            email,
            leadMagnetId: magnet.id,
            questionnaireAnswers: questionnaireAnswers ?? undefined,
          });
          await storage.incrementSubmissions(magnet.id);
        } else if (questionnaireAnswers && !existingLead.questionnaireAnswers) {
          await storage.updateLead(existingLead.id, { questionnaireAnswers });
        }
      }

      // ConvertKit sync
      const ckResult = await subscribeToConvertKit(email, firstName || "", resolvedTag);
      if (!ckResult.success && !ckResult.skipped) {
        console.error("[Subscribe] ConvertKit error:", ckResult.error);
      }

      const emailResult = magnet
        ? await sendLeadMagnetEmail(
            email,
            firstName || "",
            buildDownloadUrl(siteBaseUrl, email, magnet.id),
            siteBaseUrl,
            magnet.title,
          )
        : await sendNewsletterConfirmationEmail(email, firstName || "", siteBaseUrl);

      if (!emailResult.success) {
        console.error("Email failed:", emailResult.error);
        return res.status(500).json({ message: "We couldn't send your email right now. Please try again." });
      }

      return res.json({ success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Subscribe error:", msg);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ── Tokenized download (email-only delivery) ────────────────────────────────
  app.get("/api/download", async (req, res) => {
    try {
      const email = ((req.query.email as string) || "").toLowerCase();
      const token = req.query.token as string;
      const lmId = Number(req.query.lm);

      if (!email || !token || !lmId || isNaN(lmId)) {
        return res.status(400).send("Invalid download link.");
      }
      if (!validateDownloadToken(email, lmId, token)) {
        return res.status(403).send("This download link is not valid.");
      }

      const subscriber = await storage.getSubscriberByEmail(email);
      if (!subscriber || subscriber.unsubscribed) {
        return res.status(403).send("This download link is no longer active.");
      }

      const magnet = await storage.getLeadMagnet(lmId);
      if (!magnet || !magnet.resourceUrl) {
        return res.status(404).send("Resource not found.");
      }

      // Prefer the DB copy (uploaded via admin, survives redeploys), then disk.
      const filename = basename(magnet.resourceUrl);
      try {
        const dbFile = await storage.getResourceFile(filename);
        if (dbFile) {
          res.setHeader("Content-Type", dbFile.mimeType);
          res.setHeader("Content-Length", String(dbFile.size));
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          return res.send(dbFile.data);
        }
      } catch {
        // resource_files table missing — fall through to disk
      }

      const filePath = privateFilePath(magnet.resourceUrl);
      if (!existsSync(filePath)) {
        console.warn(`[download] File missing: ${filePath}`);
        return res.status(404).send("This file isn't available right now.");
      }

      return res.download(filePath, filename);
    } catch (err) {
      console.error("Download error:", err instanceof Error ? err.message : err);
      return res.status(500).send("Something went wrong.");
    }
  });

  // ── Unsubscribe ─────────────────────────────────────────────────────────────
  app.get("/api/unsubscribe", async (req, res) => {
    try {
      const email = req.query.email as string;
      const token = req.query.token as string;
      if (!email || !token) return res.status(400).json({ message: "Invalid unsubscribe link." });
      if (!validateUnsubscribeToken(email, token)) return res.status(400).json({ message: "Invalid token." });

      await storage.markUnsubscribed(email);
      return res.json({ success: true, message: "You have been unsubscribed." });
    } catch {
      return res.status(500).json({ message: "Something went wrong." });
    }
  });

  // ── Lead magnets list (public) ───────────────────────────────────────────────
  app.get("/api/lead-magnets", async (_req, res) => {
    try {
      const magnets = await storage.listLeadMagnets(true);
      return res.json(magnets);
    } catch {
      return res.status(500).json({ message: "Failed to load resources." });
    }
  });

  // ── View tracking (product detail page opens / signup flow starts) ──────────
  app.post("/api/lead-magnets/:id/view", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      await storage.incrementViews(id);
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ message: "Failed to record view." });
    }
  });

  // ── SEO: robots.txt + sitemap.xml ───────────────────────────────────────────
  app.get("/robots.txt", (req, res) => {
    const base = getSiteBaseUrl(req as any);
    res.type("text/plain").send(
      ["User-agent: *", "Allow: /", "Disallow: /admin", "Disallow: /api/", "", `Sitemap: ${base}/sitemap.xml`].join("\n"),
    );
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const base = getSiteBaseUrl(req as any);
      const staticPaths = ["/", "/about", "/products", "/coaching", "/game"];
      const magnets = await storage.listLeadMagnets(true);
      const urls = [
        ...staticPaths,
        ...magnets.map((m) => `/products/${slugify(m.title)}`),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
        .map((u) => `  <url><loc>${base}${u}</loc></url>`)
        .join("\n")}\n</urlset>`;
      return res.type("application/xml").send(xml);
    } catch {
      return res.status(500).send("");
    }
  });

  // ── Legacy lead endpoint ─────────────────────────────────────────────────────
  app.post("/api/lead", async (req, res) => {
    try {
      const result = insertLeadSchema.safeParse(req.body);
      if (!result.success) return res.status(400).json({ message: result.error.errors[0]?.message });
      const { email, leadMagnetId } = result.data;
      const leadMagnet = await storage.getLeadMagnet(leadMagnetId);
      if (!leadMagnet) return res.status(404).json({ message: "Resource not found." });
      const existing = await storage.getLead(email, leadMagnetId);
      if (!existing) {
        await storage.createLead(result.data);
        await storage.incrementSubmissions(leadMagnetId);
      }
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ message: "Something went wrong." });
    }
  });

  // ── Admin: signups + questionnaire answers ──────────────────────────────────
  app.get("/api/admin/leads", requireAdmin, async (_req, res) => {
    try {
      const [allLeads, allSubscribers, magnets] = await Promise.all([
        storage.listLeads(),
        storage.listSubscribers(),
        storage.listLeadMagnets(),
      ]);
      const magnetTitles = new Map(magnets.map((m) => [m.id, m.title]));
      const subByEmail = new Map(allSubscribers.map((s) => [s.email, s]));
      return res.json(
        allLeads.map((l) => {
          const sub = subByEmail.get(l.email);
          return {
            ...l,
            resourceTitle: l.leadMagnetId ? magnetTitles.get(l.leadMagnetId) ?? "Unknown" : "—",
            firstName: sub?.firstName ?? null,
            sequenceOptIn: sub?.sequenceOptIn ?? false,
            sequenceStep: sub?.sequenceStep ?? 0,
            unsubscribed: sub?.unsubscribed ?? l.unsubscribed,
          };
        })
      );
    } catch {
      return res.status(500).json({ message: "Failed to load signups." });
    }
  });

  // ── Admin: dashboard stats ──────────────────────────────────────────────────
  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const [allLeads, allSubscribers, perProduct] = await Promise.all([
        storage.listLeads(),
        storage.listSubscribers(),
        storage.getAnalytics(),
      ]);

      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      const since = (days: number) =>
        allLeads.filter((l) => now - new Date(l.createdAt).getTime() < days * DAY).length;

      // Daily signup counts for the last 30 days (oldest first)
      const signupsByDay: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const day = new Date(now - i * DAY);
        const key = day.toISOString().slice(0, 10);
        signupsByDay.push({
          date: key,
          count: allLeads.filter((l) => new Date(l.createdAt).toISOString().slice(0, 10) === key).length,
        });
      }

      const activeSubscribers = allSubscribers.filter((s) => !s.unsubscribed);
      return res.json({
        totalLeads: allLeads.length,
        leadsLast7: since(7),
        leadsPrev7: since(14) - since(7),
        totalSubscribers: allSubscribers.length,
        activeSubscribers: activeSubscribers.length,
        sequenceOptIns: activeSubscribers.filter((s) => s.sequenceOptIn).length,
        unsubscribed: allSubscribers.length - activeSubscribers.length,
        perProduct,
        signupsByDay,
      });
    } catch {
      return res.status(500).json({ message: "Failed to load stats." });
    }
  });

  // ── Admin: lead magnets (incl. inactive) + question editor ──────────────────
  app.get("/api/admin/lead-magnets", requireAdmin, async (_req, res) => {
    try {
      const magnets = await storage.listLeadMagnets();
      // Tell the admin UI whether each download product's file is actually
      // deliverable (uploaded to the DB or present on disk).
      const withFileState = await Promise.all(
        magnets.map(async (m) => ({
          ...m,
          fileUploaded: m.productType === "external" ? null : await resourceFileAvailable(m.resourceUrl),
        })),
      );
      return res.json(withFileState);
    } catch {
      return res.status(500).json({ message: "Failed to load resources." });
    }
  });

  app.post("/api/admin/lead-magnets", requireAdmin, async (req, res) => {
    try {
      const result = insertLeadMagnetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid data" });
      }
      return res.json(await storage.createLeadMagnet(result.data));
    } catch {
      return res.status(500).json({ message: "Failed to create resource." });
    }
  });

  // ── Public preview images (uploaded via admin, flagged isPublic) ────────────
  app.get("/api/files/:filename", async (req, res) => {
    try {
      const file = await storage.getResourceFile(basename(req.params.filename));
      if (!file || !file.isPublic) return res.status(404).send("Not found.");
      res.setHeader("Content-Type", file.mimeType);
      res.setHeader("Content-Length", String(file.size));
      res.setHeader("Cache-Control", "public, max-age=86400");
      return res.send(file.data);
    } catch {
      return res.status(404).send("Not found.");
    }
  });

  // ── Admin: file upload (stored in Postgres) ─────────────────────────────────
  // kind=resource (default): private, delivered only through /api/download.
  // kind=preview: public image, served from /api/files/ (used for previewImages).
  app.post("/api/admin/upload", requireAdmin, upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file received." });
      const isPreview = req.body?.kind === "preview";

      const rawExt = extname(file.originalname);
      const ext = rawExt.toLowerCase();
      const allowed = isPreview ? IMAGE_EXTENSIONS : ALLOWED_UPLOAD_EXTENSIONS;
      if (!allowed.has(ext)) {
        return res.status(400).json({
          message: isPreview
            ? `Previews must be images (${Array.from(IMAGE_EXTENSIONS).join(", ")}).`
            : `File type ${ext || "(none)"} isn't allowed.`,
        });
      }

      // Sanitize to a safe, stable filename. Previews get a prefix so a public
      // image can never overwrite (and expose) a private gated resource.
      let filename =
        basename(file.originalname, rawExt).toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) + ext;
      if (!filename || filename === ext) {
        return res.status(400).json({ message: "Invalid filename." });
      }
      if (isPreview) filename = `preview-${filename}`;

      await storage.saveResourceFile(filename, file.mimetype || "application/octet-stream", file.buffer, isPreview);
      return res.json({
        success: true,
        filename,
        resourceUrl: isPreview ? `/api/files/${filename}` : `/downloads/${filename}`,
        size: file.size,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      // Most likely cause: resource_files table doesn't exist yet
      if (/relation .* does not exist/i.test(msg)) {
        return res.status(500).json({ message: "File storage table missing — run `npm run db:push` once, then retry." });
      }
      console.error("Upload error:", msg);
      return res.status(500).json({ message: "Upload failed." });
    }
  });

  app.patch("/api/admin/lead-magnets/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const result = insertLeadMagnetSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid data" });
      }
      const updated = await storage.updateLeadMagnet(id, result.data);
      if (!updated) return res.status(404).json({ message: "Resource not found." });
      return res.json(updated);
    } catch {
      return res.status(500).json({ message: "Failed to update resource." });
    }
  });

  // ── Admin: sequence email CRUD ──────────────────────────────────────────────
  app.get("/api/admin/sequence-emails", requireAdmin, async (_req, res) => {
    try {
      return res.json(await storage.listSequenceEmails());
    } catch {
      return res.status(500).json({ message: "Failed to load sequence." });
    }
  });

  app.post("/api/admin/sequence-emails", requireAdmin, async (req, res) => {
    try {
      const result = insertSequenceEmailSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid data" });
      }
      return res.json(await storage.createSequenceEmail(result.data));
    } catch {
      return res.status(500).json({ message: "Failed to create email." });
    }
  });

  app.patch("/api/admin/sequence-emails/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      const result = insertSequenceEmailSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid data" });
      }
      const updated = await storage.updateSequenceEmail(id, result.data);
      if (!updated) return res.status(404).json({ message: "Email not found." });
      return res.json(updated);
    } catch {
      return res.status(500).json({ message: "Failed to update email." });
    }
  });

  app.delete("/api/admin/sequence-emails/:id", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      await storage.deleteSequenceEmail(id);
      return res.json({ success: true });
    } catch {
      return res.status(500).json({ message: "Failed to delete email." });
    }
  });

  return httpServer;
}
