import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowDown, Youtube } from "lucide-react";
import { site } from "@/config/site";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: "var(--c-bg)" }}
      aria-label="Hero"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

        {/* Mobile-only photo — centered, above headline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:hidden flex justify-center mb-10"
        >
          <div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden"
            style={{
              border: "1px solid var(--c-border)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
            }}
          >
            <img
              src="/nicholas.jpg"
              alt="Eric Gravely — Sales Leadership Coach"
              className="w-full h-full object-cover"
              style={{ objectPosition: "center 12%" }}
            />
          </div>
        </motion.div>

        {/* Desktop layout: content left, photo+badges right (top-aligned) */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-20 items-start">

          {/* Left — Content */}
          <div className="max-w-2xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="label-track block mb-8" data-testid="text-hero-eyebrow">
                Sales Leadership Coaching
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUp}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6"
              style={{ color: "var(--c-fg)" }}
              data-testid="text-hero-headline"
            >
              {site.hero.headlinePrefix}{" "}
              <span className="gold-underline">{site.hero.headlineHighlight}</span>{" "}
              {site.hero.headlineSuffix}
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.2}
              variants={fadeUp}
              className="text-lg leading-relaxed mb-10 max-w-lg"
              style={{ color: "var(--c-fg-55)" }}
              data-testid="text-hero-subheadline"
            >
              {site.hero.subheadline}
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.3}
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href={site.hero.ctaTarget}
                className="btn-accent px-6 py-3.5 rounded-lg text-base font-bold text-center"
                data-testid="button-hero-cta"
              >
                {site.hero.ctaText} →
              </Link>
              <a
                href={site.hero.secondaryCtaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-accent px-6 py-3.5 rounded-lg text-base text-center flex items-center justify-center gap-2"
                data-testid="link-hero-youtube"
              >
                <Youtube className="w-4 h-4" />
                {site.hero.secondaryCta}
              </a>
            </motion.div>
          </div>

          {/* Right — Photo + badges (desktop only) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex flex-col items-center gap-5 pt-2"
          >
            {/* Photo — smaller, fully visible */}
            <div
              className="w-52 h-52 rounded-full overflow-hidden flex-shrink-0"
              style={{
                border: "1px solid var(--c-border)",
                boxShadow: "0 6px 32px rgba(0,0,0,0.10)",
              }}
            >
              <img
                src="/nicholas.jpg"
                alt="Eric Gravely — Sales Leadership Coach"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 12%" }}
              />
            </div>

            {/* Stat badges — below photo, never overlapping */}
            <div className="flex gap-3">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="card-surface rounded-xl px-4 py-3 text-center"
                data-testid="stat-badge-0"
              >
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "var(--c-accent)" }}
                >
                  {site.stats[0].value}
                </div>
                <div className="text-xs mt-0.5 whitespace-nowrap" style={{ color: "var(--c-fg-55)" }}>
                  {site.stats[0].label}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.4 }}
                className="card-surface rounded-xl px-4 py-3 text-center"
                data-testid="stat-badge-1"
              >
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "var(--c-accent)" }}
                >
                  {site.stats[2].value}
                </div>
                <div className="text-xs mt-0.5 whitespace-nowrap" style={{ color: "var(--c-fg-55)" }}>
                  {site.stats[2].label}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        style={{ color: "var(--c-fg-30)" }}
      >
        <span className="label-track">Scroll</span>
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </motion.div>
    </section>
  );
}
