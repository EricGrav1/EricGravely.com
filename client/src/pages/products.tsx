import { useState } from "react";
import { motion } from "framer-motion";
import { PackageOpen, ExternalLink, Eye, ArrowRight } from "lucide-react";
import { SiApple } from "react-icons/si";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductSignupFlow, PreviewLightbox } from "@/components/ProductSignupFlow";
import { usePageMeta } from "@/lib/seo";
import { slugify } from "@shared/slug";
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
            <Link href={`/products/${slugify(product.title)}`}>
              <h2
                className="font-display text-2xl font-bold leading-snug transition-colors hover:text-accent cursor-pointer"
                style={{ color: "var(--c-fg)" }}
                data-testid={`text-product-title-${product.id}`}
              >
                {product.title}
              </h2>
            </Link>
          </div>
        </div>

        <p
          className="text-sm leading-relaxed mb-6 flex-1"
          style={{ color: "var(--c-fg-55)" }}
        >
          {product.description}
        </p>

        <Link
          href={`/products/${slugify(product.title)}`}
          className="mb-5 flex items-center gap-1.5 text-sm font-semibold self-start"
          style={{ color: "var(--c-accent)" }}
          data-testid={`link-detail-${product.id}`}
        >
          Learn more <ArrowRight className="w-3.5 h-3.5" />
        </Link>

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

// ── Download product card (email-gated, multi-step questionnaire) ─────────────
function DownloadProductCard({ product, index }: { product: LeadMagnet; index: number }) {
  const previews = (product.previewImages as string[] | null) ?? [];
  const [showPreview, setShowPreview] = useState(false);

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

        <Link href={`/products/${slugify(product.title)}`}>
          <h2
            className="font-display text-2xl font-bold mb-3 leading-snug transition-colors hover:text-accent cursor-pointer"
            style={{ color: "var(--c-fg)" }}
            data-testid={`text-product-title-${product.id}`}
          >
            {product.title}
          </h2>
        </Link>

        <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--c-fg-55)" }}>
          {product.description}
        </p>

        <div className="mb-5 flex items-center gap-5">
          {previews.length > 0 && (
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: "var(--c-accent)" }}
              data-testid={`button-preview-${product.id}`}
            >
              <Eye className="w-4 h-4" />
              Peek inside
            </button>
          )}
          <Link
            href={`/products/${slugify(product.title)}`}
            className="flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: "var(--c-accent)" }}
            data-testid={`link-detail-${product.id}`}
          >
            Learn more <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <ProductSignupFlow product={product} />
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
  usePageMeta(
    "Products & Free Resources — Eric Gravely",
    "Free sales frameworks, tools, and apps from Eric Gravely — built from 10+ years coaching sales reps and leading top-performing teams.",
  );

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
