import { ShoppingBag } from "lucide-react";

export interface BuyCardData {
  name: string;
  photo: string;
  href: string;
  blurb?: string;
}

const BTN_STYLE = {
  backgroundColor: "hsl(var(--primary))",
  color: "hsl(var(--primary-foreground))",
} as const;

/** Cartão "Onde comprar" (foto, nome e botão), no estilo do site Review Produtos. */
export function BuyCardWidget({ data }: { data: BuyCardData }) {
  return (
    <aside
      className="buy-card not-prose my-8 flex flex-col gap-4 rounded-2xl border-2 border-primary/50 bg-primary/5 p-4 sm:flex-row sm:items-center"
      aria-label={`Onde comprar: ${data.name}`}
    >
      <a
        href={data.href}
        target="_blank"
        rel="noopener noreferrer sponsored nofollow"
        tabIndex={-1}
        aria-hidden="true"
        className="shrink-0 rounded-xl bg-white p-2 sm:w-28"
      >
        <img
          src={data.photo}
          alt={data.name}
          loading="lazy"
          decoding="async"
          className="mx-auto h-24 w-full object-contain"
          style={{ margin: 0, boxShadow: "none", borderRadius: 0 }}
        />
      </a>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Onde comprar</p>
        <p className="mt-1 font-bold leading-snug text-foreground">{data.name}</p>
        {data.blurb && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{data.blurb}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
        <a
          href={data.href}
          target="_blank"
          rel="noopener noreferrer sponsored nofollow"
          className="buy-card-btn inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-soft"
          style={BTN_STYLE}
        >
          <ShoppingBag className="h-[18px] w-[18px]" />
          Comprar agora na Amazon
        </a>
        <span className="text-center text-[10px] text-muted-foreground">
          Veja o valor atualizado na Amazon
        </span>
      </div>
    </aside>
  );
}
