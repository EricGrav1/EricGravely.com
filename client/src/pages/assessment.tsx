import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/lib/seo";
import { site } from "@/config/site";

/* ============================================================
   THE DECA PERSONALITY ASSESSMENT — Eric Gravely
   Types: Dominant / Ego / Caring / Analytical
   20 general personality questions.
   Results show: personality type + meaning, how it relates to
   sales (style + blind spot), and how to sell to the other types.
   Self-contained — the email capture is not wired to any list or
   sequence.
   ============================================================ */

type TypeKey = "D" | "E" | "C" | "A";
interface AnswerOpt { t: TypeKey; text: string; }
interface Question { q: string; a: AnswerOpt[]; }
interface Profile { name: string; tagline: string; summary: string; salesStyle: string; blindspot: string; }

// Theme tokens — reused from the site's design system so the page follows
// light/dark mode instead of the source component's hardcoded ivory.
const GOLD = "var(--c-accent)";
const INK = "var(--c-fg)";
const IVORY = "var(--c-bg)";
const RAISED = "var(--c-bg2)";
const MUTED = "var(--c-fg-55)";
const MUTED2 = "var(--c-fg-45)";
const BORDER = "var(--c-border)";
const CARD = "var(--c-card)";
const CARD_BORDER = "var(--c-card-border)";

