import { useState } from "react";
import { Youtube, Linkedin, Loader2 } from "lucide-react";
import { SiX, SiInstagram, SiGithub } from "react-icons/si";
import { Link } from "wouter";
import { site } from "@/config/site";
import { BrandLogo } from "@/components/BrandLogo";

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

  const SOCIAL_ICONS = [
    { href: social.youtube,   Icon: Youtube,      label: "YouTube",     color: "#FF0033" },
    { href: social.instagram, Icon: SiInstagram,  label: "Instagram",   color: "#D62976" },
    { href: social.linkedin,  Icon: Linkedin,     label: "LinkedIn",    color: "#0A66C2" },
    { href: social.twitter,   Icon: SiX,          label: "X (Twitter)", color: "var(--c-fg)" },
    { href: "https://github.com/EricGrav1/EricGrav1/blob/main/README.md", Icon: SiGithub, label: "GitHub", color: "var(--c-fg-70)" },
  ];

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
            <Link href="/" className="inline-block mb-5" data-testid="link-footer-logo">
              <BrandLogo widthClass="w-44 sm:w-52" />
            </Link>
            <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: "var(--c-fg-45)" }}>
              {footer.tagline}
            </p>
            <div className="flex gap-3">
              {SOCIAL_ICONS.map(({ href, Icon, label, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ border: "1px solid var(--c-border)", color, background: "var(--c-bg2)" }}
                  aria-label={label}
                  data-testid={`link-social-${label.toLowerCase().replace(/[^a-z]/g, "")}`}
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <div>
            <div className="label-track mb-5">Navigate</div>
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
            <div className="label-track mb-5">{footer.newsletterTitle}</div>
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--c-fg-45)" }}>
              {footer.newsletterDesc}
            </p>

            {status === "success" ? (
              <div
                className="px-4 py-3 rounded-lg text-sm font-medium"
                style={{
                  background: "var(--c-accent-10)",
                  border: "1px solid var(--c-accent-15)",
                  color: "var(--c-accent)",
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
                  <p className="text-xs" style={{ color: "var(--c-fg-55)" }}>{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="btn-accent w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  data-testid="button-footer-subscribe"
                >
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : footer.newsletterCta}
                </button>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--c-fg-30)" }}>
                  By subscribing, you agree to receive emails from Eric Gravely. Unsubscribe anytime.
                </p>
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
            onMouseEnter={e => (e.currentTarget.style.color = "var(--c-accent)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--c-fg-30)")}
          >
            {footer.appCta}
          </a>
        </div>
      </div>
    </footer>
  );
}
