import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Youtube } from "lucide-react";
import { site } from "@/config/site";

function VideoCard({ video, index }: { video: typeof site.youtube.videos[0]; index: number }) {
  const [playing, setPlaying] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
  const isPlaceholder = video.id.startsWith("YOUTUBE_VIDEO_ID");

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group rounded-xl overflow-hidden flex flex-col"
      style={{ border: "1px solid var(--c-border)" }}
      data-testid={`card-video-${index}`}
    >
      {/* Video area */}
      <div className="relative aspect-video overflow-hidden" style={{ background: "var(--c-bg3)" }}>
        {playing && !isPlaceholder ? (
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <button
            onClick={() => !isPlaceholder && setPlaying(true)}
            className="absolute inset-0 w-full h-full focus:outline-none"
            style={{ cursor: isPlaceholder ? "default" : "pointer" }}
            aria-label={`Play ${video.title}`}
            data-testid={`button-play-${index}`}
          >
            {/* Thumbnail */}
            {!isPlaceholder && (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            )}

            {/* Dark overlay */}
            <div
              className="absolute inset-0 transition-opacity duration-300"
              style={{ background: isPlaceholder ? "var(--c-bg3)" : "rgba(0,0,0,0.25)" }}
            />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-transform duration-200 group-hover:scale-110"
                style={{
                  background: isPlaceholder ? "var(--c-border)" : "#C8102E",
                  opacity: isPlaceholder ? 0.4 : 1,
                }}
              >
                <Play className="w-6 h-6 fill-current ml-0.5" style={{ color: "#FAF7F2" }} />
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex-1 flex flex-col" style={{ background: "var(--c-card)" }}>
        <h3
          className="font-semibold text-base leading-snug mb-2 transition-colors"
          style={{ color: "var(--c-fg)" }}
        >
          {isPlaceholder ? "Coming Soon" : video.title}
        </h3>
        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--c-fg-45)" }}>
          {isPlaceholder ? "Video will appear here once a YouTube video ID is added." : video.description}
        </p>
      </div>
    </motion.div>
  );
}

export function YouTubeSection() {
  return (
    <section
      id="videos"
      className="py-24 md:py-32"
      style={{ background: "var(--c-bg2)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div>
            <span className="text-xs font-semibold tracking-widest uppercase block mb-4" style={{ color: "#C8102E" }}>
              Content
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-3" style={{ color: "var(--c-fg)" }}>
              {site.youtube.sectionTitle}
            </h2>
            <p className="text-base max-w-lg" style={{ color: "var(--c-fg-55)" }}>
              {site.youtube.sectionSubtitle}
            </p>
          </div>
          <a
            href={site.youtube.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-accent px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 flex-shrink-0 self-start md:self-auto"
            data-testid="link-youtube-channel"
          >
            <Youtube className="w-4 h-4" />
            {site.youtube.channelHandle}
          </a>
        </motion.div>

        {/* Video grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {site.youtube.videos.map((video, i) => (
            <VideoCard key={video.id + i} video={video} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <a
            href={site.youtube.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-accent px-8 py-3.5 rounded-lg text-sm font-bold inline-flex items-center gap-2"
            data-testid="link-watch-more"
          >
            <Youtube className="w-4 h-4" />
            Watch More on YouTube
          </a>
        </motion.div>
      </div>
    </section>
  );
}
