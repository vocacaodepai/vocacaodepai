import { ExternalLink, Mail, MapPin, MessageCircle } from "lucide-react";
import { whatsappNumber } from "@/lib/pai-indica-pai/format";
import { REFERRAL_KINDS } from "@/lib/pai-indica-pai/taxonomies";
import type { ReferralRow } from "@/lib/pai-indica-pai/types";
import { ReportDialog } from "./ReportDialog";

/** Card de indicação (doc 08 §3.6): título, tipo, categoria, cidade/UF, trecho e contatos consentidos. */
export function ReferralCard({ referral: r }: { referral: ReferralRow }) {
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-xl font-bold leading-tight">{r.title}</h3>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {REFERRAL_KINDS[r.kind]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        {r.category}
        {(r.city || r.uf) && (
          <>
            {" · "}
            <MapPin className="mr-0.5 inline h-3.5 w-3.5" />
            {r.city && r.uf ? `${r.city}/${r.uf}` : (r.uf ?? r.city)}
          </>
        )}
      </p>
      <p className="whitespace-pre-line text-sm leading-relaxed">{r.description}</p>
      {r.referrer_name && (
        <p className="text-xs text-muted-foreground">Indicado por {r.referrer_name}</p>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {r.contact_phone && (
          <a
            href={`https://wa.me/${whatsappNumber(r.contact_phone)}`}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        )}
        {r.contact_email && (
          <a
            href={`mailto:${r.contact_email}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-bold"
          >
            <Mail className="h-3.5 w-3.5" /> E-mail
          </a>
        )}
        {r.contact_url && (
          <a
            href={r.contact_url}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-xs font-bold"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Site
          </a>
        )}
        <span className="ml-auto [&_button]:px-3 [&_button]:py-1 [&_button]:text-xs">
          <ReportDialog entity="job_referral" entityId={r.id} />
        </span>
      </div>
    </article>
  );
}
