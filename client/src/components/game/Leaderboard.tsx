import { useQuery } from "@tanstack/react-query";
import { Loader2, Trophy } from "lucide-react";
import { formatMoney } from "@shared/salesGame";

export interface LeaderboardRow {
  rank: number;
  displayName: string;
  score: number;
  dealsClosed: number;
  bestStreak: number;
  accuracy: number;
}

export interface LeaderboardData {
  top: LeaderboardRow[];
  players: number;
}

interface Props {
  limit?: number;
  /** Highlight the row belonging to this display name (the current player). */
  highlightName?: string | null;
  /** Pre-fetched data (e.g. returned by the submit endpoint) to avoid a flash. */
  data?: LeaderboardData;
  compact?: boolean;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboard({ limit = 25, highlightName, data: provided, compact = false }: Props) {
  const { data: fetched, isLoading, isError } = useQuery<LeaderboardData>({
    queryKey: ["/api/game/leaderboard"],
    enabled: !provided,
  });
  const data = provided ?? fetched;

  if (!data && isLoading) {
    return (
      <div className="py-10 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} />
      </div>
    );
  }
  if (!data || isError) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: "var(--c-fg-45)" }}>
        The leaderboard isn't available right now.
      </p>
    );
  }
  const rows = data.top.slice(0, limit);
  if (rows.length === 0) {
    return (
      <div className="py-10 text-center">
        <Trophy className="w-6 h-6 mx-auto mb-3" style={{ color: "var(--c-accent)" }} />
        <p className="text-sm" style={{ color: "var(--c-fg-55)" }}>
          No scores yet. The first name on this board could be yours.
        </p>
      </div>
    );
  }

  return (
    <div>
      <ol className="space-y-1.5" data-testid="leaderboard">
        {rows.map((r) => {
          const mine = highlightName && r.displayName.toLowerCase() === highlightName.toLowerCase();
          return (
            <li
              key={`${r.rank}-${r.displayName}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5"
              style={{
                background: mine ? "var(--c-accent-10)" : "var(--c-card)",
                border: `1px solid ${mine ? "var(--c-accent)" : "var(--c-card-border)"}`,
              }}
              data-testid={`leaderboard-row-${r.rank}`}
            >
              <span
                className="w-8 text-center font-display font-bold text-sm tabular-nums"
                style={{ color: r.rank <= 3 ? "var(--c-accent)" : "var(--c-fg-45)" }}
              >
                {r.rank <= 3 ? MEDAL[r.rank - 1] : `#${r.rank}`}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-semibold" style={{ color: "var(--c-fg)" }}>
                {r.displayName}
                {mine && <span className="ml-2 text-[10px] uppercase tracking-wider" style={{ color: "var(--c-accent)" }}>you</span>}
              </span>
              {!compact && (
                <span className="hidden sm:inline text-xs tabular-nums" style={{ color: "var(--c-fg-45)" }}>
                  {r.dealsClosed} deal{r.dealsClosed === 1 ? "" : "s"} · {r.bestStreak} streak · {r.accuracy}%
                </span>
              )}
              <span className="font-display font-bold text-sm tabular-nums" style={{ color: "var(--c-fg)" }}>
                {formatMoney(r.score)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-center" style={{ color: "var(--c-fg-30)" }}>
        {data.players.toLocaleString()} player{data.players === 1 ? "" : "s"} on the board
      </p>
    </div>
  );
}
