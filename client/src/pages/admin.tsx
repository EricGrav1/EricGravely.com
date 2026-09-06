import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, Mail, ListChecks, ChevronDown, ChevronUp,
  Plus, Trash2, Loader2, Save, X, Pencil, Lock, LogOut,
  LayoutDashboard, Package, Upload, CheckCircle2, AlertTriangle, ExternalLink, Send,
  Globe2, ArrowUpRight, ShieldCheck, Radio, Menu, Activity,
  ShoppingBag, RefreshCw, CreditCard,
} from "lucide-react";
import { Link } from "wouter";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { useTheme } from "@/lib/theme";
import { slugify } from "@shared/slug";
import { youtubeVideoId } from "@shared/video";
import type { LeadMagnet, SequenceEmail, QuestionnaireField, Broadcast } from "@shared/schema";

// ── Types for the admin leads endpoint ────────────────────────────────────────
interface AdminLead {
  id: number;
  email: string;
  firstName: string | null;
  leadMagnetId: number | null;
  resourceTitle: string;
  questionnaireAnswers: Record<string, string> | null;
  sequenceOptIn: boolean;
  sequenceStep: number;
  unsubscribed: boolean;
  createdAt: string;
}

function isAdminDesignPreview(): boolean {
  if (!import.meta.env.DEV || typeof window === "undefined") return false;
  const localHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  return localHost && new URLSearchParams(window.location.search).get("preview") === "1";
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────
interface AdminStats {
  totalLeads: number;
  leadsLast7: number;
  leadsPrev7: number;
  totalSubscribers: number;
  activeSubscribers: number;
  sequenceOptIns: number;
  unsubscribed: number;
  perProduct: { id: number; title: string; viewCount: number; submissionCount: number; conversionRate: number }[];
  signupsByDay: { date: string; count: number }[];
}

const PREVIEW_STATS: AdminStats = {
  totalLeads: 0,
  leadsLast7: 0,
  leadsPrev7: 0,
  totalSubscribers: 0,
  activeSubscribers: 0,
  sequenceOptIns: 0,
  unsubscribed: 0,
  perProduct: [
    { id: 1, title: "The Ask & Close Playbook", viewCount: 0, submissionCount: 0, conversionRate: 0 },
    { id: 2, title: "Sales Rep Self-Coaching Tool", viewCount: 0, submissionCount: 0, conversionRate: 0 },
    { id: 3, title: "Sales Coach AI", viewCount: 0, submissionCount: 0, conversionRate: 0 },
  ],
  signupsByDay: Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return { date: date.toISOString().slice(0, 10), count: 0 };
  }),
};

const PREVIEW_LEADS: AdminLead[] = [];

const PREVIEW_PRODUCTS: Array<LeadMagnet & { fileUploaded: boolean | null }> = [
  { id: 1, title: "The Ask & Close Playbook", description: "A question-based selling framework for every stage of the deal.", productType: "download", resourceUrl: "/downloads/ask-close-playbook.pdf", deliveryMethod: "email", externalUrl: null, buttonLabel: "Get the free playbook", iconPath: null, active: true, viewCount: 0, submissionCount: 0, questionnaireFields: [], previewImages: ["/ask-close-playbook-preview.jpg"], videoUrl: null, nextSteps: null, priceCents: null, currency: "usd", stripePriceId: null, createdAt: new Date(), fileUploaded: true },
  { id: 2, title: "Sales Rep Self-Coaching Tool", description: "Score your sales calls and see exactly where performance leaks.", productType: "download", resourceUrl: "/downloads/salesrep-coaching-tool.xlsx", deliveryMethod: "email", externalUrl: null, buttonLabel: "Get the free tool", iconPath: null, active: true, viewCount: 0, submissionCount: 0, questionnaireFields: [], previewImages: ["/sales-rep-self-coaching-preview.png"], videoUrl: null, nextSteps: null, priceCents: null, currency: "usd", stripePriceId: null, createdAt: new Date(), fileUploaded: true },
  { id: 3, title: "Sales Coach AI", description: "On-demand AI coaching for sales calls, objections, and performance.", productType: "external", resourceUrl: null, deliveryMethod: "email", externalUrl: "https://apps.apple.com/us/app/sales-coach-ai/id6748286535", buttonLabel: "View on the App Store", iconPath: "/sales-coach-ai-icon.png", active: true, viewCount: 0, submissionCount: 0, questionnaireFields: null, previewImages: null, videoUrl: null, nextSteps: null, priceCents: null, currency: "usd", stripePriceId: null, createdAt: new Date(), fileUploaded: null },
  { id: 4, title: "Sales Manager Coaching Tool", description: "A structured scorecard for focused, measurable sales coaching.", productType: "paid_download", resourceUrl: "/downloads/Sales-Manager-Coaching-Tool-Bundle.zip", deliveryMethod: "purchase", externalUrl: null, buttonLabel: "Buy now — $39.99", iconPath: null, active: true, viewCount: 0, submissionCount: 0, questionnaireFields: null, previewImages: ["/sales-manager-coaching-tool-preview.png"], videoUrl: null, nextSteps: null, priceCents: 3999, currency: "usd", stripePriceId: null, createdAt: new Date(), fileUploaded: true },
];

const PREVIEW_SEQUENCE_EMAILS: SequenceEmail[] = [
  { id: 1, dayOffset: 1, subject: "Did you open it yet, {{first_name}}?", body: "Quick check-in on the resource I sent you.", audience: "resource", active: true, createdAt: new Date() },
  { id: 2, dayOffset: 3, subject: "The mistake I see on almost every call", body: "A practical sales coaching lesson.", audience: "resource", active: true, createdAt: new Date() },
  { id: 3, dayOffset: 5, subject: "Steal this: my 3-question close check", body: "Three questions to pressure-test a deal.", audience: "resource", active: true, createdAt: new Date() },
  { id: 4, dayOffset: 1, subject: "The rule I use before coaching any rep", body: "Diagnose before you prescribe.", audience: "newsletter", active: true, createdAt: new Date() },
  { id: 5, dayOffset: 3, subject: "Your reps do not need another pep talk", body: "Turn broad feedback into observable behavior.", audience: "newsletter", active: true, createdAt: new Date() },
  { id: 6, dayOffset: 6, subject: "The three steps behind better rep performance", body: "Read the Rep. Examine the Evidence. Practice to Performance.", audience: "newsletter", active: true, createdAt: new Date() },
];

const PREVIEW_BROADCASTS: Broadcast[] = [];

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div
      className="rounded-xl px-4 py-4"
      style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
    >
      <div className="text-[11px] uppercase tracking-wider mb-1.5" style={{ color: "var(--c-fg-45)" }}>{label}</div>
      <div className="font-display text-2xl font-bold" style={{ color: "var(--c-fg)" }}>{value}</div>
      {hint && <div className="text-[11px] mt-1" style={{ color: "var(--c-fg-45)" }}>{hint}</div>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", boxShadow: "0 4px 14px rgba(0,0,0,0.12)" }}
    >
      <div style={{ color: "var(--c-fg-45)" }}>{label && formatDate(label)}</div>
      <div className="font-semibold" style={{ color: "var(--c-fg)" }}>
        {payload[0].value} signup{payload[0].value === 1 ? "" : "s"}
      </div>
    </div>
  );
}

