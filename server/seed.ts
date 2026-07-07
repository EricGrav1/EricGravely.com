import { db } from "./db";
import { leadMagnets } from "@shared/schema";
import { eq } from "drizzle-orm";

const PRODUCTS = [
  {
    title: "The Ask & Close Playbook",
    description: "A question-based selling framework mapping the exact open and closed questions that move a deal through five stages, with target open-to-closed question ratios for each stage from rapport to close.",
    resourceUrl: "/downloads/ask-close-playbook.pdf",
    deliveryMethod: "email",
    active: true,
  },
  {
    title: "Sales Rep Self-Coaching Matrix",
    description: "An Excel call-scoring tool that grades your sales calls across Introduction, Call Control, and Presentation/Close, with an automatic dashboard that shows exactly where your calls are strong and where they leak.",
    resourceUrl: "/downloads/salesrep-coaching-tool.xlsx",
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
