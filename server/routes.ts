import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertLeadSchema } from "@shared/schema";
import { sendLeadMagnetEmail, validateUnsubscribeToken } from "./email";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Submit lead / email capture
  app.post("/api/lead", async (req, res) => {
    try {
      // Validate email
      const result = insertLeadSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: result.error.errors[0]?.message || "Invalid email address" 
        });
      }

      const { email } = result.data;
      
      // Check if already exists
      let lead = await storage.getLead(email);
      
      if (lead) {
        // Check if unsubscribed
        if (lead.unsubscribed) {
          return res.json({ 
            success: false, 
            unsubscribed: true,
            message: "This email has been unsubscribed." 
          });
        }
        
        // Update lastSentAt for existing lead
        lead = await storage.updateLead(email, { 
          lastSentAt: new Date().toISOString() 
        });
      } else {
        // Create new lead
        lead = await storage.createLead({ email });
        await storage.updateLead(email, { 
          lastSentAt: new Date().toISOString() 
        });
      }

      // Send email
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      const emailResult = await sendLeadMagnetEmail(email, baseUrl);
      
      if (!emailResult.success) {
        console.error("Email send failed:", emailResult.error);
        return res.status(500).json({ 
          message: "We couldn't send the email right now. Please try again later." 
        });
      }

      return res.json({ success: true, message: "Email sent successfully" });
      
    } catch (error: any) {
      console.error("Lead submission error:", error);
      return res.status(500).json({ 
        message: "Something went wrong. Please try again." 
      });
    }
  });

  // Unsubscribe endpoint
  app.get("/api/unsubscribe", async (req, res) => {
    try {
      const email = req.query.email as string;
      const token = req.query.token as string;

      if (!email || !token) {
        return res.status(400).json({ 
          message: "Invalid unsubscribe link. Missing email or token." 
        });
      }

      // Validate token
      if (!validateUnsubscribeToken(email, token)) {
        return res.status(400).json({ 
          message: "Invalid unsubscribe link. The token is not valid." 
        });
      }

      // Check if lead exists
      const lead = await storage.getLead(email);
      
      if (!lead) {
        // Lead doesn't exist, but that's okay - they're unsubscribed anyway
        return res.json({ 
          success: true, 
          message: "You have been unsubscribed successfully." 
        });
      }

      if (lead.unsubscribed) {
        return res.json({ 
          success: true, 
          message: "You were already unsubscribed." 
        });
      }

      // Mark as unsubscribed
      await storage.markUnsubscribed(email);

      return res.json({ 
        success: true, 
        message: "You have been unsubscribed successfully." 
      });
      
    } catch (error: any) {
      console.error("Unsubscribe error:", error);
      return res.status(500).json({ 
        message: "Something went wrong. Please try again." 
      });
    }
  });

  return httpServer;
}
