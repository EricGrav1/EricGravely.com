import { motion } from "framer-motion";
import { CheckCircle2, XCircle, ArrowRight, Calendar } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";

const modules = [
  {
    number: "01",
    title: "The Leader Mindset Shift",
    description: "Stop thinking like a rep. Start thinking like a leader. We rewire how you see your role, your team, and your success metrics in week one.",
    topics: ["Manager vs. leader identity", "Your first 30-day priority stack", "Setting team expectations from day one"],
  },
  {
    number: "02",
    title: "Pipeline & Performance Systems",
    description: "Build the dashboards, rhythms, and accountability structures that give you real-time visibility without becoming a micromanager.",
    topics: ["The 5 metrics that actually matter", "Weekly pipeline review cadence", "Forecasting without guessing"],
  },
  {
    number: "03",
    title: "Coaching That Drives Quota",
    description: "Learn the 1:1 framework that transforms weekly check-ins from status updates into performance-accelerating coaching sessions.",
    topics: ["The 30-minute 1:1 blueprint", "Call coaching frameworks", "How to handle a struggling rep"],
  },
  {
    number: "04",
    title: "Recruiting & Onboarding A-Players",
    description: "Hire right the first time. Build a 90-day onboarding program that gets new reps to productivity in half the time.",
    topics: ["Interview scorecard system", "The 90-day ramp blueprint", "Culture and expectation setting"],
  },
  {
    number: "05",
    title: "Difficult Conversations Mastered",
    description: "Performance management, PIPs, terminations — the conversations no one teaches you. We'll role-play every scenario until you're ready.",
    topics: ["PIP frameworks that work", "Delivering hard feedback", "Knowing when to cut vs. coach"],
  },
  {
    number: "06",
    title: "Your 6-Month Leadership Roadmap",
    description: "Build your personal leadership development plan and set the strategic goals that will define your first year as a leader.",
    topics: ["Personal leadership assessment", "Career trajectory planning", "Building executive presence"],
  },
];

const forList = [
  "New sales managers in their first 0-18 months",
  "Mid-level managers who feel stuck and want to level up",
  "Sales reps who've been promoted and need to make the transition",
  "Leaders who've been managing but never formally trained",
];

const notForList = [
  "People looking for a quick fix or magic bullet",
  "Senior VPs or C-suite leaders (this isn't the right fit)",
  "Anyone not willing to do the work between sessions",
  "Leaders who aren't ready to be honest about what's not working",
];

export default function Coaching() {
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
                {site.coaching.badge}
              </div>
              <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                The Sales Leader<br />
                <span className="italic text-[#D4A017]">Accelerator</span>
              </h1>
              <p className="text-white/55 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
                A 6-week intensive coaching program for new and emerging sales leaders who want to build high-performance teams — without burning out or second-guessing every decision.
              </p>
              <a
                href="https://calendly.com/nicholasandrews"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2"
                data-testid="button-apply-hero"
              >
                <Calendar className="w-4 h-4" />
                Book a Free Discovery Call
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
                The Curriculum
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
                6 Weeks. 6 Modules. Total Transformation.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((mod, i) => (
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
        <section
          className="py-20"
          style={{ background: "#0A0F1E" }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-14"
            >
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white">
                Is This For You?
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
                <h3 className="font-semibold text-[#D4A017] text-lg mb-5">This IS for you if…</h3>
                <ul className="space-y-4">
                  {forList.map((item, i) => (
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
                <h3 className="font-semibold text-white/60 text-lg mb-5">This is NOT for you if…</h3>
                <ul className="space-y-4">
                  {notForList.map((item, i) => (
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
                Ready to Apply?
              </h2>
              <p className="text-white/50 text-lg mb-8 leading-relaxed">
                Cohort spots are limited. Book a free 20-minute discovery call and let's see if this is the right fit for where you are right now.
              </p>
              <a
                href="https://calendly.com/nicholasandrews"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold px-8 py-4 rounded-lg font-bold text-base inline-flex items-center gap-2 mb-4"
                data-testid="button-apply-cta"
              >
                <Calendar className="w-4 h-4" />
                Book Your Discovery Call
                <ArrowRight className="w-4 h-4" />
              </a>
              <p className="text-white/25 text-sm block">
                No pressure. No hard sell. Just an honest conversation.
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
