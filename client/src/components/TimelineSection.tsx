import { motion } from "framer-motion";
import { site } from "@/config/site";

const fadeItem = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function TimelineSection() {
  return (
    <section
      className="py-24 md:py-32"
      style={{ background: "linear-gradient(180deg, #111827 0%, #0A0F1E 100%)" }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold tracking-widest uppercase text-[#D4A017] block mb-4">
            The Journey
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
            From Rep to{" "}
            <span className="italic text-[#D4A017]">Leader</span>
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            10+ years in the trenches. Here's the career arc that built the Sales Commandments methodology.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line — desktop */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px hidden lg:block"
            style={{ background: "linear-gradient(180deg, transparent, #D4A017 10%, #D4A017 90%, transparent)" }}
          />
          {/* Left line — mobile */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px lg:hidden"
            style={{ background: "linear-gradient(180deg, transparent, #D4A017 10%, #D4A017 90%, transparent)" }}
          />

          <div className="space-y-0">
            {site.timeline.map((item, i) => {
              const isLeft = i % 2 === 0;
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-60px" }}
                  variants={fadeItem}
                  className={`relative flex ${isLeft ? "lg:flex-row" : "lg:flex-row-reverse"} items-center gap-0 lg:gap-8 mb-12`}
                >
                  {/* Mobile layout */}
                  <div className="lg:hidden flex items-start gap-6 w-full pl-12">
                    {/* Dot */}
                    <div
                      className="absolute left-[18px] top-1 w-4 h-4 rounded-full border-2 border-[#D4A017] bg-[#0A0F1E] flex-shrink-0"
                      style={{ boxShadow: "0 0 12px rgba(212,160,23,0.4)" }}
                    />
                    <div
                      className="card-surface rounded-xl p-5 flex-1"
                      style={{ border: "1px solid rgba(212,160,23,0.12)" }}
                    >
                      <div className="text-[#D4A017] text-xs font-bold tracking-widest uppercase mb-1">
                        {item.year}
                      </div>
                      <div className="text-white font-semibold text-lg mb-1">{item.title}</div>
                      <div className="text-[#D4A017]/70 text-xs font-medium mb-2">{item.company}</div>
                      <p className="text-white/55 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className={`hidden lg:flex ${isLeft ? "justify-end" : "justify-start"} w-1/2 ${isLeft ? "pr-12" : "pl-12"}`}>
                    <div
                      className="card-surface rounded-xl p-6 max-w-sm w-full"
                      style={{ border: "1px solid rgba(212,160,23,0.12)" }}
                    >
                      <div className="text-[#D4A017] text-xs font-bold tracking-widest uppercase mb-2">
                        {item.year}
                      </div>
                      <div className="text-white font-semibold text-xl mb-1">{item.title}</div>
                      <div className="text-[#D4A017]/70 text-sm font-medium mb-3">{item.company}</div>
                      <p className="text-white/55 text-sm leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Center dot — desktop */}
                  <div
                    className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-[#D4A017] bg-[#0A0F1E] items-center justify-center flex-shrink-0 z-10"
                    style={{ boxShadow: "0 0 16px rgba(212,160,23,0.5)" }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#D4A017]" />
                  </div>

                  {/* Empty spacer — desktop */}
                  <div className="hidden lg:block w-1/2" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
