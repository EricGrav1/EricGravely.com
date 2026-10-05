import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Send, CalendarClock, Square, X } from "lucide-react";
import type { Broadcast, EmailAudience } from "@shared/schema";
import {
  EmailFields, PreviewAndTest, AudiencePicker, AutomationStatus, Notice, Spinner,
  audienceLabel, cardStyle, formatDateTime, parseApiError, useMagnets,
} from "./emailTools";

interface BroadcastData {
  broadcasts: Broadcast[];
  isSending: boolean;
  activeSubscribers: number;
}

const DRAFT_KEY = "admin.broadcastDraft";

function loadDraft(): { subject: string; body: string } {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "") ?? { subject: "", body: "" };
  } catch {
    return { subject: "", body: "" };
  }
}

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time.
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  sending: "Sending…",
  sent: "Sent",
  failed: "Failed",
  canceled: "Canceled",
  interrupted: "Interrupted",
};

export function BroadcastsTab() {
  const { data, isLoading } = useQuery<BroadcastData>({
    queryKey: ["/api/admin/broadcasts"],
    refetchInterval: (query) => (query.state.data?.isSending ? 3000 : false),
  });
  const magnets = useMagnets();
  const draft = useRef(loadDraft()).current;
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [audience, setAudience] = useState<{ value: EmailAudience; count: number | null }>({ value: { type: "all" }, count: null });
  const [scheduleOn, setScheduleOn] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Autosave the draft so a refresh or tab switch never loses your writing.
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, body })); } catch { /* storage blocked */ }
  }, [subject, body]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });

  // While anything is sending, keep the queue moving from this page — each
  // call sends for a few seconds. (The cron job does the same when you leave.)
  const isSending = data?.isSending ?? false;
  useEffect(() => {
    if (!isSending) return;
    let stopped = false;
    void (async () => {
      while (!stopped) {
        let wait = 1000;
        try {
          const run = await (await apiRequest("POST", "/api/admin/email/process")).json();
          if (run.paused) wait = 30_000; // rate limited or misconfigured — back off
        } catch {
          wait = 10_000;
        }
        if (stopped) break;
        await invalidate();
        await new Promise((r) => setTimeout(r, wait));
      }
    })();
    return () => { stopped = true; };
  }, [isSending]);

  const sendMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/broadcasts", {
        subject,
        body,
        audience: audience.value,
        scheduledAt: scheduleOn ? new Date(scheduleAt).toISOString() : null,
      }),
    onSuccess: () => {
      setNotice({
        kind: "ok",
        text: scheduleOn ? `Scheduled for ${formatDateTime(new Date(scheduleAt))}.` : "Sending now — progress shows below.",
      });
      setSubject("");
      setBody("");
      setScheduleOn(false);
      invalidate();
    },
    onError: (err: Error) => setNotice({ kind: "err", text: parseApiError(err) }),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/broadcasts/${id}/cancel`),
    onSuccess: invalidate,
    onError: (err: Error) => setNotice({ kind: "err", text: parseApiError(err) }),
  });

  const ready = subject.trim().length > 0 && body.trim().length > 0;
  const who = audienceLabel(audience.value, magnets).toLowerCase();

  const handleSend = () => {
    if (!ready) { setNotice({ kind: "err", text: "Subject and body are required." }); return; }
    if (scheduleOn) {
      const when = new Date(scheduleAt);
      if (isNaN(when.getTime()) || when.getTime() < Date.now()) {
        setNotice({ kind: "err", text: "Pick a time in the future." });
        return;
      }
      if (confirm(`Schedule "${subject.trim()}" for ${formatDateTime(when)}? It goes to ${who} on the list at that moment.`)) {
        sendMutation.mutate();
      }
      return;
    }
    if (confirm(`Send "${subject.trim()}" to ${audience.count ?? "?"} people (${who}) right now? This can't be undone.`)) {
      sendMutation.mutate();
    }
  };

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-6">
      <AutomationStatus />

      {/* Compose */}
      <div className="rounded-xl px-4 py-4 space-y-3" style={cardStyle}>
        <div className="text-sm font-display font-bold" style={{ color: "var(--c-fg)" }}>New broadcast</div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
          A one-time email to your list. Send yourself a test first — once it goes out, it's out.
        </p>

        <AudiencePicker onChange={(value, count) => setAudience({ value, count })} />

        <EmailFields subject={subject} body={body} onSubject={setSubject} onBody={setBody} testIdPrefix="broadcast" />
        <PreviewAndTest subject={subject} body={body} testIdPrefix="broadcast" />

        <div className="flex items-center gap-3 flex-wrap pt-1" style={{ borderTop: "1px solid var(--c-border)" }}>
          <label className="text-xs flex items-center gap-2 cursor-pointer mt-3" style={{ color: "var(--c-fg-55)" }}>
            <input
              type="checkbox"
              checked={scheduleOn}
              onChange={(e) => setScheduleOn(e.target.checked)}
              className="accent-[#C9A227]"
              data-testid="checkbox-broadcast-schedule"
            />
            Schedule for later
          </label>
          {scheduleOn && (
            <input
              type="datetime-local"
              value={scheduleAt}
              min={toLocalInput(new Date())}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="input-dark px-2.5 py-1.5 rounded-lg text-xs mt-3"
              data-testid="input-broadcast-schedule-at"
            />
          )}
          <div className="flex-1" />
          <button
            onClick={handleSend}
            disabled={!ready || sendMutation.isPending || (!scheduleOn && audience.count === 0)}
            className="btn-accent px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 disabled:opacity-50 mt-3"
            data-testid="button-broadcast-send"
          >
            {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : scheduleOn ? <CalendarClock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            {scheduleOn ? "Schedule" : `Send to ${audience.count ?? "…"}`}
          </button>
        </div>
        <Notice notice={notice} />
      </div>

      {/* History */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: "var(--c-fg-45)" }}>Broadcasts</div>
        {(data?.broadcasts ?? []).length === 0 && (
          <p className="text-xs py-4 text-center rounded-xl" style={{ color: "var(--c-fg-45)", border: "1px dashed var(--c-border)" }}>
            Nothing sent yet.
          </p>
        )}
        {(data?.broadcasts ?? []).map((b) => {
          const done = b.sentCount + b.failedCount;
          const pct = b.totalRecipients > 0 ? Math.round((done / b.totalRecipients) * 100) : 0;
          const live = b.status === "scheduled" || b.status === "sending";
          return (
            <div key={b.id} className="rounded-xl px-4 py-3 space-y-2" style={cardStyle} data-testid={`row-broadcast-${b.id}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--c-fg)" }}>{b.subject}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--c-fg-45)" }}>
                    {audienceLabel(b.audience as EmailAudience | null, magnets)}
                    {" · "}
                    {b.status === "scheduled" && b.scheduledAt
                      ? `goes out ${formatDateTime(b.scheduledAt)}`
                      : formatDateTime(b.startedAt ?? b.createdAt)}
                    {b.status !== "scheduled" && ` · ${b.sentCount}/${b.totalRecipients} sent`}
                    {b.failedCount > 0 && ` · ${b.failedCount} failed`}
                  </div>
                </div>
                <span
                  className="text-[10px] uppercase tracking-wider px-2 py-1 rounded flex-shrink-0"
                  style={
                    live
                      ? { background: "var(--c-accent-10)", color: "var(--c-accent)", border: "1px solid var(--c-accent-15)" }
                      : { background: "var(--c-border)", color: "var(--c-fg-45)" }
                  }
                >
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
                {live && (
                  <button
                    onClick={() => {
                      const q = b.status === "scheduled"
                        ? `Cancel "${b.subject}"? It won't be sent.`
                        : `Stop sending "${b.subject}"? People who already got it keep it; nobody else will.`;
                      if (confirm(q)) cancelMutation.mutate(b.id);
                    }}
                    className="h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-semibold flex-shrink-0"
                    style={{ color: "var(--c-fg-55)", border: "1px solid var(--c-border)" }}
                    data-testid={`button-cancel-broadcast-${b.id}`}
                  >
                    {b.status === "scheduled" ? <X className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                    {b.status === "scheduled" ? "Cancel" : "Stop"}
                  </button>
                )}
              </div>
              {b.status === "sending" && (
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--c-border)" }}>
                  <div className="h-full transition-all" style={{ width: `${pct}%`, background: "#C9A227" }} />
                </div>
              )}
              {b.status === "sending" && b.lastError && (
                <p className="text-[11px]" style={{ color: "#B4552D" }}>
                  Paused: {b.lastError} — it'll retry automatically.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
