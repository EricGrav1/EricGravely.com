import { db } from "./db";
import { leadMagnets } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const matrixUrl = process.env.MATRIX_URL || "";

    const existing = await db
      .select()
      .from(leadMagnets)
      .where(eq(leadMagnets.title, "Self Coaching Matrix"));

    if (existing.length === 0) {
      await db.insert(leadMagnets).values({
        title: "Self Coaching Matrix",
        description:
          "A powerful framework to transform your sales conversations. Use it to coach yourself through any sales challenge and close more deals with confidence.",
        resourceUrl: matrixUrl,
        deliveryMethod: "email",
        active: true,
      });
      console.log("[seed] Self Coaching Matrix created");
    } else if (matrixUrl && existing[0].resourceUrl !== matrixUrl) {
      await db
        .update(leadMagnets)
        .set({ resourceUrl: matrixUrl })
        .where(eq(leadMagnets.title, "Self Coaching Matrix"));
      console.log("[seed] Self Coaching Matrix URL updated");
    }
  } catch (error) {
    console.error("[seed] Seed failed:", error);
  }
}
