import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema, insertLeadMagnetSchema } from "@shared/schema";
import { sendLeadMagnetEmail, validateUnsubscribeToken } from "./email";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Lead Magnets ────────────────────────────────────────────────────────────

  // List active lead magnets (for visitors)
  app.get("/api/lead-magnets", async (_req, res) => {
    try {
      const magnets = await storage.listLeadMagnets(true);
      return res.json(magnets);
    } catch (error: any) {
      console.error("Failed to list lead magnets:", error);
      return res.status(500).json({ message: "Failed to load resources." });
    }
  });

  // Track a view
  app.post("/api/lead-magnets/:id/view", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });
      await storage.incrementViews(id);
      return res.json({ success: true });
    } catch (error: any) {
      console.error("Failed to record view:", error);
      return res.status(500).json({ message: "Failed to record view." });
    }
  });

  // ── Lead Submission ─────────────────────────────────────────────────────────

  app.post("/api/lead", async (req, res) => {
    try {
      const result = insertLeadSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: result.error.errors[0]?.message || "Invalid submission",
        });
      }

      const { email, phone, leadMagnetId, questionnaireAnswers } = result.data;

      // Load the lead magnet
      const leadMagnet = await storage.getLeadMagnet(leadMagnetId);
      if (!leadMagnet || !leadMagnet.active) {
        return res.status(404).json({ message: "Resource not found or no longer available." });
      }

      // Check for existing lead for this email + magnet combo
      const existingLead = await storage.getLead(email, leadMagnetId);

      if (existingLead) {
        if (existingLead.unsubscribed) {
          return res.json({
            success: false,
            unsubscribed: true,
            message: "This email has been unsubscribed.",
          });
        }
        // Update last sent timestamp
        await storage.updateLead(existingLead.id, { lastSentAt: new Date() });
      } else {
        // Create a new lead record
        await storage.createLead({ email, phone, leadMagnetId, questionnaireAnswers });
        await storage.incrementSubmissions(leadMagnetId);
      }

      // Send the email
      const protocol = req.headers["x-forwarded-proto"] || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      const emailResult = await sendLeadMagnetEmail(email, baseUrl, leadMagnet);

      if (!emailResult.success) {
        console.error("Email send failed:", emailResult.error);
        return res.status(500).json({
          message: "We couldn't send the email right now. Please try again later.",
        });
      }

      return res.json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
      console.error("Lead submission error:", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ── Unsubscribe ─────────────────────────────────────────────────────────────

  app.get("/api/unsubscribe", async (req, res) => {
    try {
      const email = req.query.email as string;
      const token = req.query.token as string;

      if (!email || !token) {
        return res.status(400).json({ message: "Invalid unsubscribe link. Missing email or token." });
      }

      if (!validateUnsubscribeToken(email, token)) {
        return res.status(400).json({ message: "Invalid unsubscribe link. The token is not valid." });
      }

      await storage.markUnsubscribed(email);

      return res.json({ success: true, message: "You have been unsubscribed successfully." });
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ── Analytics ───────────────────────────────────────────────────────────────

  app.get("/api/analytics", async (_req, res) => {
    try {
      const stats = await storage.getAnalytics();
      return res.json(stats);
    } catch (error: any) {
      console.error("Analytics error:", error);
      return res.status(500).json({ message: "Failed to load analytics." });
    }
  });

  // ── Admin: Lead Magnet CRUD ─────────────────────────────────────────────────

  app.get("/api/admin/lead-magnets", async (_req, res) => {
    try {
      const magnets = await storage.listLeadMagnets(false);
      return res.json(magnets);
    } catch (error: any) {
      console.error("Admin list error:", error);
      return res.status(500).json({ message: "Failed to load resources." });
    }
  });

  app.post("/api/admin/lead-magnets", async (req, res) => {
    try {
      const result = insertLeadMagnetSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: result.error.errors[0]?.message || "Invalid data",
        });
      }
      const magnet = await storage.createLeadMagnet(result.data);
      return res.status(201).json(magnet);
    } catch (error: any) {
      console.error("Admin create error:", error);
      return res.status(500).json({ message: "Failed to create resource." });
    }
  });

  app.patch("/api/admin/lead-magnets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid id." });

      const result = insertLeadMagnetSchema.partial().safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: result.error.errors[0]?.message || "Invalid data",
        });
      }

      const magnet = await storage.updateLeadMagnet(id, result.data);
      if (!magnet) return res.status(404).json({ message: "Resource not found." });

      return res.json(magnet);
    } catch (error: any) {
      console.error("Admin update error:", error);
      return res.status(500).json({ message: "Failed to update resource." });
    }
  });

  return httpServer;
}