const QUESTIONS: Question[] = [
  {
    q: "A group project has no leader. You…",
    a: [
      { t: "D", text: "Take charge. Someone has to, and waiting is wasted time." },
      { t: "E", text: "End up leading anyway — people tend to follow me." },
      { t: "C", text: "Support whoever steps up and keep the group together." },
      { t: "A", text: "Organize the plan and details first — leadership follows clarity." },
    ],
  },
  {
    q: "You're making a big decision — a car, a move, a job. You…",
    a: [
      { t: "D", text: "Decide fast and adjust later. Momentum beats perfection." },
      { t: "E", text: "Choose the option I'd be proud to be seen with." },
      { t: "C", text: "Talk it through with people I trust before committing." },
      { t: "A", text: "Research everything. There's probably a spreadsheet." },
    ],
  },
  {
    q: "In an argument, your instinct is to…",
    a: [
      { t: "D", text: "Address it head-on, right now." },
      { t: "E", text: "Win it. Backing down in front of people stings." },
      { t: "C", text: "Smooth it over and find common ground." },
      { t: "A", text: "Strip out the emotion and stick to the facts." },
    ],
  },
  {
    q: "At an event where you barely know anyone, you…",
    a: [
      { t: "D", text: "Find the most useful person in the room and go talk to them." },
      { t: "E", text: "Work the room. I like leaving an impression." },
      { t: "C", text: "Find one person and have a real conversation." },
      { t: "A", text: "Observe first. I join when there's a conversation worth joining." },
    ],
  },
  {
    q: "Your relationship with planning:",
    a: [
      { t: "D", text: "Targets, not schedules. I attack what matters most." },
      { t: "E", text: "Built around the big moments — I rise to the occasions that count." },
      { t: "C", text: "A steady routine. People can set their watch by me." },
      { t: "A", text: "Everything scheduled, sequenced, and accounted for." },
    ],
  },
  {
    q: "When you get criticized, you…",
    a: [
      { t: "D", text: "Prefer it blunt and fast. Don't dance around it." },
      { t: "E", text: "Handle it fine in private. In front of others is a different story." },
      { t: "C", text: "Take it to heart — sometimes more than I should." },
      { t: "A", text: "Want specifics and examples, not vague feelings." },
    ],
  },
  {
    q: "Under real pressure, you become…",
    a: [
      { t: "D", text: "More aggressive. I push harder." },
      { t: "E", text: "More polished. I project confidence even when I don't feel it." },
      { t: "C", text: "Quieter. I absorb it to keep the peace." },
      { t: "A", text: "More withdrawn. I retreat into the details." },
    ],
  },
  {
    q: "The best thing people say about you when you're not in the room:",
    a: [
      { t: "D", text: "“Gets it done. Just don't get in the way.”" },
      { t: "E", text: "“You always know when they're in the room.”" },
      { t: "C", text: "“The one you can actually count on.”" },
      { t: "A", text: "“The most prepared person in the building.”" },
    ],
  },
  {
    q: "Your biggest professional fear:",
    a: [
      { t: "D", text: "Being powerless — stuck under slow people and slow decisions." },
      { t: "E", text: "Being embarrassed, or seen as a failure." },
      { t: "C", text: "Letting people down." },
      { t: "A", text: "Being wrong, and someone catching it." },
    ],
  },
  {
    q: "How you win people over:",
    a: [
      { t: "D", text: "Results. I let the scoreboard talk." },
      { t: "E", text: "Presence. Confidence is contagious." },
      { t: "C", text: "Loyalty and consistency, over time." },
      { t: "A", text: "Competence. Being right and being prepared." },
    ],
  },
  {
    q: "Plans change at the last minute. You feel…",
    a: [
      { t: "D", text: "Fine — now I decide the new plan." },
      { t: "E", text: "Fine — I adapt and make it look effortless." },
      { t: "C", text: "Stressed. I liked the plan we all agreed on." },
      { t: "A", text: "Frustrated. Changes should be justified, not vibes." },
    ],
  },
  {
    q: "What actually motivates you:",
    a: [
      { t: "D", text: "Winning. Beating the target, beating the competition." },
      { t: "E", text: "Recognition. Being seen as the best at what I do." },
      { t: "C", text: "Being needed and valued by the people around me." },
      { t: "A", text: "Mastery. Understanding something deeply and being right." },
    ],
  },
  {
    q: "Someone on your team keeps underperforming. You…",
    a: [
      { t: "D", text: "Call it out directly. They should know exactly where they stand." },
      { t: "E", text: "Raise the bar yourself and let the gap do the talking." },
      { t: "C", text: "Pull them aside privately and ask what's really going on." },
      { t: "A", text: "Look at the numbers first to see where it's actually breaking down." },
    ],
  },
  {
    q: "Your ideal weekend involves…",
    a: [
      { t: "D", text: "Competing at something, or knocking out a goal." },
      { t: "E", text: "Something worth talking about on Monday." },
      { t: "C", text: "Quality time with the people who matter." },
      { t: "A", text: "Going deep on a hobby or something I'm learning." },
    ],
  },
  {
    q: "When you tell a story, you…",
    a: [
      { t: "D", text: "Get to the point. Setup, punchline, done." },
      { t: "E", text: "Perform it. The pauses, the delivery — the whole thing." },
      { t: "C", text: "Make sure everyone in the room feels part of it." },
      { t: "A", text: "Get the details right. Even the ones nobody asked for." },
    ],
  },
  {
    q: "You disagree with someone above you. You…",
    a: [
      { t: "D", text: "Say it. Titles don't scare me." },
      { t: "E", text: "Pick my moment. I want to be right AND look right." },
      { t: "C", text: "Bring it up gently, one-on-one." },
      { t: "A", text: "Come back with evidence they can't argue with." },
    ],
  },
  {
    q: "New app, tool, or gadget. You…",
    a: [
      { t: "D", text: "Skip the tutorial and figure it out by using it." },
      { t: "E", text: "Learn it well enough to be the one showing everyone else." },
      { t: "C", text: "Ask someone who already uses it to walk me through." },
      { t: "A", text: "Read the documentation. Yes, actually." },
    ],
  },
  {
    q: "What ruins your day the fastest:",
    a: [
      { t: "D", text: "Losing." },
      { t: "E", text: "Being overlooked." },
      { t: "C", text: "Tension with someone I care about." },
      { t: "A", text: "Sloppy work I have to clean up." },
    ],
  },
  {
    q: "The compliment that lands hardest:",
    a: [
      { t: "D", text: "“Nobody else could have pulled that off.”" },
      { t: "E", text: "“Everyone was talking about you afterward.”" },
      { t: "C", text: "“I don't know what we'd do without you.”" },
      { t: "A", text: "“You were right.”" },
    ],
  },
  {
    q: "Someone asks for your help. You…",
    a: [
      { t: "D", text: "Give them the fastest path to fixed. Next." },
      { t: "E", text: "Step in and show them how it's done." },
      { t: "C", text: "Drop what I'm doing. That's what I'm here for." },
      { t: "A", text: "Ask questions first — I want to solve the real problem, not the symptom." },
    ],
  },
];

