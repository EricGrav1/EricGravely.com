import { motion } from "framer-motion";
import { Download, Youtube, Smartphone, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";

export default function ThankYou() {
  const { thankYou, social } = site;

  return (
    <div style={{ backgroundColor: "#0A0F1E", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24 pb-0">
        {/* Hero area */}
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(212,160,23,0.1) 0%, transparent 60%), #0A0F1E",
          }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            {/* Gold checkmark */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
              style={{
                background: "rgba(212,160,23,0.15)",
                border: "2px solid rgba(212,160,23,0.4)",
              }}
            >
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#D4A017"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <span className="text-xs font-semibold tracking-widest uppercase text-[#D4A017] block mb-4">
                You're all set
              </span>
              <h1
                className="font-serif text-4xl md:text-5xl font-bold text-white mb-4"
                data-testid="text-success-headline"
              >
                {thankYou.headline}
              </h1>
              <p
                className="text-white/55 text-lg mb-8 max-w-xl mx-auto leading-relaxed"
                data-testid="text-success-message"
              >
                {thankYou.subheadline}
              </p>

              <a
                href={thankYou.downloadUrl}
                download
                className="btn-gold px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2 mb-4"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" />
                {thankYou.downloadLabel}
              </a>
              <p className="text-white/30 text-sm">
                {thankYou.inboxNote}
              </p>
            </motion.div>
          </div>
        </section>

        {/* What happens next */}
        <section
          className="py-20"
          style={{ background: "linear-gradient(180deg, #0A0F1E 0%, #0d1428 100%)" }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">
                {thankYou.nextStepsTitle}
              </h2>
              <p className="text-white/45">
                {thankYou.nextStepsDescription}
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {thankYou.nextSteps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="rounded-xl p-6 relative"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(212,160,23,0.12)",
                  }}
                  data-testid={`section-next-step-${i}`}
                >
                  <div className="text-[#D4A017]/40 font-serif font-bold text-4xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-white text-lg mb-2">{step.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section
          className="py-16 border-t border-white/5"
          style={{ background: "#0A0F1E" }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* YouTube CTA */}
              <motion.a
                href={social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="group rounded-xl p-6 flex items-center gap-5 transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                data-testid="link-youtube-cta"
              >
                <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0">
                  <Youtube className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1 group-hover:text-[#D4A017] transition-colors">
                    {thankYou.youtubeCta}
                  </div>
                  <div className="text-white/40 text-sm">{thankYou.youtubeDesc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#D4A017] transition-colors" />
              </motion.a>

              {/* App CTA */}
              <motion.a
                href={social.app}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="group rounded-xl p-6 flex items-center gap-5 transition-all duration-200"
                style={{
                  background: "rgba(212,160,23,0.06)",
                  border: "1px solid rgba(212,160,23,0.2)",
                }}
                data-testid="link-app-cta"
              >
                <div className="w-12 h-12 rounded-xl bg-[#D4A017]/15 border border-[#D4A017]/30 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-5 h-5 text-[#D4A017]" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white mb-1 group-hover:text-[#D4A017] transition-colors">
                    {thankYou.appCta}
                  </div>
                  <div className="text-white/40 text-sm">{thankYou.appDesc}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-[#D4A017] transition-colors" />
              </motion.a>
            </div>

            <div className="text-center mt-10">
              <Link
                href="/"
                className="text-white/35 hover:text-white text-sm transition-colors inline-flex items-center gap-1"
              >
                {thankYou.backToHome}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
