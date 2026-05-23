import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { site } from "@/config/site";

const navLinks = [
  { label: "About", href: "/#about" },
  { label: "Videos", href: "/#videos" },
  { label: "Coaching", href: "/coaching" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || mobileOpen
            ? "bg-[#0A0F1E]/95 backdrop-blur-md border-b border-white/5 shadow-xl"
            : "bg-transparent"
        }`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-[#D4A017] flex items-center justify-center font-serif font-bold text-[#0A0F1E] text-sm flex-shrink-0 group-hover:bg-[#E8B923] transition-colors">
                NA
              </div>
              <span className="font-serif font-semibold text-white text-base hidden sm:block">
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
                  className="text-sm font-medium text-white/70 hover:text-white transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="/#get-the-playbook"
                onClick={(e) => handleSmoothScroll(e, "/#get-the-playbook")}
                className="btn-gold px-4 py-2 rounded-lg text-sm font-semibold"
                data-testid="button-nav-cta"
              >
                Download Playbook
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white/80 hover:text-white p-2"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle mobile menu"
              data-testid="button-mobile-menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0A0F1E]/98 px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  handleSmoothScroll(e, link.href);
                  setMobileOpen(false);
                }}
                className="block text-base font-medium text-white/80 hover:text-white py-2 transition-colors"
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
              className="block btn-gold px-4 py-3 rounded-lg text-sm font-semibold text-center mt-4"
            >
              Download Free Playbook
            </a>
          </div>
        )}
      </nav>
    </>
  );
}