function DashboardTab({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    placeholderData: isAdminDesignPreview() ? PREVIEW_STATS : undefined,
    enabled: !isAdminDesignPreview(),
  });
  const { theme } = useTheme();
  // Brand gold, snapped per surface (validated for lightness + contrast)
  const barColor = theme === "dark" ? "#B08D1E" : "#C9A227";
  const mutedText = theme === "dark" ? "rgba(250,247,242,0.45)" : "rgba(13,13,13,0.45)";
  const gridColor = theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  if (isLoading || !stats) {
    return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} /></div>;
  }

  const weekDelta = stats.leadsLast7 - stats.leadsPrev7;
  const deltaHint =
    stats.leadsPrev7 === 0 && stats.leadsLast7 === 0
      ? "no signups yet this week"
      : `${weekDelta >= 0 ? "+" : ""}${weekDelta} vs. previous 7 days`;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        <button
          onClick={() => onNavigate("sequence")}
          className="admin-action-card group text-left"
          data-testid="quick-action-automations"
        >
          <div className="admin-action-icon"><Radio className="w-4 h-4" /></div>
          <div className="mt-5 text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Automated emails</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
            Review the emails new subscribers receive after signup.
          </p>
          <ArrowUpRight className="admin-action-arrow" />
        </button>
        <button
          onClick={() => onNavigate("broadcast")}
          className="admin-action-card group text-left"
          data-testid="quick-action-broadcast"
        >
          <div className="admin-action-icon"><Send className="w-4 h-4" /></div>
          <div className="mt-5 text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Send an update</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
            Write, test, and send a one-time email to your active list.
          </p>
          <ArrowUpRight className="admin-action-arrow" />
        </button>
        <button
          onClick={() => onNavigate("products")}
          className="admin-action-card group text-left"
          data-testid="quick-action-products"
        >
          <div className="admin-action-icon"><Package className="w-4 h-4" /></div>
          <div className="mt-5 text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Manage products</div>
          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
            Update offers, downloads, previews, and public visibility.
          </p>
          <ArrowUpRight className="admin-action-arrow" />
        </button>
      </section>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Total signups" value={stats.totalLeads} />
        <StatTile label="Last 7 days" value={stats.leadsLast7} hint={deltaHint} />
        <StatTile label="Active subscribers" value={stats.activeSubscribers} hint={`${stats.unsubscribed} unsubscribed`} />
        <StatTile label="Sequence opt-ins" value={stats.sequenceOptIns} />
      </div>

      {/* Signups over the last 30 days */}
      <div
        className="rounded-xl px-4 pt-4 pb-2"
        style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
      >
        <div className="text-[11px] uppercase tracking-wider mb-3" style={{ color: "var(--c-fg-45)" }}>
          Signups — last 30 days
        </div>
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={stats.signupsByDay} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={gridColor} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: mutedText }}
                tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                minTickGap={28}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: mutedText }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: gridColor }} />
              <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-product performance */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
      >
        <div className="text-[11px] uppercase tracking-wider px-4 pt-4 pb-2" style={{ color: "var(--c-fg-45)" }}>
          Product performance
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--c-fg-45)" }}>
                <th className="text-left font-medium px-4 py-2 text-xs">Product</th>
                <th className="text-right font-medium px-4 py-2 text-xs">Views</th>
                <th className="text-right font-medium px-4 py-2 text-xs">Signups</th>
                <th className="text-right font-medium px-4 py-2 text-xs">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {stats.perProduct.map((p) => (
                <tr key={p.id} style={{ borderTop: "1px solid var(--c-border)" }}>
                  <td className="px-4 py-2.5" style={{ color: "var(--c-fg)" }}>{p.title}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--c-fg-70)" }}>{p.viewCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--c-fg-70)" }}>{p.submissionCount}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums" style={{ color: "var(--c-fg-70)" }}>
                    {p.viewCount > 0 ? `${p.conversionRate}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] px-4 py-3" style={{ color: "var(--c-fg-45)" }}>
          Views are counted when someone opens a product page or starts the signup flow — tracking starts with this update, so older products begin at zero.
        </p>
      </div>
    </div>
  );
}

// ── Signups tab ───────────────────────────────────────────────────────────────
function SignupsTab() {
  const { data: leads, isLoading } = useQuery<AdminLead[]>({
    queryKey: ["/api/admin/leads"],
    placeholderData: isAdminDesignPreview() ? PREVIEW_LEADS : undefined,
    enabled: !isAdminDesignPreview(),
  });
  const [expanded, setExpanded] = useState<number | null>(null);

  if (isLoading) {
    return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} /></div>;
  }
  if (!leads || leads.length === 0) {
    return (
      <p className="py-16 text-center text-sm" style={{ color: "var(--c-fg-45)" }} data-testid="text-no-signups">
        No signups yet. They'll show up here as people request your resources.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {leads.map((lead) => {
        const isOpen = expanded === lead.id;
        const answers = lead.questionnaireAnswers ?? null;
        return (
          <div
            key={lead.id}
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
            data-testid={`row-signup-${lead.id}`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : lead.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              data-testid={`button-expand-${lead.id}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--c-fg)" }} data-testid={`text-email-${lead.id}`}>
                    {lead.email}
                  </span>
                  {lead.firstName && (
                    <span className="text-xs" style={{ color: "var(--c-fg-45)" }}>({lead.firstName})</span>
                  )}
                  {lead.unsubscribed && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "var(--c-border)", color: "var(--c-fg-45)" }}>
                      Unsubscribed
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--c-fg-45)" }}>
                  {lead.resourceTitle} · {formatDate(lead.createdAt)}
                  {lead.sequenceOptIn && ` · Sequence: email ${lead.sequenceStep} sent`}
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--c-fg-45)" }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--c-fg-45)" }} />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--c-border)" }}>
                {answers && Object.keys(answers).length > 0 ? (
                  <dl className="space-y-2 mt-3">
                    {Object.entries(answers).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-[11px] uppercase tracking-wider" style={{ color: "var(--c-fg-45)" }}>{key}</dt>
                        <dd className="text-sm" style={{ color: "var(--c-fg)" }} data-testid={`text-answer-${lead.id}-${key}`}>{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="text-xs mt-3" style={{ color: "var(--c-fg-45)" }}>No questionnaire answers for this signup.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Products (manager) tab ────────────────────────────────────────────────────
type AdminMagnet = LeadMagnet & { fileUploaded: boolean | null };

interface ProductFormData {
  title: string;
  description: string;
  productType: string;
  buttonLabel: string;
  externalUrl: string;
  iconPath: string;
  resourceUrl: string;
  videoUrl: string;
  previewImages: string[];
  priceCents: number | null;
  currency: string;
  stripePriceId: string;
  active: boolean;
}

function emptyProductForm(): ProductFormData {
  return {
    title: "", description: "", productType: "download",
    buttonLabel: "", externalUrl: "", iconPath: "", resourceUrl: "",
    videoUrl: "", previewImages: [], priceCents: null, currency: "usd", stripePriceId: "", active: true,
  };
}

function toApiPayload(f: ProductFormData) {
  const isOutbound = f.productType === "external" || f.productType === "game";
  const isDownload = f.productType === "download" || f.productType === "paid_download";
  const isPaid = f.productType === "paid_download";
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    productType: f.productType,
    buttonLabel: f.buttonLabel.trim() || null,
    externalUrl: isOutbound ? (f.externalUrl.trim() || null) : null,
    iconPath: f.iconPath.trim() || null,
    resourceUrl: isDownload ? (f.resourceUrl || null) : null,
    videoUrl: f.videoUrl.trim() || null,
    previewImages: f.previewImages.length > 0 ? f.previewImages : null,
    priceCents: isPaid ? f.priceCents : null,
    currency: isPaid ? f.currency.toLowerCase() : "usd",
    stripePriceId: isPaid ? (f.stripePriceId.trim() || null) : null,
    active: f.active,
  };
}

function FileUploader({
  currentUrl, onUploaded,
}: { currentUrl: string; onUploaded: (resourceUrl: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json() as { resourceUrl?: string; message?: string };
      if (!res.ok || !data.resourceUrl) {
        setError(data.message || "Upload failed.");
        return;
      }
      onUploaded(data.resourceUrl);
    } catch {
      setError("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const filename = currentUrl ? currentUrl.split("/").pop() : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
          style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)", background: "var(--c-accent-06)" }}
          data-testid="button-upload-file"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {filename ? "Replace file" : "Upload file"}
        </button>
        {filename && (
          <span className="text-xs flex items-center gap-1.5" style={{ color: "var(--c-fg-55)" }}>
            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--c-accent)" }} />
            {filename}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.xlsx,.xls,.csv,.docx,.pptx,.zip,.png,.jpg,.jpeg"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      {error && <p className="text-xs" style={{ color: "#B4552D" }}>{error}</p>}
    </div>
  );
}

// Upload + remove preview images (public, shown in "Peek inside" and on the
// product detail page). Order = display order.
function PreviewImagesManager({
  images, onChange,
}: { images: string[]; onChange: (images: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    setError("");
    const added: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append("kind", "preview");
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd, credentials: "include" });
        const data = await res.json() as { resourceUrl?: string; message?: string };
        if (!res.ok || !data.resourceUrl) {
          setError(data.message || `Upload failed for ${file.name}.`);
          continue;
        }
        added.push(data.resourceUrl);
      } catch {
        setError(`Upload failed for ${file.name}.`);
      }
    }
    if (added.length > 0) onChange([...images, ...added]);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((src, i) => (
            <div key={src} className="relative group">
              <img
                src={src}
                alt={`Preview ${i + 1}`}
                className="w-16 h-20 object-cover rounded-lg"
                style={{ border: "1px solid var(--c-border)" }}
              />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: "var(--c-bg)", border: "1px solid var(--c-border)", color: "var(--c-fg-55)" }}
                aria-label={`Remove preview ${i + 1}`}
                data-testid={`button-remove-preview-${i}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
        style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)", background: "var(--c-accent-06)" }}
        data-testid="button-upload-preview"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        Add preview image{images.length > 0 ? "s" : ""}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.gif"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
      />
      {error && <p className="text-xs" style={{ color: "#B4552D" }}>{error}</p>}
      <p className="text-[11px]" style={{ color: "var(--c-fg-45)" }}>
        Screenshots of a few pages work great. They are view-only previews; the downloadable file remains gated by the product&apos;s signup or purchase flow.
      </p>
    </div>
  );
}

function ProductForm({
  initial, onSave, onCancel, saving, isNew,
}: {
  initial: ProductFormData;
  onSave: (data: ProductFormData) => void;
  onCancel: () => void;
  saving: boolean;
  isNew: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (patch: Partial<ProductFormData>) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.description.trim()) { setError("Description is required."); return; }
    if ((form.productType === "external" || form.productType === "game") && !form.externalUrl.trim()) {
      setError("Apps and games need a destination link.");
      return;
    }
    if (form.productType === "paid_download" && (!form.priceCents || form.priceCents < 50)) {
      setError("Paid downloads need a valid price.");
      return;
    }
    if (form.productType === "paid_download" && form.stripePriceId.trim() && !form.stripePriceId.trim().startsWith("price_")) {
      setError("Stripe Price IDs start with price_. Leave this blank to use the price entered here.");
      return;
    }
    if (form.videoUrl.trim() && !youtubeVideoId(form.videoUrl.trim())) {
      setError("That doesn't look like a YouTube link — paste the URL of the video (watch, share, or Shorts link).");
      return;
    }
    setError("");
    onSave(form);
  };

  const labelStyle = { color: "var(--c-fg-55)" } as const;

  return (
    <div className="space-y-3 mt-3">
      <div>
        <label className="text-xs block mb-1" style={labelStyle}>Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Product title"
          className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
          data-testid="input-product-title"
        />
        {form.title.trim() && (
          <p className="text-[11px] mt-1" style={{ color: "var(--c-fg-45)" }}>
            Public page: /products/{slugify(form.title)}
            {!isNew && " — renaming changes this URL"}
          </p>
        )}
      </div>

      <div>
        <label className="text-xs block mb-1" style={labelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          placeholder="What is it, who is it for, why should they want it?"
          rows={3}
          className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm resize-y"
          data-testid="input-product-description"
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <label className="text-xs flex items-center gap-2" style={labelStyle}>
          Type
          <select
            value={form.productType}
            onChange={(e) => set({ productType: e.target.value })}
            className="input-dark px-2.5 py-1.5 rounded-lg text-xs"
            data-testid="select-product-type"
          >
            <option value="download">Free download (email-gated)</option>
            <option value="paid_download">Paid digital download (Stripe)</option>
            <option value="external">External link (app, paid product)</option>
            <option value="game">Sales game (playable link)</option>
          </select>
        </label>
        <label className="text-xs flex items-center gap-2 cursor-pointer" style={labelStyle}>
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => set({ active: e.target.checked })}
            className="accent-[#C9A227]"
            data-testid="checkbox-product-active"
          />
          Active (visible on the site)
        </label>
      </div>

      <div>
        <label className="text-xs block mb-1" style={labelStyle}>Button label (optional)</label>
        <input
          type="text"
          value={form.buttonLabel}
          onChange={(e) => set({ buttonLabel: e.target.value })}
          placeholder={form.productType === "game" ? "e.g. Play the game" : form.productType === "external" ? "e.g. Download on the App Store" : form.productType === "paid_download" ? "e.g. Buy the coaching tool" : "e.g. Get the free playbook"}
          className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
          data-testid="input-product-button"
        />
      </div>

      {form.productType === "external" || form.productType === "game" ? (
        <>
          <div>
            <label className="text-xs block mb-1" style={labelStyle}>
              {form.productType === "game" ? "Game URL" : "External link"}
            </label>
            <input
              type="url"
              value={form.externalUrl}
              onChange={(e) => set({ externalUrl: e.target.value })}
              placeholder="https://…"
              className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
              data-testid="input-product-external-url"
            />
          </div>
          <div>
            <label className="text-xs block mb-1" style={labelStyle}>Icon path (optional)</label>
            <input
              type="text"
              value={form.iconPath}
              onChange={(e) => set({ iconPath: e.target.value })}
              placeholder="/sales-coach-ai-icon.png"
              className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
              data-testid="input-product-icon"
            />
          </div>
        </>
      ) : (
        <>
          {form.productType === "paid_download" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs block mb-1" style={labelStyle}>Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm" style={{ color: "var(--c-fg-45)" }}>$</span>
                  <input
                    type="number"
                    min="0.50"
                    step="0.01"
                    value={form.priceCents == null ? "" : (form.priceCents / 100).toFixed(2)}
                    onChange={(e) => set({ priceCents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                    className="input-dark w-full pl-7 pr-3.5 py-2.5 rounded-lg text-sm"
                    data-testid="input-product-price"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs block mb-1" style={labelStyle}>Stripe Price ID (optional)</label>
                <input
                  type="text"
                  value={form.stripePriceId}
                  onChange={(e) => set({ stripePriceId: e.target.value })}
                  placeholder="price_…"
                  className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-xs block mb-1" style={labelStyle}>
              {form.productType === "paid_download" ? "Purchase bundle (private ZIP)" : "Resource file (delivered by email)"}
            </label>
            <FileUploader
              currentUrl={form.resourceUrl}
              onUploaded={(resourceUrl) => set({ resourceUrl })}
            />
          </div>
        </>
      )}

      <div>
        <label className="text-xs block mb-1" style={labelStyle}>Overview video — YouTube link (optional)</label>
        <input
          type="url"
          value={form.videoUrl}
          onChange={(e) => set({ videoUrl: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=…"
          className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
          data-testid="input-product-video"
        />
        <p className="text-[11px] mt-1" style={{ color: "var(--c-fg-45)" }}>
          Embedded on the product's page — a walkthrough of the resource converts better than text alone.
        </p>
      </div>

      <div>
        <label className="text-xs block mb-1" style={labelStyle}>Preview images (optional)</label>
        <PreviewImagesManager
          images={form.previewImages}
          onChange={(previewImages) => set({ previewImages })}
        />
      </div>

      {error && <p className="text-xs" style={{ color: "#B4552D" }}>{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-accent px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 disabled:opacity-60"
          data-testid="button-product-save"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {isNew ? "Create product" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
          style={{ color: "var(--c-fg-55)", border: "1px solid var(--c-border)" }}
          data-testid="button-product-cancel"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}

function ProductsTab() {
  const { data: magnets, isLoading } = useQuery<AdminMagnet[]>({
    queryKey: ["/api/admin/lead-magnets"],
    placeholderData: isAdminDesignPreview() ? PREVIEW_PRODUCTS : undefined,
    enabled: !isAdminDesignPreview(),
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-magnets"] });
    queryClient.invalidateQueries({ queryKey: ["/api/lead-magnets"] });
  };

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => apiRequest("POST", "/api/admin/lead-magnets", toApiPayload(data)),
    onSuccess: () => { invalidate(); setCreating(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductFormData }) =>
      apiRequest("PATCH", `/api/admin/lead-magnets/${id}`, toApiPayload(data)),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });

  if (isLoading) {
    return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} /></div>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
        Everything shown on /products. Free downloads are email-gated, paid downloads use Stripe, and apps and games link straight out.
        Each product also gets its own page at /products/&lt;name&gt;.
      </p>

      {(magnets ?? []).map((m) => {
        const isOpen = editingId === m.id;
        const needsFile = (m.productType === "download" || m.productType === "paid_download") && m.fileUploaded === false;
        return (
          <div
            key={m.id}
            className="rounded-xl px-4 py-3"
            style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)", opacity: m.active ? 1 : 0.6 }}
            data-testid={`row-product-${m.id}`}
          >
            <div className="flex items-center gap-3">
              <span
                className="text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                style={{ background: "var(--c-accent-10)", color: "var(--c-accent)", border: "1px solid var(--c-accent-15)" }}
              >
                {m.productType === "game" ? "Game" : m.productType === "external" ? "Link" : m.productType === "paid_download" ? "Paid" : "Download"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold truncate" style={{ color: "var(--c-fg)" }}>{m.title}</span>
                  {!m.active && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "var(--c-border)", color: "var(--c-fg-45)" }}>
                      Hidden
                    </span>
                  )}
                </div>
                {needsFile ? (
                  <div className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "#B4552D" }}>
                    <AlertTriangle className="w-3 h-3" /> No file uploaded — signups get an error until one is added
                  </div>
                ) : (
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--c-fg-45)" }}>
                    {m.productType === "paid_download" && m.priceCents != null
                      ? `${new Intl.NumberFormat("en-US", { style: "currency", currency: (m.currency ?? "usd").toUpperCase() }).format(m.priceCents / 100)} · `
                      : ""}
                    {m.submissionCount} signup{m.submissionCount === 1 ? "" : "s"} · {m.viewCount} view{m.viewCount === 1 ? "" : "s"}
                  </div>
                )}
              </div>
              {m.active && (
                <a
                  href={`/products/${slugify(m.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
                  aria-label="Open public page"
                  data-testid={`link-view-product-${m.id}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => { setEditingId(isOpen ? null : m.id); setCreating(false); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
                aria-label="Edit product"
                data-testid={`button-edit-product-${m.id}`}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {isOpen && (
              <ProductForm
                initial={{
                  title: m.title,
                  description: m.description,
                  productType: m.productType,
                  buttonLabel: m.buttonLabel ?? "",
                  externalUrl: m.externalUrl ?? "",
                  iconPath: m.iconPath ?? "",
                  resourceUrl: m.resourceUrl ?? "",
                  videoUrl: m.videoUrl ?? "",
                  previewImages: (m.previewImages as string[] | null) ?? [],
                  priceCents: m.priceCents,
                  currency: m.currency ?? "usd",
                  stripePriceId: m.stripePriceId ?? "",
                  active: m.active,
                }}
                onSave={(data) => updateMutation.mutate({ id: m.id, data })}
                onCancel={() => setEditingId(null)}
                saving={updateMutation.isPending}
                isNew={false}
              />
            )}
          </div>
        );
      })}

      {creating ? (
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>New product</div>
          <ProductForm
            initial={emptyProductForm()}
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setCreating(false)}
            saving={createMutation.isPending}
            isNew
          />
        </div>
      ) : (
        <button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)", background: "var(--c-accent-10)" }}
          data-testid="button-add-product"
        >
          <Plus className="w-4 h-4" /> Add product
        </button>
      )}
    </div>
  );
}

// ── Orders tab ───────────────────────────────────────────────────────────────
interface AdminOrder {
  id: number;
  productTitle: string;
  customerEmail: string;
  customerName: string | null;
  amountTotal: number;
  currency: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  downloadCount: number;
  maxDownloads: number;
  downloadExpiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface AdminOrdersResponse {
  checkoutConfigured: boolean;
  webhookConfigured: boolean;
  orders: AdminOrder[];
}

const PREVIEW_ORDERS: AdminOrdersResponse = {
  checkoutConfigured: false,
  webhookConfigured: false,
  orders: [],
};

function OrdersTab() {
  const designPreview = isAdminDesignPreview();
  const { data, isLoading } = useQuery<AdminOrdersResponse>({
    queryKey: ["/api/admin/orders"],
    placeholderData: designPreview ? PREVIEW_ORDERS : undefined,
    enabled: !designPreview,
  });
  const [message, setMessage] = useState("");

  const resendMutation = useMutation({
    mutationFn: (orderId: number) => apiRequest("POST", `/api/admin/orders/${orderId}/resend`),
    onSuccess: () => {
      setMessage("A fresh 30-day download link was emailed to the buyer.");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
    },
    onError: (error: Error) => setMessage(error.message.replace(/^\d+:\s*/, "")),
  });

  if (isLoading) {
    return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} /></div>;
  }

  const orders = data?.orders ?? [];
  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const revenue = paidOrders.reduce((sum, order) => sum + order.amountTotal, 0);

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        <StatTile label="Paid orders" value={paidOrders.length} />
        <StatTile label="Gross sales" value={new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(revenue / 100)} />
        <StatTile label="Delivery issues" value={orders.filter((order) => order.fulfillmentStatus === "failed").length} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--c-accent-10)" }}><CreditCard className="w-4 h-4" style={{ color: "var(--c-accent)" }} /></div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Stripe checkout</div>
            <div className="text-xs" style={{ color: data?.checkoutConfigured ? "#4fa675" : "#b87836" }}>{data?.checkoutConfigured ? "Connected" : "Needs STRIPE_SECRET_KEY"}</div>
          </div>
        </div>
        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--c-accent-10)" }}><Radio className="w-4 h-4" style={{ color: "var(--c-accent)" }} /></div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Payment webhook</div>
            <div className="text-xs" style={{ color: data?.webhookConfigured ? "#4fa675" : "#b87836" }}>{data?.webhookConfigured ? "Connected" : "Needs STRIPE_WEBHOOK_SECRET"}</div>
          </div>
        </div>
      </div>

      {message && <div className="rounded-lg px-4 py-3 text-xs" style={{ background: "var(--c-accent-10)", border: "1px solid var(--c-accent-15)", color: "var(--c-fg-70)" }}>{message}</div>}

      {orders.length === 0 ? (
        <div className="rounded-xl py-16 px-5 text-center" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
          <ShoppingBag className="w-8 h-8 mx-auto mb-4" style={{ color: "var(--c-accent)" }} />
          <h3 className="font-display text-lg font-bold mb-2" style={{ color: "var(--c-fg)" }}>No purchases yet</h3>
          <p className="text-sm" style={{ color: "var(--c-fg-45)" }}>Paid orders will appear here as soon as Stripe confirms them.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl p-4" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>{order.customerName || order.customerEmail}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "var(--c-accent-10)", color: "var(--c-accent)" }}>{order.paymentStatus}</span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "var(--c-bg2)", color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}>{order.fulfillmentStatus}</span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: "var(--c-fg-45)" }}>{order.customerEmail} · {order.productTitle}</div>
                  <div className="text-[11px] mt-1" style={{ color: "var(--c-fg-45)" }}>
                    {formatDate(order.paidAt || order.createdAt)} · {order.downloadCount}/{order.maxDownloads} downloads
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="font-display text-lg font-bold mb-2" style={{ color: "var(--c-fg)" }}>{new Intl.NumberFormat("en-US", { style: "currency", currency: order.currency.toUpperCase() }).format(order.amountTotal / 100)}</div>
                  {order.paymentStatus === "paid" && (
                    <button
                      type="button"
                      onClick={() => { setMessage(""); resendMutation.mutate(order.id); }}
                      disabled={resendMutation.isPending}
                      className="text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
                      style={{ color: "var(--c-accent)" }}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendMutation.isPending ? "animate-spin" : ""}`} /> Reset &amp; resend link
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sequence tab ──────────────────────────────────────────────────────────────
interface SequenceFormData {
  dayOffset: number;
  subject: string;
  body: string;
  active: boolean;
}

function SequenceEmailForm({
  initial, onSave, onCancel, saving,
}: {
  initial: SequenceFormData;
  onSave: (data: SequenceFormData) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [dayOffset, setDayOffset] = useState(initial.dayOffset);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [active, setActive] = useState(initial.active);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!subject.trim()) { setError("Subject is required."); return; }
    if (!body.trim()) { setError("Body is required."); return; }
    if (dayOffset < 0 || isNaN(dayOffset)) { setError("Day must be 0 or later."); return; }
    onSave({ dayOffset, subject: subject.trim(), body: body.trim(), active });
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs flex items-center gap-2" style={{ color: "var(--c-fg-55)" }}>
          Send on day
          <input
            type="number"
            min={0}
            value={dayOffset}
            onChange={(e) => setDayOffset(Number(e.target.value))}
            className="input-dark w-20 px-2.5 py-1.5 rounded-lg text-sm"
            data-testid="input-seq-day"
          />
        </label>
        <label className="text-xs flex items-center gap-2 cursor-pointer" style={{ color: "var(--c-fg-55)" }}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="accent-[#C9A227]"
            data-testid="checkbox-seq-active"
          />
          Active
        </label>
      </div>
      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject line ({{first_name}} works here)"
        className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
        data-testid="input-seq-subject"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={"Email body — plain text. Use {{first_name}} to personalize. Blank lines create paragraphs."}
        rows={8}
        className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm resize-y"
        data-testid="input-seq-body"
      />
      {error && <p className="text-xs" style={{ color: "#B4552D" }}>{error}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-accent px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 disabled:opacity-60"
          data-testid="button-seq-save"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
          style={{ color: "var(--c-fg-55)", border: "1px solid var(--c-border)" }}
          data-testid="button-seq-cancel"
        >
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}

const AUDIENCES = [
  {
    id: "resource",
    label: "Resource signups",
    description: "Follow-up series for people who request a free resource. Their download email is sent immediately.",
  },
  {
    id: "newsletter",
    label: "Newsletter signups",
    description: "Welcome series for people who join through the newsletter form in the site footer.",
  },
] as const;

function SequenceTab() {
  const { data: emails, isLoading } = useQuery<SequenceEmail[]>({
    queryKey: ["/api/admin/sequence-emails"],
    placeholderData: isAdminDesignPreview() ? PREVIEW_SEQUENCE_EMAILS : undefined,
    enabled: !isAdminDesignPreview(),
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState<string | null>(null); // audience id or null

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/sequence-emails"] });

  const createMutation = useMutation({
    mutationFn: ({ data, audience }: { data: SequenceFormData; audience: string }) =>
      apiRequest("POST", "/api/admin/sequence-emails", { ...data, audience }),
    onSuccess: () => { invalidate(); setCreating(null); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: SequenceFormData }) =>
      apiRequest("PATCH", `/api/admin/sequence-emails/${id}`, data),
    onSuccess: () => { invalidate(); setEditingId(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/sequence-emails/${id}`),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="admin-callout">
        <div className="admin-callout-icon"><Activity className="w-4 h-4" /></div>
        <div>
          <div className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>Runs automatically after signup</div>
          <p className="text-xs leading-relaxed mt-1" style={{ color: "var(--c-fg-45)" }}>
            Each person enters the series that matches where they signed up. Day 1 means one day after signup.
            Use {"{{first_name}}"} anywhere you want their name to appear.
          </p>
        </div>
      </div>

      {AUDIENCES.map((aud) => {
        const audEmails = (emails ?? []).filter((e) => (e.audience ?? "resource") === aud.id);
        return (
          <div key={aud.id} className="space-y-3">
            <div>
              <div className="text-sm font-display font-bold" style={{ color: "var(--c-fg)" }}>{aud.label}</div>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-fg-45)" }}>{aud.description}</p>
            </div>

            {audEmails.length === 0 && creating !== aud.id && (
              <p className="text-xs py-3 text-center rounded-xl" style={{ color: "var(--c-fg-45)", border: "1px dashed var(--c-border)" }}>
                No emails in this series yet — subscribers here won't receive follow-ups until you add one.
              </p>
            )}

            {audEmails.map((em) => (
        <div
          key={em.id}
          className="rounded-xl px-4 py-3"
          style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)", opacity: em.active ? 1 : 0.6 }}
          data-testid={`row-sequence-${em.id}`}
        >
          <div className="flex items-center gap-3">
            <span
              className="text-[11px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
              style={{ background: "var(--c-accent-10)", color: "var(--c-accent)", border: "1px solid var(--c-accent-15)" }}
            >
              Day {em.dayOffset}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--c-fg)" }} data-testid={`text-seq-subject-${em.id}`}>
                {em.subject}
              </div>
              {!em.active && (
                <div className="text-[11px]" style={{ color: "var(--c-fg-45)" }}>Inactive — won't be sent</div>
              )}
            </div>
            <button
              onClick={() => { setEditingId(editingId === em.id ? null : em.id); setCreating(null); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
              aria-label="Edit email"
              data-testid={`button-edit-seq-${em.id}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${em.subject}"? Subscribers currently at this step will skip to the next email.`)) {
                  deleteMutation.mutate(em.id);
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
              aria-label="Delete email"
              data-testid={`button-delete-seq-${em.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

                {editingId === em.id && (
                  <SequenceEmailForm
                    initial={{ dayOffset: em.dayOffset, subject: em.subject, body: em.body, active: em.active }}
                    onSave={(data) => updateMutation.mutate({ id: em.id, data })}
                    onCancel={() => setEditingId(null)}
                    saving={updateMutation.isPending}
                  />
                )}
              </div>
            ))}

            {creating === aud.id ? (
              <div className="rounded-xl px-4 py-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
                <div className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>New email — {aud.label}</div>
                <SequenceEmailForm
                  initial={{ dayOffset: (audEmails.length ? Math.max(...audEmails.map((e) => e.dayOffset)) + 2 : 1), subject: "", body: "", active: true }}
                  onSave={(data) => createMutation.mutate({ data, audience: aud.id })}
                  onCancel={() => setCreating(null)}
                  saving={createMutation.isPending}
                />
              </div>
            ) : (
              <button
                onClick={() => { setCreating(aud.id); setEditingId(null); }}
                className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)", background: "var(--c-accent-10)" }}
                data-testid={`button-add-sequence-${aud.id}`}
              >
                <Plus className="w-4 h-4" /> Add email
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Broadcast tab ─────────────────────────────────────────────────────────────
interface BroadcastData {
  broadcasts: Broadcast[];
  isSending: boolean;
  activeSubscribers: number;
}

function BroadcastTab() {
  const { data, isLoading } = useQuery<BroadcastData>({
    queryKey: ["/api/admin/broadcasts"],
    placeholderData: isAdminDesignPreview()
      ? { broadcasts: PREVIEW_BROADCASTS, isSending: false, activeSubscribers: PREVIEW_STATS.activeSubscribers }
      : undefined,
    enabled: !isAdminDesignPreview(),
    refetchInterval: (query) => (query.state.data?.isSending ? 3000 : false),
  });
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testTo, setTestTo] = useState("eric@ericgravely.com");
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });

  const parseErr = (err: Error) => {
    try { return JSON.parse(err.message.replace(/^\d+:\s*/, "")).message ?? "Something went wrong."; }
    catch { return "Something went wrong."; }
  };

  const testMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/broadcasts/test", { subject, body, to: testTo }),
    onSuccess: () => setNotice({ kind: "ok", text: `Test sent to ${testTo} — check that inbox.` }),
    onError: (err: Error) => setNotice({ kind: "err", text: parseErr(err) }),
  });

  const sendMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/broadcasts", { subject, body }),
    onSuccess: () => {
      setNotice({ kind: "ok", text: "Broadcast started — progress shows below." });
      setSubject("");
      setBody("");
      invalidate();
    },
    onError: (err: Error) => setNotice({ kind: "err", text: parseErr(err) }),
  });

  const canSubmit = subject.trim().length > 0 && body.trim().length > 0;
  const recipients = data?.activeSubscribers ?? 0;

  const handleSendAll = () => {
    if (!canSubmit) { setNotice({ kind: "err", text: "Subject and body are required." }); return; }
    if (confirm(`Send "${subject.trim()}" to all ${recipients} active subscribers? This can't be undone.`)) {
      sendMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Compose */}
      <div className="rounded-xl px-4 py-4 space-y-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
        <div className="text-sm font-display font-bold" style={{ color: "var(--c-fg)" }}>
          New broadcast
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
          A one-time email to all {recipients} active subscribers. Use {"{{first_name}}"} for personalization.
          Your branded layout and unsubscribe link are added automatically. Send yourself a test before the final send.
        </p>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject line"
          className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
          data-testid="input-broadcast-subject"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={"Email body — plain text. Use {{first_name}} to personalize. Blank lines create paragraphs."}
          rows={10}
          className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm resize-y"
          data-testid="input-broadcast-body"
        />

        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="Test email address"
            className="input-dark px-3 py-2 rounded-lg text-xs w-56"
            data-testid="input-broadcast-test-to"
          />
          <button
            onClick={() => { setNotice(null); testMutation.mutate(); }}
            disabled={!canSubmit || testMutation.isPending}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            style={{ color: "var(--c-accent)", border: "1px solid var(--c-accent-15)" }}
            data-testid="button-broadcast-test"
          >
            {testMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
            Send test
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSendAll}
            disabled={!canSubmit || sendMutation.isPending || data?.isSending}
            className="btn-accent px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 disabled:opacity-50"
            data-testid="button-broadcast-send"
          >
            {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send to everyone
          </button>
        </div>

        {data?.isSending && (
          <p className="text-xs" style={{ color: "var(--c-fg-45)" }}>
            A broadcast is currently sending — you can start the next one when it finishes.
          </p>
        )}
        {notice && (
          <p className="text-xs" style={{ color: notice.kind === "ok" ? "var(--c-accent)" : "#B4552D" }} data-testid="text-broadcast-notice">
            {notice.text}
          </p>
        )}
      </div>

      {/* History */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider" style={{ color: "var(--c-fg-45)" }}>Past broadcasts</div>
        {(data?.broadcasts ?? []).length === 0 && (
          <p className="text-xs py-4 text-center rounded-xl" style={{ color: "var(--c-fg-45)", border: "1px dashed var(--c-border)" }}>
            Nothing sent yet.
          </p>
        )}
        {(data?.broadcasts ?? []).map((b) => (
          <div
            key={b.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
            data-testid={`row-broadcast-${b.id}`}
          >
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--c-fg)" }}>{b.subject}</div>
              <div className="text-[11px] mt-0.5" style={{ color: "var(--c-fg-45)" }}>
                {formatDate(b.createdAt)} · {b.sentCount}/{b.totalRecipients} sent
                {b.failedCount > 0 && ` · ${b.failedCount} failed`}
              </div>
            </div>
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-1 rounded flex-shrink-0"
              style={
                b.status === "sending"
                  ? { background: "var(--c-accent-10)", color: "var(--c-accent)", border: "1px solid var(--c-accent-15)" }
                  : { background: "var(--c-border)", color: "var(--c-fg-45)" }
              }
            >
              {b.status === "sending" ? "Sending…" : b.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Questions tab ─────────────────────────────────────────────────────────────
function QuestionsEditor({ magnet }: { magnet: LeadMagnet }) {
  const initial = ((magnet.questionnaireFields as QuestionnaireField[] | null) ?? []).map((q) => ({
    ...q,
    type: q.type ?? "text",
    options: q.options ?? [],
  }));
  const [questions, setQuestions] = useState(initial);
  const [dirty, setDirty] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (fields: QuestionnaireField[]) =>
      apiRequest("PATCH", `/api/admin/lead-magnets/${magnet.id}`, { questionnaireFields: fields }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/lead-magnets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-magnets"] });
      setDirty(false);
    },
  });

  const update = (idx: number, patch: Partial<QuestionnaireField>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
    setDirty(true);
  };
  const remove = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    setDirty(true);
  };
  const add = () => {
    setQuestions((prev) => [
      ...prev,
      { id: `q_${Date.now()}`, label: "", required: true, type: "text" as const, options: [] },
    ]);
    setDirty(true);
  };

  const handleSave = () => {
    const cleaned = questions
      .filter((q) => q.label.trim())
      .map((q) => ({
        ...q,
        label: q.label.trim(),
        options: q.type === "select" ? (q.options ?? []).map((o) => o.trim()).filter(Boolean) : undefined,
      }));
    saveMutation.mutate(cleaned as QuestionnaireField[]);
  };

  return (
    <div className="space-y-3">
      {questions.map((q, idx) => (
        <div
          key={q.id}
          className="rounded-xl px-4 py-3 space-y-2"
          style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
          data-testid={`row-question-${magnet.id}-${idx}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold flex-shrink-0" style={{ color: "var(--c-fg-45)" }}>Q{idx + 1}</span>
            <input
              type="text"
              value={q.label}
              onChange={(e) => update(idx, { label: e.target.value })}
              placeholder="Question text"
              className="input-dark flex-1 px-3 py-2 rounded-lg text-sm"
              data-testid={`input-question-label-${magnet.id}-${idx}`}
            />
            <button
              onClick={() => remove(idx)}
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
              aria-label="Remove question"
              data-testid={`button-remove-question-${magnet.id}-${idx}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap pl-6">
            <select
              value={q.type}
              onChange={(e) => update(idx, { type: e.target.value as "text" | "select" })}
              className="input-dark px-2.5 py-1.5 rounded-lg text-xs"
              data-testid={`select-question-type-${magnet.id}-${idx}`}
            >
              <option value="select">Multiple choice</option>
              <option value="text">Free text</option>
            </select>
            <label className="text-xs flex items-center gap-1.5 cursor-pointer" style={{ color: "var(--c-fg-55)" }}>
              <input
                type="checkbox"
                checked={q.required}
                onChange={(e) => update(idx, { required: e.target.checked })}
                className="accent-[#C9A227]"
              />
              Required
            </label>
          </div>
          {q.type === "select" && (
            <div className="pl-6">
              <input
                type="text"
                value={(q.options ?? []).join(", ")}
                onChange={(e) => update(idx, { options: e.target.value.split(",").map((s) => s.trimStart()) })}
                placeholder="Options, separated by commas"
                className="input-dark w-full px-3 py-2 rounded-lg text-xs"
                data-testid={`input-question-options-${magnet.id}-${idx}`}
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex items-center gap-2">
        <button
          onClick={add}
          className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
          style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)" }}
          data-testid={`button-add-question-${magnet.id}`}
        >
          <Plus className="w-3.5 h-3.5" /> Add question
        </button>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="btn-accent px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 disabled:opacity-60"
            data-testid={`button-save-questions-${magnet.id}`}
          >
            {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save changes
          </button>
        )}
      </div>
    </div>
  );
}

function QuestionsTab() {
  const { data: magnets, isLoading } = useQuery<LeadMagnet[]>({
    queryKey: ["/api/admin/lead-magnets"],
    placeholderData: isAdminDesignPreview() ? PREVIEW_PRODUCTS : undefined,
    enabled: !isAdminDesignPreview(),
  });
  const downloadable = (magnets ?? []).filter((m) => m.productType === "download");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: "var(--c-accent)" }} /></div>;
  }

  const selected = downloadable.find((m) => m.id === selectedId) ?? downloadable[0];

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
        These questions are shown one at a time before someone enters their email to get a resource.
      </p>
      <div className="flex gap-2 flex-wrap">
        {downloadable.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedId(m.id)}
            className="px-3.5 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: selected?.id === m.id ? "var(--c-accent-10)" : "transparent",
              border: `1px solid ${selected?.id === m.id ? "var(--c-accent)" : "var(--c-border)"}`,
              color: "var(--c-fg)",
            }}
            data-testid={`tab-resource-${m.id}`}
          >
            {m.title}
          </button>
        ))}
      </div>
      {selected && <QuestionsEditor key={selected.id} magnet={selected} />}
    </div>
  );
}

// ── Login gate ────────────────────────────────────────────────────────────────
function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/login", { password });
    },
    onSuccess: () => {
      setError(null);
      // Drop any stale/errored admin queries (e.g. a 401'd stats fetch) so
      // they refetch cleanly with the new session cookie, then mark the
      // session authenticated directly — relying on invalidate alone races
      // an in-flight session fetch and can leave the UI on the login screen.
      queryClient.removeQueries({
        predicate: (q) => String(q.queryKey[0]).startsWith("/api/admin") && q.queryKey[0] !== "/api/admin/session",
      });
      queryClient.setQueryData(["/api/admin/session"], { authenticated: true });
    },
    onError: (err: Error) => {
      const msg = err.message.replace(/^\d+:\s*/, "");
      try {
        setError(JSON.parse(msg).message ?? "Login failed.");
      } catch {
        setError(msg || "Login failed.");
      }
    },
  });

  return (
    <div className="admin-login-shell min-h-screen px-5 py-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col overflow-hidden rounded-[28px] lg:grid lg:grid-cols-[1.15fr_0.85fr]">
        <section className="admin-login-intro relative flex min-h-[380px] flex-col justify-between overflow-hidden p-8 sm:p-12 lg:p-16">
          <div className="admin-grid-noise" />
          <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-2 text-xs font-semibold tracking-wide" style={{ color: "rgba(255,255,255,.62)" }}>
            <img src="/nav-logo.png" alt="Eric Gravely" className="h-12 w-auto brightness-0 invert" />
          </Link>
          <div className="relative z-10 max-w-lg">
            <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: "rgba(255,255,255,.48)" }}>
              Private operations
            </div>
            <h1 className="font-display text-4xl font-semibold leading-[1.02] text-white sm:text-5xl lg:text-6xl">
              Run the site.<br />Grow the audience.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7" style={{ color: "rgba(255,255,255,.6)" }}>
              Products, subscribers, automated follow-ups, and broadcasts—all in one focused control center.
            </p>
          </div>
        </section>

        <section className="flex items-center bg-[#f2f2ef] p-8 sm:p-12 lg:p-16">
          <div className="w-full max-w-sm mx-auto">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111] text-white">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/40">Restricted</div>
                <div className="text-sm font-semibold text-black">Authorized access only</div>
              </div>
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#111]" data-testid="text-login-title">
              Enter the control center
            </h2>
            <p className="mt-2 text-sm leading-6 text-black/50">
              Use your admin password to continue. Your session stays private and expires automatically.
            </p>
            <form
              className="mt-8"
              onSubmit={(e) => {
                e.preventDefault();
                if (password) loginMutation.mutate();
              }}
            >
              <label htmlFor="admin-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-black/50">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
                autoComplete="current-password"
                className="w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-sm text-black outline-none transition focus:border-black"
                data-testid="input-admin-password"
              />
              {error && (
                <p className="mt-3 text-xs text-[#a23c2a]" data-testid="text-login-error">{error}</p>
              )}
              <button
                type="submit"
                disabled={loginMutation.isPending || !password}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#111] py-3.5 text-sm font-semibold text-white transition hover:bg-[#2c2c2c] disabled:opacity-40"
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ShieldCheck className="h-4 w-4" /> Unlock dashboard</>}
              </button>
            </form>
            <Link
              href="/"
              className="mt-7 inline-flex items-center gap-1.5 text-xs font-semibold text-black/45 transition hover:text-black"
              data-testid="link-login-back-home"
            >
              ← Return to ericgravely.com
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "signups" | "orders" | "products" | "sequence" | "broadcast" | "questions";

const TABS: { id: Tab; label: string; icon: typeof Users; group: "Overview" | "Audience" | "Commerce" | "Email" | "Site" }[] = [
  { id: "dashboard", label: "Command center", icon: LayoutDashboard, group: "Overview" },
  { id: "signups", label: "Subscribers", icon: Users, group: "Audience" },
  { id: "orders", label: "Orders & delivery", icon: ShoppingBag, group: "Commerce" },
  { id: "sequence", label: "Automated emails", icon: Radio, group: "Email" },
  { id: "broadcast", label: "Send an email", icon: Send, group: "Email" },
  { id: "products", label: "Products & resources", icon: Package, group: "Site" },
  { id: "questions", label: "Signup questions", icon: ListChecks, group: "Site" },
];

const TAB_DETAILS: Record<Tab, { eyebrow: string; title: string; description: string }> = {
  dashboard: {
    eyebrow: "Overview",
    title: "Command center",
    description: "A live view of your audience, offers, and email engine.",
  },
  signups: {
    eyebrow: "Audience",
    title: "Subscribers",
    description: "See who joined, what they requested, and how they answered.",
  },
  orders: {
    eyebrow: "Commerce",
    title: "Orders & delivery",
    description: "Track paid purchases, delivery status, and resend secure download links.",
  },
  sequence: {
    eyebrow: "Email automation",
    title: "Automated emails",
    description: "Control the messages people receive after joining your list.",
  },
  broadcast: {
    eyebrow: "Email broadcast",
    title: "Send an email",
    description: "Create a timely update and send it to every active subscriber.",
  },
  products: {
    eyebrow: "Site content",
    title: "Products & resources",
    description: "Manage the offers and downloads shown on your public site.",
  },
  questions: {
    eyebrow: "Lead capture",
    title: "Signup questions",
    description: "Edit what you ask before delivering each free resource.",
  },
};

export default function Admin() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const designPreview = isAdminDesignPreview();

  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/session"],
    placeholderData: designPreview ? { authenticated: true } : undefined,
    enabled: !designPreview,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/logout");
    },
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("/api/admin") });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
    },
  });

  if (sessionLoading && !designPreview) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--c-bg)" }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--c-accent)" }} />
      </div>
    );
  }

  if (!designPreview && !sessionData?.authenticated) {
    return <AdminLogin />;
  }

  const activeDetails = TAB_DETAILS[tab];
  const navigate = (nextTab: Tab) => {
    setTab(nextTab);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="admin-shell min-h-screen">
      <aside className={`admin-sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="flex h-full flex-col">
          <div className="px-5 pb-8 pt-6">
            <img src="/nav-logo.png" alt="Eric Gravely" className="h-12 w-auto brightness-0 invert" />
            <div className="mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Site operations
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-5" aria-label="Admin navigation">
            {(["Overview", "Audience", "Commerce", "Email", "Site"] as const).map((group) => (
              <div key={group} className="mb-6">
                <div className="px-3 pb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/25">{group}</div>
                <div className="space-y-1">
                  {TABS.filter((item) => item.group === group).map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => navigate(id)}
                      className={`admin-nav-item ${tab === id ? "is-active" : ""}`}
                      data-testid={`tab-${id}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-white/[0.07] p-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-nav-item"
              data-testid="link-back-home"
            >
              <Globe2 className="h-4 w-4" />
              <span>View live site</span>
              <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-50" />
            </a>
            {designPreview ? (
              <a href="/admin" className="admin-nav-item mt-1">
                <Lock className="h-4 w-4" />
                <span>Return to login</span>
              </a>
            ) : (
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="admin-nav-item mt-1"
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4" />
                <span>Lock & log out</span>
              </button>
            )}
          </div>
        </div>
      </aside>

      {mobileNavOpen && <button className="admin-mobile-scrim" aria-label="Close menu" onClick={() => setMobileNavOpen(false)} />}

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button lg:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--c-fg-45)" }}>
            <ShieldCheck className="h-3.5 w-3.5" /> Secure session
          </div>
          {designPreview && (
            <span className="rounded-full border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em]" style={{ borderColor: "var(--c-border)", color: "var(--c-fg-55)", background: "var(--c-card)" }}>
              Design preview · no live data
            </span>
          )}
          <a href="/" target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--c-fg-55)" }}>
            ericgravely.com <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </header>

        <div className="admin-workspace">
          <div className="mb-8 border-b pb-7" style={{ borderColor: "var(--c-border)" }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--c-fg-45)" }}>{activeDetails.eyebrow}</div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl" style={{ color: "var(--c-fg)" }} data-testid="text-admin-title">
              {activeDetails.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: "var(--c-fg-45)" }}>{activeDetails.description}</p>
          </div>

          {tab === "dashboard" && <DashboardTab onNavigate={navigate} />}
          {tab === "signups" && <SignupsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "sequence" && <SequenceTab />}
          {tab === "broadcast" && <BroadcastTab />}
          {tab === "questions" && <QuestionsTab />}
        </div>
      </main>
    </div>
  );
}
