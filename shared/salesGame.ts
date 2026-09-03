// ─────────────────────────────────────────────────────────────────────────────
// READ THE ROOM — shared game engine
//
// This file is imported by BOTH the browser (to run the game) and the server
// (to replay a submitted run and recompute its score). Everything here must be
// deterministic: the deck is generated from a seed, and the score is a pure
// function of (seed, events). That is what lets the leaderboard reject a
// hand-crafted "score: 999999" POST — the server never trusts a claimed score,
// it re-derives it.
// ─────────────────────────────────────────────────────────────────────────────

export type Move = "ask" | "tell" | "close";
export type PlayerMove = Move | "none"; // "none" = the clock ran out on that line

export type Stage =
  | "First call"
  | "Discovery"
  | "Demo"
  | "Pricing"
  | "Negotiation"
  | "Final meeting";

export interface BuyerLine {
  id: string;
  text: string;
  stage: Stage;
  move: Move;
  /** 1 = obvious, 2 = requires a read, 3 = the stage chip changes the answer */
  tier: 1 | 2 | 3;
  /** Decision points end a deal: a real buying signal (close) or a decoy (ask). */
  decision?: boolean;
  why: string;
}

// ── Rules ────────────────────────────────────────────────────────────────────
export const RULES = {
  startMs: 60_000,
  maxMs: 90_000,
  correctBonusMs: 2_000,
  wrongPenaltyMs: 5_000,
  maxLines: 120,
  /** Streak multiplier: 1.0 → 3.0 at a 10-streak */
  streakStep: 0.2,
  streakCap: 10,
  lineBase: 50,
  lineSpeedBonus: 50,
  commissionRate: 0.1,
} as const;

export const MOVE_LABEL: Record<Move, string> = { ask: "Ask", tell: "Tell", close: "Close" };
export const MOVE_HINT: Record<Move, string> = {
  ask: "Probe. Get curious before you respond.",
  tell: "Answer or present. They asked — deliver.",
  close: "Ask for the commitment or lock the next step.",
};