const PROFILES: Record<TypeKey, Profile> = {
  D: {
    name: "The Dominant",
    tagline: "Direct. Decisive. Allergic to wasted time.",
    summary:
      "You take control of situations because waiting on other people physically hurts. You measure life in wins, speak in bottom lines, and would rather ask forgiveness than permission. People experience you as intense, confident, and occasionally blunt — and you're mostly fine with that. Conflict doesn't scare you; stagnation does.",
    salesStyle:
      "You're a natural closer. Your instinct is to control the process, create urgency, and ask directly for the business — which makes you lethal late in deals where someone has to push. You thrive in competitive, fast-cycle selling and exec conversations where decisiveness is respected. What works for you: options-based closes (“A or B by Friday?”), owning the next step in every interaction, and deals where speed is a feature, not a threat.",
    blindspot:
      "Your pace runs people over. You steamroll slower buyers, skip discovery when you smell a close, and read hesitation as weakness when it's often just a different decision style. The deals you lose, you lose early — before you realized the buyer needed safety or evidence, not speed.",
  },
  E: {
    name: "The Ego",
    tagline: "Confident. Magnetic. Always aware of the room.",
    summary:
      "You care how things look and who's watching — and instead of hiding that, you run on it. You want to be recognized as the best, remembered in every room, and treated as an expert rather than an extra. That drive makes you perform when the stakes are highest. People are drawn to your confidence; a few are threatened by it. Losing privately is survivable. Losing publicly is not.",
    salesStyle:
      "You're the performer. You win bake-offs, exec pitches, and any room where confidence is contagious — buyers believe you because you believe you. What works for you: big-stage moments, name-brand social proof, building a personal reputation that opens doors before you knock, and positioning yourself as the expert they're lucky to work with, not a vendor chasing them.",
    blindspot:
      "You make the sale about you. You talk past the buyer, over-promise to protect your image, and take objections personally when they're just questions. The deals you lose go to quieter reps who asked better questions while you were performing.",
  },
  C: {
    name: "The Caring",
    tagline: "Warm. Loyal. The one people actually trust.",
    summary:
      "You read people quickly, avoid unnecessary conflict, and would rather absorb pressure than pass it on. Being counted on matters more to you than being celebrated. People confide in you fast — sometimes strangers tell you things they haven't told their friends. Your word means something, and you protect that. Harmony isn't weakness to you; it's the whole point.",
    salesStyle:
      "You're the trust-builder. You win long, relationship-heavy deals and you keep customers other reps would lose — retention and expansion are your natural territory. What works for you: multi-threading deep into accounts, service-led selling, and being the rep buyers actually want to call back. Buyers don't just buy from you; they defend you internally.",
    blindspot:
      "You avoid the ask, so deals drift. You mistake “no pressure” for good selling, when sometimes the most caring thing you can do is force a decision the buyer is avoiding. Your pipeline is full of people who like you and haven't bought anything.",
  },
  A: {
    name: "The Analytical",
    tagline: "Precise. Prepared. Right more often than lucky.",
    summary:
      "You need to understand before you act. You trust data over vibes, verify what others assume, and hate being wrong more than you enjoy being praised. Your standards are high — mostly for yourself — and “because I said so” has never once worked on you. People come to you when the answer actually matters.",
    salesStyle:
      "You're the expert. Complex, technical, high-scrutiny sales are your home field — procurement processes that exhaust other reps are where you pull ahead. What works for you: airtight business cases, demos with real depth, and written follow-ups that answer the buyer's questions before they've asked them. When the deal comes down to evidence, you beat louder reps every time.",
    blindspot:
      "You over-prove and under-ask. You keep presenting evidence after the buyer is already convinced, and emotional buyers check out while you're still on slide 14. Precision wins trust; it doesn't close deals. Someone still has to ask.",
  },
};

