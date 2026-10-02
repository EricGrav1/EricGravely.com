import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff, Loader2, Mail, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { EmailAudience, LeadMagnet } from "@shared/schema";

// Shared building blocks for the Sequences and Broadcasts admin tabs.

export function parseApiError(err: Error): string {
  try {
    return JSON.parse(err.message.replace(/^\d+:\s*/, "")).message ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export function timeAgo(d: string | Date): string {
  const mins = Math.round((Date.now() - new Date(d).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function Spinner() {
  return (
    <div className="py-16 text-center">
      <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} />
    </div>
  );
}

export function Notice({ notice }: { notice: { kind: "ok" | "err"; text: string } | null }) {
  if (!notice) return null;
  return (
    <p className="text-xs" style={{ color: notice.kind === "ok" ? "var(--c-accent)" : "#B4552D" }} data-testid="text-email-notice">
      {notice.text}
    </p>
  );
}

export const cardStyle = { background: "var(--c-card)", border: "1px solid var(--c-card-border)" };

export function useMagnets() {
  return useQuery<LeadMagnet[]>({ queryKey: ["/api/admin/lead-magnets"] }).data ?? [];
}

// ── Subject + body editor ─────────────────────────────────────────────────────
export function EmailFields({
  subject, body, onSubject, onBody, rows = 10, testIdPrefix,
}: {
  subject: string;
  body: string;
  onSubject: (v: string) => void;
  onBody: (v: string) => void;
  rows?: number;
  testIdPrefix: string;
}) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={subject}
        onChange={(e) => onSubject(e.target.value)}
        placeholder="Subject line ({{first_name}} works here)"
        className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
        data-testid={`input-${testIdPrefix}-subject`}
      />
      <textarea
        value={body}
        onChange={(e) => onBody(e.target.value)}
        placeholder={"Write like you talk. Blank lines make new paragraphs.\n\nHey {{first_name}},\n\n…"}
        rows={rows}
        className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm resize-y"
        data-testid={`input-${testIdPrefix}-body`}
      />
      <button
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        className="text-[11px] underline"
        style={{ color: "var(--c-fg-45)" }}
      >
        {showHelp ? "Hide formatting tips" : "Formatting tips (links, buttons, bold)"}
      </button>
      {showHelp && (
        <div className="text-[11px] leading-relaxed rounded-lg px-3 py-2.5 space-y-1" style={{ color: "var(--c-fg-55)", background: "var(--c-bg2)" }}>
          <div><code>{"{{first_name}}"}</code> → their first name ("there" if we don't have it)</div>
          <div><code>[link text](https://…)</code> → a link inside a sentence</div>
          <div>A link alone on its own line → a big gold <b>button</b> (great for your CTA)</div>
          <div><code>**bold**</code> → <b>bold</b> · Plain https:// links become clickable automatically</div>
          <div>Your sign-off ("— Eric") and the unsubscribe link are added for you.</div>
        </div>
      )}
    </div>
  );
}

// ── Preview + test send ───────────────────────────────────────────────────────
export function PreviewAndTest({ subject, body, testIdPrefix }: { subject: string; body: string; testIdPrefix: string }) {
  const [testTo, setTestTo] = useState("eric@ericgravely.com");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const ready = subject.trim().length > 0 && body.trim().length > 0;

  const previewMutation = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/admin/email/preview", { subject, body })).json(),
    onSuccess: (data: { subject: string; html: string }) => setPreview(data),
    onError: (err: Error) => setNotice({ kind: "err", text: parseApiError(err) }),
  });
  const testMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/email/test", { subject, body, to: testTo }),
    onSuccess: () => setNotice({ kind: "ok", text: `Test sent to ${testTo} — check that inbox.` }),
    onError: (err: Error) => setNotice({ kind: "err", text: parseApiError(err) }),
  });

  // Keep an open preview in sync while editing (debounced); close it once the
  // editor is cleared (e.g. after sending).
  useEffect(() => {
    if (!subject.trim() && !body.trim()) { setPreview(null); return; }
    if (!preview || !ready) return;
    const t = setTimeout(() => previewMutation.mutate(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, body]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => (preview ? setPreview(null) : previewMutation.mutate())}
          disabled={!ready && !preview}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          style={{ color: "var(--c-fg-70)", border: "1px solid var(--c-border)" }}
          data-testid={`button-${testIdPrefix}-preview`}
        >
          {preview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {preview ? "Hide preview" : "Preview"}
        </button>
        <input
          type="email"
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
          placeholder="Test email address"
          className="input-dark px-3 py-2 rounded-lg text-xs w-52"
          data-testid={`input-${testIdPrefix}-test-to`}
        />
        <button
          type="button"
          onClick={() => { setNotice(null); testMutation.mutate(); }}
          disabled={!ready || testMutation.isPending}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          style={{ color: "var(--c-accent)", border: "1px solid var(--c-accent-15)" }}
          data-testid={`button-${testIdPrefix}-test`}
        >
          {testMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
          Send test
        </button>
      </div>
      <Notice notice={notice} />
      {preview && (
        <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--c-border)" }}>
          <div className="px-3 py-2 text-xs" style={{ background: "var(--c-bg2)", color: "var(--c-fg-70)" }}>
            <span style={{ color: "var(--c-fg-45)" }}>Subject:</span> {preview.subject}
          </div>
          <iframe
            title="Email preview"
            srcDoc={preview.html}
            sandbox=""
            className="w-full block"
            style={{ height: 480, background: "#FAF7F2" }}
            data-testid={`frame-${testIdPrefix}-preview`}
          />
        </div>
      )}
    </div>
  );
}

// ── Audience picker ───────────────────────────────────────────────────────────
type AudienceChoice = "all" | "newsletter" | "resource-any" | `resource-${number}`;

function toAudience(choice: AudienceChoice): EmailAudience {
  if (choice === "all") return { type: "all" };
  if (choice === "newsletter") return { type: "newsletter" };
  if (choice === "resource-any") return { type: "resource", leadMagnetId: null };
  return { type: "resource", leadMagnetId: Number(choice.slice("resource-".length)) };
}

export function audienceLabel(audience: EmailAudience | null, magnets: LeadMagnet[]): string {
  if (!audience || audience.type === "all") return "Everyone";
  if (audience.type === "newsletter") return "Newsletter signups";
  if (audience.leadMagnetId == null) return "Anyone who grabbed a resource";
  return `Grabbed: ${magnets.find((m) => m.id === audience.leadMagnetId)?.title ?? "a resource"}`;
}

export function AudiencePicker({
  onChange,
}: {
  onChange: (audience: EmailAudience, count: number | null) => void;
}) {
  const magnets = useMagnets().filter((m) => m.productType === "download");
  const [choice, setChoice] = useState<AudienceChoice>("all");
  const audience = toAudience(choice);

  const { data } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/audience/count", choice],
    queryFn: async () => (await apiRequest("POST", "/api/admin/audience/count", audience)).json(),
  });
  const count = data?.count ?? null;

  useEffect(() => {
    onChange(audience, count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, count]);

  return (
    <label className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "var(--c-fg-55)" }}>
      Send to
      <select
        value={choice}
        onChange={(e) => setChoice(e.target.value as AudienceChoice)}
        className="input-dark px-2.5 py-1.5 rounded-lg text-xs"
        data-testid="select-broadcast-audience"
      >
        <option value="all">Everyone on the list</option>
        <option value="newsletter">Newsletter signups</option>
        <option value="resource-any">Anyone who grabbed a free resource</option>
        {magnets.map((m) => (
          <option key={m.id} value={`resource-${m.id}`}>Grabbed: {m.title}</option>
        ))}
      </select>
      <span className="font-semibold" style={{ color: "var(--c-fg)" }} data-testid="text-audience-count">
        {count === null ? "…" : `${count} ${count === 1 ? "person" : "people"}`}
      </span>
    </label>
  );
}

