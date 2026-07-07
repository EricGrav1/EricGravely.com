// ── Site base URL ────────────────────────────────────────────────────────────
// Set SITE_BASE_URL in your environment when you have a custom domain.
// All email links, unsubscribe links, and download URLs are built from this.
// Default: the Replit dev URL (auto-detected at runtime from request headers).
//
// To update when you purchase a domain:
//   SITE_BASE_URL=https://yourdomain.com
//
// If SITE_BASE_URL is not set, the server falls back to the request's
// x-forwarded-proto + x-forwarded-host headers (correct for Replit deploys).

export function getSiteBaseUrl(req?: {
  headers: Record<string, string | string[] | undefined>;
}): string {
  if (process.env.SITE_BASE_URL) return process.env.SITE_BASE_URL.replace(/\/$/, "");
  if (!req) return "https://ericgravely.com"; // fallback for non-request contexts
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers["host"] ?? "localhost:5000";
  return `${protocol}://${host}`;
}

// ConvertKit tag for each lead magnet, keyed by lead_magnets.id.
// Update this map when you add new products.
export const PRODUCT_CK_TAGS: Record<number, string> = {
  6: "ask-close-playbook",
  8: "coaching-matrix",
};
