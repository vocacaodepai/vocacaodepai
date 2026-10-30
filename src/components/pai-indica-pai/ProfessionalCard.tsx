import { Link } from "@tanstack/react-router";
import { Compass, MapPin, Wifi } from "lucide-react";
import { jobAreaLabel } from "@/lib/pai-indica-pai/format";
import type { ProfessionalRow } from "@/lib/pai-indica-pai/types";

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url)
    return (
      <img
        src={url}
        alt={`Foto de ${name}`}
        className="h-12 w-12 rounded-full object-cover"
        loading="lazy"
      />
    );
  return (
    <span
      className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 font-display text-lg font-bold text-primary"
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Card do diretório Pai Profissional (doc 08 §3.5). */
export function ProfessionalCard({ pro }: { pro: ProfessionalRow }) {
  const name = pro.profile?.display_name ?? "Pai";
  return (
    <Link
      to="/pai-indica-pai/profissionais/$id"
      params={{ id: pro.slug }}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
    >
      <div className="flex items-center gap-3">
        <Avatar name={name} url={pro.profile?.avatar_url ?? null} />
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <p className="truncate font-display text-lg font-bold leading-tight text-primary group-hover:underline">
            {pro.profession}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {pro.area && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
            {jobAreaLabel(pro.area)}
          </span>
        )}
        {pro.remote && (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-bold text-muted-foreground">
            <Wifi className="h-3 w-3" />
            Remoto
          </span>
        )}
        {pro.is_mentor && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 font-bold text-accent">
            <Compass className="h-3 w-3" />
            Mentor
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-sm">{pro.description}</p>
      <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {pro.city && pro.uf ? `${pro.city}/${pro.uf}` : (pro.uf ?? "Brasil")}
      </p>
    </Link>
  );
}