// ── Content ──────────────────────────────────────────────────────────────────
// One defensible right move per line, with a one-sentence coaching "why".
export const LINES: BuyerLine[] = [
  // Tier 1 — clear reads
  { id: "t1-01", tier: 1, stage: "Discovery", move: "ask", text: "Honestly, we've just been managing it in spreadsheets.", why: "A vague status update is an invitation to dig. Find the pain before you pitch." },
  { id: "t1-02", tier: 1, stage: "Pricing", move: "tell", text: "How much does this actually cost per seat?", why: "A direct question deserves a direct answer. Dodging price kills trust." },
  { id: "t1-03", tier: 1, stage: "Final meeting", move: "close", text: "Okay, this makes sense. What do we need to do to get started?", why: "That is a buying signal in plain English. Ask for the commitment." },
  { id: "t1-04", tier: 1, stage: "Discovery", move: "ask", text: "Our reps hate the current tool.", why: "'Hate' is an emotion, not a requirement. Ask what specifically breaks." },
  { id: "t1-05", tier: 1, stage: "Demo", move: "tell", text: "Does it integrate with Salesforce?", why: "Answer the yes/no cleanly. Then you've earned the right to ask more." },
  { id: "t1-06", tier: 1, stage: "First call", move: "ask", text: "I'm not sure this is a priority right now.", why: "Don't argue priority. Ask what's competing for their attention." },
  { id: "t1-07", tier: 1, stage: "Discovery", move: "ask", text: "We've had two demos from other vendors already this month.", why: "Find out what those demos missed. Their gaps are your angle." },
  { id: "t1-08", tier: 1, stage: "Demo", move: "tell", text: "Can you walk me through how onboarding works?", why: "They asked to be taught. Teach — briefly." },
  { id: "t1-09", tier: 1, stage: "Final meeting", move: "close", text: "Send me the contract and I'll get it signed this week.", why: "Lock the next step: who signs, what day, and what happens right after." },
  { id: "t1-10", tier: 1, stage: "First call", move: "ask", text: "My boss asked me to look into options.", why: "'Options' means a process exists. Ask who owns the decision and why now." },
  { id: "t1-11", tier: 1, stage: "Pricing", move: "ask", text: "Your competitor quoted us 20% less.", why: "Don't defend price yet. Ask what their quote actually includes." },
  { id: "t1-12", tier: 1, stage: "Demo", move: "tell", text: "What kind of results have teams our size seen?", why: "Proof was requested. Give one specific, relevant example." },
  { id: "t1-13", tier: 1, stage: "Final meeting", move: "close", text: "Alright, I'm sold. Let's do the annual plan.", why: "Stop selling. Confirm the plan and set the start date." },
  { id: "t1-14", tier: 1, stage: "First call", move: "ask", text: "We're pretty happy with what we have.", why: "Satisfied is not the same as optimized. Ask what 'happy' costs them." },
  { id: "t1-15", tier: 1, stage: "Discovery", move: "ask", text: "It takes forever to get reports out of the system.", why: "'Forever' isn't a number. Ask how long, how often, and who waits on it." },
  { id: "t1-16", tier: 1, stage: "Demo", move: "tell", text: "Is the mobile app included or is that extra?", why: "Scope question. Answer it plainly — ambiguity here reads as a hidden fee." },
  { id: "t1-17", tier: 1, stage: "Demo", move: "tell", text: "Can multiple people be logged in at the same time?", why: "Simple capability question. Yes or no, then one sentence on how." },
  { id: "t1-18", tier: 1, stage: "Pricing", move: "tell", text: "Is there a setup fee?", why: "Money questions get straight answers. Hedging here is exactly what 'hidden fees' feel like." },
  { id: "t1-19", tier: 1, stage: "Final meeting", move: "close", text: "My team already likes it more than the current tool.", why: "Internal buy-in is done. Ask for the decision before the momentum cools." },

  // Tier 2 — takes a read
  { id: "t2-01", tier: 2, stage: "Final meeting", move: "ask", text: "I need to think about it.", why: "Isolate the real hesitation: 'What specifically would you be thinking through?'" },
  { id: "t2-02", tier: 2, stage: "Negotiation", move: "tell", text: "Is there a discount if we sign for two years?", why: "They're negotiating terms — that's late-stage. Answer, then trade value for commitment." },
  { id: "t2-03", tier: 2, stage: "Final meeting", move: "close", text: "If we did this, how fast could we be live before Q3?", why: "They're planning around go-live. Propose the start date and ask for the yes." },
  { id: "t2-04", tier: 2, stage: "Discovery", move: "ask", text: "We tried something like this two years ago and it flopped.", why: "Understand the scar before you promise it won't happen again." },
  { id: "t2-05", tier: 2, stage: "First call", move: "ask", text: "Can you just send me some information?", why: "Agree, then ask what question the info should answer. Otherwise it dies in an inbox." },
  { id: "t2-06", tier: 2, stage: "Final meeting", move: "close", text: "Who would be our point of contact after we sign?", why: "Post-sale questions mean they're picturing life after the purchase. Close." },
  { id: "t2-07", tier: 2, stage: "Negotiation", move: "tell", text: "What happens to our data if we cancel?", why: "Risk questions need clear, calm answers. Uncertainty stalls deals." },
  { id: "t2-08", tier: 2, stage: "Pricing", move: "ask", text: "This is more than we budgeted.", why: "Find the size of the gap and the flexibility before you touch price." },
  { id: "t2-09", tier: 2, stage: "First call", move: "ask", text: "How is this different from what we're using?", why: "You can't differentiate against a tool you haven't asked about. Learn their setup first." },
  { id: "t2-10", tier: 2, stage: "Discovery", move: "ask", text: "The team is stretched thin. Adding another tool feels heavy.", why: "Quantify 'stretched thin'. Adoption fear is real — learn its shape." },
  { id: "t2-11", tier: 2, stage: "Negotiation", move: "close", text: "Can you have someone talk to our IT lead about security?", why: "They're assigning internal resources. Book the call and set the decision date." },
  { id: "t2-12", tier: 2, stage: "Demo", move: "tell", text: "What's your uptime SLA?", why: "Technical due diligence. A specific number, no fluff." },
  { id: "t2-13", tier: 2, stage: "Discovery", move: "ask", text: "We're evaluating three vendors right now.", why: "Ask the criteria and the timeline. Then you know what game you're playing." },
  { id: "t2-14", tier: 2, stage: "Pricing", move: "ask", text: "I like it, but I'm not the one who signs.", why: "Map the decision: who signs, what they care about, how you get in the room." },
  { id: "t2-15", tier: 2, stage: "Demo", move: "ask", text: "Hm. That's not really how our process works.", why: "A mismatch is a discovery gap. Ask how their process actually runs." },
  { id: "t2-16", tier: 2, stage: "Negotiation", move: "tell", text: "Why is your price higher than last year's quote?", why: "Own it directly. Vague answers on price read as guilt." },
  { id: "t2-17", tier: 2, stage: "Negotiation", move: "tell", text: "What does support look like after we go live?", why: "Late-stage risk question. Describe the exact support path: who, hours, response times." },
  { id: "t2-18", tier: 2, stage: "Negotiation", move: "close", text: "We'd need it running by the 1st. Is that realistic?", why: "A deadline is a buying signal with a calendar. Confirm you can hit it and ask for the go-ahead." },

  // Tier 3 — the stage chip changes the answer
  { id: "t3-01a", tier: 3, stage: "First call", move: "ask", text: "Just tell me why I should pick you.", why: "A pitch with zero discovery is a guess. One question first: 'What would make this an easy yes?'" },
  { id: "t3-01b", tier: 3, stage: "Final meeting", move: "tell", text: "Just tell me why I should pick you.", why: "You've earned this moment. Deliver the 30-second case tied to what they told you." },
  { id: "t3-02a", tier: 3, stage: "Pricing", move: "ask", text: "Send me a proposal.", why: "Ask what has to be in it and who reads it. A blind proposal is a brochure." },
  { id: "t3-02b", tier: 3, stage: "Final meeting", move: "close", text: "Send me the proposal.", why: "Late-stage 'send it' is a yes waiting for paper. Confirm terms and the signature date." },
  { id: "t3-03", tier: 3, stage: "Demo", move: "tell", text: "Can you show me the reporting piece again?", why: "A repeat request is interest, not confusion. Show it, then check what it's for." },
  { id: "t3-04", tier: 3, stage: "Negotiation", move: "close", text: "If you can match their price, we'll sign today.", why: "Don't reopen discovery. Trade: 'If I can get there, are we signing today?' Then ask." },
  { id: "t3-05", tier: 3, stage: "First call", move: "ask", text: "We're good, thanks.", why: "A brush-off isn't a no. One respectful question earns the second sentence." },
  { id: "t3-06a", tier: 3, stage: "Discovery", move: "ask", text: "Can we start with a pilot?", why: "Before you say yes, learn what a successful pilot proves — and who judges it." },
  { id: "t3-06b", tier: 3, stage: "Final meeting", move: "close", text: "Can we start with a pilot?", why: "Late-stage pilot talk is a scoped yes. Define the pilot and lock the start date." },
  { id: "t3-07", tier: 3, stage: "Negotiation", move: "close", text: "Legal has a few redlines.", why: "Redlines mean they're buying. Set the signature date and keep the process moving." },
  { id: "t3-08", tier: 3, stage: "Demo", move: "tell", text: "How would this handle our multi-region setup?", why: "Specific technical questions mean they're mapping you onto their world. Answer precisely." },
  { id: "t3-09", tier: 3, stage: "First call", move: "ask", text: "I only have five minutes.", why: "Respect it and use it: one sharp question beats a compressed pitch." },
  { id: "t3-10", tier: 3, stage: "Final meeting", move: "ask", text: "I'm still a little nervous about the switch.", why: "Late nerves are specific. Name the fear before you reassure it." },
  { id: "t3-11a", tier: 3, stage: "Discovery", move: "ask", text: "What does implementation look like?", why: "Early on, this is fear wearing a question. Ask what's worried them about rollouts before." },
  { id: "t3-11b", tier: 3, stage: "Final meeting", move: "tell", text: "What does implementation look like?", why: "Late-stage, they're planning. Give the concrete timeline and who does what." },

  // Decision points — real buying signals (close)
  { id: "d-01", tier: 1, decision: true, stage: "Final meeting", move: "close", text: "Okay — where do I sign?", why: "Nothing to add. Hand them the pen." },
  { id: "d-02", tier: 1, decision: true, stage: "Final meeting", move: "close", text: "Let's do it. Can we start next month?", why: "Confirm the date and the first milestone. Then stop talking." },
  { id: "d-03", tier: 1, decision: true, stage: "Negotiation", move: "close", text: "I've got budget approval. What are the next steps?", why: "Budget is cleared. Lay out the steps and ask for the signature." },
  { id: "d-04", tier: 1, decision: true, stage: "Final meeting", move: "close", text: "Alright, you've convinced me.", why: "Convinced is not signed. Ask for the commitment right now." },
  { id: "d-05", tier: 2, decision: true, stage: "Negotiation", move: "close", text: "Our CFO is fine with it if you are.", why: "The last approver just said yes through the buyer. Close." },
  { id: "d-06", tier: 2, decision: true, stage: "Final meeting", move: "close", text: "Can you send over the agreement today?", why: "Send it — and set the time you'll walk through it together." },
  { id: "d-07", tier: 2, decision: true, stage: "Final meeting", move: "close", text: "What's the fastest way to get the team onboarded?", why: "They're already implementing in their head. Propose the kickoff and ask." },
  { id: "d-08", tier: 2, decision: true, stage: "Negotiation", move: "close", text: "We'd want to kick off before the new fiscal year.", why: "They gave you the deadline. Back into the signature date and ask for it." },
  { id: "d-09", tier: 2, decision: true, stage: "Final meeting", move: "close", text: "The team is on board. What are the payment options?", why: "Payment questions are the last mile. Present the options and ask which one." },

  // Decision points — decoys that look like buying signals (ask)
  { id: "x-01", tier: 2, decision: true, stage: "Final meeting", move: "ask", text: "Sounds great. Let me run it by the team and circle back.", why: "'Circle back' is where deals die. Ask who, when, and what would make it a yes." },
  { id: "x-02", tier: 2, decision: true, stage: "Pricing", move: "ask", text: "Yeah, this could work... eventually.", why: "'Eventually' is a timing objection wearing a smile. Ask what has to happen first." },
  { id: "x-03", tier: 2, decision: true, stage: "Final meeting", move: "ask", text: "Send me everything you've got and I'll review it over the weekend.", why: "Ask which question the material must answer. Otherwise it's homework they won't do." },
  { id: "x-04", tier: 3, decision: true, stage: "Negotiation", move: "ask", text: "I love it. Price is the only thing.", why: "Isolate it: 'If price weren't a factor, would you move forward?' Then handle it." },
  { id: "x-05", tier: 3, decision: true, stage: "Negotiation", move: "ask", text: "We're leaning your way, but the other vendor is throwing in training.", why: "Find out what training is worth to them before you match or counter." },
  { id: "x-06", tier: 3, decision: true, stage: "Final meeting", move: "ask", text: "This is probably a next-quarter thing for us.", why: "Ask what changes next quarter. If nothing does, the delay is a soft no." },
  { id: "x-07", tier: 3, decision: true, stage: "Final meeting", move: "ask", text: "Great stuff. I'll be in touch.", why: "Warm words, zero commitment. Ask for the specific next step before you hang up." },
];

