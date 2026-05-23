import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Shield } from "lucide-react";
import { useLocation } from "wouter";
import { site } from "@/config/site";

export function LeadCaptureSection() {
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim() || undefined,
          tag: site.leadMagnet.convertKitTag,
        }),
      });

      const data = await res.json() as { success?: boolean; message?: string };

      if (!res.ok || !data.success) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      setLocation("/thank-you");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="get-the-playbook"
      className="py-24 md:py-32 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #0A0F1E 0%, #0d1428 50%, #0A0F1E 100%)",
      }}
    >
      {/* Background gold glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[#D4A017]/5 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — Copy */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-[#D4A017] block mb-4">
              Free Download
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {site.leadMagnet.formHeadline}
            </h2>
            <p className="text-white/55 text-base leading-relaxed mb-8">
              {site.leadMagnet.description}
            </p>

            {/* Bullets */}
            <ul className="space-y-4">
              {site.leadMagnet.bullets.map((bullet, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.4 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#D4A017] flex-shrink-0 mt-0.5" />
                  <span className="text-white/75 text-sm leading-relaxed">{bullet}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="rounded-2xl p-8"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(212,160,23,0.2)",
                boxShadow: "0 0 60px rgba(212,160,23,0.06)",
              }}
            >
              <div className="mb-6">
                <h3 className="font-serif text-2xl font-bold text-white mb-1">
                  Get the Playbook — Free
                </h3>
                <p className="text-white/45 text-sm">{site.leadMagnet.formSubheadline}</p>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4 mb-6">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wide">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      className="input-dark w-full px-4 py-3 rounded-lg text-sm"
                      disabled={loading}
                      data-testid="input-first-name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wide">
                      Email Address <span className="text-[#D4A017]">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="input-dark w-full px-4 py-3 rounded-lg text-sm"
                      disabled={loading}
                      data-testid="input-email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-3 rounded-lg bg-red-900/30 border border-red-500/30 text-red-400 text-sm" data-testid="text-form-error">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-gold w-full py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  data-testid="button-submit"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send Me the Playbook →"
                  )}
                </button>

                <div className="flex items-center gap-2 justify-center mt-4 text-white/30 text-xs">
                  <Shield className="w-3 h-3" />
                  {site.leadMagnet.privacyNote}
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
