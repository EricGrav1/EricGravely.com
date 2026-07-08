import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Loader2, Shield, X,
  PackageOpen, ExternalLink, ArrowLeft, Eye, ChevronDown,
} from "lucide-react";
import { SiApple } from "react-icons/si";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import type { LeadMagnet, QuestionnaireField } from "@shared/schema";

// ── App icon with graceful fallback ──────────────────────────────────────────
function AppIcon({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-20 h-20 rounded-[18px] object-cover flex-shrink-0"
      style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
    />
  );
}

// ── External product card (direct link, no email gate) ────────────────────────
function ExternalProductCard({ product, index }: { product: LeadMagnet; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
      data-testid={`card-external-${product.id}`}
    >
      <div className="p-7 flex-1 flex flex-col">
        <span className="label-track block mb-4">App</span>

        <div className="flex items-start gap-4 mb-4">
          {product.iconPath && (
            <AppIcon src={product.iconPath} alt={product.title} />
          )}
          <div className="min-w-0">
            <h2
              className="font-display text-2xl font-bold leading-snug"
              style={{ color: "var(--c-fg)" }}
              data-testid={`text-product-title-${product.id}`}
            >
              {product.title}
            </h2>
          </div>
        </div>

        <p
          className="text-sm leading-relaxed mb-8 flex-1"
          style={{ color: "var(--c-fg-55)" }}
        >
          {product.description}
        </p>

        <a
          href={product.externalUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-accent w-full py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2"
          data-testid={`button-external-${product.id}`}
        >
          <SiApple className="w-4 h-4" />
          {product.buttonLabel ?? "Get the App"}
          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
        </a>
      </div>
    </motion.div>
  );
}

// ── View-only preview lightbox ─────────────────────────────────────────────────
// The resource itself is only delivered by email — this is a look-inside teaser.
function PreviewLightbox({
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

// ── Download product card (email-gated, multi-step questionnaire) ─────────────
type FormState = "idle" | "form" | "loading" | "success";

function DownloadProductCard({ product, index }: { product: LeadMagnet; index: number }) {
  const questions = ((product.questionnaireFields as QuestionnaireField[] | null) ?? [])
    .filter((q) => q && q.label);
  const previews = (product.previewImages as string[] | null) ?? [];

  const [formState, setFormState] = useState<FormState>("idle");
  const [step, setStep] = useState(0); // question index; questions.length = contact step
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const totalSteps = questions.length + 1;
  const isContactStep = step >= questions.length;
  const currentQ = isContactStep ? null : questions[step];

  const handleOpen = () => {
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
    setOptIn(false);
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
          sequenceOptIn: optIn,
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
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
      data-testid={`card-product-${product.id}`}
    >
      {showPreview && previews.length > 0 && (
        <PreviewLightbox images={previews} title={product.title} onClose={() => setShowPreview(false)} />
      )}

      <div className="p-7 flex-1 flex flex-col">
        <span className="label-track block mb-4">Free — Sent to Your Inbox</span>

        <h2
          className="font-display text-2xl font-bold mb-3 leading-snug"
          style={{ color: "var(--c-fg)" }}
          data-testid={`text-product-title-${product.id}`}
        >
          {product.title}
        </h2>

        <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--c-fg-55)" }}>
          {product.description}
        </p>

        {previews.length > 0 && formState === "idle" && (
          <button
            onClick={() => setShowPreview(true)}
            className="mb-5 flex items-center gap-2 text-sm font-semibold transition-colors self-start"
            style={{ color: "var(--c-accent)" }}
            data-testid={`button-preview-${product.id}`}
          >
            <Eye className="w-4 h-4" />
            Peek inside
          </button>
        )}

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

                    <label
                      className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer px-1"
                      style={{ color: "var(--c-fg-55)" }}
                    >
                      <input
                        type="checkbox"
                        checked={optIn}
                        onChange={(e) => setOptIn(e.target.checked)}
                        className="mt-0.5 accent-[#C9A227]"
                        disabled={formState === "loading"}
                        data-testid={`checkbox-optin-${product.id}`}
                      />
                      <span>
                        Also send me Eric's free coaching email series — practical sales tips over the next week. Unsubscribe anytime.
                      </span>
                    </label>

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
                    <div className="flex items-center gap-1.5 justify-center text-xs" style={{ color: "var(--c-fg-30)" }}>
                      <Shield className="w-3 h-3" />
                      No spam. Unsubscribe anytime.
                    </div>
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
      </div>
    </motion.div>
  );
}

// ── Smart dispatcher ──────────────────────────────────────────────────────────
function ProductCard({ product, index }: { product: LeadMagnet; index: number }) {
  if (product.productType === "external") {
    return <ExternalProductCard product={product} index={index} />;
  }
  return <DownloadProductCard product={product} index={index} />;
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center py-24 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "var(--c-accent-10)", border: "1px solid var(--c-accent-15)" }}
      >
        <PackageOpen className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
      </div>
      <h3 className="font-display text-xl font-bold mb-2" style={{ color: "var(--c-fg)" }}>
        More resources coming soon
      </h3>
      <p className="text-sm max-w-xs" style={{ color: "var(--c-fg-45)" }}>
        New tools and playbooks are in the works. Check back soon or scroll down for coaching.
      </p>
    </motion.div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Products() {
  const { data: products, isLoading, isError } = useQuery<LeadMagnet[]>({
    queryKey: ["/api/lead-magnets"],
  });

  const appProducts = products?.filter((p) => p.productType === "external") ?? [];
  const downloadProducts = products?.filter((p) => p.productType !== "external") ?? [];

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24">
        {/* Page header */}
        <section className="pt-20 pb-12 md:pt-24 md:pb-16" style={{ background: "var(--c-bg)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <span className="label-track block mb-6">Tools &amp; Resources</span>
              <h1
                className="font-display text-4xl md:text-5xl font-bold mb-5 leading-tight"
                style={{ color: "var(--c-fg)" }}
              >
                I wasn't always good — I just never stopped trying to get better.{" "}
                <span className="gold-underline">That's why I know what works.</span>
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                Free frameworks and tools I use with the reps and managers I coach. Answer a few quick questions and they're delivered straight to your inbox.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Apps section — only rendered when there are external products */}
        {(isLoading || appProducts.length > 0) && (
          <section className="pb-16" style={{ background: "var(--c-bg)" }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="label-track mb-6">Apps</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading && (
                  <div
                    className="rounded-2xl h-64 animate-pulse"
                    style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
                  />
                )}
                {appProducts.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Free Resources section */}
        <section
          className="py-16 md:py-20"
          style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="label-track mb-8">Free Resources</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-products">
              {isLoading && (
                <>
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl h-64 animate-pulse"
                      style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
                    />
                  ))}
                </>
              )}
              {isError && (
                <div className="col-span-full py-16 text-center" style={{ color: "var(--c-fg-45)" }}>
                  <p className="text-sm">Couldn't load resources right now. Please refresh the page.</p>
                </div>
              )}
              {!isLoading && !isError && downloadProducts.length === 0 && <EmptyState />}
              {!isLoading && !isError && downloadProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          className="py-16"
          style={{ background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-base mb-2" style={{ color: "var(--c-fg-55)" }}>
                Want something more hands-on?
              </p>
              <Link
                href="/coaching"
                className="text-base font-semibold transition-colors inline-flex items-center gap-1.5"
                style={{ color: "var(--c-accent)" }}
              >
                Apply for 1-on-1 coaching →
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