// ── Automation health ─────────────────────────────────────────────────────────
interface EmailStatus {
  cronConfigured: boolean;
  lastCronRun: { at: string } | null;
  lastTimerRun: { at: string } | null;
}

const CRON_STALE_MS = 60 * 60 * 1000;

// Tells Eric whether scheduled sending actually works in production. On
// Replit Autoscale the server sleeps between visits, so sequences and
// scheduled broadcasts depend on the external cron pinging /api/cron/email.
export function AutomationStatus() {
  const { data } = useQuery<EmailStatus>({ queryKey: ["/api/admin/email/status"], refetchInterval: 60_000 });
  if (!data) return null;

  const cronHealthy = data.lastCronRun && Date.now() - new Date(data.lastCronRun.at).getTime() < CRON_STALE_MS;
  if (cronHealthy) {
    return (
      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--c-fg-55)" }} data-testid="text-automation-ok">
        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#3F8F5A" }} />
        Automatic sending is on — last check {timeAgo(data.lastCronRun!.at)}.
      </div>
    );
  }

  return (
    <div className="rounded-xl px-4 py-3 text-xs leading-relaxed space-y-1.5" style={{ background: "rgba(180,85,45,0.08)", border: "1px solid rgba(180,85,45,0.25)", color: "var(--c-fg-70)" }} data-testid="text-automation-warning">
      <div className="flex items-center gap-2 font-semibold" style={{ color: "#B4552D" }}>
        <AlertTriangle className="w-3.5 h-3.5" />
        {data.lastCronRun ? `Automatic sending last ran ${timeAgo(data.lastCronRun.at)}` : "Automatic sending isn't set up yet"}
      </div>
      <p>
        Your site sleeps when nobody's visiting, so sequence emails and scheduled broadcasts need a wake-up ping every 10 minutes.
        {data.cronConfigured
          ? " CRON_SECRET is set — add the same value as a GitHub Actions secret named CRON_SECRET so the email-cron workflow can ping the site."
          : " Set a CRON_SECRET secret in Replit (any long random string), redeploy, then add the same value as a GitHub Actions secret named CRON_SECRET."}
      </p>
      <p style={{ color: "var(--c-fg-45)" }}>
        Until then, emails still go out whenever the site is awake{data.lastTimerRun ? ` (last ran ${timeAgo(data.lastTimerRun.at)})` : ""}, or when you hit "Send due emails now".
      </p>
    </div>
  );
}
