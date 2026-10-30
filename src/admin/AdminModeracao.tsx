import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Ban,
  Check,
  ExternalLink,
  Eye,
  Flag,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge, btnOutline, btnPrimary, inputCls } from "@/components/pai-indica-pai/shared";
import { translatePipError } from "@/lib/pai-indica-pai/client";
import {
  blockUser,
  getModerationQueue,
  markReportReviewed,
  moderateEntity,
} from "@/lib/pai-indica-pai/functions";
import {
  formatDateBR,
  formatSalaryRange,
  jobAreaLabel,
  jobTypeLabel,
  timeAgo,
} from "@/lib/pai-indica-pai/format";
import {
  MENTORSHIP_AREAS,
  REFERRAL_KINDS,
  REJECTION_PRESETS,
} from "@/lib/pai-indica-pai/taxonomies";
import type {
  JobRow,
  ModerationQueue,
  PipEntity,
  ProfessionalRow,
  ReferralRow,
} from "@/lib/pai-indica-pai/types";
import { cn } from "@/lib/utils";

// Fila de moderação do Pai Indica Pai (doc 08 §6): vagas, indicações, profissionais, mentorias,
// denúncias e bloqueados. Aprovar/rejeitar via moderate_* (gravam moderation_log) e e-mail ao autor.

type Tab = "jobs" | "referrals" | "professionals" | "mentorships" | "reports" | "blocked";
type StatusFilter = "pending" | "approved" | "rejected" | "all";
type Item =
  | (JobRow & { _entity: "job" })
  | (ReferralRow & { _entity: "job_referral" })
  | (ProfessionalRow & { _entity: "professional" });

const EMPTY: ModerationQueue = {
  jobs: [],
  referrals: [],
  professionals: [],
  mentorships: [],
  reports: [],
  blocked: [],
  authors: {},
  metrics: { pending: 0, approved7d: 0, rejected7d: 0, activeJobs: 0, views: 0, applyClicks: 0 },
};

const itemTitle = (i: Item) => (i._entity === "professional" ? i.profession : i.title);
const itemAuthor = (i: Item) =>
  (i._entity === "job" ? i.posted_by : i._entity === "job_referral" ? i.referred_by : i.user_id) ??
  null;
const itemUrl = (i: Item) =>
  i._entity === "job"
    ? `/pai-indica-pai/vagas/${i.slug}`
    : i._entity === "professional"
      ? `/pai-indica-pai/profissionais/${i.slug}`
      : "/pai-indica-pai/indicacoes";

