import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ArrowDown } from "lucide-react";
import { site } from "@/config/site";
import { SocialIcons } from "@/components/SocialIcons";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="hero-video-shell relative min-h-screen flex flex-col justify-center overflow-hidden"
      aria-label="Hero"
    >
      <div className="absolute inset-0 z-0 overflow-hidden bg-[#090909]" aria-hidden="true">
        {shouldReduceMotion ? (
          <img
            src="/hero-background-poster.jpg"
            alt=""
            className="hero-video-media h-full w-full object-cover"
          />
        ) : (
          <video
            className="hero-video-media h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/hero-background-poster.jpg"
            disablePictureInPicture
          >
            <source src="/hero-background.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero-video-overlay absolute inset-0" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">

        {/* Mobile-only photo — centered, above headline */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:hidden flex flex-col items-center mb-10"
        >
          <div
            className="w-44 h-52 sm:w-52 sm:h-60 rounded-2xl overflow-hidden"
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
          <SocialIcons className="justify-center mt-4" />
        </motion.div>

        {/* Desktop layout: content left, photo+badges right (top-aligned) */}
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-20 items-start">

          {/* Left — Content */}
          <div className="max-w-2xl">
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="label-track block mb-8" data-testid="text-hero-eyebrow">
                Sales. Leadership. Coaching.
              </span>
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUp}
              className="hero-display text-[2.55rem] sm:text-[3rem] lg:text-[3.25rem] font-semibold leading-[1.08] mb-6"
              style={{ color: "var(--c-fg)" }}
              data-testid="text-hero-headline"
            >
              {site.hero.headlinePrefix}{" "}
              <span className="gold-underline">{site.hero.headlineHighlight}</span>
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
              <a
                href={site.hero.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-accent px-6 py-3.5 rounded-lg text-base font-bold text-center"
                data-testid="button-hero-cta"
              >
                {site.hero.ctaText} →
              </a>
              <Link
                href={site.hero.secondaryCtaTarget}
                className="btn-outline-accent px-6 py-3.5 rounded-lg text-base text-center flex items-center justify-center gap-2"
                data-testid="link-hero-secondary"
              >
                {site.hero.secondaryCta}
              </Link>
            </motion.div>
          </div>

          {/* Right — video sits behind this lightweight social proof rail */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:flex w-72 min-h-[540px] flex-col items-center justify-end gap-5 pb-6"
          >
            <SocialIcons />

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
