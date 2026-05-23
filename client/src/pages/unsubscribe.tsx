import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/config/site";
import { Loader2 } from "lucide-react";

type Status = "loading" | "success" | "error";

export default function Unsubscribe() {
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
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />
      <main className="pt-24 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4" style={{ color: "var(--c-fg-45)" }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#C8102E" }} />
            <p className="text-sm">Processing your request…</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: "rgba(200,16,46,0.12)",
                border: "2px solid rgba(200,16,46,0.28)",
              }}
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="#C8102E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1
              className="font-serif text-3xl font-bold mb-3"
              style={{ color: "var(--c-fg)" }}
              data-testid="text-unsubscribe-success"
            >
              {copy.successTitle}
            </h1>
            <p className="text-base mb-8 max-w-md" style={{ color: "var(--c-fg-55)" }}>{copy.successMessage}</p>
            <Link href="/" className="text-sm transition-colors" style={{ color: "#C8102E" }}>
              {copy.backToHome}
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{
                background: "var(--c-card)",
                border: "1px solid var(--c-card-border)",
              }}
            >
              <span className="text-2xl" style={{ color: "var(--c-fg-40)" }}>?</span>
            </div>
            <h1
              className="font-serif text-3xl font-bold mb-3"
              style={{ color: "var(--c-fg)" }}
              data-testid="text-unsubscribe-error"
            >
              {copy.errorTitle}
            </h1>
            <p className="text-base mb-8 max-w-md" style={{ color: "var(--c-fg-55)" }}>{copy.errorMessage}</p>
            <Link href="/" className="text-sm transition-colors" style={{ color: "var(--c-fg-30)" }}>
              {copy.backToHome}
            </Link>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
