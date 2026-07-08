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
];

// Default nurture sequence — sent only to subscribers who checked the opt-in
// box. Day offsets are relative to the moment they opted in. Day 0 is the
// resource delivery email itself, so the sequence starts on day 1.
// Fully editable in the admin panel.
const SEQUENCE: { dayOffset: number; subject: string; body: string }[] = [
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
      } else if (product.questionnaireFields && !existing[0].questionnaireFields) {
        // Backfill default questions on existing resources that have none
        await db
          .update(leadMagnets)
          .set({ questionnaireFields: product.questionnaireFields })
          .where(eq(leadMagnets.id, existing[0].id));
        console.log(`[seed] Added default questionnaire to: ${product.title}`);
      }
    }

    // Seed the nurture sequence only if the table is completely empty,
    // so admin edits/deletions are never overwritten.
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(sequenceEmails);
    if (count === 0) {
      await db.insert(sequenceEmails).values(SEQUENCE.map((s) => ({ ...s, active: true })));
      console.log(`[seed] Created ${SEQUENCE.length} sequence emails`);
    }
  } catch (error) {
    console.error("[seed] Seed failed:", error);
  }
}