export const LINE_BY_ID: Record<string, BuyerLine> = Object.fromEntries(LINES.map((l) => [l.id, l]));

// ── Deterministic RNG (mulberry32) ───────────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Draws without replacement; reshuffles when a pool runs dry. */
class Pool {
  private order: string[] = [];
  private pos = 0;
  constructor(private ids: string[], private rnd: () => number) {}
  next(avoid: Set<string>): string {
    for (let attempts = 0; attempts < 3; attempts++) {
      if (this.pos >= this.order.length) {
        this.order = shuffle(this.ids, this.rnd);
        this.pos = 0;
      }
      const id = this.order[this.pos++];
      if (!avoid.has(id)) return id;
    }
    return this.order[this.pos - 1];
  }
}

// ── Deck generation ──────────────────────────────────────────────────────────
export interface DeckCard {
  lineId: string;
  dealIndex: number;
  /** Position within the deal, 0-based; the last card of a deal is the decision point */
  lineInDeal: number;
  linesInDeal: number;
  dealValue: number;
  windowMs: number;
  company: string;
}

const COMPANIES = [
  "Apex Logistics", "Brightside Dental", "Meridian Health", "Northwind Freight", "Crescent Foods",
  "Stonebridge Mfg.", "Harbor & Vale", "Lumen Robotics", "Oakline Realty", "Pinnacle Staffing",
  "Redwood Fitness", "Summit Legal", "Tidewater Marine", "Vantage Media", "Willow Creek Farms",
  "Ironclad Security", "Bluefin Analytics", "Copperhead Tools", "Granite Peak Outfitters", "Silverline Travel",
];

