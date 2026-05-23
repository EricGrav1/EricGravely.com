import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";
import { Loader2 } from "lucide-react";

type Status = "loading" | "success" | "error";

export default function Unsubscribe() {
  const [location] = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const { unsubscribe: copy } = site;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    const token = params.get("token");

    if (!email || !token) {
      setStatus("error");
      return;
    }

    fetch(`/api/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: { success?: boolean }) => {
        setStatus(data.success ? "success" : "error");
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div style={{ backgroundColor: "#0A0F1E", minHeight: "100vh" }}>
      <SiteNav />
      <main className="pt-24 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 text-white/50">
            <Loader2 className="w-8 h-8 animate-spin text-[#D4A017]" />
            <p className="text-sm">Processing your request…</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: "rgba(212,160,23,0.15)", border: "2px solid rgba(212,160,23,0.3)" }}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="#D4A017" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl font-bold text-white mb-3" data-testid="text-unsubscribe-success">
              {copy.successTitle}
            </h1>
            <p className="text-white/50 text-base mb-8 max-w-md">{copy.successMessage}</p>
            <Link href="/" className="text-[#D4A017] hover:text-[#E8B923] text-sm transition-colors">
              {copy.backToHome}
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.05)", border: "2px solid rgba(255,255,255,0.1)" }}
            >
              <span className="text-2xl text-white/40">?</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-white mb-3" data-testid="text-unsubscribe-error">
              {copy.errorTitle}
            </h1>
            <p className="text-white/50 text-base mb-8 max-w-md">{copy.errorMessage}</p>
            <Link href="/" className="text-white/35 hover:text-white text-sm transition-colors">
              {copy.backToHome}
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