/* SELL_TO[yourType][buyerType] */
const SELL_TO: Record<TypeKey, Record<TypeKey, string[]>> = {
  D: {
    D: [
      "Match their pace and be blunt — they respect directness, not deference.",
      "Give them control through options: “A or B by Friday?” never open-ended.",
      "Don't fight for the wheel. Make THEM the winner of the deal.",
    ],
    E: [
      "Your directness can bruise their image. Never win an argument at their expense — you'll win the point and lose the deal.",
      "Sell how this elevates THEM: the win they present to their board, the credit they take.",
      "Make them the hero of every recap. Their name on the victory, your name on the invoice.",
    ],
    C: [
      "Your intensity reads as pressure. Slow the close down on purpose.",
      "Sell safety: references, a pilot, a rollback plan. Build a path of small yeses.",
      "Never force a fast decision — you'll get a polite yes and a silent ghost.",
    ],
    A: [
      "Your confidence is not evidence. Bring data and send materials before the call.",
      "Be ready for “how do you know that?” on every claim you make.",
      "Never wing a number. One wrong stat and your credibility is gone for good.",
    ],
  },
  E: {
    D: [
      "They don't care about your highlight reel. Outcomes only — be brief.",
      "Let them own the decision. Your reputation opens the door; THEIR result closes it.",
      "Skip the performance. A Dominant buyer smells a show and disqualifies you for it.",
    ],
    E: [
      "Two spotlights, one stage. Hand them the stage on purpose — you can't out-shine your way into their wallet.",
      "Flatter with specifics, not generics. “Your Q2 turnaround was impressive” beats “you guys are great.”",
      "Sell exclusivity: “we don't take every client.” Ego buyers pay for what not everyone gets.",
    ],
    C: [
      "Your polish reads as slick to them. Drop the performance and get real.",
      "Consistency beats charisma here — show up the same way every single time.",
      "Make room for their team's voices. A Caring buyer buys for the group, not the spotlight.",
    ],
    A: [
      "Charisma reads as spin. Replace adjectives with numbers and put everything in writing.",
      "Underclaim and over-document. Let the receipts brag for you.",
      "Give them silence to process. Do not fill it — that's the hardest part for you.",
    ],
  },
  C: {
    D: [
      "They will steamroll you if you let them. Walk in with a point of view and state it.",
      "Shorten your answers. Bottom line first, context only if asked.",
      "Ask for the business directly. They respect the ask — hesitation reads as weakness.",
    ],
    E: [
      "They don't just want care — they want admiration. Compliment their wins with specifics.",
      "Position them as the visionary who found the solution, not someone who needed help.",
      "Put their name on the win in every recap and every internal email.",
    ],
    C: [
      "Highest trust, slowest deal. Both of you avoid pushing — someone has to.",
      "Create gentle deadlines tied to THEIR goals (“live before your Q3 kickoff”).",
      "Name the decision out loud. Comfortable silence is where these deals go to die.",
    ],
    A: [
      "Strong pairing — you're both deliberate and neither of you oversells.",
      "Your risk is under-asserting value. Pair your patience with hard proof.",
      "Document everything. They'll notice, and it compounds trust.",
    ],
  },
  A: {
    D: [
      "They decide on outcomes, not process. Lead with the conclusion.",
      "Keep the backup analysis in your pocket — bring it out only if challenged.",
      "Give ONE recommendation, not an options analysis. And move faster than feels safe.",
    ],
    E: [
      "They don't buy spreadsheets — they buy status. Translate your data into what it makes them look like.",
      "Lead with the marquee outcome or logo; keep the detail as backup.",
      "Praise their sharp questions. An Ego buyer who feels smart in your meeting buys from you.",
    ],
    C: [
      "Translate your specs into safety: “here's why nothing breaks.”",
      "Introduce them to support and success people early — humans, not documentation.",
      "Be the guide, not the professor.",
    ],
    A: [
      "This becomes a credibility contest. Be rigorous but decisive.",
      "Two analysts equals analysis paralysis — agree on evaluation criteria upfront.",
      "Whoever frames the criteria wins the deal. Make sure it's you.",
    ],
  },
};

const TYPE_ORDER: TypeKey[] = ["D", "E", "C", "A"];

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const h = (size: number): React.CSSProperties => ({
  fontFamily: "'Syne', sans-serif",
  fontWeight: 700,
  fontSize: size,
  lineHeight: 1.15,
  margin: 0,
  color: INK,
});
const eyebrow: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: MUTED,
  marginBottom: 14,
};
const goldBtn: React.CSSProperties = {
  background: GOLD,
  color: "#141311",
  border: "none",
  padding: "14px 28px",
  fontSize: 16,
  fontFamily: "'DM Sans', sans-serif",
  cursor: "pointer",
  borderRadius: 8,
  fontWeight: 700,
};
const sectionLabel: React.CSSProperties = { ...eyebrow, marginTop: 34, marginBottom: 10, color: GOLD };