export function linesForDeal(dealIndex: number): number {
  return dealIndex < 2 ? 3 : dealIndex < 4 ? 4 : 5;
}
export function windowForDeal(dealIndex: number): number {
  return dealIndex < 2 ? 6000 : dealIndex < 4 ? 5000 : dealIndex < 6 ? 4200 : 3600;
}

export function buildDeck(seed: number): DeckCard[] {
  const rnd = mulberry32(seed);
  const byTier = (t: number) => LINES.filter((l) => !l.decision && l.tier === t).map((l) => l.id);
  const pools = {
    t1: new Pool(byTier(1), rnd),
    t2: new Pool(byTier(2), rnd),
    t3: new Pool(byTier(3), rnd),
    signal: new Pool(LINES.filter((l) => l.decision && l.move === "close").map((l) => l.id), rnd),
    decoy: new Pool(LINES.filter((l) => l.decision && l.move !== "close").map((l) => l.id), rnd),
  };
  const companies = shuffle(COMPANIES, rnd);
  const deck: DeckCard[] = [];
  const recent = new Set<string>();

  for (let d = 0; deck.length < RULES.maxLines; d++) {
    const n = linesForDeal(d);
    const windowMs = windowForDeal(d);
    const dealValue = 6000 + d * 3000 + [0, 500, 1000, 1500][Math.floor(rnd() * 4)];
    const company = companies[d % companies.length];

    for (let i = 0; i < n && deck.length < RULES.maxLines; i++) {
      const isDecision = i === n - 1;
      let lineId: string;
      if (isDecision) {
        const decoyChance = d < 2 ? 0 : d < 4 ? 0.35 : 0.5;
        lineId = (rnd() < decoyChance ? pools.decoy : pools.signal).next(recent);
      } else {
        const r = rnd();
        const pool =
          d < 2 ? pools.t1
          : d < 4 ? (r < 0.5 ? pools.t1 : pools.t2)
          : d < 6 ? (r < 0.45 ? pools.t2 : pools.t3)
          : r < 0.2 ? pools.t1 : r < 0.5 ? pools.t2 : pools.t3;
        lineId = pool.next(recent);
      }
      recent.add(lineId);
      if (recent.size > 12) recent.delete(recent.values().next().value as string);
      deck.push({ lineId, dealIndex: d, lineInDeal: i, linesInDeal: n, dealValue, windowMs, company });
    }
  }
  return deck;
}

