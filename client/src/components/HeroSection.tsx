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
      style={{
        background: "radial-gradient(ellipse at 70% 0%, rgba(212,160,23,0.13) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(26,35,64,0.6) 0%, transparent 50%), linear-gradient(180deg, #0A0F1E 0%, #0d1428 100%)",
      }}
      aria-label="Hero"
    >
      {/* Geometric accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-1/2 h-full opacity-5"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, rgba(212,160,23,0.5) 0px, rgba(212,160,23,0.5) 1px, transparent 1px, transparent 40px)",
          }}
        />
        <div className="absolute top-1/4 -left-24 w-96 h-96 rounded-full bg-[#D4A017]/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-[#1a2340]/80 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Content */}
          <div>
            {/* Badge */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase text-[#D4A017] border border-[#D4A017]/30 bg-[#D4A017]/8 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] animate-pulse" />
                {site.hero.badge}
              </span>
            </motion.div>

            {/* Headline — driven entirely by site.ts */}
            <motion.h1
              initial="hidden"
              animate="visible"
              custom={0.1}
              variants={fadeUp}
              className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6"
              data-testid="text-hero-headline"
            >
              {site.hero.headlinePrefix}{" "}
              <span className="text-[#D4A017] italic">{site.hero.headlineHighlight}</span>{" "}
              {site.hero.headlineSuffix}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial="hidden"
              animate="visible"
              custom={0.2}
              variants={fadeUp}
              className="text-lg text-white/60 leading-relaxed mb-8 max-w-lg"
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
              className="flex flex-col sm:flex-row gap-4 mb-10"
            >
              <a
                href="#get-the-playbook"
                onClick={handleScrollToPlaybook}
                className="btn-gold px-6 py-3.5 rounded-lg text-base font-bold text-center"
                data-testid="button-hero-cta"
              >
                {site.hero.ctaText} →
              </a>
              <a
                href={site.hero.secondaryCtaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold px-6 py-3.5 rounded-lg text-base text-center flex items-center justify-center gap-2"
                data-testid="link-hero-youtube"
              >
                <Youtube className="w-4 h-4" />
                {site.hero.secondaryCta}
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0.4}
              variants={fadeUp}
              className="flex items-center gap-4 text-sm text-white/40"
            >
              <div className="flex -space-x-2">
                {["S", "M", "A", "R"].map((l, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-[#1a2340] border-2 border-[#0A0F1E] flex items-center justify-center text-[10px] font-bold text-white/60"
                  >
                    {l}
                  </div>
                ))}
              </div>
              <span dangerouslySetInnerHTML={{
                __html: site.hero.socialProof.replace(/(\d[\d,+]+)/, '<strong class="text-white/70">$1</strong>')
              }} />
            </motion.div>
          </div>

          {/* Right — Photo Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex justify-center lg:justify-end"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#D4A017]/20 blur-2xl scale-110" />

              <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 rounded-full border-2 border-[#D4A017]/40 flex items-center justify-center">
                <div className="w-[92%] h-[92%] rounded-full bg-gradient-to-br from-[#1a2340] to-[#0d1428] border border-white/10 flex flex-col items-center justify-center">
                  <div className="font-serif text-7xl font-bold text-[#D4A017] mb-2">NA</div>
                  <div className="text-white/40 text-xs font-medium tracking-widest uppercase">Photo Coming</div>
                </div>
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-[#D4A017]" />
              </div>

              {/* Floating badges */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute -left-4 top-1/3 card-surface rounded-xl px-4 py-3 shadow-xl"
              >
                <div className="text-[#D4A017] font-bold text-lg leading-none">{site.stats[0].value}</div>
                <div className="text-white/60 text-xs mt-0.5">{site.stats[0].label}</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="absolute -right-4 bottom-1/3 card-surface rounded-xl px-4 py-3 shadow-xl"
              >
                <div className="text-[#D4A017] font-bold text-lg leading-none">{site.stats[1].value}</div>
                <div className="text-white/60 text-xs mt-0.5">{site.stats[1].label}</div>
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
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30"
      >
        <span className="text-xs tracking-widest uppercase font-medium">Scroll</span>
        <ArrowDown className="w-4 h-4 animate-bounce" />
      </motion.div>
    </section>
  );
}