export default function Assessment() {
  usePageMeta(
    "The DECA Sales Personality Assessment — Eric Gravely",
    "A 3-minute assessment that reveals your sales personality type — Dominant, Ego, Caring, or Analytical — how it shows up when you sell, and how to sell to buyers who aren't wired like you.",
  );

  const [stage, setStage] = useState<"intro" | "quiz" | "results">("intro");
  const [idx, setIdx] = useState(0);
  const [scores, setScores] = useState<Record<TypeKey, number>>({ D: 0, E: 0, C: 0, A: 0 });
  const [order, setOrder] = useState<AnswerOpt[][]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [openCell, setOpenCell] = useState<TypeKey | null>(null);
  const [phone, setPhone] = useState("");
  const [optIn, setOptIn] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading">("idle");
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const start = () => {
    setScores({ D: 0, E: 0, C: 0, A: 0 });
    setIdx(0);
    setOrder(QUESTIONS.map((q) => shuffle(q.a)));
    setSubmitted(false);
    setShowForm(false);
    setSubmitStatus("idle");
    setFormError("");
    setStage("quiz");
    window.scrollTo({ top: 0 });
  };

  const answer = (t: TypeKey) => {
    setScores((prev) => ({ ...prev, [t]: prev[t] + 1 }));
    if (idx + 1 < QUESTIONS.length) setIdx(idx + 1);
    else { setStage("results"); window.scrollTo({ top: 0 }); }
  };

  const ranked = TYPE_ORDER.map((t) => ({ t, s: scores[t] })).sort((a, b) => b.s - a.s);
  const primary = ranked[0]?.t ?? "D";
  const secondary = ranked[1]?.t ?? "E";
  const p = PROFILES[primary];
  const shortName = p.name.replace(/^The\s+/, ""); // "The Dominant" -> "Dominant"

  const submitEmail = async () => {
    if (!name.trim()) { setFormError("Please enter your first name."); return; }
    if (!email.includes("@")) { setFormError("Please enter a valid email address."); return; }
    setSubmitStatus("loading");
    setFormError("");
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          decaType: primary,
          scores,
          optIn,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setFormError(data.message || "Something went wrong. Please try again.");
        setSubmitStatus("idle");
        return;
      }
      setSubmitted(true);
    } catch {
      setFormError("Network error — please try again.");
      setSubmitStatus("idle");
    }
  };

  const card: React.CSSProperties = { width: "100%", maxWidth: 640, margin: "0 auto" };

  return (
    <div style={{ backgroundColor: IVORY, minHeight: "100vh" }}>
      <SiteNav />
      <style>{`
        .deca-opt:hover { border-color: ${GOLD} !important; background: var(--c-bg3) !important; }
        .deca-cell:hover { border-color: ${GOLD} !important; }
      `}</style>

      <main className="pt-24 pb-8" style={{ display: "flex", justifyContent: "center", padding: "96px 20px 40px" }}>
        <div style={card}>
          {/* ---------- INTRO ---------- */}
          {stage === "intro" && (
            <div>
              <div style={eyebrow}>The DECA Personality Assessment · 3 minutes</div>
              <h1 style={h(40)}>
                What's your{" "}
                <span style={{ borderBottom: `4px solid ${GOLD}` }}>Personality Type</span>?
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.6, margin: "20px 0 8px", color: INK }}>
                20 questions about how you actually operate — no right answers. Uncover your{" "}
                <strong>Personal Sales Avatar</strong>: who you are, how it shows up when you sell,
                and why certain buyers never seem to close for you.
              </p>
              <p style={{ fontSize: 14, color: MUTED, margin: "0 0 28px" }}>
                Then get the part nobody teaches: how YOUR avatar sells to the three types of people
                who aren't wired like you.
              </p>
              <button style={goldBtn} onClick={start} data-testid="button-start-assessment">
                Start the assessment →
              </button>
            </div>
          )}

          {/* ---------- QUIZ ---------- */}
          {stage === "quiz" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={eyebrow}>
                  Question {idx + 1} of {QUESTIONS.length}
                </span>
              </div>
              <div style={{ height: 4, background: RAISED, borderRadius: 2, marginBottom: 28 }}>
                <div
                  style={{
                    height: 4,
                    width: `${(idx / QUESTIONS.length) * 100}%`,
                    background: GOLD,
                    borderRadius: 2,
                    transition: "width .3s",
                  }}
                />
              </div>
              <h2 style={h(26)} data-testid="text-question">{QUESTIONS[idx].q}</h2>
              <div style={{ marginTop: 22, display: "grid", gap: 10 }}>
                {(order[idx] || QUESTIONS[idx].a).map((opt, i) => (
                  <button
                    key={i}
                    className="deca-opt"
                    onClick={() => answer(opt.t)}
                    data-testid={`option-${i}`}
                    style={{
                      textAlign: "left",
                      background: RAISED,
                      border: "1px solid transparent",
                      padding: "16px 18px",
                      fontSize: 15.5,
                      lineHeight: 1.45,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: "pointer",
                      borderRadius: 8,
                      color: INK,
                      transition: "all .15s",
                    }}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---------- RESULTS ---------- */}
          {stage === "results" && (
            <div>
              {/* 1. PERSONALITY TYPE + WHAT IT MEANS */}
              <div style={eyebrow}>Your Personal Sales Avatar</div>
              <h1 style={h(38)} data-testid="text-result-type">
                You're <span style={{ borderBottom: `4px solid ${GOLD}` }}>{p.name}</span>
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.5, margin: "16px 0 6px", fontWeight: 500, color: INK }}>
                {p.tagline}
              </p>
              <p style={{ fontSize: 14, color: MUTED2, margin: "0 0 18px" }}>
                Secondary type: {PROFILES[secondary].name.replace("The ", "")}
              </p>

              <div style={{ display: "flex", gap: 8, margin: "0 0 22px", flexWrap: "wrap" }}>
                {ranked.map(({ t, s }) => (
                  <div
                    key={t}
                    style={{
                      background: t === primary ? INK : RAISED,
                      color: t === primary ? IVORY : INK,
                      padding: "8px 14px",
                      borderRadius: 6,
                      fontSize: 13.5,
                    }}
                  >
                    {PROFILES[t].name.replace("The ", "")}: <strong>{s}</strong>/{QUESTIONS.length}
                  </div>
                ))}
              </div>

              <div style={sectionLabel}>What this means</div>
              <p style={{ fontSize: 15, lineHeight: 1.65, margin: "0 0 6px", color: INK }}>{p.summary}</p>

              {/* 2. HOW IT RELATES TO SALES */}
              <div style={sectionLabel}>How this shows up when you sell</div>
              <p style={{ fontSize: 15, lineHeight: 1.65, margin: "0 0 18px", color: INK }}>{p.salesStyle}</p>
              <div style={{ background: RAISED, padding: "16px 18px", borderRadius: 8 }}>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: INK }}>
                  <strong>Your blind spot:</strong> {p.blindspot}
                </p>
              </div>

              {/* 3. HOW TO SELL TO THE OTHER TYPES */}
              <div style={sectionLabel}>How to sell to every type — as {p.name.toLowerCase()}</div>
              <p style={{ fontSize: 14, color: MUTED, margin: "0 0 16px" }}>
                Tap a buyer type. This is where deals are won or lost — selling to people who aren't
                wired like you.
              </p>
              <div style={{ display: "grid", gap: 10, marginBottom: 34 }}>
                {TYPE_ORDER.map((buyer) => (
                  <div
                    key={buyer}
                    className="deca-cell"
                    style={{
                      border: `1px solid ${openCell === buyer ? GOLD : CARD_BORDER}`,
                      borderRadius: 8,
                      background: CARD,
                      transition: "border-color .15s",
                    }}
                  >
                    <button
                      onClick={() => setOpenCell(openCell === buyer ? null : buyer)}
                      data-testid={`sell-to-${buyer}`}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        padding: "14px 18px",
                        fontSize: 15.5,
                        fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        color: INK,
                      }}
                    >
                      <span>
                        Selling to {PROFILES[buyer].name.toLowerCase()} buyers
                        {buyer === primary ? " (your mirror)" : ""}
                      </span>
                      <span style={{ color: GOLD }}>{openCell === buyer ? "−" : "+"}</span>
                    </button>
                    {openCell === buyer && (
                      <ul style={{ margin: "0 0 14px", padding: "0 18px 0 36px" }}>
                        {SELL_TO[primary][buyer].map((line, i) => (
                          <li key={i} style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 8, color: INK }}>
                            {line}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* EMAIL RESULTS — capture (name, email, phone, opt-in) then deliver the PDF */}
              {submitted ? (
                <div
                  style={{ border: `1px solid ${GOLD}`, background: CARD, padding: "20px 22px", borderRadius: 10, marginBottom: 20 }}
                  data-testid="text-assessment-success"
                >
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: INK }}>
                    <strong>Sent — check your inbox.</strong> Your {shortName} playbook is on its way as a
                    PDF{optIn ? ", and you're on the list for more" : ""}. (Check spam if you don't see it in a couple minutes.)
                  </p>
                </div>
              ) : !showForm ? (
                <div
                  style={{
                    border: `1px solid ${CARD_BORDER}`,
                    background: CARD,
                    padding: "24px 22px",
                    borderRadius: 10,
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  <h3 style={h(20)}>Want this as a PDF?</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED, margin: "10px 0 16px" }}>
                    Get your full {shortName} playbook emailed to you — keep it, print it, share it with your team.
                  </p>
                  <button
                    style={goldBtn}
                    onClick={() => setShowForm(true)}
                    data-testid="button-email-results"
                  >
                    Email Results →
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    border: `1px solid ${CARD_BORDER}`,
                    background: CARD,
                    padding: "24px 22px",
                    borderRadius: 10,
                    marginBottom: 20,
                  }}
                >
                  <h3 style={h(20)}>Where should I send it?</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.6, color: MUTED, margin: "10px 0 16px" }}>
                    Your {shortName} playbook, delivered as a PDF.
                  </p>
                  <div style={{ display: "grid", gap: 12, maxWidth: 440 }}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="First name"
                      className="input-dark"
                      data-testid="input-assessment-name"
                      style={{ padding: "14px 16px", fontSize: 15, borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      type="email"
                      className="input-dark"
                      data-testid="input-assessment-email"
                      style={{ padding: "14px 16px", fontSize: 15, borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      type="tel"
                      className="input-dark"
                      data-testid="input-assessment-phone"
                      style={{ padding: "14px 16px", fontSize: 15, borderRadius: 8, fontFamily: "'DM Sans', sans-serif" }}
                    />
                    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, lineHeight: 1.5, color: MUTED, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={optIn}
                        onChange={(e) => setOptIn(e.target.checked)}
                        style={{ marginTop: 3, accentColor: GOLD as string }}
                        data-testid="checkbox-assessment-optin"
                      />
                      <span>Add me to Eric's list for sales tips, coaching, and event invites. By opting in you agree to receive emails from Eric Gravely — unsubscribe anytime.</span>
                    </label>
                    {formError && (
                      <p style={{ fontSize: 13, color: "#B4552D", margin: 0 }} data-testid="text-assessment-error">
                        {formError}
                      </p>
                    )}
                    <button
                      style={{ ...goldBtn, opacity: submitStatus === "loading" ? 0.6 : 1 }}
                      onClick={submitEmail}
                      disabled={submitStatus === "loading"}
                      data-testid="button-assessment-submit"
                    >
                      {submitStatus === "loading" ? "Sending…" : "Email me my results →"}
                    </button>
                  </div>
                </div>
              )}

              {/* Manager bridge CTA */}
              <div style={{ background: INK, color: IVORY, padding: "26px 24px", borderRadius: 10 }}>
                <h3 style={{ ...h(20), color: IVORY }}>Lead a sales team?</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.6, margin: "10px 0 16px", color: IVORY, opacity: 0.8 }}>
                  Run your whole team through the DECA assessment and you'll see exactly why your
                  Dominants blow up deals with careful buyers — and why your Caring reps never ask
                  for the close. That conversation is where coaching starts.
                </p>
                <button
                  style={{ ...goldBtn, fontSize: 14.5 }}
                  onClick={() => window.open(site.coaching.calendlyUrl, "_blank", "noopener,noreferrer")}
                  data-testid="button-team-debrief"
                >
                  Book a team debrief with Eric →
                </button>
              </div>

              <div style={{ marginTop: 26 }}>
                <button
                  onClick={start}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: MUTED,
                    fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: "pointer",
                    padding: 0,
                  }}
                  data-testid="button-retake"
                >
                  ↺ Retake the assessment
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