// ── Run state + reducer ──────────────────────────────────────────────────────
export interface RunEvent {
  move: PlayerMove;
  /** Reaction time in ms, clamped to [0, windowMs] */
  ms: number;
}

export interface LastResult {
  lineId: string;
  move: PlayerMove;
  expected: Move;
  correct: boolean;
  earned: number;
  timeDeltaMs: number;
  dealBanked: number | null; // commission banked when a deal closes
  dealLost: boolean;
  multiplier: number;
}

export interface RunState {
  seed: number;
  deck: DeckCard[];
  index: number;
  timeLeftMs: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  answered: number;
  dealsClosed: number;
  dealsLost: number;
  /** wrongPicks[expected][chosen] — powers the "instinct profile" on the results screen */
  wrongPicks: Record<Move, Record<PlayerMove, number>>;
  ended: boolean;
  endReason: "time" | "cap" | null;
  last: LastResult | null;
}

export function createRun(seed: number): RunState {
  const zero = (): Record<PlayerMove, number> => ({ ask: 0, tell: 0, close: 0, none: 0 });
  return {
    seed,
    deck: buildDeck(seed),
    index: 0,
    timeLeftMs: RULES.startMs,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    answered: 0,
    dealsClosed: 0,
    dealsLost: 0,
    wrongPicks: { ask: zero(), tell: zero(), close: zero() },
    ended: false,
    endReason: null,
    last: null,
  };
}

