import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ReadTheRoom } from "@/components/game/ReadTheRoom";
import { Leaderboard } from "@/components/game/Leaderboard";
import { usePageMeta } from "@/lib/seo";

export default function GamePage() {
  usePageMeta(
    "Read the Room — the 60-second sales game by Eric Gravely",
    "A buyer says something. Ask, tell, or close? You have seconds. Bank commission, build a streak, and put your name on the leaderboard.",
  );

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />
      <main className="pt-24">
        <section className="pt-8 pb-6 md:pt-14 md:pb-10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="label-track block mb-5">The Sales Game</span>
              <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight" style={{ color: "var(--c-fg)" }}>
                Read the <span className="gold-underline">Room</span>
              </h1>
              <p className="text-base md:text-lg max-w-xl mx-auto leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                Every buyer line is a fork: ask, tell, or close. Reps who pick right — fast — close more. Prove it in sixty seconds.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="pb-16 md:pb-24">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
              <ReadTheRoom />
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24" style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}>
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="label-track block mb-3">Top closers</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold" style={{ color: "var(--c-fg)" }}>Leaderboard</h2>
            </div>
            <Leaderboard limit={25} />
          </div>
        </section>

        <section className="py-16 md:py-20" style={{ borderTop: "1px solid var(--c-border)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
            <div className="rounded-xl p-6" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
              <span className="label-track block mb-3">Why this game</span>
              <h3 className="font-display font-semibold text-xl mb-2" style={{ color: "var(--c-fg)" }}>
                The #1 leak on real calls is picking the wrong move.
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                Reps pitch when they should ask. They ask when the buyer is ready to sign. Every line in this game comes from a
                pattern I've coached hundreds of times. The Ask &amp; Close Playbook maps the exact question ratios for every stage.
              </p>
              <Link href="/products" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold" style={{ color: "var(--c-accent)" }}>
                Get the free playbook <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-xl p-6" style={{ background: "var(--c-accent-06)", border: "1px solid var(--c-accent-15)" }}>
              <span className="label-track block mb-3" style={{ color: "var(--c-accent)" }}>Run it with your team</span>
              <h3 className="font-display font-semibold text-xl mb-2" style={{ color: "var(--c-fg)" }}>
                Sales managers: make this your Monday warm-up.
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                Ten minutes, whole team, one leaderboard. The instinct profile at the end tells you who over-pitches and who
                never asks for the close — before it shows up in your pipeline.
              </p>
              <Link href="/coaching" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold" style={{ color: "var(--c-accent)" }}>
                Work with me <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
