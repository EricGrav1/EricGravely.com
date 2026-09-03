import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Volume2, VolumeX, Share2, RotateCcw, Trophy, Zap, Keyboard } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { sfx } from "@/lib/sfx";
import {
  applyEvent, createRun, currentCard, formatMoney, multiplierFor, summarize,
  LINE_BY_ID, MOVE_HINT, MOVE_LABEL, RULES,
  type LastResult, type Move, type PlayerMove, type RunEvent, type RunState, type Stage,
} from "@shared/salesGame";
import { Leaderboard, type LeaderboardData } from "./Leaderboard";

type Phase = "intro" | "countdown" | "playing" | "over";

const BEST_KEY = "rtr-best";
const PLAYER_KEY = "rtr-player";
const MOVES: Move[] = ["ask", "tell", "close"];
const KEYS: Record<string, Move> = {
  a: "ask", t: "tell", c: "close",
  "1": "ask", "2": "tell", "3": "close",
  ArrowLeft: "ask", ArrowDown: "tell", ArrowRight: "close",
};

const STAGE_TONE: Record<Stage, "early" | "mid" | "late"> = {
  "First call": "early", Discovery: "early", Demo: "mid", Pricing: "mid", Negotiation: "late", "Final meeting": "late",
};

interface SavedPlayer { displayName: string; email: string }

interface SubmitResponse {
  success: boolean;
  score: number;
  bestScore: number;
  isNewBest: boolean;
  rank: number;
  top: LeaderboardData["top"];
  players: number;
}

function readJson<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
function writeJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}
function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] & 0x7fffffff;
}
function fmtClock(ms: number): string {
  const s = Math.max(0, ms) / 1000;
  return s >= 10 ? `${Math.floor(s)}s` : `${s.toFixed(1)}s`;
}

