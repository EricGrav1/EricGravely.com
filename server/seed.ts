import { db } from "./db";
import { leadMagnets } from "@shared/schema";
import { eq } from "drizzle-orm";

const PRODUCTS = [
  {
    title: "The Ask & Close Playbook",
    description: "A question-based selling system built from 10+ years coaching hundreds of sales reps. Learn to sell by asking instead of pitching — the right mix of open-ended and closed questions at every stage of the sale, and how to guide a conversation naturally toward the close.",
    resourceUrl: "/lead-magnet.pdf",
    deliveryMethod: "email",
    active: true,
  },
  {
    title: "The Self Coaching Tool",
    description: "A self-evaluation and call-scoring tool for sales reps who want to improve between manager touchpoints. Score your own calls, identify patterns in your performance, and build the habit of honest self-assessment.",
    resourceUrl: "/self-coaching-tool.pdf",
    deliveryMethod: "email",
    active: true,
  },
];

export async function seedDatabase() {
  try {
    for (const product of PRODUCTS) {
      const existing = await db
        .select()
        .from(leadMagnets)
        .where(eq(leadMagnets.title, product.title));

      if (existing.length === 0) {
        await db.insert(leadMagnets).values(product);
        console.log(`[seed] Created: ${product.title}`);
      }
    }
  } catch (error) {
    console.error("[seed] Seed failed:", error);
  }
}
