import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon } from "lucide-react";
import { site } from "@/config/site";
import { useTheme } from "@/lib/theme";

const navLinks = [
  { label: "About", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Assessment", href: "/assessment" },
  { label: "Coaching", href: "/coaching" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [location] = useLocation();
  const { theme, toggle } = useTheme();
  const overVideoHero = location === "/" && !scrolled && !mobileOpen;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const navBg = scrolled || mobileOpen
    ? "dark:bg-[#0F0F0E]/95 bg-[#FAF7F2]/95 backdrop-blur-md border-b dark:border-white/5 border-black/[0.06] shadow-sm"
    : "bg-transparent";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Wordmark */}
            <Link href="/" className="flex items-center group" data-testid="link-logo">
              {logoFailed ? (
                <span
                  className="font-display font-bold text-lg tracking-tight"
                  style={{ color: "var(--c-fg)" }}
                >
                  {site.name}
                </span>
              ) : (
                <img
                  src="/nav-logo.png"
                  alt={site.name}
                  onError={() => setLogoFailed(true)}
                  className={`h-9 md:h-11 w-auto ${overVideoHero ? "invert" : "dark:invert"}`}
                />
              )}
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium transition-colors duration-200"
                  style={{
                    color: overVideoHero
                      ? location === link.href ? "#FFFFFF" : "rgba(255,255,255,0.72)"
                      : location === link.href ? "var(--c-fg)" : "var(--c-fg-55)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  color: overVideoHero ? "rgba(255,255,255,0.72)" : "var(--c-fg-45)",
                  border: overVideoHero ? "1px solid rgba(255,255,255,0.22)" : "1px solid var(--c-border)",
                }}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link
                href="/products"
                className="btn-accent px-4 py-2 rounded-lg text-sm font-semibold"
                style={overVideoHero ? { background: "#F5F5F3", color: "#090909" } : undefined}
                data-testid="button-nav-cta"
              >
                Free Resources
              </Link>
            </div>

            {/* Mobile right */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: overVideoHero ? "rgba(255,255,255,0.72)" : "var(--c-fg-45)" }}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                className="p-2 transition-colors"
                style={{ color: overVideoHero ? "rgba(255,255,255,0.82)" : "var(--c-fg-70)" }}
                onClick={() => setMobileOpen((o) => !o)}
                aria-label="Toggle mobile menu"
                data-testid="button-mobile-menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div
            className="md:hidden px-4 py-6 space-y-1"
            style={{ borderTop: "1px solid var(--c-border)", backgroundColor: "var(--c-bg)" }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-base font-medium py-2.5 transition-colors"
                style={{ color: "var(--c-fg-70)" }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3">
              <Link
                href="/products"
                className="block btn-accent px-4 py-3 rounded-lg text-sm font-semibold text-center"
              >
                Free Resources
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
