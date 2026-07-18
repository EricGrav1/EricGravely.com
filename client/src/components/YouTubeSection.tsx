import { motion } from "framer-motion";
import { Play, Youtube } from "lucide-react";
import { site } from "@/config/site";

const videos = site.youtube.videos;
const tiles = [...videos, ...videos];

function VideoTile({ id, title }: { id: string; title: string }) {
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative flex-shrink-0 rounded-xl overflow-hidden group"
      style={{ width: 300, height: 170, border: "1px solid var(--c-border)" }}
      aria-label={title}
      data-testid={`card-video-${id}`}
    >
      <img
        src={thumb}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)" }}
      />
      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 group-hover:scale-110"
          style={{ background: "var(--c-accent)" }}
        >
          <Play className="w-5 h-5 fill-current ml-0.5" style={{ color: "#0D0D0D" }} />
        </div>
      </div>
      {/* Title at bottom */}
      <p
        className="absolute bottom-0 left-0 right-0 px-4 pb-3 text-xs font-semibold leading-snug line-clamp-2"
        style={{ color: "#FAF7F2" }}
      >
        {title}
      </p>
    </a>
  );
}

export function YouTubeSection() {
  return (
    <section
      id="videos"
      className="py-20 md:py-28 overflow-hidden"
      style={{ background: "var(--c-bg2)", borderTop: "1px solid var(--c-border)" }}
    >
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <span className="label-track block mb-4">Content</span>
          <h2
            className="font-display text-4xl md:text-5xl font-bold"
            style={{ color: "var(--c-fg)" }}
          >
            {site.youtube.sectionTitle}
          </h2>
          <p className="text-base mt-3 max-w-lg" style={{ color: "var(--c-fg-55)" }}>
            {site.youtube.sectionSubtitle}
          </p>
        </div>
        <a
          href={site.youtube.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline-accent px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 flex-shrink-0 self-start"
          data-testid="link-youtube-channel"
        >
          <Youtube className="w-4 h-4" />
          {site.youtube.channelHandle}
        </a>
      </motion.div>

      {/* Scrolling ticker */}
      <div className="relative">
        {/* Fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, var(--c-bg2), transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, var(--c-bg2), transparent)" }}
        />
        <div className="flex gap-4 px-4 social-feed-marquee" style={{ animationDuration: "32s" }}>
          {tiles.map((v, i) => (
            <VideoTile key={`${v.id}-${i}`} id={v.id} title={v.title} />
          ))}
        </div>
      </div>
    </section>
  );
}
