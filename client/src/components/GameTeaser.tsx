import { motion } from "framer-motion";
import { Link } from "wouter";
import { Zap } from "lucide-react";
import { MOVE_LABEL } from "@shared/salesGame";

export function GameTeaser() {
  return (
    <section className="py-20 md:py-24" style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }} aria-label="Sales game">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl overflow-hidden grid md:grid-cols-[1.2fr_1fr]"
          style={{ background: "var(--c-bg)", border: "1px solid var(--c-accent-15)", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}
        >
          <div className="p-8 md:p-10">
            <span className="label-track block mb-4" style={{ color: "var(--c-accent)" }}>New · The sales game</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-3 leading-tight" style={{ color: "var(--c-fg)" }}>
              Think you can read the room?
            </h2>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--c-fg-55)" }}>
              A buyer says something. You've got seconds to pick the move: ask, tell, or close. Right calls add time, wrong calls
              burn it. Close deals, bank commission, and put your name on the leaderboard.
            </p>
            <Link href="/game" className="btn-accent inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-base font-bold" data-testid="button-home-play">
              <Zap className="w-4 h-4" /> Play Read the Room
            </Link>
          </div>
          <div className="p-8 md:p-10 flex flex-col justify-center gap-3" style={{ background: "var(--c-bg3)", borderLeft: "1px solid var(--c-border)" }}>
            <div className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-md self-start" style={{ background: "var(--c-accent)", color: "#0D0D0D" }}>
              Final meeting
            </div>
            <p className="font-display font-semibold text-xl leading-snug" style={{ color: "var(--c-fg)" }}>“Send me the proposal.”</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(["ask", "tell", "close"] as const).map((m) => (
                <div key={m} className="rounded-lg py-2.5 text-center font-display font-bold text-sm" style={{ background: "var(--c-card)", border: `1px solid ${m === "close" ? "var(--c-accent)" : "var(--c-card-border)"}`, color: m === "close" ? "var(--c-accent)" : "var(--c-fg)" }}>
                  {MOVE_LABEL[m].toUpperCase()}
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
              Late-stage “send it” is a yes waiting for paper. Same words on a first call? You ask. Same words, different room.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
