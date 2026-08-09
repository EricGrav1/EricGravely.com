import { createContext, useContext } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, CalendarCheck, Linkedin, Moon, PackageOpen, Play, Sparkles, Sun, Youtube } from "lucide-react";
import { SiInstagram, SiX } from "react-icons/si";
import { site } from "@/config/site";
import { usePageMeta } from "@/lib/seo";
import { usePublishedProducts } from "@/lib/products";
import { useTheme } from "@/lib/theme";
import { slugify } from "@shared/slug";

const darkPalette = {
  canvas: "#090909",
  surface: "#121212",
  card: "#181818",
  ink: "#F5F5F3",
  body: "#B5B5B0",
  muted: "#858581",
  line: "#292929",
  bronze: "#D0D0CC",
  bronzeSoft: "#222222",
  primary: "#E3E3DF",
  primaryInk: "#090909",
  primaryDescription: "rgba(9,9,9,.62)",
  primaryIconBg: "rgba(9,9,9,.09)",
  footer: "#0E0E0E",
  shadow: "0 28px 80px rgba(0,0,0,.38)",
  photoShadow: "0 8px 26px rgba(0,0,0,.32)",
};

const lightPalette: typeof darkPalette = {
  canvas: "#EEECE6",
  surface: "#FAF9F6",
  card: "#FFFFFF",
  ink: "#171815",
  body: "#595B55",
  muted: "#898A84",
  line: "#DEDDD7",
  bronze: "#92722F",
  bronzeSoft: "#EEE7D7",
  primary: "#171815",
  primaryInk: "#F8F6F0",
  primaryDescription: "rgba(248,246,240,.58)",
  primaryIconBg: "rgba(255,255,255,.09)",
  footer: "#F5F3EE",
  shadow: "0 28px 80px rgba(33,34,29,.08)",
  photoShadow: "0 8px 26px rgba(23,24,21,.12)",
};

const BioPaletteContext = createContext(darkPalette);
const useBioPalette = () => useContext(BioPaletteContext);

const socialLinks = [
  { label: "LinkedIn", href: site.social.linkedin, Icon: Linkedin, color: "#0A66C2" },
  { label: "YouTube", href: site.social.youtube, Icon: Youtube, color: "#FF0033" },
  { label: "Instagram", href: site.social.instagram, Icon: SiInstagram, color: "#D62976" },
  { label: "X", href: site.social.twitter, Icon: SiX, color: undefined },
];

function SocialLinks() {
  const palette = useBioPalette();

  return (
    <div className="col-span-full flex sm:flex-wrap gap-2 mt-1 sm:mt-5" aria-label="Social media links">
      {socialLinks.map(({ label, href, Icon, color }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-none h-9 sm:px-3 rounded-[9px] flex items-center justify-center gap-2 text-[11px] font-semibold transition-all hover:-translate-y-0.5"
          style={{ color: palette.body, background: palette.card, border: `1px solid ${palette.line}` }}
          aria-label={label}
          data-testid={`link-bio-${label.toLowerCase()}`}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: label === "X" ? palette.ink : color }} />
          <span className="hidden sm:inline" style={{ color: palette.body }}>{label}</span>
        </a>
      ))}
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
  primary = false,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof CalendarCheck;
  primary?: boolean;
}) {
  const palette = useBioPalette();

  return (
    <Link
      href={href}
      className="group grid grid-cols-[40px,1fr,auto] gap-3.5 items-center min-h-[88px] px-4 sm:px-5 py-4 rounded-[14px] transition-all hover:-translate-y-0.5"
      style={{
        color: primary ? palette.primaryInk : palette.ink,
        background: primary ? palette.primary : palette.card,
        border: `1px solid ${primary ? palette.primary : palette.line}`,
      }}
    >
      <span
        className="w-10 h-10 rounded-[10px] flex items-center justify-center"
        style={{ color: primary ? palette.primaryInk : palette.bronze, background: primary ? palette.primaryIconBg : palette.bronzeSoft }}
      >
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="bio-serif block text-[18px] font-semibold leading-tight tracking-[-0.02em] mb-1">{title}</span>
        <span className="block text-[11px] sm:text-xs leading-relaxed" style={{ color: primary ? palette.primaryDescription : palette.muted }}>
          {description}
        </span>
      </span>
      <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" style={{ color: primary ? palette.primaryInk : palette.bronze }} />
    </Link>
  );
}

