import { db } from "./db";
import { leadMagnets } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const existing = await db
      .select()
      .from(leadMagnets)
      .where(eq(leadMagnets.title, "The New Sales Manager Playbook"));

    if (existing.length === 0) {
      await db.insert(leadMagnets).values({
        title: "The New Sales Manager Playbook",
        description: "The exact framework used to take 3 different sales teams from average to top performers. Covers 1:1 frameworks, metrics that matter, coaching without micromanaging, and a 90-day onboarding blueprint.",
        resourceUrl: "/lead-magnet.pdf",
        deliveryMethod: "email",
        active: true,
      });
      console.log("[seed] Sales Manager Playbook created");
    }
  } catch (error) {
    console.error("[seed] Seed failed:", error);
  }
}
