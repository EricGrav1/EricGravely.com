import { db } from "./db";
import { leadMagnets, sequenceEmails, type QuestionnaireField } from "@shared/schema";
import { eq, isNull, sql } from "drizzle-orm";

// Default 5-question questionnaire shown before the contact step.
// Editable per resource in the admin panel (/admin).
const DEFAULT_QUESTIONS: QuestionnaireField[] = [
  {
    id: "role",
    label: "What best describes your role?",
    required: true,
    type: "select",
    options: ["SDR / BDR", "Account Executive", "Sales Manager / Leader", "Business Owner", "Other"],
  },
  {
    id: "experience",
    label: "How long have you been in sales?",
    required: true,
    type: "select",
    options: ["Less than 1 year", "1–3 years", "3–7 years", "7+ years"],
  },
  {
    id: "challenge",
    label: "What's your biggest challenge right now?",
    required: true,
    type: "select",
    options: [
      "Booking more meetings",
      "Controlling the conversation",
      "Handling objections",
      "Closing consistently",
      "Coaching my team",
    ],
  },
  {
    id: "quota",
    label: "Where are you against quota lately?",
    required: true,
    type: "select",
    options: ["Ahead of quota", "Right around quota", "Behind quota", "I don't carry a quota"],
  },
  {
    id: "goal",
    label: "What's the #1 thing you want to improve in the next 90 days?",
    required: true,
    type: "text",
  },
];

