import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { BrandLogo } from "@/components/BrandLogo";
import { SocialIcons } from "@/components/SocialIcons";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (d = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: d },
  }),
};

const PILLARS = [
  {
    label: "Leadership",
    body: "Setting the standard for your team — not just managing to a number, but shaping how your reps think about the job and their own development.",
  },
  {
    label: "Motivation",
    body: "Understanding what actually drives each rep on your team. Blanket incentives don't move everyone. Individual motivation is a coaching skill.",
  },
  {
    label: "Ability",
    body: "Diagnosing skill gaps honestly and closing them with targeted coaching — not repetition, not inspiration, but deliberate skill-building.",
  },
  {
    label: "Organization",
    body: "Building the systems and rhythms that make consistent performance possible: pipeline discipline, 1:1 structure, and activity cadence.",
  },
];

export default function About() {
  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main>
        {/* ── Hero intro ──────────────────────────────────────────────────── */}
        <section
          className="pt-32 pb-20 md:pt-40 md:pb-28"
          style={{ background: "var(--c-bg)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1fr_320px] gap-16 items-start">

              {/* Left — intro text */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
              >
                <motion.span variants={fadeUp} custom={0} className="label-track block mb-6">
                  About Eric
                </motion.span>

                <motion.h1
                  variants={fadeUp}
                  custom={0.1}
                  className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-8"
                  style={{ color: "var(--c-fg)" }}
                >
                  From Rep to{" "}
                  <span className="gold-underline">Leader</span>
                </motion.h1>

                <motion.div variants={fadeUp} custom={0.2} className="max-w-xl space-y-5">
                  <p className="text-lg leading-relaxed" style={{ color: "var(--c-fg-70)" }}>
                    I started in insurance sales in 2014 with no playbook, no shortcuts — just a
                    conviction that the fundamentals matter more than most people admit.
                    Over the next decade I earned my way to trainer, then to sales manager,
                    built three top-performing teams, and won Presidents Club three consecutive times.
                  </p>
                  <p className="text-base leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                    Along the way I coached hundreds of reps. Not in a workshop-and-certificate sense —
                    in the trenches, on real deals, with real pressure. The patterns I kept seeing
                    eventually became a framework. That framework is what I coach to.
                  </p>
                </motion.div>
              </motion.div>

              {/* Right — photo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center lg:items-end"
              >
                <div
                  className="w-72 h-80 lg:w-80 lg:h-96 rounded-2xl overflow-hidden"
                  style={{
                    border: "1px solid var(--c-border)",
                    boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
                  }}
                >
                  <img
                    src="/nicholas.jpg"
                    alt="Eric Gravely"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 12%" }}
                  />
                </div>
                <SocialIcons className="mt-5" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Credential bar ──────────────────────────────────────────────── */}
        <section
          style={{
            borderTop: "1px solid var(--c-border)",
            borderBottom: "1px solid var(--c-border)",
            background: "var(--c-bg2)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--c-border)]">
              {[
                { value: "10+", label: "Years in Sales" },
                { value: "100s", label: "Reps Coached" },
                { value: "3x", label: "Presidents Club" },
                { value: "3", label: "Teams Built" },
              ].map((stat, i) => (
                <div key={i} className="py-10 px-6 text-center">
                  <div className="font-display text-3xl font-bold mb-1" style={{ color: "var(--c-accent)" }}>
                    {stat.value}
                  </div>
                  <div className="label-track">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Middle 60% ──────────────────────────────────────────────────── */}
        <section className="py-24 md:py-32" style={{ background: "var(--c-bg)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
            >
              <span className="label-track block mb-6">The Core Belief</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-8 leading-tight" style={{ color: "var(--c-fg)" }}>
                Why I Coach the{" "}
                <span className="gold-underline">Middle 60%</span>
              </h2>

              <div className="space-y-5 text-base leading-relaxed max-w-2xl" style={{ color: "var(--c-fg-60)" }}>
                <p>
                  Every sales team has a predictable shape. About 20% of your reps are going to win
                  regardless — they're self-directed, motivated, and frankly they don't need much from you.
                  Another 20% are likely on their way out no matter what you do.
                </p>
                <p>
                  That leaves the middle 60%. These are the reps where a manager's coaching skill
                  actually determines revenue outcomes. They're capable. They're coachable. They want to
                  improve. But they need structure, clarity, and someone who knows how to develop a
                  real human being — not just a quota carrier.
                </p>
                <p style={{ color: "var(--c-fg-70)" }}>
                  Most sales managers were promoted because they were great reps. Nobody trained them
                  for the difference between selling and coaching. That gap is expensive. The Middle 60%
                  either moves up or stays stuck based almost entirely on the quality of their manager's
                  coaching — and most managers were never taught how to do it.
                </p>
                <p style={{ color: "var(--c-fg-70)" }}>
                  That's the gap I coach to. That's where the real revenue leverage is.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Rep-to-manager transition ────────────────────────────────────── */}
        <section
          className="py-24 md:py-32"
          style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7 }}
            >
              <span className="label-track block mb-6">The Transition Nobody Prepares You For</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-8 leading-tight" style={{ color: "var(--c-fg)" }}>
                Being a top rep doesn't make you a good{" "}
                <span className="gold-underline">manager</span>
              </h2>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--c-fg-60)" }}>
                  <p>
                    The skills that make a great salesperson — individual drive, competitive instinct,
                    closing ability — are mostly useless when your job is to develop other people.
                    In fact, they can get in the way.
                  </p>
                  <p>
                    New managers who came up as top reps often fall into the same traps: they
                    do the selling themselves instead of coaching, they expect their team to operate
                    the way they did, and they misread low performance as low effort rather than
                    missing skill.
                  </p>
                </div>
                <div className="space-y-4 text-base leading-relaxed" style={{ color: "var(--c-fg-60)" }}>
                  <p>
                    The rep-to-manager transition is one of the highest-stakes moments in a sales
                    career. Most organizations hand you a new title and a team and assume the rest
                    will sort itself out.
                  </p>
                  <p>
                    I coach new managers through this shift directly: how to run 1:1s that actually
                    develop people, how to diagnose skill gaps vs. motivation gaps, and how to build
                    the team habits that make numbers repeatable — not accidental.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Four Pillars ────────────────────────────────────────────────── */}
        <section
          className="py-24 md:py-32"
          style={{ background: "var(--c-bg)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="mb-14"
            >
              <span className="label-track block mb-5">The Framework</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold leading-tight" style={{ color: "var(--c-fg)" }}>
                Four Pillars of{" "}
                <span className="gold-underline">Effective Coaching</span>
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {PILLARS.map((pillar, i) => (
                <motion.div
                  key={pillar.label}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.55, delay: i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  className="rounded-2xl p-6 flex flex-col gap-4"
                  style={{
                    background: "var(--c-card)",
                    border: "1px solid var(--c-card-border)",
                  }}
                  data-testid={`card-pillar-${i}`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--c-accent-10)", border: "1px solid var(--c-accent-15)" }}
                  >
                    <div
                      className="font-display text-xs font-bold"
                      style={{ color: "var(--c-accent)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>
                  <div>
                    <div className="label-track mb-2" style={{ color: "var(--c-accent)" }}>
                      {pillar.label}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                      {pillar.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Brand moment ─────────────────────────────────────────────────── */}
        <section
          className="py-16"
          style={{ background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
            <BrandLogo widthClass="w-48 sm:w-56 md:w-64" />
          </div>
        </section>

        {/* ── Closing CTA ─────────────────────────────────────────────────── */}
        <section
          className="py-20 md:py-24"
          style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2
                className="font-display text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "var(--c-fg)" }}
              >
                Ready to put this to work?
              </h2>
              <p className="text-base mb-10 leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                Start with a free resource or apply for 1-on-1 coaching.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="btn-accent px-7 py-3.5 rounded-lg font-bold text-base inline-flex items-center justify-center gap-2"
                  data-testid="button-about-products"
                >
                  Browse Free Resources
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/coaching"
                  className="btn-outline-accent px-7 py-3.5 rounded-lg font-bold text-base inline-flex items-center justify-center gap-2"
                  data-testid="button-about-coaching"
                >
                  Apply for Coaching
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