// ── Component ────────────────────────────────────────────────────────────────
export function ReadTheRoom() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [run, setRun] = useState<RunState | null>(null);
  const runRef = useRef<RunState | null>(null);
  const eventsRef = useRef<RunEvent[]>([]);
  const [count, setCount] = useState(3);
  const [cardStart, setCardStart] = useState(0);
  const [feedback, setFeedback] = useState<LastResult | null>(null);
  const feedbackRef = useRef<LastResult | null>(null);
  const [, setTick] = useState(0);
  const [soundOn, setSoundOn] = useState(sfx.isOn());
  const [localBest, setLocalBest] = useState<number>(() => Number(localStorage.getItem(BEST_KEY) || 0));
  const timers = useRef<number[]>([]);

  const setRunBoth = (r: RunState) => { runRef.current = r; setRun(r); };
  const setFeedbackBoth = (f: LastResult | null) => { feedbackRef.current = f; setFeedback(f); };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // ── Start / countdown ──
  const start = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = [];
    const r = createRun(randomSeed());
    eventsRef.current = [];
    setRunBoth(r);
    setFeedbackBoth(null);
    setPhase("countdown");
    setCount(3);
    sfx.start();
    [2, 1, 0].forEach((n, i) => later(() => {
      setCount(n);
      if (n === 0) {
        later(() => { setCardStart(performance.now()); setPhase("playing"); }, 500);
      }
    }, 650 * (i + 1)));
  }, []);

  // ── Answer ──
  const answer = useCallback((move: PlayerMove) => {
    const r = runRef.current;
    if (!r || r.ended || feedbackRef.current) return;
    const card = currentCard(r);
    if (!card) return;
    const elapsed = performance.now() - cardStart;
    const ms = move === "none" ? card.windowMs : Math.min(card.windowMs, Math.max(0, elapsed));
    const ev: RunEvent = { move, ms: Math.round(ms) };
    eventsRef.current.push(ev);
    const next = applyEvent(r, ev);
    setRunBoth(next);
    setFeedbackBoth(next.last);
    const res = next.last!;
    if (res.dealBanked) sfx.bank(); else if (res.correct) sfx.correct(); else sfx.wrong();
    const hold = !res.correct ? 1900 : res.dealBanked ? 1250 : 800;
    later(() => {
      if (next.ended) {
        sfx.over();
        setPhase("over");
        if (next.score > localBest) { setLocalBest(next.score); try { localStorage.setItem(BEST_KEY, String(next.score)); } catch { /* */ } }
      } else {
        setFeedbackBoth(null);
        setCardStart(performance.now());
      }
    }, hold);
  }, [cardStart, localBest]);

  // ── Clock ticker + timeout ──
  useEffect(() => {
    if (phase !== "playing") return;
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      const r = runRef.current;
      if (!r || feedbackRef.current) return;
      const card = currentCard(r);
      if (!card) return;
      const elapsed = performance.now() - cardStart;
      // Global clock can also run out mid-line
      if (elapsed >= card.windowMs || r.timeLeftMs - elapsed <= 0) answer("none");
    }, 50);
    return () => clearInterval(id);
  }, [phase, cardStart, answer]);

  // ── Keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (phase === "playing") {
        const m = KEYS[e.key] ?? KEYS[e.key.toLowerCase()];
        if (m) { e.preventDefault(); answer(m); }
      } else if ((phase === "intro" || phase === "over") && (e.key === "Enter" || e.key === " ")) {
        if (phase === "intro") { e.preventDefault(); start(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, answer, start]);

  const toggleSound = () => { const on = !soundOn; sfx.set(on); setSoundOn(on); };

  // ── Derived ──
  // While feedback is showing, keep rendering the line that was just answered —
  // the run state has already advanced to the next card.
  const card = run ? (feedback ? run.deck[run.index - 1] ?? null : currentCard(run)) : null;
  const line = card ? LINE_BY_ID[card.lineId] : null;
  const elapsed = phase === "playing" && !feedback ? performance.now() - cardStart : 0;
  const clockMs = run ? Math.max(0, run.timeLeftMs - elapsed) : RULES.startMs;
  const windowPct = card ? Math.max(0, 1 - elapsed / card.windowMs) : 1;
  const urgent = clockMs < 10_000;

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}
      data-testid="game-shell"
    >
      <div className="h-1.5" style={{ background: "linear-gradient(90deg, var(--c-accent), var(--c-accent-h))" }} />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
          <span className="font-display font-bold text-sm tracking-tight" style={{ color: "var(--c-fg)" }}>Read the Room</span>
        </div>
        <div className="flex items-center gap-3">
          {localBest > 0 && (
            <span className="text-xs hidden sm:inline" style={{ color: "var(--c-fg-45)" }}>
              Personal best <strong style={{ color: "var(--c-fg)" }}>{formatMoney(localBest)}</strong>
            </span>
          )}
          <button
            onClick={toggleSound}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
            aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
            data-testid="button-sound"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {phase === "intro" && <Intro key="intro" onStart={start} best={localBest} />}
          {phase === "countdown" && (
            <motion.div key="count" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center">
              <span className="label-track block mb-4">First deal is on the line</span>
              <motion.div
                key={count}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="font-display font-bold leading-none"
                style={{ fontSize: "clamp(72px, 18vw, 128px)", color: "var(--c-accent)" }}
              >
                {count > 0 ? count : "GO"}
              </motion.div>
              <p className="mt-4 text-sm" style={{ color: "var(--c-fg-45)" }}>Read the stage. Read the line. Pick the move.</p>
            </motion.div>
          )}
          {phase === "playing" && run && card && line && (
            <motion.div key="play" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* HUD */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                <Hud label="Commission" value={formatMoney(run.score)} pulseKey={run.score} accent />
                <Hud
                  label="Streak"
                  value={`${run.streak} · ×${multiplierFor(run.streak).toFixed(1)}`}
                  pulseKey={run.streak}
                  hint={run.streak >= RULES.streakCap ? "MAX HEAT" : undefined}
                />
                <Hud label="Clock" value={fmtClock(clockMs)} pulseKey={Math.floor(clockMs / 1000)} danger={urgent} />
              </div>

              {/* Time delta floaters */}
              <div className="relative h-0">
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      key={run.answered}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: -10 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute right-0 -top-6 text-xs font-bold"
                      style={{ color: feedback.timeDeltaMs > 0 ? "#19a866" : "#e0524d" }}
                    >
                      {feedback.timeDeltaMs > 0 ? "+" : "−"}{Math.abs(feedback.timeDeltaMs) / 1000}s
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Deal header */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="label-track" style={{ letterSpacing: "0.12em" }}>
                    Deal {card.dealIndex + 1} · {card.company}
                  </div>
                  <div className="text-sm font-semibold mt-0.5" style={{ color: "var(--c-fg-70)" }}>
                    {formatMoney(card.dealValue)} deal · {formatMoney(card.dealValue * RULES.commissionRate)} commission on the close
                  </div>
                </div>
                <div className="flex gap-1" aria-label="Deal progress">
                  {Array.from({ length: card.linesInDeal }).map((_, i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: i < card.lineInDeal ? "var(--c-accent)" : i === card.lineInDeal ? "var(--c-fg)" : "var(--c-fg-20)",
                        outline: i === card.linesInDeal - 1 ? "1.5px solid var(--c-accent)" : "none",
                        outlineOffset: 1,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Buyer card */}
              <motion.div
                key={feedback ? run.index - 1 : run.index}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22 }}
                className="rounded-xl p-5 sm:p-7 relative overflow-hidden"
                style={{ background: "var(--c-bg)", border: `1px solid ${feedback ? (feedback.correct ? "#19a866" : "#e0524d") : "var(--c-card-border)"}` }}
              >
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <StageChip stage={line.stage} />
                  {line.decision && (
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded" style={{ background: "var(--c-accent-15)", color: "var(--c-accent)" }}>
                      Decision point
                    </span>
                  )}
                </div>
                <p
                  className="font-display font-semibold leading-snug"
                  style={{ fontSize: "clamp(20px, 3.6vw, 30px)", color: "var(--c-fg)" }}
                  data-testid="text-buyer-line"
                >
                  “{line.text}”
                </p>

                {/* Line window bar */}
                <div className="mt-5 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-fg-20)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${windowPct * 100}%`,
                      background: windowPct < 0.3 ? "#e0524d" : windowPct < 0.6 ? "#f0a51a" : "var(--c-accent)",
                      transition: "width 50ms linear",
                    }}
                  />
                </div>

                {/* Feedback overlay */}
                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ y: 8 }}
                      animate={{ y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 flex flex-col justify-center p-5 sm:p-7"
                      style={{ background: "var(--c-bg)" }}
                      data-testid="feedback"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="w-8 h-8 rounded-full grid place-items-center font-bold"
                          style={{ background: feedback.correct ? "rgba(25,168,102,.15)" : "rgba(224,82,77,.14)", color: feedback.correct ? "#19a866" : "#e0524d" }}
                        >
                          {feedback.correct ? "✓" : feedback.move === "none" ? "◷" : "✕"}
                        </span>
                        <div>
                          <div className="font-display font-bold" style={{ color: "var(--c-fg)" }}>
                            {feedback.correct
                              ? feedback.dealBanked ? `Deal closed · +${formatMoney(feedback.dealBanked)} commission` : `${MOVE_LABEL[feedback.expected]}. +${formatMoney(feedback.earned)}`
                              : feedback.move === "none" ? "Too slow." : `You chose ${MOVE_LABEL[feedback.move as Move]}. The move was ${MOVE_LABEL[feedback.expected]}.`}
                          </div>
                          {feedback.dealLost && <div className="text-xs font-semibold" style={{ color: "#e0524d" }}>Deal lost. No commission.</div>}
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-70)" }}>{LINE_BY_ID[feedback.lineId].why}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Moves */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
                {MOVES.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => answer(m)}
                    disabled={!!feedback}
                    className="rounded-xl py-4 sm:py-5 px-2 text-left transition-transform active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
                    data-testid={`button-move-${m}`}
                  >
                    <div className="flex items-center justify-between px-2">
                      <span className="font-display font-bold text-lg sm:text-xl" style={{ color: "var(--c-fg)" }}>{MOVE_LABEL[m].toUpperCase()}</span>
                      <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded" style={{ border: "1px solid var(--c-border)", color: "var(--c-fg-45)" }}>
                        {["A", "T", "C"][i]}
                      </kbd>
                    </div>
                    <div className="px-2 mt-1 text-[11px] leading-snug hidden sm:block" style={{ color: "var(--c-fg-45)" }}>{MOVE_HINT[m]}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {phase === "over" && run && (
            <Results key="over" run={run} events={eventsRef.current} onReplay={start} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Pieces ───────────────────────────────────────────────────────────────────
function Hud({ label, value, pulseKey, accent, danger, hint }: { label: string; value: string; pulseKey: number; accent?: boolean; danger?: boolean; hint?: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5 text-center" style={{ background: "var(--c-card)", border: `1px solid ${danger ? "#e0524d" : "var(--c-card-border)"}` }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--c-fg-45)" }}>{label}</div>
      <motion.div
        key={pulseKey}
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25 }}
        className="font-display font-bold text-base sm:text-xl tabular-nums leading-tight mt-0.5"
        style={{ color: danger ? "#e0524d" : accent ? "var(--c-accent)" : "var(--c-fg)" }}
      >
        {value}
      </motion.div>
      {hint && <div className="text-[9px] font-bold tracking-wider" style={{ color: "var(--c-accent)" }}>{hint}</div>}
    </div>
  );
}

function StageChip({ stage }: { stage: Stage }) {
  const tone = STAGE_TONE[stage];
  const style =
    tone === "late" ? { background: "var(--c-accent)", color: "#0D0D0D" }
    : tone === "mid" ? { background: "var(--c-accent-15)", color: "var(--c-fg)" }
    : { background: "var(--c-fg-20)", color: "var(--c-fg)" };
  return (
    <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md" style={style} data-testid="stage-chip">
      {stage}
    </span>
  );
}

function Intro({ onStart, best }: { onStart: () => void; best: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div className="text-center mb-8">
        <span className="label-track block mb-3">60 seconds · 3 moves · one leaderboard</span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3" style={{ color: "var(--c-fg)" }}>
          Can you read the room?
        </h2>
        <p className="max-w-xl mx-auto text-sm sm:text-base leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
          A buyer says something. You have a few seconds to pick the right move. Right calls add time and build your streak.
          Wrong calls burn five seconds. Close deals to bank commission — the clock is your only life.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {MOVES.map((m) => (
          <div key={m} className="rounded-xl p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
            <div className="font-display font-bold text-lg mb-1" style={{ color: "var(--c-fg)" }}>{MOVE_LABEL[m].toUpperCase()}</div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--c-fg-55)" }}>{MOVE_HINT[m]}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 mb-8 flex gap-3 items-start" style={{ background: "var(--c-accent-06)", border: "1px solid var(--c-accent-15)" }}>
        <StageChip stage="Final meeting" />
        <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--c-fg-70)" }}>
          <strong style={{ color: "var(--c-fg)" }}>Watch the stage chip.</strong> “Send me a proposal” on a first call is a brush-off — you ask. In a final
          meeting it's a yes waiting for paper — you close. Same words, different room.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <button onClick={onStart} className="btn-accent px-10 py-4 rounded-lg font-bold text-base w-full sm:w-auto" data-testid="button-play">
          Start the clock →
        </button>
        <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--c-fg-30)" }}>
          <Keyboard className="w-3.5 h-3.5" /> Keys: A · T · C
        </span>
      </div>
      {best > 0 && (
        <p className="text-center text-xs mt-4" style={{ color: "var(--c-fg-45)" }}>Your personal best: {formatMoney(best)}. Beat it.</p>
      )}
    </motion.div>
  );
}

// ── Results + submit ─────────────────────────────────────────────────────────
function Results({ run, events, onReplay }: { run: RunState; events: RunEvent[]; onReplay: () => void }) {
  const summary = useMemo(() => summarize(run), [run]);
  const saved = useMemo(() => readJson<SavedPlayer>(PLAYER_KEY), []);
  const [displayName, setDisplayName] = useState(saved?.displayName ?? "");
  const [email, setEmail] = useState(saved?.email ?? "");
  const [optIn, setOptIn] = useState(false);
  const [editing, setEditing] = useState(!saved);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const eventsSnapshot = useRef(events.slice());

  const submit = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/game/runs", {
        seed: run.seed,
        events: eventsSnapshot.current,
        displayName: displayName.trim(),
        email: email.trim(),
        sequenceOptIn: optIn,
      });
      return (await res.json()) as SubmitResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      writeJson(PLAYER_KEY, { displayName: displayName.trim(), email: email.trim() } satisfies SavedPlayer);
      queryClient.setQueryData(["/api/game/leaderboard"], { top: data.top, players: data.players });
    },
    onError: (err: Error) => {
      // apiRequest throws "status: body" — surface the server's message when it's JSON
      const m = err.message.match(/^\d+:\s*([\s\S]*)$/);
      let msg = m?.[1] ?? err.message;
      try { msg = (JSON.parse(msg) as { message?: string }).message ?? msg; } catch { /* plain text */ }
      setError(msg || "Couldn't save your score. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const name = displayName.trim();
    if (name.length < 2 || name.length > 20) return setError("Display name needs to be 2–20 characters.");
    if (!/^[A-Za-z0-9\u00C0-\u024F ._'-]+$/.test(name)) return setError("Display name can only use letters, numbers, spaces, and . _ ' -");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError("Please enter a valid email address.");
    submit.mutate();
  };

  const share = async () => {
    const text = `I banked ${formatMoney(summary.score)} in commission playing Read the Room by Eric Gravely. Think you can read a buyer better than me? ${window.location.origin}/game`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* user cancelled */ }
  };

  const outOfTime = run.endReason === "time";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} data-testid="results">
      <div className="text-center mb-6">
        <span className="label-track block mb-2">{outOfTime ? "Clock's out" : "Day's over"} · commission banked</span>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="font-display font-bold leading-none"
          style={{ fontSize: "clamp(48px, 12vw, 84px)", color: "var(--c-accent)" }}
          data-testid="text-final-score"
        >
          {formatMoney(summary.score)}
        </motion.div>
        {result?.isNewBest && (
          <div className="inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold" style={{ background: "var(--c-accent-15)", color: "var(--c-accent)" }}>
            ★ New personal best · Rank #{result.rank}
          </div>
        )}
        {result && !result.isNewBest && (
          <div className="mt-3 text-xs" style={{ color: "var(--c-fg-45)" }}>
            Your best is still {formatMoney(result.bestScore)} (rank #{result.rank}).
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-6">
        <Stat label="Accuracy" value={`${summary.accuracy}%`} />
        <Stat label="Right calls" value={`${summary.correct}/${summary.answered}`} />
        <Stat label="Best streak" value={`${summary.bestStreak}`} />
        <Stat label="Deals closed" value={`${summary.dealsClosed}${summary.dealsLost ? ` · ${summary.dealsLost} lost` : ""}`} />
      </div>

      <div className="rounded-xl p-5 mb-6" style={{ background: "var(--c-accent-06)", border: "1px solid var(--c-accent-15)" }}>
        <div className="label-track mb-1" style={{ color: "var(--c-accent)" }}>Your instinct profile</div>
        <div className="font-display font-bold text-xl mb-1" style={{ color: "var(--c-fg)" }}>{summary.profile.title}</div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-70)" }}>{summary.profile.blurb}</p>
        {summary.profile.id !== "reader" && (
          <Link href="/products" className="inline-block mt-3 text-sm font-semibold" style={{ color: "var(--c-accent)" }}>
            Fix it with the free Ask &amp; Close Playbook →
          </Link>
        )}
      </div>

      {/* Save score */}
      {!result ? (
        <form onSubmit={handleSubmit} className="rounded-xl p-5 mb-6" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }} data-testid="form-save-score">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
            <span className="font-display font-bold" style={{ color: "var(--c-fg)" }}>Put it on the leaderboard</span>
          </div>
          {!editing && saved ? (
            <p className="text-sm mb-3" style={{ color: "var(--c-fg-55)" }}>
              Saving as <strong style={{ color: "var(--c-fg)" }}>{saved.displayName}</strong> ({saved.email}).{" "}
              <button type="button" className="underline" onClick={() => setEditing(true)} style={{ color: "var(--c-accent)" }}>Not you?</button>
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Display name (shown publicly)"
                maxLength={20}
                className="input-dark w-full px-4 py-3 rounded-lg text-sm"
                data-testid="input-display-name"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (never shown)"
                className="input-dark w-full px-4 py-3 rounded-lg text-sm"
                data-testid="input-email"
                required
              />
            </div>
          )}
          <label className="flex items-start gap-2.5 text-xs mb-4 cursor-pointer" style={{ color: "var(--c-fg-55)" }}>
            <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} className="mt-0.5 accent-[#C9A227]" data-testid="checkbox-optin" />
            <span>Also send me Eric's coaching emails — the same frameworks behind these buyer lines. Unsubscribe anytime.</span>
          </label>
          {error && <p className="text-xs mb-3" style={{ color: "#e0524d" }} data-testid="text-submit-error">{error}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={submit.isPending} className="btn-accent px-6 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60" data-testid="button-save-score">
              {submit.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
              Save my score
            </button>
            <button type="button" onClick={onReplay} className="btn-outline-accent px-6 py-3 rounded-lg text-sm flex items-center justify-center gap-2" data-testid="button-skip-replay">
              <RotateCcw className="w-4 h-4" /> Skip, play again
            </button>
          </div>
          <p className="text-[11px] mt-3" style={{ color: "var(--c-fg-30)" }}>
            Your email keeps your best score attached to you and is never shown on the board.
          </p>
        </form>
      ) : (
        <div className="rounded-xl p-5 mb-6" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <span className="font-display font-bold" style={{ color: "var(--c-fg)" }}>Leaderboard</span>
            <span className="text-xs" style={{ color: "var(--c-fg-45)" }}>You're ranked #{result.rank} of {result.players}</span>
          </div>
          <Leaderboard limit={10} highlightName={displayName.trim()} data={{ top: result.top, players: result.players }} compact />
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={onReplay} className="btn-accent px-8 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2" data-testid="button-play-again">
          <RotateCcw className="w-4 h-4" /> Run it back
        </button>
        <button onClick={share} className="btn-outline-accent px-8 py-3.5 rounded-lg text-sm flex items-center justify-center gap-2" data-testid="button-share">
          <Share2 className="w-4 h-4" /> {copied ? "Copied!" : "Challenge a rep"}
        </button>
      </div>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-3 text-center" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: "var(--c-fg-45)" }}>{label}</div>
      <div className="font-display font-bold text-lg mt-0.5" style={{ color: "var(--c-fg)" }}>{value}</div>
    </div>
  );
}
