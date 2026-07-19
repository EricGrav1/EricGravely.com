// Extract a YouTube video id from the common URL shapes people paste:
// watch?v=, youtu.be/, shorts/, embed/, live/. Returns null if none found.
export function youtubeVideoId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/")[1];
      return id && /^[\w-]{6,20}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{6,20}$/.test(v)) return v;
      const m = u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,20})/);
      if (m) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}
