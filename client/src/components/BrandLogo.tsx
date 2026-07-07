import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { site } from "@/config/site";

interface BrandLogoProps {
  /** Tailwind width class, e.g. "w-48" or "w-56". Defaults to "w-52". */
  widthClass?: string;
  /** Extra classes on the container */
  className?: string;
  linkToHome?: boolean;
}

/**
 * Renders /brand-logo.png with correct blend-mode treatment for each theme:
 *   light → mix-blend-mode: multiply  (ivory bg disappears into page)
 *   dark  → invert(0.95) + mix-blend-mode: screen  (reads as ivory script on dark bg)
 *
 * Falls back silently to the Syne text wordmark if the image fails to load
 * or hasn't been uploaded yet.
 */
export function BrandLogo({ widthClass = "w-52", className = "" }: BrandLogoProps) {
  const { theme } = useTheme();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`font-display font-bold text-2xl ${className}`}
        style={{ color: "var(--c-fg)" }}
      >
        {site.name}
      </span>
    );
  }

  return (
    <img
      src="/brand-logo.png"
      alt={site.name}
      className={`${widthClass} h-auto object-contain ${theme === "dark" ? "logo-img-dark" : "logo-img-light"} ${className}`}
      onError={() => setFailed(true)}
      data-testid="img-brand-logo"
    />
  );
}
