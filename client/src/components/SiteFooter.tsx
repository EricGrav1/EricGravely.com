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
    <footer
      style={{
        background: "var(--c-bg3)",
        borderTop: "1px solid var(--c-border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4 group">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-serif font-bold text-sm"
                style={{ background: "#C8102E", color: "#FAF7F2" }}
              >
                NA
              </div>
              <div>
                <div className="font-serif font-bold text-base" style={{ color: "var(--c-fg)" }}>{site.name}</div>
                <div className="text-xs font-medium" style={{ color: "#C8102E" }}>{site.title}</div>
              </div>
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "var(--c-fg-45)" }}>
              {footer.tagline}
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {[
                { href: social.youtube, Icon: Youtube, label: "YouTube" },
                { href: social.linkedin, Icon: Linkedin, label: "LinkedIn" },
                { href: social.twitter, Icon: Twitter, label: "Twitter / X" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{
                    border: "1px solid var(--c-border)",
                    color: "var(--c-fg-45)",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#C8102E")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--c-fg-45)")}
                  aria-label={label}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#C8102E" }}>
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
                      className="text-sm transition-colors"
                      style={{ color: "var(--c-fg-55)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--c-fg)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--c-fg-55)")}
                    >
                      {link.label}
                    </a>
                  ) : link.href.startsWith("/#") ? (
                    <a
                      href={link.href}
                      onClick={(e) => handleSmoothScroll(e, link.href)}
                      className="text-sm transition-colors cursor-pointer"
                      style={{ color: "var(--c-fg-55)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "var(--c-fg)")}
                      onMouseLeave={e => (e.currentTarget.style.color = "var(--c-fg-55)")}
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm transition-colors"
                      style={{ color: "var(--c-fg-55)" }}
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
            <div className="text-xs font-semibold tracking-widest uppercase mb-5" style={{ color: "#C8102E" }}>
              {footer.newsletterTitle}
            </div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
              {footer.newsletterDesc}
            </p>

            {status === "success" ? (
              <div
                className="px-4 py-3 rounded-lg text-sm font-medium"
                style={{
                  background: "rgba(200,16,46,0.10)",
                  border: "1px solid rgba(200,16,46,0.30)",
                  color: "#C8102E",
                }}
              >
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
                  <p className="text-xs" style={{ color: "#C8102E" }}>{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-accent w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="button-footer-subscribe"
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : footer.newsletterCta}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          <p className="text-xs" style={{ color: "var(--c-fg-30)" }}>
            © {new Date().getFullYear()} {site.name}. {footer.copyright}
          </p>
          <a
            href={social.app}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs transition-colors"
            style={{ color: "var(--c-fg-30)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#C8102E")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--c-fg-30)")}
          >
            {footer.appCta}
          </a>
        </div>
      </div>
    </footer>
  );
}
