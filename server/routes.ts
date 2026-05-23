import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSubscriberSchema, insertLeadSchema } from "@shared/schema";
import { sendLeadMagnetEmail, sendNewsletterConfirmationEmail, validateUnsubscribeToken } from "./email";
import { subscribeToConvertKit } from "./convertkit";

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

      // Idempotent: don't create duplicate subscriber records
      const existing = await storage.getSubscriberByEmail(email);
      if (!existing) {
        await storage.createSubscriber({ email, firstName, tag });
      }

      // ConvertKit — non-blocking (skip gracefully if not configured)
      subscribeToConvertKit(email, firstName || "").catch((err: unknown) => {
        console.error("[ConvertKit] Error:", err);
      });

      // Send email
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const isLeadMagnet = tag === "lead-magnet-playbook" || tag === "lead-magnet";
      const emailResult = isLeadMagnet
        ? await sendLeadMagnetEmail(email, firstName || "", "/lead-magnet.pdf", baseUrl)
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
    } catch (err: unknown) {
      return res.status(500).json({ message: "Something went wrong." });
    }
  });

  // ── Legacy endpoints (kept for backward compatibility) ───────────────────────
  app.get("/api/lead-magnets", async (_req, res) => {
    try {
      const magnets = await storage.listLeadMagnets(true);
      return res.json(magnets);
    } catch {
      return res.status(500).json({ message: "Failed to load resources." });
    }
  });

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