function ProductRow({
  href,
  type,
  availability,
  title,
  description,
  image,
  imagePosition = "50% 50%",
  external = true,
}: {
  href: string;
  type: string;
  availability: string;
  title: string;
  description: string;
  image?: string;
  imagePosition?: string;
  external?: boolean;
}) {
  const palette = useBioPalette();

  const content = (
    <>
      <span
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{ background: palette.bronzeSoft, border: `1px solid ${palette.line}` }}
      >
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" style={{ objectPosition: imagePosition }} />
        ) : type === "Sales game" ? (
          <Play className="w-5 h-5 fill-current" style={{ color: palette.bronze }} />
        ) : (
          <Sparkles className="w-5 h-5" style={{ color: palette.bronze }} />
        )}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: palette.bronze }}>{type}</span>
          <span className="w-[3px] h-[3px] rounded-full bg-[#5E5E5B]" />
          <span className="text-[10px]" style={{ color: palette.muted }}>{availability}</span>
        </span>
        <span className="bio-serif block text-[21px] font-semibold tracking-[-0.025em] leading-tight mb-1">{title}</span>
        <span className="block text-xs leading-relaxed" style={{ color: palette.body }}>{description}</span>
      </span>
      <span className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-end gap-2.5 text-[11px] font-bold whitespace-nowrap pt-3 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: palette.line }}>
        View product <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: palette.bronze }} />
      </span>
    </>
  );

  const classes = "group grid grid-cols-[56px,1fr] sm:grid-cols-[64px,1fr,auto] items-center gap-3.5 sm:gap-5 p-[18px] sm:p-5 rounded-[14px] transition-all hover:-translate-y-0.5";
  const styles = { color: palette.ink, background: palette.card, border: `1px solid ${palette.line}` };

  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes} style={styles}>{content}</a>
  ) : (
    <Link href={href} className={classes} style={styles}>{content}</Link>
  );
}

