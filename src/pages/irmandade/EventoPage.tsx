import { useState } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { CalendarPlus, MapPin, Share2, Users, Video } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { RsvpButton } from "@/components/irmandade/RsvpButton";
import { formatEventDate } from "@/components/irmandade/EventCard";
import { EVENT_KIND_LABEL, type EventRow } from "@/lib/irmandade/types";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const routeApi = getRouteApi("/_site/eventos/$slug");

function icsFor(e: EventRow): string {
  const dt = (iso: string) =>
    new Date(iso)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const end = e.ends_at ?? new Date(new Date(e.starts_at).getTime() + 2 * 3600_000).toISOString();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//PT`,
    "BEGIN:VEVENT",
    `UID:${e.id}@vocacaodepai.com.br`,
    `DTSTART:${dt(e.starts_at)}`,
    `DTEND:${dt(end)}`,
    `SUMMARY:${e.title}`,
    `URL:${SITE_URL}/eventos/${e.slug}`,
    `LOCATION:${e.mode === "online" ? (e.url ?? "On-line") : `${e.address ?? ""} ${e.city ?? ""}/${e.uf ?? ""}`}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/** /eventos/$slug (doc 09 §8): descrição, endereço (Maps), RSVP, .ics, WhatsApp, "Como foi" após o evento. */
export default function EventoPage() {
  const event = routeApi.useLoaderData();
  const [count, setCount] = useState(event.rsvp_count);
  const past = new Date(event.starts_at).getTime() < Date.now() || event.status === "done";
  const paragraphs = (event.description ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const maps =
    event.mode === "presencial"
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.address ?? ""} ${event.city ?? ""} ${event.uf ?? ""}`)}`
      : null;
  const downloadIcs = () => {
    const blob = new Blob([icsFor(event)], { type: "text/calendar;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${event.slug}.ics`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const share = `https://wa.me/?text=${encodeURIComponent(`${event.title} — ${formatEventDate(event.starts_at)}\n${SITE_URL}/eventos/${event.slug}`)}`;
  const capacityLeft = event.capacity != null ? event.capacity - count : null;

  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Irmandade", path: "/irmandade" },
          { name: "Encontros", path: "/eventos" },
          { name: event.title, path: `/eventos/${event.slug}` },
        ]}
      />
      <div className="mx-auto mt-6 grid max-w-5xl gap-8 lg:grid-cols-[1fr_320px]">
        <article>
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
            {EVENT_KIND_LABEL[event.kind] ?? event.kind}
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight md:text-4xl">
            {event.title}
          </h1>
          {event.cover_image_url && (
            <img
              src={event.cover_image_url}
              alt={event.title}
              className="mt-6 w-full rounded-2xl object-cover"
            />
          )}
          <div className="prose mt-6 max-w-none text-foreground/90">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>Detalhes em breve.</p>
            )}
          </div>
          {past && (
            <div className="mt-8 rounded-2xl border border-border bg-muted/40 p-5">
              <h2 className="font-display text-xl font-bold">Como foi?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Esteve lá? Conte para os outros pais o que ficou do encontro.
              </p>
              <Link
                to="/historias/nova"
                className="mt-3 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
              >
                Contar como foi
              </Link>
            </div>
          )}
        </article>
        <aside className="space-y-4 self-start rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="text-sm capitalize">
            <strong className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Quando
            </strong>
            {formatEventDate(event.starts_at)}
          </p>
          <p className="text-sm">
            <strong className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Onde
            </strong>
            {event.mode === "online" ? (
              <span className="inline-flex items-center gap-1">
                <Video className="h-4 w-4 text-primary" /> On-line
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener"
                    className="ml-1 font-semibold text-primary hover:underline"
                  >
                    (abrir link)
                  </a>
                )}
              </span>
            ) : (
              <a
                href={maps ?? "#"}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <MapPin className="h-4 w-4" /> {event.address ?? ""} {event.city}
                {event.uf ? `/${event.uf}` : ""}
              </a>
            )}
          </p>
          {event.organizer && (
            <p className="text-sm">
              <strong className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Organização
              </strong>
              {event.organizer}
            </p>
          )}
          {event.price_text && (
            <p className="text-sm">
              <strong className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Investimento
              </strong>
              {event.price_text}
            </p>
          )}
          <p className="inline-flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" /> {count} confirmado{count === 1 ? "" : "s"}
            {event.capacity ? ` de ${event.capacity} vagas` : ""}
          </p>
          {!past && event.status === "published" && (
            <RsvpButton
              eventId={event.id}
              slug={event.slug}
              capacityLeft={capacityLeft}
              onChange={(s) => setCount((c) => (s === "going" ? c + 1 : Math.max(0, c - 1)))}
            />
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              onClick={downloadIcs}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Adicionar ao calendário
            </button>
            <a
              href={share}
              target="_blank"
              rel="noopener"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold"
            >
              <Share2 className="h-3.5 w-3.5" /> Compartilhar no WhatsApp
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
