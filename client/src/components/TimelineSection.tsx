import { motion } from "framer-motion";
import { site } from "@/config/site";

const fadeItem = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export function TimelineSection() {
  const { timeline } = site;

  return (
    <section
      className="py-24 md:py-32"
      style={{ background: "var(--c-bg)" }}
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
          <span className="text-xs font-semibold tracking-widest uppercase block mb-4" style={{ color: "#C8102E" }}>
            {timeline.sectionLabel}
          </span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4" style={{ color: "var(--c-fg)" }}>
            {timeline.sectionTitlePrefix}{" "}
            <span className="italic" style={{ color: "#C8102E" }}>{timeline.sectionTitleHighlight}</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--c-fg-55)" }}>
            {timeline.sectionDescription}
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line — desktop */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px hidden lg:block"
            style={{ background: "linear-gradient(180deg, transparent, #C8102E 10%, #C8102E 90%, transparent)" }}
          />
          {/* Left line — mobile */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px lg:hidden"
            style={{ background: "linear-gradient(180deg, transparent, #C8102E 10%, #C8102E 90%, transparent)" }}
          />

          <div className="space-y-0">
            {timeline.items.map((item, i) => {
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
                    <div
                      className="absolute left-[18px] top-1 w-4 h-4 rounded-full border-2 flex-shrink-0"
                      style={{
                        borderColor: "#C8102E",
                        backgroundColor: "var(--c-bg)",
                        boxShadow: "0 0 12px rgba(200,16,46,0.4)",
                      }}
                    />
                    <div
                      className="rounded-xl p-5 flex-1"
                      style={{
                        background: "var(--c-card)",
                        border: "1px solid rgba(200,16,46,0.14)",
                      }}
                    >
                      <div className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#C8102E" }}>{item.year}</div>
                      <div className="font-semibold text-lg mb-1" style={{ color: "var(--c-fg)" }}>{item.title}</div>
                      <div className="text-xs font-medium mb-2" style={{ color: "rgba(200,16,46,0.7)" }}>{item.company}</div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-55)" }}>{item.description}</p>
                    </div>
                  </div>

                  {/* Desktop layout */}
                  <div className={`hidden lg:flex ${isLeft ? "justify-end" : "justify-start"} w-1/2 ${isLeft ? "pr-12" : "pl-12"}`}>
                    <div
                      className="rounded-xl p-6 max-w-sm w-full"
                      style={{
                        background: "var(--c-card)",
                        border: "1px solid rgba(200,16,46,0.14)",
                      }}
                    >
                      <div className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#C8102E" }}>{item.year}</div>
                      <div className="font-semibold text-xl mb-1" style={{ color: "var(--c-fg)" }}>{item.title}</div>
                      <div className="text-sm font-medium mb-3" style={{ color: "rgba(200,16,46,0.7)" }}>{item.company}</div>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--c-fg-55)" }}>{item.description}</p>
                    </div>
                  </div>

                  {/* Center dot — desktop */}
                  <div
                    className="hidden lg:flex absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 items-center justify-center flex-shrink-0 z-10"
                    style={{
                      borderColor: "#C8102E",
                      backgroundColor: "var(--c-bg)",
                      boxShadow: "0 0 16px rgba(200,16,46,0.5)",
                    }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: "#C8102E" }} />
                  </div>

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