export function currentCard(state: RunState): DeckCard | null {
  return state.ended ? null : state.deck[state.index] ?? null;
}

export function multiplierFor(streak: number): number {
  return 1 + RULES.streakStep * Math.min(streak, RULES.streakCap);
}

/** Pure transition. Never mutates `state`. */
export function applyEvent(state: RunState, event: RunEvent): RunState {
  if (state.ended) return state;
  const card = state.deck[state.index];
  if (!card) return { ...state, ended: true, endReason: "cap" };
  const line = LINE_BY_ID[card.lineId];
  const ms = Math.max(0, Math.min(card.windowMs, Math.round(event.ms)));
  const correct = event.move === line.move;
  const mult = multiplierFor(state.streak);

  let earned = 0;
  let dealBanked: number | null = null;
  let dealLost = false;
  let timeDeltaMs: number;

  if (correct) {
    const speed = 1 - ms / card.windowMs;
    earned = Math.round((RULES.lineBase + RULES.lineSpeedBonus * speed) * mult);
    if (line.decision) {
      dealBanked = Math.round(card.dealValue * RULES.commissionRate * mult);
      earned += dealBanked;
    }
    timeDeltaMs = RULES.correctBonusMs;
  } else {
    if (line.decision) dealLost = true;
    timeDeltaMs = -RULES.wrongPenaltyMs;
  }

  const wrongPicks = correct
    ? state.wrongPicks
    : {
        ...state.wrongPicks,
        [line.move]: { ...state.wrongPicks[line.move], [event.move]: state.wrongPicks[line.move][event.move] + 1 },
      };

  const timeLeftMs = Math.min(RULES.maxMs, state.timeLeftMs - ms + timeDeltaMs);
  const streak = correct ? state.streak + 1 : 0;
  const index = state.index + 1;
  const outOfTime = timeLeftMs <= 0;
  const outOfCards = index >= state.deck.length;

  return {
    ...state,
    index,
    timeLeftMs: Math.max(0, timeLeftMs),
    score: state.score + earned,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    correct: state.correct + (correct ? 1 : 0),
    answered: state.answered + 1,
    dealsClosed: state.dealsClosed + (dealBanked !== null ? 1 : 0),
    dealsLost: state.dealsLost + (dealLost ? 1 : 0),
    wrongPicks,
    ended: outOfTime || outOfCards,
    endReason: outOfTime ? "time" : outOfCards ? "cap" : null,
    last: { lineId: card.lineId, move: event.move, expected: line.move, correct, earned, timeDeltaMs, dealBanked, dealLost, multiplier: mult },
  };
}

// ── Server-side verification ─────────────────────────────────────────────────
export interface RunSummary {
  score: number;
  correct: number;
  answered: number;
  accuracy: number;
  bestStreak: number;
  dealsClosed: number;
  dealsLost: number;
  profile: InstinctProfile;
}

/**
 * Replays events from the seed. Returns null when the event list is not a
 * legal run (too many events, events after the run ended, impossible timing).
 */
