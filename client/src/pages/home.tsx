import { SiteNav } from "@/components/SiteNav";
import { HeroSection } from "@/components/HeroSection";
import { StatsBar } from "@/components/StatsBar";
import { YouTubeSection } from "@/components/YouTubeSection";
import { CoachingSection } from "@/components/CoachingSection";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <div style={{ backgroundColor: "var(--c-bg)", minHeight: "100vh" }}>
      <SiteNav />
      <HeroSection />
      <StatsBar />
      <YouTubeSection />
      <CoachingSection />
      <SiteFooter />
    </div>
  );
}
