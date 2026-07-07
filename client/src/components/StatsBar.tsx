import { motion } from "framer-motion";
import { site } from "@/config/site";

export function StatsBar() {
  return (
    <section
      id="about"
      style={{
        background: "var(--c-bg2)",
        borderTop: "1px solid var(--c-border)",
        borderBottom: "1px solid var(--c-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-0"
        >
          {site.stats.map((stat, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
              }}
              className="flex flex-col items-center text-center px-6 py-8"
              style={{
                borderRight: i < site.stats.length - 1 ? "1px solid var(--c-border)" : "none",
                borderTop: i >= 2 ? "1px solid var(--c-border)" : "none",
              }}
              data-testid={`stat-${i}`}
            >
              <div
                className="font-display text-4xl lg:text-5xl font-bold mb-2"
                style={{ color: "var(--c-accent)" }}
              >
                {stat.value}
              </div>
              <div className="label-track mt-1 max-w-[120px] leading-snug" style={{ letterSpacing: "0.08em" }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
