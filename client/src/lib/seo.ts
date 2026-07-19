import { useEffect } from "react";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

// Per-page title + description/OG tags. Each page sets its own on mount, so no
// cleanup is needed — navigation always overwrites.
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    setMeta("property", "og:title", title);
    if (description) {
      setMeta("name", "description", description);
      setMeta("property", "og:description", description);
    }
  }, [title, description]);
}

// Fire-and-forget product view tracking (powers admin conversion stats)
export function trackProductView(id: number) {
  fetch(`/api/lead-magnets/${id}/view`, { method: "POST" }).catch(() => {});
}
