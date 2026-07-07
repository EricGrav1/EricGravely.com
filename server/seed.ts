import { db } from "./db";
import { leadMagnets } from "@shared/schema";
import { eq } from "drizzle-orm";

const MATRIX_URL = process.env.MATRIX_URL || "/self-coaching-matrix.pdf";

const PRODUCTS = [
  {
    title: "The Ask & Close Playbook",
    description: "A question-based selling system built from 10+ years coaching hundreds of sales reps. Learn to sell by asking instead of pitching — the right mix of open-ended and closed questions at every stage of the sale.",
    resourceUrl: "/lead-magnet.pdf",
    deliveryMethod: "email",
    active: true,
  },
  {
    title: "The Self Coaching Matrix",
    description: "A self-evaluation and call-scoring tool that lets sales reps score their own calls and coach themselves between manager touchpoints. Built for reps who want to improve without waiting for their next 1:1.",
    resourceUrl: MATRIX_URL,
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
