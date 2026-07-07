import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Shield, ChevronDown, X } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";

type Product = typeof site.products[0];
type FormState = "idle" | "open" | "loading" | "success" | "error";

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpen = () => {
    setFormState("open");
    setErrorMsg("");
  };

  const handleClose = () => {
    setFormState("idle");
    setFirstName("");
    setEmail("");
    setErrorMsg("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
          tag: product.tag,
        }),
      });

      const data = await res.json() as { success?: boolean; message?: string };

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setFormState("open");
        return;
      }

      setFormState("success");
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setFormState("open");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-card-border)",
      }}
      data-testid={`card-product-${index}`}
    >
      {/* Card body */}
      <div className="p-7 flex-1 flex flex-col">
        <span className="label-track block mb-4" style={{ color: "var(--c-accent)" }}>
          {product.eyebrow}
        </span>

        <h2
          className="font-display text-2xl font-bold mb-3 leading-snug"
          style={{ color: "var(--c-fg)" }}
        >
          {product.title}
        </h2>

        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--c-fg-55)" }}>
          {product.description}
        </p>

        <ul className="space-y-2.5 mb-8 flex-1">
          {product.bullets.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: "var(--c-accent)" }}
              />
              <span className="text-sm leading-snug" style={{ color: "var(--c-fg-70)" }}>
                {bullet}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA / inline form */}
        <AnimatePresence mode="wait">
          {formState === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl px-5 py-4 text-center"
              style={{
                background: "var(--c-accent-10)",
                border: "1px solid var(--c-accent-15)",
              }}
            >
              <div className="font-display font-semibold mb-1" style={{ color: "var(--c-accent)" }}>
                On its way!
              </div>
              <p className="text-xs" style={{ color: "var(--c-fg-55)" }}>
                Check your inbox — it'll arrive within 2 minutes.
              </p>
            </motion.div>
          ) : formState === "idle" ? (
            <motion.button
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={handleOpen}
              className="btn-accent w-full py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2"
              data-testid={`button-get-${index}`}
            >
              Get it free
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-display font-semibold" style={{ color: "var(--c-fg)" }}>
                  {product.formCardTitle}
                </span>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-3">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name (optional)"
                  className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
                  disabled={formState === "loading"}
                  data-testid={`input-firstname-${index}`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address *"
                  required
                  className="input-dark w-full px-3.5 py-2.5 rounded-lg text-sm"
                  disabled={formState === "loading"}
                  data-testid={`input-email-${index}`}
                />

                {errorMsg && (
                  <p
                    className="text-xs px-1"
                    style={{ color: "var(--c-fg-55)" }}
                    data-testid={`text-error-${index}`}
                  >
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formState === "loading"}
                  className="btn-accent w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  data-testid={`button-submit-${index}`}
                >
                  {formState === "loading" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    `Send me ${product.title} →`
                  )}
                </button>

                <div
                  className="flex items-center gap-1.5 justify-center text-xs"
                  style={{ color: "var(--c-fg-30)" }}
                >
                  <Shield className="w-3 h-3" />
                  No spam. Unsubscribe anytime.
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Products() {
  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24">
        {/* Page header */}
        <section className="py-20 md:py-24" style={{ background: "var(--c-bg)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mb-14"
            >
              <span className="label-track block mb-6">Free Resources</span>
              <h1
                className="font-display text-4xl md:text-5xl font-bold mb-5 leading-tight"
                style={{ color: "var(--c-fg)" }}
              >
                Tools &{" "}
                <span className="gold-underline">Playbooks</span>
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                Practical resources built from 10+ years coaching sales reps and leading teams. Each one is free — gated only by your email so I can send it directly to your inbox.
              </p>
            </motion.div>

            {/* Product grid — 1 / 2 / 3 column responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {site.products.map((product, i) => (
                <ProductCard key={product.tag} product={product} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          className="py-16"
          style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}
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
