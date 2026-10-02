import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus, Trash2, Loader2, Save, X, Pencil, ChevronDown, ChevronUp, UserPlus, Zap, Pause, Play,
} from "lucide-react";
import type { Sequence, SequenceEmail, SequenceTrigger, LeadMagnet } from "@shared/schema";
import {
  EmailFields, PreviewAndTest, AutomationStatus, Notice, Spinner,
  cardStyle, parseApiError, useMagnets,
} from "./emailTools";

type AdminSequence = Sequence & { inProgress: number; totalEnrolled: number; emails: SequenceEmail[] };

const QUERY_KEY = ["/api/admin/sequences"];
const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

function triggerLabel(seq: Pick<Sequence, "trigger" | "leadMagnetId">, magnets: LeadMagnet[]): string {
  if (seq.trigger === "newsletter_signup") return "Starts when someone joins the newsletter";
  if (seq.trigger === "manual") return "Manual — only people you enroll";
  if (seq.leadMagnetId == null) return "Starts when someone grabs any free resource";
  return `Starts when someone grabs “${magnets.find((m) => m.id === seq.leadMagnetId)?.title ?? "a deleted resource"}”`;
}

// ── Trigger picker (shared by create + settings) ──────────────────────────────
type TriggerChoice = "newsletter" | "manual" | "resource-any" | `resource-${number}`;

function toChoice(trigger: SequenceTrigger, leadMagnetId: number | null): TriggerChoice {
  if (trigger === "newsletter_signup") return "newsletter";
  if (trigger === "manual") return "manual";
  return leadMagnetId == null ? "resource-any" : `resource-${leadMagnetId}`;
}

function fromChoice(choice: TriggerChoice): { trigger: SequenceTrigger; leadMagnetId: number | null } {
  if (choice === "newsletter") return { trigger: "newsletter_signup", leadMagnetId: null };
  if (choice === "manual") return { trigger: "manual", leadMagnetId: null };
  if (choice === "resource-any") return { trigger: "resource_signup", leadMagnetId: null };
  return { trigger: "resource_signup", leadMagnetId: Number(choice.slice("resource-".length)) };
}

function TriggerSelect({ value, onChange, testId }: { value: TriggerChoice; onChange: (v: TriggerChoice) => void; testId: string }) {
  const magnets = useMagnets().filter((m) => m.productType === "download");
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TriggerChoice)}
      className="input-dark px-2.5 py-1.5 rounded-lg text-xs"
      data-testid={testId}
    >
      <option value="resource-any">Someone grabs any free resource</option>
      {magnets.map((m) => (
        <option key={m.id} value={`resource-${m.id}`}>Someone grabs: {m.title}</option>
      ))}
      <option value="newsletter">Someone joins the newsletter</option>
      <option value="manual">Manual only (enroll people yourself)</option>
    </select>
  );
}

// ── Email editor ──────────────────────────────────────────────────────────────
interface EmailFormData {
  dayOffset: number;
  subject: string;
  body: string;
  active: boolean;
}

