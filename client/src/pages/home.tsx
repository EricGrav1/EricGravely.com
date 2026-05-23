import { SiteNav } from "@/components/SiteNav";
import { HeroSection } from "@/components/HeroSection";
import { StatsBar } from "@/components/StatsBar";
import { TimelineSection } from "@/components/TimelineSection";
import { YouTubeSection } from "@/components/YouTubeSection";
import { LeadCaptureSection } from "@/components/LeadCaptureSection";
import { CoachingSection } from "@/components/CoachingSection";
import { SiteFooter } from "@/components/SiteFooter";

export default function Home() {
  return (
    <div style={{ backgroundColor: "#0A0F1E", minHeight: "100vh" }}>
      <SiteNav />
      <HeroSection />
      <StatsBar />
      <TimelineSection />
      <YouTubeSection />
      <LeadCaptureSection />
      <CoachingSection />
      <SiteFooter />
    </div>
  );
}
