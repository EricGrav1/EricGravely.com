import type { Express } from "express";
import { type Server } from "http";
import { existsSync } from "fs";
import { join, basename } from "path";
import { z } from "zod";
import { storage } from "./storage";
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

const subscribeExtrasSchema = z.object({
  questionnaireAnswers: z.record(z.string()).optional(),
  sequenceOptIn: z.boolean().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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

        const filePath = privateFilePath(magnet.resourceUrl || "");
        if (!magnet.resourceUrl || !existsSync(filePath)) {
          console.warn(`[subscribe] File missing for "${magnet.title}": ${filePath} — email not sent`);
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

      const filePath = privateFilePath(magnet.resourceUrl);
      if (!existsSync(filePath)) {
        console.warn(`[download] File missing: ${filePath}`);
        return res.status(404).send("This file isn't available right now.");
      }

      return res.download(filePath, basename(magnet.resourceUrl));
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
  app.get("/api/admin/leads", async (_req, res) => {
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

  // ── Admin: lead magnets (incl. inactive) + question editor ──────────────────
  app.get("/api/admin/lead-magnets", async (_req, res) => {
    try {
      return res.json(await storage.listLeadMagnets());
    } catch {
      return res.status(500).json({ message: "Failed to load resources." });
    }
  });

  app.patch("/api/admin/lead-magnets/:id", async (req, res) => {
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
  app.get("/api/admin/sequence-emails", async (_req, res) => {
    try {
      return res.json(await storage.listSequenceEmails());
    } catch {
      return res.status(500).json({ message: "Failed to load sequence." });
    }
  });

  app.post("/api/admin/sequence-emails", async (req, res) => {
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

  app.patch("/api/admin/sequence-emails/:id", async (req, res) => {
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

  app.delete("/api/admin/sequence-emails/:id", async (req, res) => {
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
