import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { ReviewModelo } from "@/lib/review-body";

/** Barra fixa de compra (review única), aparece depois de rolar o começo do artigo. */
export function StickyBuyBar({ modelo }: { modelo: ReviewModelo }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-2.5 shadow-elegant backdrop-blur print:hidden">
      <div className="container flex items-center gap-3">
        <img
          src={modelo.src}
          alt=""
          className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain p-1"
          style={{ margin: 0, boxShadow: "none" }}
        />
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{modelo.name}</p>
        <a
          href={modelo.href}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="buy-card-btn inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold shadow-soft"
          style={{
            backgroundColor: "hsl(var(--primary))",
            color: "hsl(var(--primary-foreground))",
          }}
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="sm:hidden">Comprar na Amazon</span>
          <span className="hidden sm:inline">Comprar agora na Amazon</span>
        </a>
      </div>
    </div>
  );
}
