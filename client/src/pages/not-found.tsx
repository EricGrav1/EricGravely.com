import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div style={{ backgroundColor: "#0A0F1E", minHeight: "100vh" }}>
      <SiteNav />
      <main className="pt-24 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="font-serif text-8xl font-bold text-[#D4A017]/20 mb-4">404</div>
        <h1 className="font-serif text-3xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-white/50 text-base mb-8 max-w-md">
          Looks like this page doesn't exist. Head back home and keep moving.
        </p>
        <Link
          href="/"
          className="btn-gold px-6 py-3 rounded-lg font-semibold text-sm inline-flex items-center gap-2"
        >
          ← Back to Home
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
