import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Calendar } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";

export default function Coaching() {
  const { coaching } = site;

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24">
        {/* Hero */}
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{ background: "var(--c-bg)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(200,16,46,0.08) 0%, transparent 55%)" }}
          />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
                style={{
                  color: "#C8102E",
                  border: "1px solid rgba(200,16,46,0.30)",
                  background: "rgba(200,16,46,0.08)",
                }}
              >
                {coaching.badge}
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: "var(--c-fg)" }}>
                {coaching.pageHeroTitle}<br />
                <span className="italic" style={{ color: "#C8102E" }}>{coaching.pageHeroTitleHighlight}</span>
              </h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10" style={{ color: "var(--c-fg-55)" }}>
                {coaching.pageHeroDescription}
              </p>
              <a
                href={coaching.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2"
                data-testid="button-apply-hero"
              >
                <Calendar className="w-4 h-4" />
                {coaching.pageHeroCta}
              </a>
            </motion.div>
          </div>
        </section>

        {/* Program modules */}
        <section className="py-20 md:py-28" style={{ background: "var(--c-bg2)" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <span className="text-xs font-semibold tracking-widest uppercase block mb-4" style={{ color: "#C8102E" }}>
                {coaching.curriculumLabel}
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold" style={{ color: "var(--c-fg)" }}>
                {coaching.curriculumTitle}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaching.modules.map((mod, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="rounded-xl p-6"
                  style={{
                    background: "var(--c-card)",
                    border: "1px solid rgba(200,16,46,0.10)",
                  }}
                  data-testid={`card-module-${i}`}
                >
                  <div className="font-serif font-bold text-5xl mb-4 leading-none" style={{ color: "rgba(200,16,46,0.25)" }}>
                    {mod.number}
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--c-fg)" }}>{mod.title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--c-fg-45)" }}>{mod.description}</p>
                  <ul className="space-y-1.5">
                    {mod.topics.map((topic, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs" style={{ color: "var(--c-fg-40)" }}>
                        <span style={{ color: "#C8102E" }} className="mt-0.5">→</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-20" style={{ background: "var(--c-bg)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold" style={{ color: "var(--c-fg)" }}>
                {coaching.whoItIsForTitle}
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* For */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-xl p-6"
                style={{
                  background: "rgba(200,16,46,0.05)",
                  border: "1px solid rgba(200,16,46,0.15)",
                }}
              >
                <h3 className="font-semibold text-lg mb-5" style={{ color: "#C8102E" }}>{coaching.forTitle}</h3>
                <ul className="space-y-4">
                  {coaching.forList.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "#C8102E" }} />
                      <span className="text-sm" style={{ color: "var(--c-fg-70)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Not for */}
              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-xl p-6"
                style={{
                  background: "var(--c-card)",
                  border: "1px solid var(--c-card-border)",
                }}
              >
                <h3 className="font-semibold text-lg mb-5" style={{ color: "var(--c-fg-55)" }}>{coaching.notForTitle}</h3>
                <ul className="space-y-4">
                  {coaching.notForList.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--c-fg-30)" }} />
                      <span className="text-sm" style={{ color: "var(--c-fg-45)" }}>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Application CTA */}
        <section
          className="py-20"
          style={{
            background: "var(--c-bg2)",
            borderTop: "1px solid var(--c-border)",
          }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--c-fg)" }}>
                {coaching.applyTitle}
              </h2>
              <p className="text-lg mb-8 leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                {coaching.applyDescription}
              </p>
              <a
                href={coaching.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2 mb-4"
                data-testid="button-apply-cta"
              >
                <Calendar className="w-4 h-4" />
                {coaching.applyCtaText}
                <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-sm block" style={{ color: "var(--c-fg-30)" }}>
                {coaching.applyFootnote}
              </p>
              <div className="mt-10">
                <Link
                  href="/"
                  className="text-sm transition-colors inline-flex items-center gap-1"
                  style={{ color: "var(--c-fg-30)" }}
                >
                  ← Back to Home
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
