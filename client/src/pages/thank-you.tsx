import { motion } from "framer-motion";
import { Download, Youtube, Smartphone, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";

export default function ThankYou() {
  const { thankYou, social } = site;

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24 pb-0">
        {/* Hero area */}
        <section
          className="py-20 md:py-28 relative overflow-hidden"
          style={{ background: "var(--c-bg)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(200,16,46,0.08) 0%, transparent 60%)" }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
            {/* Red checkmark */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full mx-auto mb-8 flex items-center justify-center"
              style={{
                background: "rgba(200,16,46,0.12)",
                border: "2px solid rgba(200,16,46,0.35)",
              }}
            >
              <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13L9 17L19 7"
                  stroke="#C8102E"
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
              <span className="text-xs font-semibold tracking-widest uppercase block mb-4" style={{ color: "#C8102E" }}>
                You're all set
              </span>
              <h1
                className="font-serif text-4xl md:text-5xl font-bold mb-4"
                style={{ color: "var(--c-fg)" }}
                data-testid="text-success-headline"
              >
                {thankYou.headline}
              </h1>
              <p
                className="text-lg mb-8 max-w-xl mx-auto leading-relaxed"
                style={{ color: "var(--c-fg-55)" }}
                data-testid="text-success-message"
              >
                {thankYou.subheadline}
              </p>

              <a
                href={thankYou.downloadUrl}
                download
                className="btn-accent px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2 mb-4"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" />
                {thankYou.downloadLabel}
              </a>
              <p className="text-sm" style={{ color: "var(--c-fg-30)" }}>
                {thankYou.inboxNote}
              </p>
            </motion.div>
          </div>
        </section>

        {/* What happens next */}
        <section className="py-20" style={{ background: "var(--c-bg2)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-3" style={{ color: "var(--c-fg)" }}>
                {thankYou.nextStepsTitle}
              </h2>
              <p style={{ color: "var(--c-fg-45)" }}>
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
                    background: "var(--c-card)",
                    border: "1px solid rgba(200,16,46,0.12)",
                  }}
                  data-testid={`section-next-step-${i}`}
                >
                  <div className="font-serif font-bold text-4xl mb-4" style={{ color: "rgba(200,16,46,0.35)" }}>
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--c-fg)" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-45)" }}>{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTAs */}
        <section
          className="py-16"
          style={{
            background: "var(--c-bg)",
            borderTop: "1px solid var(--c-border)",
          }}
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
                  background: "var(--c-card)",
                  border: "1px solid var(--c-card-border)",
                }}
                data-testid="link-youtube-cta"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(200,16,46,0.12)",
                    border: "1px solid rgba(200,16,46,0.25)",
                  }}
                >
                  <Youtube className="w-5 h-5" style={{ color: "#C8102E" }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1 transition-colors" style={{ color: "var(--c-fg)" }}>
                    {thankYou.youtubeCta}
                  </div>
                  <div className="text-sm" style={{ color: "var(--c-fg-45)" }}>{thankYou.youtubeDesc}</div>
                </div>
                <ArrowRight className="w-4 h-4" style={{ color: "var(--c-fg-30)" }} />
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
                  background: "rgba(200,16,46,0.05)",
                  border: "1px solid rgba(200,16,46,0.18)",
                }}
                data-testid="link-app-cta"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(200,16,46,0.12)",
                    border: "1px solid rgba(200,16,46,0.25)",
                  }}
                >
                  <Smartphone className="w-5 h-5" style={{ color: "#C8102E" }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1" style={{ color: "var(--c-fg)" }}>
                    {thankYou.appCta}
                  </div>
                  <div className="text-sm" style={{ color: "var(--c-fg-45)" }}>{thankYou.appDesc}</div>
                </div>
                <ArrowRight className="w-4 h-4" style={{ color: "var(--c-fg-30)" }} />
              </motion.a>
            </div>

            <div className="text-center mt-10">
              <Link
                href="/"
                className="text-sm transition-colors inline-flex items-center gap-1"
                style={{ color: "var(--c-fg-30)" }}
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
