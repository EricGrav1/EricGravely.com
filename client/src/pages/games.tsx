import { motion } from "framer-motion";
import { ArrowUpRight, Crosshair, Gamepad2, ShieldCheck, Sparkles } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { games } from "@/config/games";
import { usePageMeta } from "@/lib/seo";

function GamePreview() {
  return (
    <div
      className="relative min-h-[310px] overflow-hidden bg-[#040914] p-6 sm:min-h-[380px] sm:p-8"
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(44,217,231,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(44,217,231,.09) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "linear-gradient(to bottom, black, transparent 88%)",
        }}
      />
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-60 w-60 rounded-full bg-cyan-400/20 blur-3xl" />

      <div className="relative flex items-center justify-between border-b border-cyan-300/20 pb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-100/60 sm:text-xs">
        <span className="flex items-center gap-2 text-cyan-200">
          <span className="h-2 w-2 rotate-45 bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)]" />
          Objection Defenders
        </span>
        <span>Wave 01 / 05</span>
      </div>

      <div className="relative mx-auto mt-10 max-w-md">
        <div className="flex items-end justify-between gap-5">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200/50">
              Incoming objection
            </div>
            <div className="font-display text-2xl font-bold leading-tight text-white sm:text-4xl">
              “Your price is too high.”
            </div>
          </div>
          <Crosshair className="h-12 w-12 shrink-0 text-cyan-300/70 sm:h-16 sm:w-16" strokeWidth={1} />
        </div>

        <div className="mt-8 space-y-2.5">
          {["Acknowledge the concern", "Ask what feels out of range", "Reframe around the outcome"].map((label, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 border px-4 py-3 font-mono text-xs uppercase tracking-wide ${
                index === 1
                  ? "border-cyan-300/70 bg-cyan-300/10 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,.10)]"
                  : "border-white/10 bg-white/[0.025] text-white/45"
              }`}
              style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
            >
              <span className="text-cyan-300/70">0{index + 1}</span>
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 right-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-violet-200/60">
        <Sparkles className="h-3.5 w-3.5" />
        Sales Coach AI
      </div>
    </div>
  );
}

export default function Games() {
  usePageMeta(
    "Sales Training Games — Eric Gravely",
    "Practice objection handling and sales conversations through interactive browser games from Eric Gravely.",
  );

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-20">
        <section className="border-b py-20 md:py-28" style={{ borderColor: "var(--c-border)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid items-end gap-10 lg:grid-cols-[1fr_0.62fr]"
            >
              <div>
                <span className="label-track mb-6 flex items-center gap-2">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Practice, made playable
                </span>
                <h1 className="hero-display max-w-4xl text-5xl font-bold leading-[0.95] md:text-7xl lg:text-[5.4rem]" style={{ color: "var(--c-fg)" }}>
                  Build the reflexes your next call will demand.
                </h1>
              </div>
              <div className="border-l pl-6 md:pl-8" style={{ borderColor: "var(--c-border)" }}>
                <p className="max-w-lg text-lg leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                  Short, focused sales games built to turn good advice into instinct. Choose a challenge and play directly in your browser.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-16 md:py-24" style={{ background: "var(--c-bg2)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-9 flex items-end justify-between gap-6">
              <div>
                <span className="label-track mb-3 block">Choose your drill</span>
                <h2 className="font-display text-3xl font-bold md:text-4xl" style={{ color: "var(--c-fg)" }}>
                  Games library
                </h2>
              </div>
              <div className="hidden text-sm sm:block" style={{ color: "var(--c-fg-30)" }}>
                {games.length.toString().padStart(2, "0")} game{games.length === 1 ? "" : "s"} live
              </div>
            </div>

            <div className="space-y-8">
              {games.map((game, index) => (
                <motion.article
                  key={game.slug}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  className="group overflow-hidden border lg:grid lg:grid-cols-[1.12fr_0.88fr]"
                  style={{ background: "var(--c-bg)", borderColor: "var(--c-card-border)" }}
                  data-testid={`card-game-${game.slug}`}
                >
                  <a href={game.href} aria-label={`Play ${game.title}`} tabIndex={-1}>
                    <GamePreview />
                  </a>

                  <div className="flex flex-col p-6 sm:p-9 lg:p-11">
                    <div className="mb-8 flex items-center justify-between gap-4">
                      <span className="label-track">{game.eyebrow}</span>
                      <span
                        className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                        style={{ color: "var(--c-fg-55)", borderColor: "var(--c-border)" }}
                      >
                        Live
                      </span>
                    </div>

                    <h3 className="font-display text-4xl font-bold md:text-5xl" style={{ color: "var(--c-fg)" }}>
                      {game.title}
                    </h3>
                    <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                      {game.description}
                    </p>

                    <div className="mt-7 flex flex-wrap gap-2">
                      {game.details.map((detail) => (
                        <span
                          key={detail}
                          className="rounded-full border px-3 py-1.5 text-xs"
                          style={{ color: "var(--c-fg-45)", borderColor: "var(--c-border)" }}
                        >
                          {detail}
                        </span>
                      ))}
                    </div>

                    <div className="mt-8 border-t pt-7" style={{ borderColor: "var(--c-border)" }}>
                      <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em]" style={{ color: "var(--c-fg-45)" }}>
                        <ShieldCheck className="h-4 w-4" />
                        Skills under pressure
                      </div>
                      <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                        {game.skills.map((skill, skillIndex) => (
                          <div key={skill} className="flex items-center gap-2 text-sm" style={{ color: "var(--c-fg-70)" }}>
                            <span className="font-mono text-[10px]" style={{ color: "var(--c-fg-30)" }}>
                              0{skillIndex + 1}
                            </span>
                            {skill}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-9">
                      <a
                        href={game.href}
                        className="btn-accent inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-sm font-bold sm:w-auto"
                        data-testid={`button-play-${game.slug}`}
                      >
                        {game.status}
                        <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-12 flex items-center gap-3 border-t pt-8" style={{ borderColor: "var(--c-border)", color: "var(--c-fg-30)" }}>
              <span className="font-mono text-xs">02</span>
              <span className="text-sm">More sales challenges are in the lab.</span>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
