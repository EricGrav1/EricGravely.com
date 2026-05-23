import { motion } from "framer-motion";
import { Play, Youtube } from "lucide-react";
import { site } from "@/config/site";

function VideoCard({ video, index }: { video: typeof site.youtube.videos[0]; index: number }) {
  const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

  return (
    <motion.a
      href={videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group block rounded-xl overflow-hidden"
      style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      data-testid={`card-video-${index}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-[#1a2340] overflow-hidden">
        <img
          src={thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
        {/* Overlay */}
        <div className="video-overlay absolute inset-0" />
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-[#D4A017] flex items-center justify-center shadow-xl transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#E8B923]">
            <Play className="w-6 h-6 text-[#0A0F1E] fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
        <h3 className="font-semibold text-white text-base leading-snug mb-2 group-hover:text-[#D4A017] transition-colors">
          {video.title}
        </h3>
        <p className="text-white/45 text-sm leading-relaxed line-clamp-2">
          {video.description}
        </p>
      </div>
    </motion.a>
  );
}

export function YouTubeSection() {
  return (
    <section
      id="videos"
      className="py-24 md:py-32"
      style={{ background: "#0A0F1E" }}
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
            <span className="text-xs font-semibold tracking-widest uppercase text-[#D4A017] block mb-4">
              Content
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-3">
              {site.youtube.sectionTitle}
            </h2>
            <p className="text-white/50 text-base max-w-lg">
              {site.youtube.sectionSubtitle}
            </p>
          </div>
          <a
            href={site.youtube.channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-gold px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 flex-shrink-0 self-start md:self-auto"
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
            className="btn-gold px-8 py-3.5 rounded-lg text-sm font-bold inline-flex items-center gap-2"
          >
            <Youtube className="w-4 h-4" />
            Watch More on YouTube
          </a>
        </motion.div>
      </div>
    </section>
  );
}
