import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bookmark,
  BookmarkCheck,
  Building2,
  Clock,
  ExternalLink,
  Eye,
  Mail,
  MapPin,
  MessageCircle,
  Share2,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/ga4";
import {
  isJobSaved,
  toggleSaveJob,
  trackJobApply,
  translatePipError,
} from "@/lib/pai-indica-pai/client";
import {
  daysUntil,
  formatDateBR,
  formatSalaryRange,
  jobAreaLabel,
  jobTypeLabel,
  whatsappNumber,
  whatsappShareUrl,
} from "@/lib/pai-indica-pai/format";
import { AVISO_ANTIFRAUDE } from "@/lib/pai-indica-pai/taxonomies";
import type { JobDetailData, JobPublic } from "@/lib/pai-indica-pai/types";
import { SITE_URL } from "@/lib/site";
import { JobCard } from "./JobCard";
import { ReportDialog } from "./ReportDialog";
import { btnOutline, btnPrimary } from "./shared";

export type JobDetailJob = JobDetailData["job"];

/** Botão "Compartilhar no WhatsApp" (doc 08 §4.3). */
export function ShareWhatsAppButton({
  job,
}: {
  job: Pick<JobPublic, "id" | "title" | "company" | "slug">;
}) {
  return (
    <a
      href={whatsappShareUrl(job, SITE_URL)}
      target="_blank"
      rel="noopener"
      onClick={() => trackEvent("job_share_whatsapp", { job_id: job.id })}
      className={btnOutline}
    >
      <Share2 className="h-4 w-4" /> Compartilhar no WhatsApp
    </a>
  );
}

function SaveJobButton({ jobId }: { jobId: string }) {
  const { user, openLogin } = useAuth();
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (!user) return;
    isJobSaved(user.id, jobId)
      .then(setSaved)
      .catch(() => {});
  }, [user, jobId]);
  const toggle = async () => {
    if (!user) {
      openLogin();
      return;
    }
    try {
      setSaved(await toggleSaveJob(user.id, jobId));
    } catch (e) {
      toast.error(translatePipError(e));
    }
  };
  return (
    <button type="button" onClick={toggle} className={btnOutline}>
      {saved ? (
        <BookmarkCheck className="h-4 w-4 text-primary" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {saved ? "Salva" : "Salvar"}
    </button>
  );
}

/**
 * Corpo da página da vaga (doc 08 §3.3). `preview` desliga métricas, salvar e denúncia
 * (usado pela pré-visualização do formulário com os dados ainda não enviados).
 */
export function JobDetail({
  job,
  live,
  similar = [],
  preview = false,
}: {
  job: JobDetailJob;
  live: boolean;
  similar?: JobPublic[];
  preview?: boolean;
}) {
  const left = daysUntil(job.expires_at);
  const hasContact = Boolean(job.contact_email || job.contact_url || job.contact_phone);
  const apply = (channel: "email" | "url" | "whatsapp") => {
    if (!preview) void trackJobApply(job.id, channel);
  };

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
            {jobTypeLabel(job.type)}
          </span>
          {job.area && (
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {jobAreaLabel(job.area)}
            </span>
          )}
          {!live && !preview && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
              Vaga encerrada
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl font-bold leading-tight md:text-4xl">{job.title}</h1>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            {job.company}
          </span>
          <span className="flex items-center gap-1.5">
            {job.remote ? (
              <>
                <Wifi className="h-4 w-4" />
                Remoto — Brasil
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                {job.city}/{job.uf}
              </>
            )}
          </span>
          <span>{formatSalaryRange(job.salary_min, job.salary_max)}</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
          {job.moderated_at && <span>Publicada em {formatDateBR(job.moderated_at)}</span>}
          {live && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {left <= 0
                ? "Encerra hoje"
                : `Encerra em ${left} dias (${formatDateBR(job.expires_at)})`}
            </span>
          )}
          {!preview && (
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {job.views} visualizações
            </span>
          )}
        </div>
      </header>

      {!live && !preview ? (
        <div className="rounded-2xl border border-border bg-muted/40 p-6">
          <h2 className="font-display text-xl font-bold">Esta vaga foi encerrada</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O prazo acabou ou a vaga foi preenchida. Veja vagas semelhantes abaixo ou{" "}
            <Link to="/pai-indica-pai/vagas" className="font-semibold text-primary hover:underline">
              todas as vagas abertas
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <section className="prose prose-neutral max-w-none dark:prose-invert">
            <h2 className="font-display text-2xl font-bold">Sobre a vaga</h2>
            <p className="whitespace-pre-line text-base leading-relaxed">{job.description}</p>
          </section>

          <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
            <h2 className="font-display text-2xl font-bold">Como se candidatar</h2>
            {job.how_to_apply && (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{job.how_to_apply}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {job.contact_email && (
                <a
                  href={`mailto:${job.contact_email}?subject=${encodeURIComponent(`Vaga: ${job.title}`)}`}
                  onClick={() => apply("email")}
                  className={btnPrimary}
                >
                  <Mail className="h-4 w-4" /> Enviar e-mail
                </a>
              )}
              {job.contact_url && (
                <a
                  href={job.contact_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  onClick={() => apply("url")}
                  className={btnPrimary}
                >
                  <ExternalLink className="h-4 w-4" /> Acessar link
                </a>
              )}
              {job.contact_phone && (
                <a
                  href={`https://wa.me/${whatsappNumber(job.contact_phone)}?text=${encodeURIComponent(`Olá! Vi a vaga "${job.title}" no Vocação de Pai.`)}`}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  onClick={() => apply("whatsapp")}
                  className={btnPrimary}
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
              {!hasContact && (
                <p className="text-sm text-muted-foreground">
                  Entre em contato pelo site da empresa.
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {!preview && (
        <div className="flex flex-wrap gap-2">
          <ShareWhatsAppButton job={job} />
          <SaveJobButton jobId={job.id} />
          <ReportDialog entity="job" entityId={job.id} />
        </div>
      )}

      <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
        <strong>Sinal de alerta:</strong> {AVISO_ANTIFRAUDE}
      </p>

      {similar.length > 0 && (
        <section>
          <h2 className="font-display text-2xl font-bold">Vagas semelhantes</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {similar.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