export function replayRun(seed: number, events: RunEvent[]): RunSummary | null {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0x7fffffff) return null;
  if (events.length === 0 || events.length > RULES.maxLines) return null;
  let state = createRun(seed);
  for (const ev of events) {
    if (state.ended) return null; // events after the clock hit zero
    const card = state.deck[state.index];
    if (!card) return null;
    if (!Number.isFinite(ev.ms) || ev.ms < 0 || ev.ms > card.windowMs + 250) return null;
    if (!["ask", "tell", "close", "none"].includes(ev.move)) return null;
    // A timeout must have consumed (roughly) the whole window.
    if (ev.move === "none" && ev.ms < card.windowMs - 250) return null;
    state = applyEvent(state, ev);
  }
  // A submitted run must be finished — no cashing in a half-played, still-ticking run.
  if (!state.ended) return null;
  return summarize(state);
}

export function summarize(state: RunState): RunSummary {
  return {
    score: state.score,
    correct: state.correct,
    answered: state.answered,
    accuracy: state.answered ? Math.round((state.correct / state.answered) * 100) : 0,
    bestStreak: state.bestStreak,
    dealsClosed: state.dealsClosed,
    dealsLost: state.dealsLost,
    profile: instinctProfile(state),
  };
}

// ── Instinct profile (results-screen coaching) ───────────────────────────────
export interface InstinctProfile {
  id: "reader" | "presenter" | "sprinter" | "interviewer" | "hesitator";
  title: string;
  blurb: string;
}

export function instinctProfile(state: RunState): InstinctProfile {
  const w = state.wrongPicks;
  const pitchedEarly = w.ask.tell;                       // told when they should have asked
  const closedEarly = w.ask.close + w.tell.close;        // closed when the room wasn't ready
  const overAsked = w.tell.ask + w.close.ask;            // asked when they needed an answer or the ask
  const froze = w.ask.none + w.tell.none + w.close.none; // ran out the clock
  const wrong = state.answered - state.correct;
  const accuracy = state.answered ? state.correct / state.answered : 0;

  if (state.answered >= 6 && accuracy >= 0.9) {
    return { id: "reader", title: "The Room Reader", blurb: "You matched the move to the moment almost every time. That's the whole skill. Now do it faster." };
  }
  if (wrong === 0) {
    return { id: "reader", title: "The Room Reader", blurb: "Clean run. Play longer and see if the instinct holds when the windows shrink." };
  }
  const top = Math.max(pitchedEarly, closedEarly, overAsked, froze);
  if (top === froze) {
    return { id: "hesitator", title: "The Hesitator", blurb: "The clock beat you more than the buyer did. In a real call, silence after a question is fine — silence after a buying signal is not." };
  }
  if (top === pitchedEarly) {
    return { id: "presenter", title: "The Presenter", blurb: "You pitched when the buyer needed a question. Reps talk when they should be asking — it's the #1 leak I see on call reviews." };
  }
  if (top === closedEarly) {
    return { id: "sprinter", title: "The Sprinter", blurb: "You went for the close before the room was ready. Speed is great — but a premature close resets trust." };
  }
  return { id: "interviewer", title: "The Interviewer", blurb: "You kept asking when the buyer wanted an answer or a decision. Questions build trust; at some point you have to land the plane." };
}

// ── Formatting helpers shared by client and server responses ────────────────
export function formatMoney(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-US");
}

/** Absolute ceiling on any legal score, used as a cheap sanity check. */
export const SCORE_CEILING = (() => {
  // Perfect, instant answers on the most valuable possible deck of maxLines.
  const maxMult = multiplierFor(RULES.streakCap);
  const maxDeals = Math.ceil(RULES.maxLines / 3);
  const maxDealValue = 6000 + maxDeals * 3000 + 1500;
  return Math.ceil(
    RULES.maxLines * (RULES.lineBase + RULES.lineSpeedBonus) * maxMult +
      maxDeals * maxDealValue * RULES.commissionRate * maxMult,
  );
})();
