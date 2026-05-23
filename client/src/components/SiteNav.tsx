import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Sun, Moon } from "lucide-react";
import { site } from "@/config/site";
import { useTheme } from "@/lib/theme";

const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Videos", href: "/#videos" },
  { label: "Coaching", href: "/coaching" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#")) {
      e.preventDefault();
      const id = href.replace("/#", "");
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (location !== "/") {
        window.location.href = href;
      }
    }
  };

  const navBg = scrolled || mobileOpen
    ? "dark:bg-[#0D0D0D]/95 bg-[#FAF7F2]/95 backdrop-blur-md border-b dark:border-white/5 border-black/8 shadow-sm"
    : "bg-transparent";

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center font-serif font-bold text-sm flex-shrink-0 transition-colors"
                style={{ backgroundColor: "#C8102E", color: "#FAF7F2" }}
              >
                EG
              </div>
              <span className="font-serif font-semibold text-[color:var(--c-fg)] text-base hidden sm:block">
                {site.name}
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                  className="text-sm font-medium text-fg-55 hover:text-fg transition-colors duration-200"
                  style={{ color: "var(--c-fg-55)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--c-fg)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--c-fg-55)")}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop right side */}
            <div className="hidden md:flex items-center gap-3">
              {/* Theme toggle */}
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "var(--c-fg-45)", border: "1px solid var(--c-border)" }}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                data-testid="button-theme-toggle"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <a
                href="/#get-the-playbook"
                onClick={(e) => handleSmoothScroll(e, "/#get-the-playbook")}
                className="btn-accent px-4 py-2 rounded-lg text-sm font-semibold"
                data-testid="button-nav-cta"
              >
                Download Playbook
              </a>
            </div>

            {/* Mobile right side */}
            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: "var(--c-fg-45)" }}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button
                className="p-2 transition-colors"
                style={{ color: "var(--c-fg-70)" }}
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
            className="md:hidden px-4 py-6 space-y-4"
            style={{
              borderTop: "1px solid var(--c-border)",
              backgroundColor: "var(--c-bg)",
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleSmoothScroll(e, link.href);
                  setMobileOpen(false);
                }}
                className="block text-base font-medium py-2 transition-colors"
                style={{ color: "var(--c-fg-70)" }}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/#get-the-playbook"
              onClick={(e) => {
                handleSmoothScroll(e, "/#get-the-playbook");
                setMobileOpen(false);
              }}
              className="block btn-accent px-4 py-3 rounded-lg text-sm font-semibold text-center mt-4"
            >
              Download Free Playbook
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
