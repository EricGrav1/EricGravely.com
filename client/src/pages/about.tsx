import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { TimelineSection } from "@/components/TimelineSection";
import { site } from "@/config/site";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
  }),
};

export default function About() {
  const { about, stats } = site;

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />

      <main className="pt-24">
        {/* Page header */}
        <section className="py-20 md:py-28" style={{ background: "var(--c-bg)" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            >
              <motion.span
                variants={fadeUp}
                custom={0}
                className="label-track block mb-6"
              >
                {about.eyebrow}
              </motion.span>

              <motion.h1
                variants={fadeUp}
                custom={0.1}
                className="font-display text-4xl md:text-6xl font-bold mb-10 leading-[1.1]"
                style={{ color: "var(--c-fg)" }}
              >
                {about.headline}{" "}
                <span className="gold-underline">{about.headlineHighlight}</span>
              </motion.h1>

              {/* Two-column bio + photo */}
              <div className="grid lg:grid-cols-[1fr_auto] gap-12 lg:gap-20 items-start">
                <div>
                  {about.bio.map((paragraph, i) => (
                    <motion.p
                      key={i}
                      variants={fadeUp}
                      custom={0.2 + i * 0.1}
                      className="text-lg leading-relaxed mb-5"
                      style={{ color: i === 0 ? "var(--c-fg-70)" : "var(--c-fg-55)" }}
                    >
                      {paragraph}
                    </motion.p>
                  ))}
                </div>

                <motion.div
                  variants={fadeUp}
                  custom={0.2}
                  className="lg:w-56 flex-shrink-0"
                >
                  <div
                    className="w-48 h-48 lg:w-56 lg:h-56 rounded-full overflow-hidden mx-auto lg:mx-0"
                    style={{
                      border: "1px solid var(--c-border)",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    }}
                  >
                    <img
                      src="/nicholas.jpg"
                      alt="Eric Gravely"
                      className="w-full h-full object-cover"
                      style={{ objectPosition: "center 12%" }}
                    />
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats row */}
        <section
          style={{
            background: "var(--c-bg2)",
            borderTop: "1px solid var(--c-border)",
            borderBottom: "1px solid var(--c-border)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center px-4 py-6"
                  style={{
                    borderRight: i < stats.length - 1 ? "1px solid var(--c-border)" : "none",
                  }}
                >
                  <div
                    className="font-display text-3xl md:text-4xl font-bold mb-1"
                    style={{ color: "var(--c-accent)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="label-track" style={{ letterSpacing: "0.08em" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline — relocated from homepage */}
        <TimelineSection />

        {/* Closing CTA */}
        <section
          className="py-20 md:py-28"
          style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}
        >
          <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--c-fg)" }}>
                Ready to put this to work?
              </h2>
              <p className="text-lg mb-10 leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
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
