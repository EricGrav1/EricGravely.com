import { Youtube, Linkedin } from "lucide-react";
import { SiX, SiInstagram, SiGithub } from "react-icons/si";
import { site } from "@/config/site";

const { social } = site;

const SOCIAL_ICONS = [
  { href: social.youtube, Icon: Youtube, label: "YouTube", color: "#FF0033" },
  { href: social.instagram, Icon: SiInstagram, label: "Instagram", color: "#D62976" },
  { href: social.linkedin, Icon: Linkedin, label: "LinkedIn", color: "#0A66C2" },
  { href: social.twitter, Icon: SiX, label: "X (Twitter)", color: "var(--c-fg)" },
  { href: "https://github.com/EricGrav1/EricGrav1/blob/main/README.md", Icon: SiGithub, label: "GitHub", color: "var(--c-fg-70)" },
];

export function SocialIcons({ className = "", size = "sm" }: { className?: string; size?: "sm" | "md" }) {
  const boxClass = size === "sm" ? "w-8 h-8" : "w-9 h-9";
  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {SOCIAL_ICONS.map(({ href, Icon, label, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${boxClass} rounded-lg flex items-center justify-center transition-all hover:-translate-y-0.5 hover:shadow-sm`}
          style={{ border: "1px solid var(--c-border)", color, background: "var(--c-bg)" }}
          aria-label={label}
          data-testid={`link-social-hero-${label.toLowerCase().replace(/[^a-z]/g, "")}`}
        >
          <Icon className={iconClass} />
        </a>
      ))}
    </div>
  );
}
