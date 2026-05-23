import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { site } from "@/config/site";

export function CoachingSection() {
  return (
    <section
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ background: "var(--c-bg)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            style={{
              color: "#C8102E",
              border: "1px solid rgba(200,16,46,0.30)",
              background: "rgba(200,16,46,0.08)",
            }}
          >
            {site.coaching.badge}
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--c-fg)" }}>
            {site.coaching.headline}
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--c-fg-55)" }}>
            {site.coaching.subheadline}
          </p>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {site.coaching.benefits.map((benefit, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
              className="rounded-xl p-6"
              style={{
                background: "var(--c-card)",
                border: "1px solid rgba(200,16,46,0.12)",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: "rgba(200,16,46,0.12)",
                  border: "1px solid rgba(200,16,46,0.20)",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#C8102E" }} />
              </div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--c-fg)" }}>{benefit.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-55)" }}>{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center"
        >
          <Link
            href={site.coaching.ctaUrl}
            className="btn-accent px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2"
            data-testid="button-apply-coaching"
          >
            {site.coaching.ctaText}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-sm mt-4" style={{ color: "var(--c-fg-30)" }}>{site.coaching.note}</p>
        </motion.div>
      </div>
    </section>
  );
}
