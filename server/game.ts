// ─────────────────────────────────────────────────────────────────────────────
// READ THE ROOM — server side
//
// The browser never tells us its score. It sends the seed and the list of
// moves it made; we replay them through the same engine (shared/salesGame.ts)
// and store whatever the replay says. See replayRun() for the legality checks.
// ─────────────────────────────────────────────────────────────────────────────
import type { Express, Request } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { storage } from "./storage";
import { gamePlayers, gameRuns, gameSubmitSchema, type GamePlayer } from "@shared/schema";
import { replayRun, SCORE_CEILING, type RunSummary } from "@shared/salesGame";
import { subscribeToConvertKit } from "./convertkit";
import { requireAdmin } from "./adminAuth";

export const GAME_SUBSCRIBER_TAG = "sales-game";
const LEADERBOARD_SIZE = 25;

// Tables are created at boot (same approach as the session table) so the
// game works the moment this deploys, without waiting on `npm run db:push`.
// The Drizzle definitions in shared/schema.ts stay the source of truth.
export async function ensureGameTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "game_players" (
        "id" serial PRIMARY KEY,
        "email" text NOT NULL UNIQUE,
        "display_name" text NOT NULL,
        "best_score" integer NOT NULL DEFAULT 0,
        "best_run" jsonb,
        "plays" integer NOT NULL DEFAULT 0,
        "last_played_at" timestamp NOT NULL DEFAULT now(),
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "game_runs" (
        "id" serial PRIMARY KEY,
        "player_id" integer REFERENCES "game_players"("id"),
        "score" integer NOT NULL,
        "seed" integer NOT NULL,
        "summary" jsonb,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS "idx_game_players_best_score" ON "game_players" ("best_score" DESC)`);
  } catch (err) {
    console.error("[game] Failed to ensure game tables:", err instanceof Error ? err.message : err);
  }
}

// ── Rate limit: submissions per IP ───────────────────────────────────────────
const WINDOW_MS = 10 * 60 * 1000;
const MAX_SUBMITS = 40; // a run lasts ≥ 60s, so 40 per 10 min is already generous
const submits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = submits.get(ip);
  if (!entry || now > entry.resetAt) {
    submits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_SUBMITS;
}

// ── Data access ──────────────────────────────────────────────────────────────
export interface LeaderboardRow {
  rank: number;
  displayName: string;
  score: number;
  dealsClosed: number;
  bestStreak: number;
  accuracy: number;
}

function toRow(p: GamePlayer, rank: number): LeaderboardRow {
  const run = (p.bestRun ?? {}) as Partial<RunSummary>;
  return {
    rank,
    displayName: p.displayName,
    score: p.bestScore,
    dealsClosed: run.dealsClosed ?? 0,
    bestStreak: run.bestStreak ?? 0,
    accuracy: run.accuracy ?? 0,
  };
}

async function topPlayers(limit = LEADERBOARD_SIZE): Promise<LeaderboardRow[]> {
  const rows = await db
    .select()
    .from(gamePlayers)
    .where(sql`${gamePlayers.bestScore} > 0`)
    .orderBy(desc(gamePlayers.bestScore), gamePlayers.lastPlayedAt)
    .limit(limit);
  return rows.map((p, i) => toRow(p, i + 1));
}

async function playerCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(gamePlayers);
  return row?.count ?? 0;
}

/** 1-based rank for a score: number of players strictly above it, plus one. */
async function rankFor(score: number): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(gamePlayers)
    .where(sql`${gamePlayers.bestScore} > ${score}`);
  return (row?.count ?? 0) + 1;
}

// ── Routes ───────────────────────────────────────────────────────────────────
export function registerGameRoutes(app: Express): void {
  app.get("/api/game/leaderboard", async (_req, res) => {
    try {
      const [top, players] = await Promise.all([topPlayers(), playerCount()]);
      res.setHeader("Cache-Control", "no-store");
      return res.json({ top, players });
    } catch (err) {
      console.error("[game] leaderboard:", err instanceof Error ? err.message : err);
      return res.status(500).json({ message: "Couldn't load the leaderboard." });
    }
  });

  app.post("/api/game/runs", async (req: Request, res) => {
    try {
      if (rateLimited(req.ip ?? "unknown")) {
        return res.status(429).json({ message: "Slow down — too many submissions. Try again in a few minutes." });
      }
      const parsed = gameSubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Invalid submission" });
      }
      const { seed, events, displayName, sequenceOptIn } = parsed.data;
      const email = parsed.data.email.toLowerCase();

      const summary = replayRun(seed, events);
      if (!summary || summary.score > SCORE_CEILING) {
        return res.status(422).json({ message: "That run couldn't be verified. Play again and resubmit." });
      }

      // Upsert the player. Best score only ever goes up.
      const [existing] = await db.select().from(gamePlayers).where(eq(gamePlayers.email, email));
      const isNewBest = !existing || summary.score > existing.bestScore;
      let player: GamePlayer;
      if (existing) {
        [player] = await db
          .update(gamePlayers)
          .set({
            displayName,
            plays: sql`${gamePlayers.plays} + 1`,
            lastPlayedAt: new Date(),
            ...(isNewBest ? { bestScore: summary.score, bestRun: summary } : {}),
          })
          .where(eq(gamePlayers.id, existing.id))
          .returning();
      } else {
        [player] = await db
          .insert(gamePlayers)
          .values({ email, displayName, bestScore: summary.score, bestRun: summary, plays: 1 })
          .returning();
      }
      await db.insert(gameRuns).values({ playerId: player.id, score: summary.score, seed, summary });

      // Lead capture — same subscriber table the funnel uses, tagged so you can
      // tell game players apart from resource downloads. Idempotent, and it
      // never resurrects someone who unsubscribed.
      try {
        const sub = await storage.getSubscriberByEmail(email);
        if (!sub) {
          await storage.createSubscriber({ email, firstName: displayName.split(" ")[0], tag: GAME_SUBSCRIBER_TAG });
          const ck = await subscribeToConvertKit(email, displayName.split(" ")[0], GAME_SUBSCRIBER_TAG);
          if (!ck.success && !ck.skipped) console.error("[game] ConvertKit error:", ck.error);
        }
        if (sequenceOptIn && !sub?.unsubscribed) {
          await storage.setSequenceOptIn(email);
        }
      } catch (err) {
        // Never fail the score submission because lead capture hiccuped.
        console.error("[game] subscriber capture failed:", err instanceof Error ? err.message : err);
      }

      const [rank, top, players] = await Promise.all([rankFor(player.bestScore), topPlayers(), playerCount()]);
      return res.json({
        success: true,
        score: summary.score,
        summary,
        bestScore: player.bestScore,
        isNewBest,
        rank,
        top,
        players,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/relation .* does not exist/i.test(msg)) {
        return res.status(500).json({ message: "Leaderboard storage isn't ready yet. Try again in a minute." });
      }
      console.error("[game] submit:", msg);
      return res.status(500).json({ message: "Couldn't save your score. Please try again." });
    }
  });

  // Admin: every player with email — these are leads.
  app.get("/api/admin/game/players", requireAdmin, async (_req, res) => {
    try {
      const [players, runsAgg] = await Promise.all([
        db.select().from(gamePlayers).orderBy(desc(gamePlayers.bestScore)),
        db.select({ runs: sql<number>`count(*)::int`, avg: sql<number>`coalesce(avg(${gameRuns.score}),0)::int` }).from(gameRuns),
      ]);
      return res.json({
        players: players.map((p, i) => ({
          rank: i + 1,
          id: p.id,
          email: p.email,
          displayName: p.displayName,
          bestScore: p.bestScore,
          plays: p.plays,
          lastPlayedAt: p.lastPlayedAt,
          createdAt: p.createdAt,
          bestRun: p.bestRun,
        })),
        totalRuns: runsAgg[0]?.runs ?? 0,
        avgScore: runsAgg[0]?.avg ?? 0,
      });
    } catch (err) {
      console.error("[game] admin players:", err instanceof Error ? err.message : err);
      return res.status(500).json({ message: "Failed to load players." });
    }
  });
}
