import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, Mail, ListChecks, ChevronDown, ChevronUp,
  Plus, Trash2, Loader2, Save, X, Pencil, Lock, LogOut,
  LayoutDashboard, Package, Upload, CheckCircle2, AlertTriangle, ExternalLink, Send,
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

function DashboardTab() {
  const { data: stats, isLoading } = useQuery<AdminStats>({ queryKey: ["/api/admin/stats"] });
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
    <div className="space-y-5">
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
  const { data: leads, isLoading } = useQuery<AdminLead[]>({ queryKey: ["/api/admin/leads"] });
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
  active: boolean;
}

function emptyProductForm(): ProductFormData {
  return {
    title: "", description: "", productType: "download",
    buttonLabel: "", externalUrl: "", iconPath: "", resourceUrl: "",
    videoUrl: "", previewImages: [], active: true,
  };
}

function toApiPayload(f: ProductFormData) {
  return {
    title: f.title.trim(),
    description: f.description.trim(),
    productType: f.productType,
    buttonLabel: f.buttonLabel.trim() || null,
    externalUrl: f.productType === "external" ? (f.externalUrl.trim() || null) : null,
    iconPath: f.iconPath.trim() || null,
    resourceUrl: f.productType === "download" ? (f.resourceUrl || null) : null,
    videoUrl: f.videoUrl.trim() || null,
    previewImages: f.previewImages.length > 0 ? f.previewImages : null,
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
        Screenshots of a few pages work great. Shown as a view-only "Peek inside" — visitors still have to sign up for the real file.
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
    if (form.productType === "external" && !form.externalUrl.trim()) {
      setError("External products need a link (App Store, checkout page, etc.).");
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
            <option value="external">External link (app, paid product)</option>
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
          placeholder={form.productType === "external" ? "e.g. Download on the App Store" : "e.g. Get the free playbook"}
          className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
          data-testid="input-product-button"
        />
      </div>

      {form.productType === "external" ? (
        <>
          <div>
            <label className="text-xs block mb-1" style={labelStyle}>External link</label>
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
        <div>
          <label className="text-xs block mb-1" style={labelStyle}>Resource file (delivered by email)</label>
          <FileUploader
            currentUrl={form.resourceUrl}
            onUploaded={(resourceUrl) => set({ resourceUrl })}
          />
        </div>
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
  const { data: magnets, isLoading } = useQuery<AdminMagnet[]>({ queryKey: ["/api/admin/lead-magnets"] });
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
        Everything shown on /products. Free downloads are email-gated; external products link straight out.
        Each product also gets its own page at /products/&lt;name&gt;.
      </p>

      {(magnets ?? []).map((m) => {
        const isOpen = editingId === m.id;
        const needsFile = m.productType !== "external" && m.fileUploaded === false;
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
                {m.productType === "external" ? "Link" : "Download"}
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
    description: "Sent to everyone who grabs a free resource, starting the day after they sign up.",
  },
  {
    id: "newsletter",
    label: "Newsletter signups",
    description: "Sent to everyone who subscribes through the newsletter form (footer).",
  },
] as const;

function SequenceTab() {
  const { data: emails, isLoading } = useQuery<SequenceEmail[]>({ queryKey: ["/api/admin/sequence-emails"] });
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
      <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
        Everyone who signs up is automatically enrolled in the matching series (the forms show a consent note).
        Day 1 = one day after signup. Use {"{{first_name}}"} to personalize.
      </p>

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
          A one-off email to all {recipients} active subscribers. Plain text with {"{{first_name}}"} personalization —
          the unsubscribe link is added automatically. Always send yourself a test first.
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
  const { data: magnets, isLoading } = useQuery<LeadMagnet[]>({ queryKey: ["/api/admin/lead-magnets"] });
  const downloadable = (magnets ?? []).filter((m) => m.productType !== "external");
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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--c-bg)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
          style={{ background: "var(--c-accent-10)", border: "1px solid var(--c-accent)" }}
        >
          <Lock className="w-5 h-5" style={{ color: "var(--c-accent)" }} />
        </div>
        <h1 className="font-display text-xl font-bold mb-1" style={{ color: "var(--c-fg)" }} data-testid="text-login-title">
          Admin access
        </h1>
        <p className="text-xs mb-6" style={{ color: "var(--c-fg-45)" }}>
          Enter the admin password to manage signups and emails.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password) loginMutation.mutate();
          }}
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-lg px-3.5 py-2.5 text-sm mb-3 outline-none"
            style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)", color: "var(--c-fg)" }}
            data-testid="input-admin-password"
          />
          {error && (
            <p className="text-xs mb-3" style={{ color: "#c0392b" }} data-testid="text-login-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loginMutation.isPending || !password}
            className="w-full rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ background: "var(--c-accent)", color: "#141311" }}
            data-testid="button-admin-login"
          >
            {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Log in"}
          </button>
        </form>
        <Link
          href="/"
          className="block text-center text-xs font-semibold mt-5"
          style={{ color: "var(--c-fg-45)" }}
          data-testid="link-login-back-home"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Tab = "dashboard" | "signups" | "products" | "sequence" | "broadcast" | "questions";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "signups", label: "Signups", icon: Users },
  { id: "products", label: "Products", icon: Package },
  { id: "sequence", label: "Sequence", icon: Mail },
  { id: "broadcast", label: "Broadcast", icon: Send },
  { id: "questions", label: "Questions", icon: ListChecks },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const { data: sessionData, isLoading: sessionLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/session"],
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

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--c-bg)" }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--c-accent)" }} />
      </div>
    );
  }

  if (!sessionData?.authenticated) {
    return <AdminLogin />;
  }

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: "var(--c-fg)" }} data-testid="text-admin-title">
              Admin
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--c-fg-45)" }}>
              Stats, signups, products, sequences, broadcasts, and questionnaires
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-semibold"
              style={{ color: "var(--c-accent)" }}
              data-testid="link-back-home"
            >
              ← Back to site
            </Link>
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: "var(--c-fg-45)" }}
              data-testid="button-admin-logout"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 mb-6 rounded-xl p-1" style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)" }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              style={{
                background: tab === id ? "var(--c-card)" : "transparent",
                color: tab === id ? "var(--c-fg)" : "var(--c-fg-45)",
                border: tab === id ? "1px solid var(--c-card-border)" : "1px solid transparent",
              }}
              data-testid={`tab-${id}`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {tab === "dashboard" && <DashboardTab />}
        {tab === "signups" && <SignupsTab />}
        {tab === "products" && <ProductsTab />}
        {tab === "sequence" && <SequenceTab />}
        {tab === "broadcast" && <BroadcastTab />}
        {tab === "questions" && <QuestionsTab />}
      </div>
    </div>
  );
}
