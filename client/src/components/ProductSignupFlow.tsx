import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Shield, X, ArrowLeft, ChevronDown } from "lucide-react";
import { trackProductView } from "@/lib/seo";
import type { LeadMagnet, QuestionnaireField } from "@shared/schema";

// ── View-only preview lightbox ─────────────────────────────────────────────────
// The resource itself is only delivered by email — this is a look-inside teaser.
export function PreviewLightbox({
  images, title, onClose,
}: { images: string[]; title: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,13,0.85)" }}
      onClick={onClose}
      data-testid="lightbox-preview"
    >
      <div
        className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{ background: "var(--c-card)" }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-3"
          style={{ background: "var(--c-card)", borderBottom: "1px solid var(--c-border)" }}
        >
          <span className="text-sm font-display font-semibold" style={{ color: "var(--c-fg)" }}>
            {title} — preview
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
            aria-label="Close preview"
            data-testid="button-close-preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-4 select-none">
          {images.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`${title} preview page ${i + 1}`}
              className="w-full rounded-lg pointer-events-none"
              draggable={false}
              style={{ border: "1px solid var(--c-border)" }}
            />
          ))}
          <p className="text-xs text-center pb-2" style={{ color: "var(--c-fg-45)" }}>
            Preview only — the full version is delivered to your inbox.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Email-gated signup flow: CTA → questionnaire steps → contact → success ────
// Used by both the /products grid cards and the /products/:slug detail pages.
type FormState = "idle" | "form" | "loading" | "success";

export function ProductSignupFlow({
  product,
  trackViewOnOpen = true,
}: {
  product: LeadMagnet;
  /** Detail pages track the view on mount instead — pass false there. */
  trackViewOnOpen?: boolean;
}) {
  const questions = ((product.questionnaireFields as QuestionnaireField[] | null) ?? [])
    .filter((q) => q && q.label);

  const [formState, setFormState] = useState<FormState>("idle");
  const [step, setStep] = useState(0); // question index; questions.length = contact step
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const totalSteps = questions.length + 1;
  const isContactStep = step >= questions.length;
  const currentQ = isContactStep ? null : questions[step];

  const handleOpen = () => {
    if (trackViewOnOpen) trackProductView(product.id);
    setFormState("form");
    setStep(0);
    setErrorMsg("");
  };
  const handleClose = () => {
    setFormState("idle");
    setStep(0);
    setAnswers({});
    setFirstName("");
    setEmail("");
    setErrorMsg("");
  };

  const selectAnswer = (q: QuestionnaireField, value: string) => {
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setErrorMsg("");
    // Auto-advance on selection
    setTimeout(() => setStep((s) => s + 1), 150);
  };

  const handleNext = () => {
    if (currentQ?.required && !(answers[currentQ.id] ?? "").trim()) {
      setErrorMsg("Please answer to continue.");
      return;
    }
    setErrorMsg("");
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email.trim()) { setErrorMsg("Email address is required."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setFormState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          leadMagnetId: product.id,
          questionnaireAnswers: Object.keys(answers).length > 0 ? answers : undefined,
        }),
      });
      const data = await res.json() as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setFormState("form");
        return;
      }
      setFormState("success");
    } catch {
      setErrorMsg("Network error — please check your connection and try again.");
      setFormState("form");
    }
  };

  return (
    <AnimatePresence mode="wait">
      {formState === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="rounded-xl px-5 py-5 text-center"
          style={{ background: "var(--c-accent-10)", border: "1px solid var(--c-accent-15)" }}
          data-testid={`text-success-${product.id}`}
        >
          <CheckCircle2 className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--c-accent)" }} />
          <div className="font-display font-semibold mb-1" style={{ color: "var(--c-fg)" }}>
            On its way!
          </div>
          <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
            Check your inbox — arrives within 2 minutes. Check spam if you don't see it.
          </p>
        </motion.div>

      ) : formState === "idle" ? (
        <motion.button
          key="cta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOpen}
          className="btn-accent w-full py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2"
          data-testid={`button-get-${product.id}`}
        >
          {product.buttonLabel ?? "Get it free"}
          <ChevronDown className="w-4 h-4" />
        </motion.button>

      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header: progress + close */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold tracking-wide" style={{ color: "var(--c-fg-45)" }} data-testid={`text-step-${product.id}`}>
              {totalSteps > 1 ? `Step ${Math.min(step + 1, totalSteps)} of ${totalSteps}` : "Almost there"}
            </span>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
              aria-label="Close form"
              data-testid={`button-close-${product.id}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress bar */}
          {totalSteps > 1 && (
            <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: "var(--c-border)" }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ background: "var(--c-accent)", width: `${(Math.min(step + 1, totalSteps) / totalSteps) * 100}%` }}
              />
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentQ ? (
              <motion.div
                key={`q-${step}`}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
              >
                <p className="text-sm font-display font-semibold mb-3" style={{ color: "var(--c-fg)" }} data-testid={`text-question-${product.id}`}>
                  {currentQ.label}
                </p>

                {currentQ.type === "select" && currentQ.options?.length ? (
                  <div className="space-y-2">
                    {currentQ.options.map((opt) => {
                      const selected = answers[currentQ.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => selectAnswer(currentQ, opt)}
                          className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-colors"
                          style={{
                            border: `1px solid ${selected ? "var(--c-accent)" : "var(--c-border)"}`,
                            background: selected ? "var(--c-accent-10)" : "transparent",
                            color: "var(--c-fg)",
                          }}
                          data-testid={`option-${product.id}-${currentQ.id}-${opt}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={answers[currentQ.id] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))}
                      placeholder="Type your answer…"
                      rows={3}
                      className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm resize-none"
                      data-testid={`input-answer-${product.id}-${currentQ.id}`}
                    />
                    <button
                      type="button"
                      onClick={handleNext}
                      className="btn-accent w-full py-3 rounded-lg font-bold text-sm"
                      data-testid={`button-next-${product.id}`}
                    >
                      Next →
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-xs px-1 mt-2" style={{ color: "var(--c-fg-55)" }}>{errorMsg}</p>
                )}

                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs mt-3"
                    style={{ color: "var(--c-fg-45)" }}
                    data-testid={`button-back-${product.id}`}
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="contact"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-3"
              >
                <p className="text-sm font-display font-semibold" style={{ color: "var(--c-fg)" }}>
                  Where should I send {product.title}?
                </p>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name (optional)"
                  className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
                  disabled={formState === "loading"}
                  data-testid={`input-firstname-${product.id}`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address *"
                  required
                  className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
                  disabled={formState === "loading"}
                  data-testid={`input-email-${product.id}`}
                />

                {errorMsg && (
                  <p className="text-xs px-1" style={{ color: "var(--c-fg-55)" }}>{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="btn-accent w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  data-testid={`button-submit-${product.id}`}
                >
                  {formState === "loading" ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sending…</>
                  ) : (
                    "Send it to my inbox →"
                  )}
                </button>
                <p
                  className="text-[11px] leading-relaxed text-center px-1"
                  style={{ color: "var(--c-fg-45)" }}
                  data-testid={`text-consent-${product.id}`}
                >
                  <Shield className="w-3 h-3 inline mr-1 align-[-2px]" />
                  By submitting, you agree to receive emails from Eric Gravely — including a short coaching series. No spam, unsubscribe anytime.
                </p>
                {questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--c-fg-45)" }}
                    data-testid={`button-back-${product.id}`}
                  >
                    <ArrowLeft className="w-3 h-3" /> Back
                  </button>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
