import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema, insertLeadSchema } from "@shared/schema";
import { sendLeadMagnetEmail, sendNewsletterConfirmationEmail, validateUnsubscribeToken } from "./email";
import { subscribeToConvertKit } from "./convertkit";

interface ProductInfo {
  name: string;
  downloadUrl: string;
}

const LEAD_MAGNET_PRODUCTS: Record<string, ProductInfo> = {
  "lead-magnet-ask-close":    { name: "The Ask & Close Playbook",  downloadUrl: "/lead-magnet.pdf" },
  "lead-magnet-self-coaching":{ name: "The Self Coaching Tool",    downloadUrl: "/self-coaching-tool.pdf" },
  "lead-magnet":              { name: "The Ask & Close Playbook",  downloadUrl: "/lead-magnet.pdf" },
  "lead-magnet-playbook":     { name: "The Ask & Close Playbook",  downloadUrl: "/lead-magnet.pdf" },
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Main subscribe endpoint ──────────────────────────────────────────────────
  app.post("/api/subscribe", async (req, res) => {
    try {
      const result = insertSubscriberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid submission" });
      }

      const { email, firstName, tag } = result.data;

      // Suppression check
      const existing = await storage.getSubscriberByEmail(email);
      if (existing?.unsubscribed) {
        return res.json({ success: true });
      }

      // Idempotent: don't duplicate subscriber records
      if (!existing) {
        await storage.createSubscriber({ email, firstName, tag });
      }

      // ConvertKit sync
      const ckResult = await subscribeToConvertKit(email, firstName || "", tag);
      if (!ckResult.success && !ckResult.skipped) {
        console.error("[Subscribe] ConvertKit error:", ckResult.error);
      }

      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const product = tag ? LEAD_MAGNET_PRODUCTS[tag] : undefined;

      const emailResult = product
        ? await sendLeadMagnetEmail(email, firstName || "", product.downloadUrl, baseUrl, product.name)
        : await sendNewsletterConfirmationEmail(email, firstName || "");

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

  // ── Lead magnets list ────────────────────────────────────────────────────────
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

  return httpServer;
}
