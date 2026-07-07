import type { Express } from "express";
import { createServer, type Server } from "http";
import { existsSync } from "fs";
import { join } from "path";
import { storage } from "./storage";
import { insertSubscriberSchema, insertLeadSchema } from "@shared/schema";
import { sendLeadMagnetEmail, sendNewsletterConfirmationEmail, validateUnsubscribeToken } from "./email";
import { subscribeToConvertKit } from "./convertkit";
import { getSiteBaseUrl, PRODUCT_CK_TAGS } from "./config";

// Tag-based fallback map for homepage lead capture (convertKitTag in site.ts)
const LEAD_MAGNET_TAG_MAP: Record<string, { name: string; downloadUrl: string }> = {
  "lead-magnet-ask-close":     { name: "The Ask & Close Playbook",     downloadUrl: "/downloads/ask-close-playbook.pdf" },
  "ask-close-playbook":        { name: "The Ask & Close Playbook",     downloadUrl: "/downloads/ask-close-playbook.pdf" },
  "coaching-matrix":           { name: "Sales Rep Self-Coaching Tool", downloadUrl: "/downloads/salesrep-coaching-tool.xlsx" },
  "lead-magnet":               { name: "The Ask & Close Playbook",     downloadUrl: "/downloads/ask-close-playbook.pdf" },
  "lead-magnet-playbook":      { name: "The Ask & Close Playbook",     downloadUrl: "/downloads/ask-close-playbook.pdf" },
};

// Resolve the filesystem path for a public download URL
function publicFilePath(downloadUrl: string): string {
  const relative = downloadUrl.startsWith("/") ? downloadUrl.slice(1) : downloadUrl;
  return join(process.cwd(), "client", "public", relative);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Main subscribe endpoint ──────────────────────────────────────────────────
  // Accepts either:
  //   { email, firstName, tag }           — tag-based (homepage lead capture)
  //   { email, firstName, leadMagnetId }  — DB-driven (products page)
  app.post("/api/subscribe", async (req, res) => {
    try {
      const result = insertSubscriberSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid submission" });
      }

      const { email, firstName } = result.data;
      const leadMagnetId = req.body.leadMagnetId ? Number(req.body.leadMagnetId) : undefined;
      const siteBaseUrl = getSiteBaseUrl(req as any);

      // Resolve product — DB lookup takes priority over tag map
      let product: { name: string; downloadUrl: string } | undefined;
      let resolvedTag = result.data.tag || "newsletter";

      if (leadMagnetId && !isNaN(leadMagnetId)) {
        const lm = await storage.getLeadMagnet(leadMagnetId);
        if (!lm) return res.status(404).json({ message: "Product not found." });

        const downloadUrl = lm.resourceUrl || "/downloads/ask-close-playbook.pdf";
        const filePath = publicFilePath(downloadUrl);
        const fileExists = existsSync(filePath);

        if (!fileExists) {
          console.warn(`[subscribe] File missing for "${lm.title}": ${filePath} — email not sent`);
          return res.status(503).json({
            message: "This resource isn't available for download yet. Check back soon.",
          });
        }

        product = { name: lm.title, downloadUrl };
        resolvedTag = PRODUCT_CK_TAGS[leadMagnetId] ?? `lead-magnet-product-${leadMagnetId}`;

        // Increment submission count
        await storage.incrementSubmissions(leadMagnetId);

      } else if (resolvedTag && LEAD_MAGNET_TAG_MAP[resolvedTag]) {
        const tagProduct = LEAD_MAGNET_TAG_MAP[resolvedTag];
        const filePath = publicFilePath(tagProduct.downloadUrl);
        const fileExists = existsSync(filePath);

        if (!fileExists) {
          console.warn(`[subscribe] File missing for tag "${resolvedTag}": ${filePath} — email not sent`);
          return res.status(503).json({
            message: "This resource isn't available for download yet. Check back soon.",
          });
        }

        product = tagProduct;
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

      // ConvertKit sync
      const ckResult = await subscribeToConvertKit(email, firstName || "", resolvedTag);
      if (!ckResult.success && !ckResult.skipped) {
        console.error("[Subscribe] ConvertKit error:", ckResult.error);
      }

      const emailResult = product
        ? await sendLeadMagnetEmail(email, firstName || "", product.downloadUrl, siteBaseUrl, product.name)
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
