import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import {
  archiveProfessional,
  deleteJob,
  deleteReferral,
  fetchMyJobs,
  fetchMyProfessional,
  fetchMyReferrals,
  renewJob,
  renewReferral,
  translatePipError,
} from "@/lib/pai-indica-pai/client";
import { daysUntil, formatDateBR } from "@/lib/pai-indica-pai/format";
import type { JobRow, ProfessionalRow, ReferralRow } from "@/lib/pai-indica-pai/types";
import { StatusBadge, btnOutline } from "./shared";

/**
 * "Minhas publicações" (doc 08 §3.4, §10 item 21): vagas, indicações e perfil do pai logado,
 * com status, prazo, renovar (RPC) e excluir (hard delete, LGPD). A aba de /minha-conta (Fase 5)
 * pode reutilizar este componente.
 */
export function MyPublications({ refreshKey = 0 }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [pro, setPro] = useState<ProfessionalRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [j, r, p] = await Promise.all([
        fetchMyJobs(user.id),
        fetchMyReferrals(user.id),
        fetchMyProfessional(user.id),
      ]);
      setJobs(j);
      setReferrals(r);
      setPro(p);
    } catch {
      /* banco indisponível: lista vazia */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
      await load();
    } catch (e) {
      toast.error(translatePipError(e));
    }
  };

  if (!user) return null;
  if (loading)
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando suas publicações…
      </div>
    );
  if (!jobs.length && !referrals.length && !pro)
    return (
      <p className="text-sm text-muted-foreground">
        Você ainda não publicou nada no Pai Indica Pai.
      </p>
    );

  const conversion = (j: JobRow) =>
    j.views > 0
      ? `${Math.round((j.apply_clicks / j.views) * 100)}% de conversão`
      : "sem visualizações ainda";

  return (
    <div className="space-y-6">
      {jobs.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-bold">Minhas vagas</h3>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <Link
                    to="/pai-indica-pai/vagas/$slug"
                    params={{ slug: j.slug }}
                    className="font-bold hover:text-primary"
                  >
                    {j.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {j.company} ·{" "}
                    {j.status === "approved"
                      ? `encerra em ${Math.max(0, daysUntil(j.expires_at))} dias (${formatDateBR(j.expires_at)})`
                      : `enviada em ${formatDateBR(j.created_at)}`}{" "}
                    · {j.views} views · {j.apply_clicks} cliques · {conversion(j)}
                  </p>
                  {j.rejection_reason && (
                    <p className="mt-1 text-xs text-destructive">Motivo: {j.rejection_reason}</p>
                  )}
                </div>
                <StatusBadge status={j.status} />
                {(j.status === "approved" || j.status === "expired") && (
                  <button
                    type="button"
                    onClick={() => run(() => renewJob(j.id), "Vaga renovada.")}
                    className={btnOutline}
                    title="Até 3 renovações sem nova moderação; a partir de 7 dias do fim"
                  >
                    <RefreshCw className="h-4 w-4" /> Renovar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Excluir esta vaga? Isso apaga definitivamente."))
                      void run(() => deleteJob(j.id), "Vaga excluída.");
                  }}
                  className={btnOutline}
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {referrals.length > 0 && (
        <section>
          <h3 className="font-display text-xl font-bold">Minhas indicações</h3>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
            {referrals.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{r.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.category} ·{" "}
                    {r.expires_at
                      ? `válida até ${formatDateBR(r.expires_at)}`
                      : `enviada em ${formatDateBR(r.created_at)}`}
                  </p>
                  {r.rejection_reason && (
                    <p className="mt-1 text-xs text-destructive">Motivo: {r.rejection_reason}</p>
                  )}
                </div>
                <StatusBadge status={r.status} />
                {(r.status === "approved" || r.status === "expired") && (
                  <button
                    type="button"
                    onClick={() => run(() => renewReferral(r.id), "Indicação renovada.")}
                    className={btnOutline}
                  >
                    <RefreshCw className="h-4 w-4" /> Renovar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Excluir esta indicação?"))
                      void run(() => deleteReferral(r.id), "Indicação excluída.");
                  }}
                  className={btnOutline}
                >
                  <Trash2 className="h-4 w-4" /> Excluir
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {pro && (
        <section>
          <h3 className="font-display text-xl font-bold">Meu perfil de Pai Profissional</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-bold">{pro.profession}</p>
              <p className="text-xs text-muted-foreground">
                {pro.is_mentor ? "Mentor · " : ""}
                {pro.city && pro.uf ? `${pro.city}/${pro.uf}` : pro.remote ? "Remoto" : ""}
              </p>
              {pro.rejection_reason && (
                <p className="mt-1 text-xs text-destructive">Motivo: {pro.rejection_reason}</p>
              )}
            </div>
            <StatusBadge status={pro.status} />
            <Link to="/pai-indica-pai/profissionais/novo" search={{}} className={btnOutline}>
              Editar
            </Link>
            {pro.status !== "archived" && (
              <button
                type="button"
                onClick={() => {
                  if (confirm("Desativar seu perfil? Ele sai do diretório."))
                    void run(() => archiveProfessional(pro.id), "Perfil desativado.");
                }}
                className={btnOutline}
              >
                <Trash2 className="h-4 w-4" /> Desativar
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
