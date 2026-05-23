import { motion } from "framer-motion";
import { site } from "@/config/site";

export function StatsBar() {
  return (
    <section
      id="about"
      className="border-y border-white/5"
      style={{ background: "linear-gradient(180deg, #0d1428 0%, #111827 100%)" }}
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
              className={`flex flex-col items-center text-center px-6 py-8 ${
                i < site.stats.length - 1 ? "border-r border-white/5" : ""
              } ${i >= 2 ? "border-t border-white/5 lg:border-t-0" : ""}`}
              data-testid={`stat-${i}`}
            >
              <div
                className="font-serif text-4xl lg:text-5xl font-bold mb-2"
                style={{ color: "#D4A017" }}
              >
                {stat.value}
              </div>
              <div className="text-white/50 text-sm font-medium leading-snug max-w-[120px]">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
