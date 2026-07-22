import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Gamepad2, Mail, PackageOpen, Play, ShieldCheck, Sparkles } from "lucide-react";
import { SiApple } from "react-icons/si";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductSignupFlow } from "@/components/ProductSignupFlow";
import { usePageMeta, trackProductView } from "@/lib/seo";
import { slugify } from "@shared/slug";
import { youtubeVideoId } from "@shared/video";
import type { LeadMagnet } from "@shared/schema";

function NotFoundState() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto"
        style={{ background: "var(--c-accent-10)", border: "1px solid var(--c-accent-15)" }}
      >
        <PackageOpen className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
      </div>
      <h1 className="font-display text-2xl font-bold mb-3" style={{ color: "var(--c-fg)" }}>
        Product not found
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--c-fg-55)" }}>
        This product doesn't exist or is no longer available.
      </p>
      <Link
        href="/products"
        className="btn-accent inline-flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Browse all products
      </Link>
    </div>
  );
}

export default function ProductDetail() {
  const params = useParams<{ slug: string }>();
  const { data: products, isLoading } = useQuery<LeadMagnet[]>({
    queryKey: ["/api/lead-magnets"],
  });

  const product = products?.find((p) => slugify(p.title) === params.slug);
  const isGame = product?.productType === "game";
  const isExternal = product?.productType === "external";
  const isOutbound = isExternal || isGame;
  const previews = (product?.previewImages as string[] | null) ?? [];
  const [iconFailed, setIconFailed] = useState(false);

  usePageMeta(
    product ? `${product.title} — Eric Gravely` : "Products — Eric Gravely",
    product?.description ?? undefined,
  );

  // One view per page open (powers admin conversion stats)
  useEffect(() => {
    if (product) trackProductView(product.id);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24">
        {isLoading ? (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
            <div
              className="rounded-2xl h-96 animate-pulse"
              style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
            />
          </div>
        ) : !product ? (
          <NotFoundState />
        ) : (
          <>
            <section className="pt-14 pb-16 md:pt-16 md:pb-20">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold mb-10"
                  style={{ color: "var(--c-fg-45)" }}
                  data-testid="link-back-products"
                >
                  <ArrowLeft className="w-4 h-4" /> All products
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-12 lg:gap-16 items-start">
                  {/* Left: pitch */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="label-track block mb-5">
                      {isGame ? "Interactive Sales Game" : isExternal ? "App" : "Free — Sent to Your Inbox"}
                    </span>

                    {isOutbound && product.iconPath && !iconFailed && (
                      <img
                        src={product.iconPath}
                        alt={product.title}
                        onError={() => setIconFailed(true)}
                        className="w-24 h-24 rounded-[22px] object-cover mb-6"
                        style={{ boxShadow: "0 6px 24px rgba(0,0,0,0.2)" }}
                      />
                    )}

                    <h1
                      className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight"
                      style={{ color: "var(--c-fg)" }}
                      data-testid="text-detail-title"
                    >
                      {product.title}
                    </h1>

                    <p className="text-lg leading-relaxed mb-8" style={{ color: "var(--c-fg-55)" }}>
                      {product.description}
                    </p>

                    {/* Trust markers */}
                    <div className="space-y-3 mb-10">
                      {(isGame
                        ? [
                            { icon: Gamepad2, text: "Built to turn sales practice into repetition" },
                            { icon: Sparkles, text: "Designed from real coaching scenarios" },
                          ]
                        : isExternal
                        ? [
                            { icon: Sparkles, text: "Built from 10+ years of real sales coaching" },
                            { icon: ShieldCheck, text: "Made by a 3x Presidents Club winner" },
                          ]
                        : [
                            { icon: Mail, text: "Delivered free, straight to your inbox" },
                            { icon: Sparkles, text: "Built from coaching hundreds of sales reps" },
                            { icon: ShieldCheck, text: "No spam — unsubscribe anytime" },
                          ]
                      ).map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: "var(--c-accent-10)", border: "1px solid var(--c-accent-15)" }}
                          >
                            <Icon className="w-4 h-4" style={{ color: "var(--c-accent)" }} />
                          </div>
                          <span className="text-sm" style={{ color: "var(--c-fg-70)" }}>{text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Overview video */}
                    {youtubeVideoId(product.videoUrl ?? "") && (
                      <div className="space-y-4 mb-10">
                        <div className="label-track">Watch the Overview</div>
                        <div
                          className="relative w-full overflow-hidden rounded-xl"
                          style={{ aspectRatio: "16 / 9", border: "1px solid var(--c-border)", background: "var(--c-bg2)" }}
                        >
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId(product.videoUrl ?? "")}`}
                            title={`${product.title} — video overview`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    {/* Inline preview gallery */}
                    {previews.length > 0 && (
                      <div className="space-y-4">
                        <div className="label-track">Look Inside</div>
                        <div
                          className="space-y-4 select-none"
                          onContextMenu={(e) => e.preventDefault()}
                        >
                          {previews.map((src, i) => (
                            <img
                              key={src}
                              src={src}
                              alt={`${product.title} preview page ${i + 1}`}
                              className="w-full rounded-xl pointer-events-none"
                              draggable={false}
                              style={{ border: "1px solid var(--c-border)" }}
                            />
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: "var(--c-fg-45)" }}>
                          {isGame ? "Gameplay preview — launch the game when you're ready to play." : isExternal ? "Product preview." : "Preview only — the full version is delivered to your inbox."}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Right: sticky action card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="lg:sticky lg:top-28 rounded-2xl p-7"
                    style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}
                  >
                    {isOutbound ? (
                      <>
                        <h2 className="font-display text-lg font-bold mb-2" style={{ color: "var(--c-fg)" }}>
                          {isGame ? `Play ${product.title}` : `Get ${product.title}`}
                        </h2>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--c-fg-55)" }}>
                          {isGame ? "Open the game in a new tab and put the skill into practice." : "Available now — tap below to download."}
                        </p>
                        <a
                          href={product.externalUrl ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-accent w-full py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2"
                          data-testid={`button-external-${product.id}`}
                        >
                          {isGame ? <Play className="w-4 h-4 fill-current" /> : <SiApple className="w-4 h-4" />}
                          {product.buttonLabel ?? (isGame ? "Play Game" : "Get the App")}
                          <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                        </a>
                      </>
                    ) : (
                      <>
                        <h2 className="font-display text-lg font-bold mb-2" style={{ color: "var(--c-fg)" }}>
                          Get it free
                        </h2>
                        <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--c-fg-55)" }}>
                          Answer a few quick questions and it's in your inbox within 2 minutes.
                        </p>
                        <ProductSignupFlow product={product} trackViewOnOpen={false} />
                      </>
                    )}
                  </motion.div>
                </div>
              </div>
            </section>

            {/* Cross-sell: coaching */}
            <section
              className="py-16"
              style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}
            >
              <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
                <p className="text-base mb-2" style={{ color: "var(--c-fg-55)" }}>
                  Want something more hands-on?
                </p>
                <Link
                  href="/coaching"
                  className="text-base font-semibold inline-flex items-center gap-1.5"
                  style={{ color: "var(--c-accent)" }}
                >
                  Apply for 1-on-1 coaching →
                </Link>
              </div>
            </section>
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