export default function AdminModeracao() {
  const [tab, setTab] = useState<Tab>("jobs");
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [data, setData] = useState<ModerationQueue>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Item | null>(null);
  const [rejecting, setRejecting] = useState<Item | null>(null);
  const [blocking, setBlocking] = useState<{ id: string; name: string } | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getModerationQueue());
    } catch (e) {
      toast.error(translatePipError(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const items: Item[] = useMemo(() => {
    const list: Item[] =
      tab === "jobs"
        ? data.jobs.map((j) => ({ ...j, _entity: "job" as const }))
        : tab === "referrals"
          ? data.referrals.map((r) => ({ ...r, _entity: "job_referral" as const }))
          : tab === "professionals"
            ? data.professionals.map((p) => ({ ...p, _entity: "professional" as const }))
            : [];
    return status === "all" ? list : list.filter((i) => i.status === status);
  }, [tab, status, data]);

  const duplicates = useMemo(() => {
    const seen = new Map<string, number>();
    for (const j of data.jobs)
      if (j.status !== "rejected")
        seen.set(j.title.toLowerCase(), (seen.get(j.title.toLowerCase()) ?? 0) + 1);
    return seen;
  }, [data.jobs]);

  const moderate = async (i: Item, next: "approved" | "rejected", why?: string) => {
    setBusy(i.id);
    try {
      await moderateEntity({
        data: { entity: i._entity as PipEntity, id: i.id, status: next, reason: why ?? "" },
      });
      toast.success(
        next === "approved"
          ? "Aprovado e autor avisado por e-mail."
          : "Rejeitado; motivo enviado ao autor.",
      );
      setRejecting(null);
      setReason("");
      await load();
    } catch (e) {
      toast.error(translatePipError(e));
    } finally {
      setBusy(null);
    }
  };

  const block = async (userId: string, why: string, on = true) => {
    setBusy(userId);
    try {
      await blockUser({ data: { user_id: userId, reason: why, block: on } });
      toast.success(
        on ? "Usuário bloqueado; publicações removidas do ar." : "Usuário desbloqueado.",
      );
      setBlocking(null);
      setReason("");
      await load();
    } catch (e) {
      toast.error(translatePipError(e));
    } finally {
      setBusy(null);
    }
  };

  const counts = {
    jobs: data.jobs.filter((j) => j.status === "pending").length,
    referrals: data.referrals.filter((r) => r.status === "pending").length,
    professionals: data.professionals.filter((p) => p.status === "pending").length,
    mentorships: data.mentorships.filter((m) => m.status === "requested").length,
    reports: data.reports.filter((r) => r.action !== "review").length,
    blocked: data.blocked.length,
  };
  const tabs: { key: Tab; label: string }[] = [
    { key: "jobs", label: "Vagas" },
    { key: "referrals", label: "Indicações" },
    { key: "professionals", label: "Profissionais" },
    { key: "mentorships", label: "Mentorias" },
    { key: "reports", label: "Denúncias" },
    { key: "blocked", label: "Bloqueados" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Moderação — Pai Indica Pai</h1>
        <div className="flex gap-2">
          <Link to="/admin" className={btnOutline}>
            Painel
          </Link>
          <button type="button" onClick={load} className={btnOutline}>
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Atualizar
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Pendentes", data.metrics.pending],
          ["Aprovadas 7d", data.metrics.approved7d],
          ["Rejeitadas 7d", data.metrics.rejected7d],
          ["Vagas ativas", data.metrics.activeJobs],
          ["Views", data.metrics.views],
          ["Cliques candidatura", data.metrics.applyClicks],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-3xl font-bold">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            {counts[t.key] ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {counts[t.key]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {(tab === "jobs" || tab === "referrals" || tab === "professionals") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(["pending", "approved", "rejected", "all"] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-bold",
                status === s
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-card text-muted-foreground",
              )}
            >
              {s === "pending"
                ? "Pendentes"
                : s === "approved"
                  ? "Aprovados"
                  : s === "rejected"
                    ? "Rejeitados"
                    : "Todos"}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : tab === "mentorships" ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Mentor</th>
                <th className="p-3">Mentorado</th>
                <th className="p-3">Área</th>
                <th className="p-3">Status</th>
                <th className="p-3">Quando</th>
              </tr>
            </thead>
            <tbody>
              {data.mentorships.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground">
                    Nenhum pedido de mentoria.
                  </td>
                </tr>
              )}
              {data.mentorships.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="p-3">{data.authors[m.mentor_id] ?? "—"}</td>
                  <td className="p-3">{data.authors[m.mentee_id] ?? "—"}</td>
                  <td className="p-3">{MENTORSHIP_AREAS[m.area] ?? m.area}</td>
                  <td className="p-3">
                    <StatusBadge status={m.status} />
                  </td>
                  <td className="p-3 text-muted-foreground">{timeAgo(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="p-3 text-xs text-muted-foreground">
            Aceite/recusa é do mentor (Área do Pai). Aqui só acompanhamento.
          </p>
        </div>
      ) : tab === "reports" ? (
        <div className="mt-6 space-y-2">
          {data.reports.length === 0 && (
            <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhuma denúncia.
            </p>
          )}
          {data.reports.map((r) => (
            <div
              key={r.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <Flag
                className={cn(
                  "h-4 w-4",
                  r.action === "auto_hide"
                    ? "text-destructive"
                    : r.action === "review"
                      ? "text-primary"
                      : "text-accent",
                )}
              />
              <span className="font-bold">
                {r.action === "auto_hide"
                  ? "AUTO-OCULTA"
                  : r.action === "review"
                    ? "Revisada"
                    : "Denúncia"}
              </span>
              <span className="text-muted-foreground">
                {r.entity} · {r.entity_id.slice(0, 8)}…
              </span>
              <span className="flex-1">{r.note}</span>
              <span className="text-xs text-muted-foreground">{timeAgo(r.created_at)}</span>
              {r.action !== "review" && (
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={async () => {
                    setBusy(r.id);
                    try {
                      await markReportReviewed({
                        data: { entity: r.entity, entity_id: r.entity_id },
                      });
                      await load();
                    } catch (e) {
                      toast.error(translatePipError(e));
                    } finally {
                      setBusy(null);
                    }
                  }}
                  className={btnOutline}
                >
                  <ShieldCheck className="h-4 w-4" /> Marcar como revisada
                </button>
              )}
            </div>
          ))}
        </div>
      ) : tab === "blocked" ? (
        <div className="mt-6 space-y-2">
          {data.blocked.length === 0 && (
            <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nenhum usuário bloqueado.
            </p>
          )}
          {data.blocked.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm"
            >
              <Ban className="h-4 w-4 text-destructive" />
              <span className="font-bold">{b.display_name}</span>
              <span className="flex-1 text-muted-foreground">
                {b.blocked_reason} · {formatDateBR(b.blocked_at)}
              </span>
              <button
                type="button"
                disabled={busy === b.id}
                onClick={() => block(b.id, "desbloqueio manual", false)}
                className={btnOutline}
              >
                Desbloquear
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.length === 0 && (
            <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nada nesta fila.
            </p>
          )}
          {items.map((i) => {
            const author = itemAuthor(i);
            const dup = i._entity === "job" && (duplicates.get(i.title.toLowerCase()) ?? 0) > 1;
            return (
              <div
                key={i.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 text-sm",
                  i.auto_hidden ? "border-destructive" : "border-border",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold">
                    {itemTitle(i)}
                    {i._entity === "job" && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {i.company} · {jobTypeLabel(i.type)}
                      </span>
                    )}
                    {i._entity === "job_referral" && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {REFERRAL_KINDS[i.kind]} · {i.category}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {author ? (data.authors[author] ?? "autor") : "sem autor"} ·{" "}
                    {i.city && i.uf ? `${i.city}/${i.uf}` : "remoto"} · {timeAgo(i.created_at)}
                    {i.report_count > 0 && (
                      <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                        {i.report_count} denúncia(s)
                      </span>
                    )}
                    {i.auto_hidden && (
                      <span className="ml-2 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                        AUTO-OCULTA
                      </span>
                    )}
                    {dup && (
                      <span className="ml-2 rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-bold">
                        possível duplicata
                      </span>
                    )}
                  </p>
                </div>
                <StatusBadge status={i.status} />
                <button type="button" onClick={() => setViewing(i)} className={btnOutline}>
                  <Eye className="h-4 w-4" /> Ver
                </button>
                {i.status !== "approved" && (
                  <button
                    type="button"
                    disabled={busy === i.id}
                    onClick={() => moderate(i, "approved")}
                    className={btnPrimary}
                  >
                    {busy === i.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}{" "}
                    Aprovar
                  </button>
                )}
                {i.status !== "rejected" && (
                  <button
                    type="button"
                    disabled={busy === i.id}
                    onClick={() => {
                      setRejecting(i);
                      setReason("");
                    }}
                    className={btnOutline}
                  >
                    <X className="h-4 w-4" /> Rejeitar
                  </button>
                )}
                {author && (
                  <button
                    type="button"
                    onClick={() => {
                      setBlocking({ id: author, name: data.authors[author] ?? "autor" });
                      setReason("");
                    }}
                    className={cn(btnOutline, "text-destructive")}
                  >
                    <Ban className="h-4 w-4" /> Bloquear autor
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ver: todos os campos, inclusive contato */}
      <Sheet open={Boolean(viewing)} onOpenChange={(o) => !o && setViewing(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {viewing && (
            <>
              <SheetHeader>
                <SheetTitle>{itemTitle(viewing)}</SheetTitle>
                <SheetDescription>
                  <StatusBadge status={viewing.status} /> · enviado {timeAgo(viewing.created_at)} ·{" "}
                  {viewing.report_count} denúncia(s)
                </SheetDescription>
              </SheetHeader>
              <dl className="mt-4 space-y-3 text-sm">
                {viewing._entity === "job" && (
                  <>
                    <Row k="Empresa" v={viewing.company} />
                    <Row
                      k="Tipo / área"
                      v={`${jobTypeLabel(viewing.type)} · ${jobAreaLabel(viewing.area)}`}
                    />
                    <Row
                      k="Local"
                      v={viewing.remote ? "Remoto" : `${viewing.city}/${viewing.uf}`}
                    />
                    <Row
                      k="Salário"
                      v={formatSalaryRange(viewing.salary_min, viewing.salary_max)}
                    />
                    <Row k="Como se candidatar" v={viewing.how_to_apply ?? "—"} />
                  </>
                )}
                {viewing._entity === "professional" && (
                  <>
                    <Row k="Área" v={jobAreaLabel(viewing.area)} />
                    <Row
                      k="Mentor"
                      v={
                        viewing.is_mentor
                          ? `sim (${viewing.mentor_areas.map((a) => MENTORSHIP_AREAS[a] ?? a).join(", ")}; capacidade ${viewing.mentor_capacity})`
                          : "não"
                      }
                    />
                  </>
                )}
                <Row k="Descrição" v={viewing.description} pre />
                <Row k="E-mail" v={viewing.contact_email ?? "—"} />
                <Row k="Telefone" v={viewing.contact_phone ?? "—"} />
                <Row
                  k="Link"
                  v={
                    viewing.contact_url ? (
                      <a
                        href={viewing.contact_url}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary underline"
                      >
                        {viewing.contact_url} <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      "—"
                    )
                  }
                />
                <Row k="Consentiu exibir contato" v={viewing.consent_contact ? "sim" : "não"} />
                {viewing.rejection_reason && (
                  <Row k="Motivo da rejeição" v={viewing.rejection_reason} />
                )}
                <Row
                  k="Página"
                  v={
                    <Link to={itemUrl(viewing)} className="text-primary underline">
                      {itemUrl(viewing)}
                    </Link>
                  }
                />
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Rejeitar com motivo */}
      <Dialog open={Boolean(rejecting)} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeitar: {rejecting ? itemTitle(rejecting) : ""}</DialogTitle>
            <DialogDescription>
              O motivo vai por e-mail ao autor e fica no registro de moderação (mín. 10 caracteres).
            </DialogDescription>
          </DialogHeader>
          <select
            className={inputCls}
            value=""
            onChange={(e) => e.target.value && setReason(e.target.value)}
            aria-label="Motivo pronto"
          >
            <option value="">Motivos prontos…</option>
            {REJECTION_PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <textarea
            rows={4}
            className={inputCls}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (vai para o autor)"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRejecting(null)} className={btnOutline}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={reason.trim().length < 10 || Boolean(busy)}
              onClick={() => rejecting && moderate(rejecting, "rejected", reason.trim())}
              className={btnPrimary}
            >
              Rejeitar e avisar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bloquear autor */}
      <Dialog open={Boolean(blocking)} onOpenChange={(o) => !o && setBlocking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bloquear {blocking?.name}</DialogTitle>
            <DialogDescription>
              Isso remove do ar tudo que ele publicou e impede novas publicações. Reversível em
              "Bloqueados".
            </DialogDescription>
          </DialogHeader>
          <textarea
            rows={3}
            className={inputCls}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motivo (mín. 10 caracteres)"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setBlocking(null)} className={btnOutline}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={reason.trim().length < 10 || Boolean(busy)}
              onClick={() => blocking && block(blocking.id, reason.trim())}
              className={cn(btnPrimary, "bg-destructive hover:bg-destructive/90")}
            >
              <Ban className="h-4 w-4" /> Bloquear
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ k, v, pre = false }: { k: string; v: React.ReactNode; pre?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className={cn("mt-0.5", pre && "whitespace-pre-line")}>{v}</dd>
    </div>
  );
}
