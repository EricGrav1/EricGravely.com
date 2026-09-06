import { useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2, Mail, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/lib/seo";

type PurchaseStatus = {
  status: "paid" | "processing" | "failed";
  customerEmail?: string;
  downloadUrl?: string;
  expiresAt?: string;
  downloadsRemaining?: number;
  message?: string;
};

export default function PurchaseSuccess() {
  usePageMeta("Purchase complete — Eric Gravely", "Your Sales Manager Coaching Tool is ready.");
  const [result, setResult] = useState<PurchaseStatus | null>(null);
  const [error, setError] = useState("");
  const sessionId = new URLSearchParams(window.location.search).get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setError("This purchase link is missing its checkout session.");
      return;
    }

    let cancelled = false;
    let attempt = 0;
    const load = async () => {
      try {
        const response = await fetch(`/api/checkout/session/${encodeURIComponent(sessionId)}`, { credentials: "include" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || "We could not confirm the purchase.");
        if (cancelled) return;
        setResult(body);
        if (body.status === "processing" && attempt < 5) {
          attempt += 1;
          window.setTimeout(load, 1500);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "We could not confirm the purchase.");
      }
    };
    load();
    return () => { cancelled = true; };
  }, [sessionId]);

  const paid = result?.status === "paid";

  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />
      <main className="pt-24">
        <section className="py-16 md:py-24">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <div className="rounded-2xl p-7 md:p-10 text-center" style={{ background: "var(--c-card)", border: "1px solid var(--c-card-border)" }}>
              {error ? (
                <>
                  <div className="w-14 h-14 mx-auto mb-6 rounded-2xl flex items-center justify-center" style={{ background: "var(--c-accent-10)" }}>
                    <RefreshCw className="w-6 h-6" style={{ color: "var(--c-accent)" }} />
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-4" style={{ color: "var(--c-fg)" }}>We couldn&apos;t confirm it yet</h1>
                  <p className="leading-relaxed mb-7" style={{ color: "var(--c-fg-55)" }}>{error}</p>
                  <p className="text-sm" style={{ color: "var(--c-fg-45)" }}>If Stripe charged your card, your delivery email will still be sent automatically. Contact eric@ericgravely.com if you need help.</p>
                </>
              ) : !paid ? (
                <>
                  <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin" style={{ color: "var(--c-accent)" }} />
                  <h1 className="font-display text-3xl font-bold mb-4" style={{ color: "var(--c-fg)" }}>Confirming your purchase…</h1>
                  <p style={{ color: "var(--c-fg-55)" }}>This usually takes only a few seconds. Please keep this page open.</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-14 h-14 mx-auto mb-6" style={{ color: "var(--c-accent)" }} />
                  <span className="label-track block mb-4">Purchase Complete</span>
                  <h1 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: "var(--c-fg)" }}>Your coaching tool is ready.</h1>
                  <p className="leading-relaxed mb-7" style={{ color: "var(--c-fg-55)" }}>
                    We sent the download link to <strong style={{ color: "var(--c-fg)" }}>{result.customerEmail}</strong>. You can also download it now.
                  </p>
                  <a href={result.downloadUrl} className="btn-accent w-full py-3.5 rounded-lg font-bold text-base flex items-center justify-center gap-2 mb-4" data-testid="button-download-purchase">
                    <Download className="w-4 h-4" /> Download your files
                  </a>
                  <div className="flex items-start gap-3 text-left rounded-xl p-4" style={{ background: "var(--c-bg2)", border: "1px solid var(--c-border)" }}>
                    <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--c-accent)" }} />
                    <p className="text-xs leading-relaxed" style={{ color: "var(--c-fg-55)" }}>
                      The link allows {result.downloadsRemaining ?? 5} downloads and expires in 30 days. Save the ZIP file somewhere secure after downloading it.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="text-center mt-8">
              <Link href="/products" className="text-sm font-semibold" style={{ color: "var(--c-accent)" }}>Return to products →</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