const PRODUCTS = [
  {
    title: "The Ask & Close Playbook",
    description: "Most reps ask questions at random and hope. This playbook maps the exact open and closed questions for all five stages of a deal — and the ratio top performers run at each stage without thinking about it.",
    productType: "download",
    resourceUrl: "/downloads/ask-close-playbook.pdf",
    deliveryMethod: "email",
    buttonLabel: "Get the free playbook",
    questionnaireFields: DEFAULT_QUESTIONS,
    active: true,
  },
  {
    title: "Sales Rep Self-Coaching Tool",
    description: "Grade your own calls before your manager does. Score yourself across Intro, Call Control, and Close — the dashboard shows you exactly where your calls leak.",
    productType: "download",
    resourceUrl: "/downloads/salesrep-coaching-tool.xlsx",
    deliveryMethod: "email",
    buttonLabel: "Get the free tool",
    questionnaireFields: DEFAULT_QUESTIONS,
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
  {
    title: "Sales Manager Coaching Tool",
    description: "Score a coaching conversation across six critical stages, identify the first manager behavior to strengthen, and leave with one measurable action to practice and review.",
    productType: "paid_download",
    resourceUrl: "/downloads/Sales-Manager-Coaching-Tool-Bundle.zip",
    deliveryMethod: "purchase",
    buttonLabel: "Buy now - $39.99",
    priceCents: 3999,
    currency: "usd",
    previewImages: [
      "/sales-manager-coaching-tool-preview.png",
      "/sales-manager-coaching-tool-example.png",
    ],
    nextSteps: "Start with the quick-start guide, review the completed example, then score one real coaching conversation using the blank scorecard.",
    active: true,
  },
];

// Default nurture sequence — sent only to subscribers who checked the opt-in
// box. Day offsets are relative to the moment they opted in. Day 0 is the
// resource delivery email itself, so the sequence starts on day 1.
// Fully editable in the admin panel.
const RESOURCE_SEQUENCE: { dayOffset: number; subject: string; body: string }[] = [
  {
    dayOffset: 1,
    subject: "Did you open it yet, {{first_name}}?",
    body: `Hey {{first_name}},

Quick check-in — did you get a chance to open the resource I sent yesterday?

Most people download things like this and never look at them. Don't be most people. Block 15 minutes today, go through it once, and pick ONE thing to try on your very next call.

That's it. One thing. Small changes compound faster than you'd think.

If anything in there is unclear, hit reply and ask. I read every email.`,
  },
  {
    dayOffset: 3,
    subject: "The mistake I see on almost every call",
    body: `Hey {{first_name}},

After reviewing hundreds of sales calls, there's one mistake I see more than any other:

Reps talk when they should be asking.

The moment a prospect raises a concern, most reps jump straight into pitch mode — features, reassurances, discounts. And the prospect shuts down, because nobody likes being talked at.

Top performers do the opposite. They get curious. "Tell me more about that." "What's driving that concern?" "What would need to be true for this to make sense?"

Next call, when you feel the urge to defend — ask a question instead. Watch what happens.`,
  },
  {
    dayOffset: 5,
    subject: "Steal this: my 3-question close check",
    body: `Hey {{first_name}},

Before you ever ask for the business, you should be able to answer three questions:

1. Does the prospect clearly understand the problem we solve for them — in THEIR words, not mine?

2. Have they told me what happens if they do nothing?

3. Do I know exactly who else is involved in this decision?

If you can't answer all three, you're not ready to close — you're guessing. And guessed closes are where deals go to die.

Run this check on your current pipeline today. You'll immediately see which deals are real and which are wishful thinking.`,
  },
  {
    dayOffset: 7,
    subject: "Want me in your corner, {{first_name}}?",
    body: `Hey {{first_name}},

Over the past week I've sent you the frameworks I use with the reps and managers I coach. If you've put even one of them to work, you're ahead of most.

But here's the honest truth: tools only take you so far. The fastest growth I've ever seen — in my own career and in the people I coach — comes from having someone in your corner who watches your game film and tells you the truth.

That's what my 1-on-1 coaching is. We look at your actual calls, find where deals are leaking, and fix it together.

If you want to go deeper, apply here and tell me where you're stuck. If coaching's not the right fit right now, no pressure — keep using the tools, and keep replying to these emails when questions come up.

I'm rooting for you either way.`,
  },
];

// Newsletter subscribers receive the confirmation email immediately, then
// this short authority-building series. It is deliberately distinct from the
// resource follow-up sequence and remains fully editable in /admin.
const NEWSLETTER_SEQUENCE: { dayOffset: number; subject: string; body: string }[] = [
  {
    dayOffset: 1,
    subject: "The rule I use before coaching any rep",
    body: `Hey {{first_name}},

Before I coach a rep, I separate the person from the performance problem.

Too many managers see a missed number and jump straight to motivation: work harder, make more calls, push the deal. But the number is only the symptom. The real constraint might be skill, confidence, organization, or a gap in how the rep understands the customer.

My rule is simple: diagnose before you prescribe.

The next time a rep misses, ask one more question before giving advice. You will coach the real problem faster.`,
  },
  {
    dayOffset: 3,
    subject: "Your reps do not need another pep talk",
    body: `Hey {{first_name}},

Most struggling reps do not need more motivation. They need a manager who can name the exact behavior that is costing them deals.

"Improve discovery" is not coachable. "Ask one impact question before presenting" is.

Specific behavior gives the rep something they can practice, and it gives you something you can actually inspect on the next call.

Pick one rep today. Replace the broad feedback you were going to give with one observable behavior. Then coach only that until it sticks.`,
  },
  {
    dayOffset: 6,
    subject: "The three steps behind better rep performance",
    body: `Hey {{first_name}},

The best coaching systems are not complicated. Mine comes down to three moves:

Read the Rep — understand the person before assuming the problem.

Examine the Evidence — use calls, activity, and results to find the real constraint.

Practice to Performance — coach one behavior until it shows up when it counts.

That is the REP Development System. It gives managers a repeatable way to build stronger reps instead of relying on instinct and generic advice.

I will keep sharing the tools and coaching breakdowns I use in the field. If there is a sales-management problem you want me to unpack, reply and tell me.`,
  },
];

export async function seedDatabase() {
  try {
    // Seed default products only when the table is completely empty. Products
    // are managed in the admin panel — matching by title here would re-create
    // a product every time it gets renamed.
    const [{ count: productCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(leadMagnets);
    if (productCount === 0) {
      for (const product of PRODUCTS) {
        await db.insert(leadMagnets).values(product);
        console.log(`[seed] Created: ${product.title}`);
      }
    } else {
      // Backfill default questions on existing download resources that have none
      const existing = await db.select().from(leadMagnets);
      for (const row of existing) {
        if (row.productType === "download" && !row.questionnaireFields) {
          await db
            .update(leadMagnets)
            .set({ questionnaireFields: DEFAULT_QUESTIONS })
            .where(eq(leadMagnets.id, row.id));
          console.log(`[seed] Added default questionnaire to: ${row.title}`);
        }
      }
      if (!existing.some((row) => row.productType === "paid_download")) {
        const paidProduct = PRODUCTS.find((product) => product.productType === "paid_download");
        if (paidProduct) {
          await db.insert(leadMagnets).values(paidProduct);
          console.log(`[seed] Created paid product: ${paidProduct.title}`);
        }
      }
    }

    // Seed each audience independently. This lets an existing installation
    // gain the newsletter series without disturbing an edited resource series.
    const sequenceCounts = await db
      .select({ audience: sequenceEmails.audience, count: sql<number>`count(*)::int` })
      .from(sequenceEmails)
      .groupBy(sequenceEmails.audience);
    const countByAudience = new Map(sequenceCounts.map((row) => [row.audience ?? "resource", row.count]));

    if ((countByAudience.get("resource") ?? 0) === 0) {
      await db.insert(sequenceEmails).values(
        RESOURCE_SEQUENCE.map((email) => ({ ...email, audience: "resource", active: true })),
      );
      console.log(`[seed] Created ${RESOURCE_SEQUENCE.length} resource sequence emails`);
    }

    if ((countByAudience.get("newsletter") ?? 0) === 0) {
      await db.insert(sequenceEmails).values(
        NEWSLETTER_SEQUENCE.map((email) => ({ ...email, audience: "newsletter", active: true })),
      );
      console.log(`[seed] Created ${NEWSLETTER_SEQUENCE.length} newsletter sequence emails`);
    }
  } catch (error) {
    console.error("[seed] Seed failed:", error);
  }
}
