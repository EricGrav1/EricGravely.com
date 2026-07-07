import { db } from "./db";
import { leadMagnets } from "@shared/schema";
import { eq } from "drizzle-orm";

const PRODUCTS = [
  {
    title: "The Ask & Close Playbook",
    description: "Most reps ask questions at random and hope. This playbook maps the exact open and closed questions for all five stages of a deal — and the ratio top performers run at each stage without thinking about it.",
    productType: "download",
    resourceUrl: "/downloads/ask-close-playbook.pdf",
    deliveryMethod: "email",
    buttonLabel: "Get the free playbook",
    active: true,
  },
  {
    title: "Sales Rep Self-Coaching Tool",
    description: "Grade your own calls before your manager does. Score yourself across Intro, Call Control, and Close — the dashboard shows you exactly where your calls leak.",
    productType: "download",
    resourceUrl: "/downloads/salesrep-coaching-tool.xlsx",
    deliveryMethod: "email",
    buttonLabel: "Get the free tool",
    active: true,
  },
  {
    title: "Sales Coach AI",
    description: "Your calls, analyzed. AI-powered coaching that reviews your performance and tells you what to fix — like having a coach in your pocket after every call.",
    productType: "external",
    deliveryMethod: "email",
    externalUrl: "https://apps.apple.com/us/app/sales-coach-ai/id6748286535",
    buttonLabel: "Download on the App Store",
    iconPath: "/sales-coach-ai-icon.png",
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
