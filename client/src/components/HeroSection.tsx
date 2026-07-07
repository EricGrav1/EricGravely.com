import { motion } from "framer-motion";
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
  const handleScrollToPlaybook = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("get-the-playbook");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: "var(--c-bg)" }}
      aria-label="Hero"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Content */}
          <div>
            {/* Tracked eyebrow label */}
            <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
              <span className="label-track block mb-8" data-testid="text-hero-eyebrow">
                Sales Leadership Coaching
              </span>
            </motion.div>

            {/* Headline */}
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

            {/* Subheadline */}
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

            {/* CTA Buttons */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.3}
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <a
                href="#get-the-playbook"
                onClick={handleScrollToPlaybook}
                className="btn-accent px-6 py-3.5 rounded-lg text-base font-bold text-center"
                data-testid="button-hero-cta"
              >
                {site.hero.ctaText} →
              </a>
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

          {/* Right — Real Photo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative">
              {/* Photo circle */}
              <div
                className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full overflow-hidden"
                style={{
                  border: "1px solid var(--c-border)",
                  boxShadow: "0 8px 48px rgba(0,0,0,0.10)",
                }}
              >
                <img
                  src="/nicholas.jpg"
                  alt="Eric Gravely — Sales Leadership Coach"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "center 12%" }}
                />
              </div>

              {/* Floating stat badge — left */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -left-4 top-1/3 card-surface rounded-xl px-4 py-3 shadow-xl"
              >
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "var(--c-accent)" }}
                >
                  {site.stats[0].value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--c-fg-55)" }}>
                  {site.stats[0].label}
                </div>
              </motion.div>

              {/* Floating stat badge — right */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="absolute -right-4 bottom-1/3 card-surface rounded-xl px-4 py-3 shadow-xl"
              >
                <div
                  className="font-display font-bold text-lg leading-none"
                  style={{ color: "var(--c-accent)" }}
                >
                  {site.stats[1].value}
                </div>
                <div className="text-xs mt-0.5" style={{ color: "var(--c-fg-55)" }}>
                  {site.stats[1].label}
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
