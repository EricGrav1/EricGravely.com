import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, Mail, ListChecks, ChevronDown, ChevronUp,
  Plus, Trash2, Loader2, Save, X, Pencil, Lock, LogOut,
} from "lucide-react";
import { Link } from "wouter";
import type { LeadMagnet, SequenceEmail, QuestionnaireField } from "@shared/schema";

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

function SequenceTab() {
  const { data: emails, isLoading } = useQuery<SequenceEmail[]>({ queryKey: ["/api/admin/sequence-emails"] });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/sequence-emails"] });

  const createMutation = useMutation({
    mutationFn: (data: SequenceFormData) => apiRequest("POST", "/api/admin/sequence-emails", data),
    onSuccess: () => { invalidate(); setCreating(false); },
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
    <div className="space-y-3">
      <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
        These emails go out automatically to people who check the opt-in box, starting from the day they sign up.
        Day 1 = one day after signup. Use {"{{first_name}}"} to personalize.
      </p>

      {(emails ?? []).map((em) => (
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
              onClick={() => { setEditingId(editingId === em.id ? null : em.id); setCreating(false); }}
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

      {creating ? (
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
          <div className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>New sequence email</div>
          <SequenceEmailForm
            initial={{ dayOffset: (emails?.length ? Math.max(...emails.map((e) => e.dayOffset)) + 2 : 1), subject: "", body: "", active: true }}
            onSave={(data) => createMutation.mutate(data)}
            onCancel={() => setCreating(false)}
            saving={createMutation.isPending}
          />
        </div>
      ) : (
        <button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)", background: "var(--c-accent-10)" }}
          data-testid="button-add-sequence"
        >
          <Plus className="w-4 h-4" /> Add email
        </button>
      )}
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/session"] });
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
type Tab = "signups" | "sequence" | "questions";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "signups", label: "Signups", icon: Users },
  { id: "sequence", label: "Email Sequence", icon: Mail },
  { id: "questions", label: "Questions", icon: ListChecks },
];

export default function Admin() {
  const [tab, setTab] = useState<Tab>("signups");

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
              Signups, nurture sequence, and questionnaire management
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

        {tab === "signups" && <SignupsTab />}
        {tab === "sequence" && <SequenceTab />}
        {tab === "questions" && <QuestionsTab />}
      </div>
    </div>
  );
}