export default function Bio() {
  usePageMeta(
    "Eric Gravely — Coaching, Products & Links",
    "Connect with Eric Gravely and explore sales coaching, resources, software, and tools.",
  );

  const { data: products } = usePublishedProducts();
  const { theme, toggle } = useTheme();
  const palette = theme === "dark" ? darkPalette : lightPalette;
  const additionalProducts = (products ?? []).filter((product) => {
    const title = product.title.toLowerCase();
    return !title.includes("sales coach ai") && !title.includes("clipfarmer") && !title.includes("clippfarmer");
  });

  return (
    <BioPaletteContext.Provider value={palette}>
    <div className="min-h-screen transition-colors duration-300" style={{ background: palette.canvas, color: palette.ink }}>
      <main className="w-[calc(100%-20px)] sm:w-[calc(100%-32px)] max-w-[760px] mx-auto py-[18px] sm:py-9 pb-8 sm:pb-16">
        <nav className="flex items-center justify-between px-1 mb-4 sm:mb-7">
          <Link href="/" className="bio-serif text-[21px] font-semibold tracking-[-0.03em]">Eric Gravely</Link>
          <div className="flex items-center gap-2.5">
            <Link href="/" className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: palette.muted }}>
              Visit main site&nbsp; ↗
            </Link>
            <button
              type="button"
              onClick={toggle}
              className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-all hover:-translate-y-0.5"
              style={{ color: palette.body, background: palette.card, border: `1px solid ${palette.line}` }}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              data-testid="button-bio-theme-toggle"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="overflow-hidden rounded-[19px] sm:rounded-3xl"
          style={{ background: palette.surface, border: `1px solid ${palette.line}`, boxShadow: palette.shadow }}
        >
          <header className="px-6 sm:px-11 py-8 sm:py-10 border-b" style={{ borderColor: palette.line }}>
            <div className="grid grid-cols-[82px,1fr] sm:grid-cols-[116px,1fr] gap-[18px] sm:gap-[30px] items-start sm:items-center">
              <img
                src="/nicholas.jpg"
                alt="Eric Gravely"
                className="w-[82px] h-[82px] sm:w-[116px] sm:h-[116px] rounded-[14px] sm:rounded-[18px] object-cover object-[50%_34%]"
                style={{ filter: "saturate(.88) contrast(1.02)", boxShadow: palette.photoShadow }}
              />
              <div>
                <h1 className="bio-serif text-[32px] sm:text-[42px] leading-none font-semibold tracking-[-0.045em] mb-2">Eric Gravely</h1>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.11em] mb-3" style={{ color: palette.bronze }}>
                  Sales leader · Coach · Builder
                </p>
                <p className="hidden sm:block text-sm leading-relaxed max-w-[500px]" style={{ color: palette.body }}>
                  Helping sales leaders develop stronger reps, build consistent teams, and lead without carrying every deal themselves.
                </p>
              </div>
              <p className="col-span-full sm:hidden text-[13px] leading-relaxed" style={{ color: palette.body }}>
                Helping sales leaders develop stronger reps, build consistent teams, and lead without carrying every deal themselves.
              </p>
              <SocialLinks />
            </div>
          </header>

          <div className="px-[18px] sm:px-11 py-7 sm:py-8 pb-8 sm:pb-10">
            <section>
              <div className="flex items-end justify-between gap-5 mb-3.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: palette.muted }}>Start here</span>
                <span className="hidden sm:block text-[11px]" style={{ color: palette.muted }}>For sales leaders ready to build a stronger team</span>
              </div>
              <div className="grid gap-2.5">
                <ActionCard
                  href="/coaching"
                  title="Work with Eric"
                  description="Coaching for managers who want consistent performance without carrying every deal."
                  icon={CalendarCheck}
                  primary
                />
                <ActionCard
                  href="/products"
                  title="Free tools & resources"
                  description="Practical frameworks, playbooks, and sales tools you can use today."
                  icon={PackageOpen}
                />
              </div>
            </section>

            <section className="mt-8 sm:mt-[34px]">
              <div className="flex items-end justify-between gap-5 mb-3.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: palette.muted }}>Products</span>
                <span className="hidden sm:block text-[11px]" style={{ color: palette.muted }}>Software and tools built by Eric</span>
              </div>
              <div className="grid gap-2.5">
                <ProductRow
                  href="https://clippfarmer.com"
                  type="Creator software"
                  availability="Available now"
                  title="ClippFarmer"
                  description="Automatically finds standout moments in YouTube videos and live streams, then turns them into captioned vertical clips ready for TikTok, Reels, and Shorts."
                  image="/clippfarmer-icon.png"
                />
                <ProductRow
                  href={site.social.app}
                  type="Sales coaching app"
                  availability="iPhone & iPad"
                  title="SalesCoachAI"
                  description="On-demand call coaching that shows sales reps what to improve after every conversation."
                  image="/salescoachai-card.jpeg"
                  imagePosition="50% 32%"
                />
                {additionalProducts.map((product) => (
                  <ProductRow
                    key={product.id}
                    href={`/products/${slugify(product.title)}`}
                    type={product.productType === "game" ? "Sales game" : product.productType === "download" ? "Free resource" : "Product"}
                    availability={product.productType === "game" ? "Play online" : "Learn more"}
                    title={product.title}
                    description={product.description}
                    external={false}
                  />
                ))}
              </div>
            </section>
          </div>

          <footer className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-6 sm:px-11 py-5 text-[10px] border-t" style={{ color: palette.muted, background: palette.footer, borderColor: palette.line }}>
            <span>© {new Date().getFullYear()} Eric Gravely</span>
            <span>Sales · Coaching · Leadership</span>
          </footer>
        </motion.div>
      </main>
    </div>
    </BioPaletteContext.Provider>
  );
}
