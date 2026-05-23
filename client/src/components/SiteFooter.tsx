import { useState } from "react";
import { motion } from "framer-motion";
import { Youtube, Linkedin, Twitter, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { site } from "@/config/site";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const { footer, social } = site;

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), tag: "newsletter" }),
      });
      const data = await res.json() as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const id = href.replace("/#", "");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer style={{ background: "#070b16", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div className="w-10 h-10 rounded-lg bg-[#D4A017] flex items-center justify-center font-serif font-bold text-[#0A0F1E] text-sm">
                NA
              </div>
              <div>
                <div className="font-serif font-bold text-white text-base">{site.name}</div>
                <div className="text-[#D4A017] text-xs font-medium">{site.title}</div>
              </div>
            </Link>
            <p className="text-white/40 text-sm leading-relaxed mb-6 max-w-xs">
              {footer.tagline}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              <a
                href={social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-[#D4A017] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-[#D4A017] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={social.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-[#D4A017] transition-colors"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav links */}
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#D4A017] mb-5">
              Navigate
            </div>
            <nav className="space-y-3">
              {footer.links.map((link) => (
                <div key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </a>
                  ) : link.href.startsWith("/#") ? (
                    <a
                      href={link.href}
                      onClick={(e) => handleSmoothScroll(e, link.href)}
                      className="text-white/50 hover:text-white text-sm transition-colors cursor-pointer"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-[#D4A017] mb-5">
              {footer.newsletterTitle}
            </div>
            <p className="text-white/40 text-sm mb-4 leading-relaxed">
              {footer.newsletterDesc}
            </p>

            {status === "success" ? (
              <div className="px-4 py-3 rounded-lg bg-[#D4A017]/10 border border-[#D4A017]/30 text-[#D4A017] text-sm font-medium">
                {footer.newsletterSuccess}
              </div>
            ) : (
              <form onSubmit={handleNewsletter} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={footer.newsletterPlaceholder}
                  className="input-dark w-full px-4 py-2.5 rounded-lg text-sm"
                  disabled={status === "loading"}
                  data-testid="input-footer-email"
                />
                {status === "error" && (
                  <p className="text-red-400 text-xs">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-gold w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="button-footer-subscribe"
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : footer.newsletterCta}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">
            © {new Date().getFullYear()} {site.name}. {footer.copyright}
          </p>
          <a
            href={social.app}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-[#D4A017] text-xs transition-colors"
          >
            {footer.appCta}
          </a>
        </div>
      </div>
    </footer>
  );
}
