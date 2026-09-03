import { SiteNav } from "@/components/SiteNav";
import { HeroSection } from "@/components/HeroSection";
import { StatsBar } from "@/components/StatsBar";
import { YouTubeSection } from "@/components/YouTubeSection";
import { CoachingSection } from "@/components/CoachingSection";
import { GameTeaser } from "@/components/GameTeaser";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/lib/seo";
import { site } from "@/config/site";

export default function Home() {
  usePageMeta("Eric Gravely — Sales Leadership Coach", site.description);
  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />
      <HeroSection />
      <StatsBar />
      <YouTubeSection />
      <GameTeaser />
      <CoachingSection />
      <SiteFooter />
    </div>
  );
}
