import { CalendarDays, MapPin, Users, Video } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { EVENT_KIND_LABEL, type EventRow } from "@/lib/irmandade/types";

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  })
    .format(new Date(iso))
    .replace(
      /, (\d{2}):(\d{2})$/,
      (_m, h: string, mm: string) => `, ${Number(h)}h${mm === "00" ? "" : mm}`,
    );
}

/** Cartão de encontro (doc 09 §8): capa, data em PT-BR, cidade/UF ou Online, vagas, chip do tipo. */
export function EventCard({ event }: { event: EventRow }) {
  const e = event;
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      {e.cover_image_url && (
        <img
          src={e.cover_image_url}
          alt={e.title}
          loading="lazy"
          className="aspect-[16/9] w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-bold text-accent">
            {EVENT_KIND_LABEL[e.kind] ?? e.kind}
          </span>
          {e.status === "done" && (
            <span className="rounded-full bg-muted px-2.5 py-0.5 font-bold text-muted-foreground">
              Realizado
            </span>
          )}
          {e.status === "canceled" && (
            <span className="rounded-full bg-destructive/10 px-2.5 py-0.5 font-bold text-destructive">
              Cancelado
            </span>
          )}
        </div>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug">
          <Link to={`/eventos/${e.slug}`} className="hover:text-primary">
            {e.title}
          </Link>
        </h3>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-2 capitalize">
            <CalendarDays className="h-4 w-4 text-primary" /> {formatEventDate(e.starts_at)}
          </li>
          <li className="flex items-center gap-2">
            {e.mode === "online" ? (
              <Video className="h-4 w-4 text-primary" />
            ) : (
              <MapPin className="h-4 w-4 text-primary" />
            )}
            {e.mode === "online" ? "Online" : `${e.city ?? ""}${e.uf ? `/${e.uf}` : ""}`}
          </li>
          <li className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> {e.rsvp_count} confirmado
            {e.rsvp_count === 1 ? "" : "s"}
            {e.capacity ? ` · ${e.capacity} vagas` : ""}
          </li>
        </ul>
        <Link
          to={`/eventos/${e.slug}`}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-full border border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Ver encontro
        </Link>
      </div>
    </article>
  );
}
