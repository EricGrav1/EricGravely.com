import { Play } from "lucide-react";
import { site } from "@/config/site";

const videos = site.youtube.videos;
const tiles = [...videos, ...videos];

function Thumbnail({ id, title }: { id: string; title: string }) {
  const thumb = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex-shrink-0 rounded-xl overflow-hidden group"
      style={{ width: 260, height: 148, border: "1px solid var(--c-border)" }}
      aria-label={title}
      data-testid={`link-feed-video-${id}`}
    >
      <img
        src={thumb}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div
        className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-60"
        style={{ background: "rgba(0,0,0,0.35)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110"
          style={{ background: "var(--c-accent)" }}
        >
          <Play className="w-4 h-4 fill-current ml-0.5" style={{ color: "#0D0D0D" }} />
        </div>
      </div>
    </a>
  );
}

export function SocialFeedStrip() {
  return (
    <section
      className="py-12 overflow-hidden"
      style={{ background: "var(--c-bg)", borderTop: "1px solid var(--c-border)" }}
    >
      {/* Ticker label */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex items-center justify-between">
        <span className="label-track" style={{ color: "var(--c-fg-45)" }}>
          @EricGravely on YouTube
        </span>
        <a
          href={site.youtube.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold transition-colors"
          style={{ color: "var(--c-accent)" }}
          data-testid="link-feed-channel"
        >
          Subscribe →
        </a>
      </div>

      {/* Scrolling strip */}
      <div className="relative">
        {/* Left fade */}
        <div
          className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--c-bg), transparent)" }}
        />
        {/* Right fade */}
        <div
          className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--c-bg), transparent)" }}
        />

        <div className="flex gap-4 social-feed-marquee px-4">
          {tiles.map((v, i) => (
            <Thumbnail key={`${v.id}-${i}`} id={v.id} title={v.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
