import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { site } from "@/config/site";

export function CoachingSection() {
  return (
    <section
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0A0F1E 0%, #0d1428 100%)" }}
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase text-[#D4A017] border border-[#D4A017]/30 bg-[#D4A017]/8 mb-6">
            {site.coaching.badge}
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            {site.coaching.headline}
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">
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
              className="rounded-xl p-6 relative group"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,160,23,0.12)",
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#D4A017]/15 border border-[#D4A017]/20 flex items-center justify-center mb-4">
                <div className="w-2.5 h-2.5 rounded-full bg-[#D4A017]" />
              </div>
              <h3 className="font-semibold text-white text-lg mb-2">{benefit.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{benefit.description}</p>
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
            className="btn-gold px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2"
            data-testid="button-apply-coaching"
          >
            {site.coaching.ctaText}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-white/30 text-sm mt-4">{site.coaching.note}</p>
        </motion.div>
      </div>
    </section>
  );
}
