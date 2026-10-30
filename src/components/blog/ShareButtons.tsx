import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { SITE_URL } from "@/lib/site";

type IconProps = { className?: string };

// Brand icons as inline SVGs (lucide-react no longer ships brand logos).
const WhatsAppIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.17.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z" />
  </svg>
);

const FacebookIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.9h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
  </svg>
);

const XIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.9 2.1h3.68l-8.04 9.19L24 23.1h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 2.1h7.59l5.24 6.93L18.9 2.1zm-1.29 18.9h2.04L6.49 4.12H4.3L17.61 21z" />
  </svg>
);

const PinterestIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.31-.09-.79-.17-2.01.04-2.87.18-.78 1.2-5.08 1.2-5.08s-.31-.62-.31-1.54c0-1.44.83-2.51 1.87-2.51.88 0 1.31.66 1.31 1.46 0 .89-.57 2.21-.86 3.44-.24 1.03.52 1.87 1.53 1.87 1.84 0 3.26-1.94 3.26-4.75 0-2.48-1.78-4.22-4.33-4.22-2.95 0-4.68 2.21-4.68 4.5 0 .89.34 1.85.77 2.37.08.1.1.19.07.29-.08.32-.25 1.02-.28 1.16-.05.19-.15.23-.35.14-1.31-.61-2.12-2.52-2.12-4.05 0-3.3 2.4-6.33 6.91-6.33 3.63 0 6.45 2.59 6.45 6.04 0 3.6-2.27 6.5-5.42 6.5-1.06 0-2.05-.55-2.39-1.2l-.65 2.48c-.24.91-.87 2.05-1.3 2.75.98.3 2.02.47 3.1.47 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

const LinkedInIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
  </svg>
);

const TelegramIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M21.94 4.02 19.2 19.75c-.2 1.06-.86 1.32-1.75.82l-4.83-3.56-2.33 2.24c-.26.26-.47.47-.97.47l.34-4.92L18.6 6.28c.39-.35-.08-.54-.6-.19L6.28 13.54l-4.74-1.48c-1.03-.32-1.05-1.03.22-1.53L20.7 2.84c.86-.32 1.61.2 1.24 1.18z" />
  </svg>
);

const BRANDS = [
  {
    key: "whatsapp",
    icon: WhatsAppIcon,
    href: (u: string, t: string) => `https://wa.me/?text=${t}%20${u}`,
  },
  {
    key: "facebook",
    icon: FacebookIcon,
    href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  },
  {
    key: "twitter",
    icon: XIcon,
    href: (u: string, t: string) => `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
  },
  {
    key: "pinterest",
    icon: PinterestIcon,
    href: (u: string, t: string) =>
      `https://pinterest.com/pin/create/button/?url=${u}&description=${t}`,
  },
  {
    key: "linkedin",
    icon: LinkedInIcon,
    href: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
  },
  {
    key: "telegram",
    icon: TelegramIcon,
    href: (u: string, t: string) => `https://t.me/share/url?url=${u}&text=${t}`,
  },
] as const;

export function ShareButtons({
  title,
  slug,
  path,
  compact = false,
}: {
  title: string;
  slug: string;
  /** Caminho da página quando não for /post/<slug> (ex.: /pai-indica/<slug>). */
  path?: string;
  compact?: boolean;
}) {
  const pagePath = path ?? `/post/${slug}`;
  const url = encodeURIComponent(`${SITE_URL}${pagePath}`);
  const text = encodeURIComponent(title);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${SITE_URL}${pagePath}`);
      toast.success("Link copiado!");
    } catch {
      toast.error("Link copiado!");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!compact && (
        <span className="mr-1 text-sm font-bold text-muted-foreground">{"Compartilhe"}</span>
      )}
      {BRANDS.map((b) => (
        <a
          key={b.key}
          href={b.href(url, text)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Compartilhar no ${b.key}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
        >
          <b.icon className="h-4 w-4" />
        </a>
      ))}
      <button
        onClick={copy}
        aria-label={"Copiar link"}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
      >
        <Link2 className="h-4 w-4" />
      </button>
    </div>
  );
}
