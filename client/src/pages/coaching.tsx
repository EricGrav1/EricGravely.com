import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Calendar } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";

export default function Coaching() {
  const { coaching } = site;

  return (
    <div style={{ backgroundColor: "#0A0F1E", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24">
        {/* Hero */}
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 60% 0%, rgba(212,160,23,0.1) 0%, transparent 55%), #0A0F1E",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase text-[#D4A017] border border-[#D4A017]/30 bg-[#D4A017]/8 mb-6">
                {coaching.badge}
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                {coaching.pageHeroTitle}<br />
                <span className="italic text-[#D4A017]">{coaching.pageHeroTitleHighlight}</span>
              </h1>
              <p className="text-white/55 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
                {coaching.pageHeroDescription}
              </p>
              <a
                href={coaching.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2"
                data-testid="button-apply-hero"
              >
                <Calendar className="w-4 h-4" />
                {coaching.pageHeroCta}
              </a>
            </motion.div>
          </div>
        </section>

        {/* Program modules */}
        <section
          className="py-20 md:py-28"
          style={{ background: "linear-gradient(180deg, #0A0F1E 0%, #0d1428 100%)" }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <span className="text-xs font-semibold tracking-widest uppercase text-[#D4A017] block mb-4">
                {coaching.curriculumLabel}
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
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
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(212,160,23,0.1)",
                  }}
                  data-testid={`card-module-${i}`}
                >
                  <div className="text-[#D4A017]/30 font-serif font-bold text-5xl mb-4 leading-none">
                    {mod.number}
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-2">{mod.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed mb-4">{mod.description}</p>
                  <ul className="space-y-1.5">
                    {mod.topics.map((topic, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-white/40">
                        <span className="text-[#D4A017] mt-0.5">→</span>
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
        <section className="py-20" style={{ background: "#0A0F1E" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
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
                style={{ background: "rgba(212,160,23,0.05)", border: "1px solid rgba(212,160,23,0.15)" }}
              >
                <h3 className="font-semibold text-[#D4A017] text-lg mb-5">{coaching.forTitle}</h3>
                <ul className="space-y-4">
                  {coaching.forList.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#D4A017] flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">{item}</span>
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
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <h3 className="font-semibold text-white/60 text-lg mb-5">{coaching.notForTitle}</h3>
                <ul className="space-y-4">
                  {coaching.notForList.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-white/25 flex-shrink-0 mt-0.5" />
                      <span className="text-white/40 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Application CTA */}
        <section
          className="py-20 border-t border-white/5"
          style={{ background: "linear-gradient(180deg, #0A0F1E 0%, #0d1428 100%)" }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                {coaching.applyTitle}
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                {coaching.applyDescription}
              </p>
              <a
                href={coaching.calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2 mb-4"
                data-testid="button-apply-cta"
              >
                <Calendar className="w-4 h-4" />
                {coaching.applyCtaText}
                <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-white/25 text-sm block">
                {coaching.applyFootnote}
              </p>

              <div className="mt-10">
                <Link
                  href="/"
                  className="text-white/30 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
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
