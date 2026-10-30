import { getRouteApi } from "@tanstack/react-router";
import { Compass, ExternalLink, Mail, MapPin, MessageCircle, Wifi } from "lucide-react";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { MentorshipRequestDialog } from "@/components/pai-indica-pai/MentorCard";
import { ReportDialog } from "@/components/pai-indica-pai/ReportDialog";
import { AntifraudNotice, PipNav, btnPrimary } from "@/components/pai-indica-pai/shared";
import { formatDateBR, jobAreaLabel, whatsappNumber } from "@/lib/pai-indica-pai/format";
import { MENTORSHIP_AREAS } from "@/lib/pai-indica-pai/taxonomies";

const routeApi = getRouteApi("/_site/pai-indica-pai/profissionais/$id");

/** Perfil público do Pai Profissional (doc 08 §3.5): descrição, contatos consentidos, pedir mentoria, denunciar. */
export default function ProfessionalPage() {
  const pro = routeApi.useLoaderData();
  if (!pro) return null;
  const name = pro.profile?.display_name ?? "Pai";
  const hasContact = Boolean(pro.contact_email || pro.contact_phone || pro.contact_url);

  return (
    <div className="container max-w-4xl space-y-6 pb-16 pt-6">
      <Breadcrumbs
        items={[
          { name: "Pai Indica Pai", path: "/pai-indica-pai" },
          { name: "Pai Profissional", path: "/pai-indica-pai/profissionais" },
          { name: pro.profession, path: `/pai-indica-pai/profissionais/${pro.slug}` },
        ]}
      />
      <PipNav current="/pai-indica-pai/profissionais" />
      <article className="space-y-8">
        <header className="flex flex-wrap items-center gap-5">
          {pro.profile?.avatar_url ? (
            <img
              src={pro.profile.avatar_url}
              alt={`Foto de ${name}`}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <span
              className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/15 font-display text-4xl font-bold text-primary"
              aria-hidden
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-muted-foreground">{name}</p>
            <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">
              {pro.profession}
            </h1>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {pro.area && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-bold text-primary">
                  {jobAreaLabel(pro.area)}
                </span>
              )}
              {pro.remote && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-bold text-muted-foreground">
                  <Wifi className="h-3 w-3" />
                  Atende remoto
                </span>
              )}
              {pro.is_mentor && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 font-bold text-accent">
                  <Compass className="h-3 w-3" />
                  Mentor
                </span>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {pro.city && pro.uf ? `${pro.city}/${pro.uf}` : (pro.uf ?? "Brasil")} · no diretório
              desde {formatDateBR(pro.moderated_at ?? pro.created_at)}
            </p>
          </div>
        </header>

        <section>
          <h2 className="font-display text-2xl font-bold">Sobre o trabalho</h2>
          <p className="mt-2 whitespace-pre-line text-base leading-relaxed">{pro.description}</p>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-display text-2xl font-bold">Contato</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {pro.contact_phone && (
              <a
                href={`https://wa.me/${whatsappNumber(pro.contact_phone)}`}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className={btnPrimary}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            {pro.contact_email && (
              <a href={`mailto:${pro.contact_email}`} className={btnPrimary}>
                <Mail className="h-4 w-4" /> E-mail
              </a>
            )}
            {pro.contact_url && (
              <a
                href={pro.contact_url}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className={btnPrimary}
              >
                <ExternalLink className="h-4 w-4" /> Site
              </a>
            )}
            {!hasContact && (
              <p className="text-sm text-muted-foreground">
                Este pai preferiu não exibir contato público. Se ele for mentor, peça mentoria
                abaixo.
              </p>
            )}
          </div>
        </section>

        {pro.is_mentor && (
          <section className="rounded-2xl border border-accent/40 bg-accent/10 p-6">
            <h2 className="font-display text-2xl font-bold">Mentoria</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Áreas: {pro.mentor_areas.map((a) => MENTORSHIP_AREAS[a] ?? a).join(", ")} ·{" "}
              {(pro.mentor_slots ?? pro.mentor_capacity) > 0
                ? `${pro.mentor_slots ?? pro.mentor_capacity} vaga(s) disponível(is)`
                : "agenda cheia"}
            </p>
            <div className="mt-4">
              <MentorshipRequestDialog mentor={pro} />
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-2">
          <ReportDialog entity="professional" entityId={pro.id} />
        </div>
        <AntifraudNotice />
      </article>
    </div>
  );
}