function SequenceEmailForm({
  initial, onSave, onCancel, saving,
}: {
  initial: EmailFormData;
  onSave: (data: EmailFormData) => void;
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
        <span className="text-[11px]" style={{ color: "var(--c-fg-45)" }}>
          {dayOffset === 0 ? "right after they enter" : `${dayOffset} day${dayOffset === 1 ? "" : "s"} after they enter`}
        </span>
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
      <EmailFields subject={subject} body={body} onSubject={setSubject} onBody={setBody} rows={8} testIdPrefix="seq" />
      <PreviewAndTest subject={subject} body={body} testIdPrefix="seq" />
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

// ── One sequence ──────────────────────────────────────────────────────────────
function SequenceCard({ seq, magnets, defaultOpen }: { seq: AdminSequence; magnets: LeadMagnet[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingSettings, setEditingSettings] = useState(false);
  const [name, setName] = useState(seq.name);
  const [trigger, setTrigger] = useState<TriggerChoice>(toChoice(seq.trigger as SequenceTrigger, seq.leadMagnetId));
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const onError = (err: Error) => setNotice({ kind: "err", text: parseApiError(err) });

  const updateSeq = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("PATCH", `/api/admin/sequences/${seq.id}`, data),
    onSuccess: () => { invalidate(); setEditingSettings(false); },
    onError,
  });
  const deleteSeq = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/admin/sequences/${seq.id}`),
    onSuccess: invalidate,
    onError,
  });
  const enrollExisting = useMutation({
    mutationFn: async () => {
      const { matching } = await (await apiRequest("POST", `/api/admin/sequences/${seq.id}/enroll-existing`, { dryRun: true })).json();
      if (!confirm(
        `Add up to ${matching} existing subscriber(s) who match this sequence's trigger? ` +
        `Their day count starts today, and anyone already in it is skipped.`,
      )) return null;
      return (await apiRequest("POST", `/api/admin/sequences/${seq.id}/enroll-existing`, {})).json();
    },
    onSuccess: (res: { enrolled: number } | null) => {
      if (!res) return;
      setNotice({ kind: "ok", text: `Enrolled ${res.enrolled} subscriber(s). Their first email goes out on the next run.` });
      invalidate();
    },
    onError,
  });
  const createEmail = useMutation({
    mutationFn: (data: EmailFormData) => apiRequest("POST", "/api/admin/sequence-emails", { ...data, sequenceId: seq.id }),
    onSuccess: () => { invalidate(); setCreating(false); },
    onError,
  });
  const updateEmail = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EmailFormData }) => apiRequest("PATCH", `/api/admin/sequence-emails/${id}`, data),
    onSuccess: () => { invalidate(); setEditingId(null); },
    onError,
  });
  const deleteEmail = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/sequence-emails/${id}`),
    onSuccess: invalidate,
    onError,
  });

  const activeEmails = seq.emails.filter((e) => e.active).length;
  const nextDay = seq.emails.length ? Math.max(...seq.emails.map((e) => e.dayOffset)) + 2 : 1;

  return (
    <div className="rounded-xl" style={{ ...cardStyle, opacity: seq.active ? 1 : 0.75 }} data-testid={`card-sequence-${seq.id}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-display font-bold" style={{ color: "var(--c-fg)" }}>{seq.name}</span>
            {!seq.active && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: "var(--c-border)", color: "var(--c-fg-45)" }}>
                Paused
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--c-fg-45)" }}>
            {triggerLabel(seq, magnets)} · {activeEmails} email{activeEmails === 1 ? "" : "s"} · {seq.inProgress} subscriber{seq.inProgress === 1 ? "" : "s"}
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: "var(--c-fg-45)" }} /> : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--c-fg-45)" }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--c-border)" }}>
          {/* Settings row */}
          <div className="flex items-center gap-2 flex-wrap pt-3">
            <button
              onClick={() => setEditingSettings(!editingSettings)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              style={{ color: "var(--c-fg-70)", border: "1px solid var(--c-border)" }}
              data-testid={`button-sequence-settings-${seq.id}`}
            >
              <Pencil className="w-3 h-3" /> Name & trigger
            </button>
            <button
              onClick={() => updateSeq.mutate({ active: !seq.active })}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              style={{ color: "var(--c-fg-70)", border: "1px solid var(--c-border)" }}
              data-testid={`button-sequence-toggle-${seq.id}`}
            >
              {seq.active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {seq.active ? "Pause" : "Resume"}
            </button>
            <button
              onClick={() => enrollExisting.mutate()}
              disabled={enrollExisting.isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
              style={{ color: "var(--c-accent)", border: "1px solid var(--c-accent-15)" }}
              data-testid={`button-sequence-enroll-${seq.id}`}
            >
              {enrollExisting.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
              Add existing subscribers
            </button>
            <div className="flex-1" />
            <button
              onClick={() => {
                if (confirm(`Delete "${seq.name}" and all ${seq.emails.length} of its emails? Nobody in it will get anything further. This can't be undone.`)) {
                  deleteSeq.mutate();
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
              aria-label="Delete sequence"
              data-testid={`button-sequence-delete-${seq.id}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {editingSettings && (
            <div className="rounded-lg px-3 py-3 space-y-2" style={{ background: "var(--c-bg2)" }}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-dark w-full px-3 py-2 rounded-lg text-sm"
                data-testid={`input-sequence-name-${seq.id}`}
              />
              <label className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "var(--c-fg-55)" }}>
                Who enters automatically:
                <TriggerSelect value={trigger} onChange={setTrigger} testId={`select-sequence-trigger-${seq.id}`} />
              </label>
              <p className="text-[11px]" style={{ color: "var(--c-fg-45)" }}>
                Changing the trigger only affects new signups — people already in this sequence stay in it.
              </p>
              <button
                onClick={() => updateSeq.mutate({ name, ...fromChoice(trigger) })}
                disabled={updateSeq.isPending || !name.trim()}
                className="btn-accent px-3.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
              >
                <Save className="w-3 h-3" /> Save settings
              </button>
            </div>
          )}

          <Notice notice={notice} />

          {/* Emails */}
          {seq.emails.length === 0 && !creating && (
            <p className="text-xs py-3 text-center rounded-xl" style={{ color: "var(--c-fg-45)", border: "1px dashed var(--c-border)" }}>
              No emails yet — add the first one below.
            </p>
          )}

          {seq.emails.map((em) => (
            <div key={em.id} className="rounded-xl px-3 py-2.5" style={{ background: "var(--c-bg2)", opacity: em.active ? 1 : 0.6 }} data-testid={`row-sequence-${em.id}`}>
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
                  <div className="text-[11px]" style={{ color: "var(--c-fg-45)" }}>
                    {em.active ? `Sent ${em.sentCount} time${em.sentCount === 1 ? "" : "s"}` : "Inactive — skipped"}
                  </div>
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
                    if (confirm(`Delete "${em.subject}"? People who haven't reached it yet will go straight to the next email.`)) {
                      deleteEmail.mutate(em.id);
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
                  onSave={(data) => updateEmail.mutate({ id: em.id, data })}
                  onCancel={() => setEditingId(null)}
                  saving={updateEmail.isPending}
                />
              )}
            </div>
          ))}

          {creating ? (
            <div className="rounded-xl px-3 py-3" style={{ background: "var(--c-bg2)" }}>
              <div className="text-sm font-semibold" style={{ color: "var(--c-fg)" }}>New email</div>
              <SequenceEmailForm
                initial={{ dayOffset: nextDay, subject: "", body: "", active: true }}
                onSave={(data) => createEmail.mutate(data)}
                onCancel={() => setCreating(false)}
                saving={createEmail.isPending}
              />
            </div>
          ) : (
            <button
              onClick={() => { setCreating(true); setEditingId(null); }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)", background: "var(--c-accent-10)" }}
              data-testid={`button-add-sequence-email-${seq.id}`}
            >
              <Plus className="w-4 h-4" /> Add email
            </button>
          )}
          <p className="text-[11px]" style={{ color: "var(--c-fg-45)" }}>
            Adding an email after the last one also sends it to people who already finished, once its day arrives.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Tab ───────────────────────────────────────────────────────────────────────
export function SequencesTab() {
  const { data: seqs, isLoading } = useQuery<AdminSequence[]>({ queryKey: QUERY_KEY });
  const magnets = useMagnets();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState<TriggerChoice>("resource-any");
  const [newId, setNewId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const createSeq = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/admin/sequences", { name: newName, ...fromChoice(newTrigger) })).json(),
    onSuccess: (seq: Sequence) => {
      setNewId(seq.id);
      setCreating(false);
      setNewName("");
      invalidate();
    },
    onError: (err: Error) => setNotice({ kind: "err", text: parseApiError(err) }),
  });

  const runNow = useMutation({
    mutationFn: async () => (await apiRequest("POST", "/api/admin/email/process")).json(),
    onSuccess: (r: { sequenceSent: number; broadcastSent: number; paused?: string }) => {
      setNotice(
        r.paused
          ? { kind: "err", text: `Sending paused: ${r.paused}` }
          : { kind: "ok", text: r.sequenceSent ? `Sent ${r.sequenceSent} sequence email(s).` : "Nothing was due — you're all caught up." },
      );
      invalidate();
    },
    onError: (err: Error) => setNotice({ kind: "err", text: parseApiError(err) }),
  });

  if (isLoading) return <Spinner />;

  // Warn when one signup would land in two resource sequences at once.
  const resourceSeqs = (seqs ?? []).filter((s) => s.active && s.trigger === "resource_signup");
  const overlap = resourceSeqs.some((s) => s.leadMagnetId == null) && resourceSeqs.some((s) => s.leadMagnetId != null);

  return (
    <div className="space-y-5">
      <AutomationStatus />

      <div className="flex items-start gap-3 flex-wrap">
        <p className="text-xs leading-relaxed flex-1 min-w-[220px]" style={{ color: "var(--c-fg-45)" }}>
          Sequences are automatic follow-up emails. Each one has a trigger (who gets in) and a series of emails sent N days after they enter.
          Everyone goes through a sequence once — signing up again never restarts it.
        </p>
        <button
          onClick={() => { setNotice(null); runNow.mutate(); }}
          disabled={runNow.isPending}
          className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
          style={{ color: "var(--c-fg-70)", border: "1px solid var(--c-border)" }}
          data-testid="button-run-sequences-now"
        >
          {runNow.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Send due emails now
        </button>
      </div>
      <Notice notice={notice} />

      {overlap && (
        <p className="text-[11px] rounded-lg px-3 py-2" style={{ color: "var(--c-fg-55)", background: "var(--c-bg2)" }}>
          Heads up: you have an "any resource" sequence and a resource-specific one both active, so someone who grabs that resource gets both.
          Pause one if that's not what you want.
        </p>
      )}

      <div className="space-y-3">
        {(seqs ?? []).map((seq) => (
          <SequenceCard key={seq.id} seq={seq} magnets={magnets} defaultOpen={seq.id === newId} />
        ))}
      </div>

      {creating ? (
        <div className="rounded-xl px-4 py-4 space-y-3" style={cardStyle}>
          <div className="text-sm font-display font-bold" style={{ color: "var(--c-fg)" }}>New sequence</div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name it (e.g. Playbook → coaching call)"
            className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
            autoFocus
            data-testid="input-new-sequence-name"
          />
          <label className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "var(--c-fg-55)" }}>
            Who enters automatically:
            <TriggerSelect value={newTrigger} onChange={setNewTrigger} testId="select-new-sequence-trigger" />
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => createSeq.mutate()}
              disabled={!newName.trim() || createSeq.isPending}
              className="btn-accent px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 disabled:opacity-60"
              data-testid="button-create-sequence"
            >
              {createSeq.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Create
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
              style={{ color: "var(--c-fg-55)", border: "1px solid var(--c-border)" }}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ color: "var(--c-accent)", border: "1px dashed var(--c-accent-15)", background: "var(--c-accent-10)" }}
          data-testid="button-new-sequence"
        >
          <Plus className="w-4 h-4" /> New sequence
        </button>
      )}
    </div>
  );
}
