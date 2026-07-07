import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Loader2, Shield, ChevronDown, X,
  PackageOpen, ExternalLink,
} from "lucide-react";
import { SiApple } from "react-icons/si";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import type { LeadMagnet } from "@shared/schema";

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

// ── Download product card (email-gated) ───────────────────────────────────────
type FormState = "idle" | "open" | "loading" | "success" | "error";

function DownloadProductCard({ product, index }: { product: LeadMagnet; index: number }) {
  const [formState, setFormState] = useState<FormState>("idle");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpen = () => { setFormState("open"); setErrorMsg(""); };
  const handleClose = () => { setFormState("idle"); setFirstName(""); setEmail(""); setErrorMsg(""); };

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
      setErrorMsg("Network error — please check your connection and try again.");
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
      style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
      data-testid={`card-product-${product.id}`}
    >
      <div className="p-7 flex-1 flex flex-col">
        <span className="label-track block mb-4">Free Download</span>

        <h2
          className="font-display text-2xl font-bold mb-3 leading-snug"
          style={{ color: "var(--c-fg)" }}
          data-testid={`text-product-title-${product.id}`}
        >
          {product.title}
        </h2>

        <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: "var(--c-fg-55)" }}>
          {product.description}
        </p>

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
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-display font-semibold" style={{ color: "var(--c-fg)" }}>
                  Get {product.title}
                </span>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
                  aria-label="Close form"
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
                <div className="flex items-center gap-1.5 justify-center text-xs" style={{ color: "var(--c-fg-30)" }}>
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
                Built from real sales floors.{" "}
                <span className="gold-underline">Not theory.</span>
              </h1>
              <p className="text-lg leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                Free frameworks and tools I use with the reps and managers I coach. Take them, use them, run better calls this week.
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
            <div className="label-track mb-8">Free Downloads</div>

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
