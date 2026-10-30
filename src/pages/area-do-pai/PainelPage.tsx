import { useCallback, useEffect, useState } from "react";
import {
  Baby,
  Bookmark,
  Briefcase,
  Flag,
  Loader2,
  Mail,
  Route as RouteIcon,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken, ptError } from "@/lib/auth";
import { getPainelData, setNewsletterPref } from "@/lib/area-do-pai/area.functions";
import { EMPTY_PAINEL, type PainelData } from "@/lib/area-do-pai/types";
import { humanAge, phaseBySlug } from "@/lib/phases";
import { AreaShell, Card, primaryBtn, secondaryBtn } from "@/components/area-do-pai/AreaShell";
import { UpsellCard } from "@/components/area-do-pai/PremiumGate";
import { BadgeGrid } from "@/components/formacao/BadgeGrid";
import { StreakChip } from "@/components/formacao/StreakChip";
import { MyPublications } from "@/components/pai-indica-pai/MyPublications";
import { getMyFormacaoFn } from "@/lib/tracks.functions";
import type { MyFormacao } from "@/lib/formacao/types";
import { formatDateShort } from "@/lib/site";
import { cn } from "@/lib/utils";

// Painel /area-do-pai (doc 07 §4.9): os 10 blocos em ordem. O grosso vem de
// getPainelData em uma chamada. Trilhas, desafios, insígnias e streak (Fase 7)
// vêm de getMyFormacaoFn (get_member_dashboard + grant_badges_for_me) e caem
// nos dados do painel se a chamada falhar; "Minhas vagas/indicações" (Fase 6)
// é o MyPublications do Pai Indica Pai. Tudo degrada para vazio sem banco.

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};

const STATUS_PT: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Reprovado",
  expired: "Expirado",
};

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export default function PainelPage() {
  const { user, member } = useAuth();
  const [data, setData] = useState<PainelData | null>(null);
  const [formacao, setFormacao] = useState<MyFormacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [newsBusy, setNewsBusy] = useState(false);

  const load = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      setData(EMPTY_PAINEL);
      setLoading(false);
      return;
    }
    try {
      setData(await getPainelData({ data: { accessToken } }));
    } catch (e) {
      setData(EMPTY_PAINEL);
      toast.error(ptError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  // Formação (Fase 7): o bearer vai pelo middleware (attachSupabaseAuth); sem sessão
  // ou sem banco a chamada falha e os cards usam o que getPainelData trouxe.
  useEffect(() => {
    if (!user) return setFormacao(null);
    let alive = true;
    getMyFormacaoFn()
      .then((r) => alive && setFormacao(r))
      .catch(() => alive && setFormacao(null));
    return () => {
      alive = false;
    };
  }, [user]);

  const toggleNewsletter = async (optIn: boolean) => {
    setNewsBusy(true);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Sessão expirada. Entre novamente.");
      const r = await setNewsletterPref({ data: { accessToken, optIn } });
      setData((d) => (d ? { ...d, newsletter: { status: r.status } } : d));
      toast.success(
        optIn
          ? r.emailed
            ? "Enviamos o e-mail de confirmação. Confira sua caixa de entrada."
            : "Preferência salva."
          : "Você saiu do resumo semanal.",
      );
    } catch (e) {
      toast.error(ptError(e));
    } finally {
      setNewsBusy(false);
    }
  };

  const d = data ?? EMPTY_PAINEL;
  const name = d.profile?.display_name ?? member?.display_name ?? "pai";
  const first = name.split(/\s+/)[0];

  // Fonte única para os cards da Formação: getMyFormacaoFn quando respondeu,
  // senão o que o get_member_dashboard do painel já trouxe (mesma RPC, sem streak).
  const tracks = formacao
    ? formacao.formacao.tracks
    : d.tracksInProgress.map((t) => ({ ...t, next_step: null }));
  const challenges = formacao
    ? formacao.formacao.challenges.map((c) => ({
        slug: c.slug,
        title: c.title,
        day: c.current_day,
        days: c.days,
        today: c.today,
      }))
    : d.activeChallenges.map((c) => ({ ...c, today: null }));
  const badges = formacao ? formacao.badges_all : d.badges;

  return (
    <AreaShell
      title={`${greeting()}, ${first}.`}
      description="Seu painel: filhos, conteúdo por fase, salvos, trilhas e insígnias."
      actions={
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold",
              d.plan.premium ? "bg-accent/20 text-accent" : "bg-primary/10 text-primary",
            )}
          >
            {d.plan.name}
          </span>
          <Link to="/minha-conta" className={secondaryBtn}>
            Editar perfil
          </Link>
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando seu painel…
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* 2. Filhos e fases */}
          <Card
            title="Seus filhos"
            className="lg:col-span-2"
            action={
              <Link
                to="/area-do-pai/filhos"
                className="text-sm font-bold text-primary hover:underline"
              >
                Gerenciar filhos
              </Link>
            }
          >
            {d.children.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center">
                <Baby className="mx-auto h-8 w-8 text-primary" aria-hidden />
                <p className="mt-2 font-semibold">
                  Cadastre seu filho e receba conteúdo para a fase dele.
                </p>
                <Link to="/area-do-pai/filhos" className={cn(primaryBtn, "mt-4")}>
                  Cadastrar filho
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {d.children.map((c) => {
                  const phase = phaseBySlug(c.phase);
                  const posts = d.recommended
                    .filter((p) => p.phase === c.phase || p.phase === "todas")
                    .slice(0, 4);
                  return (
                    <div key={c.id} className="rounded-xl border border-border p-4">
                      <p className="font-display text-lg font-bold">
                        {c.name || (c.sex === "F" ? "Sua filha" : "Seu filho")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {humanAge(c.birth_date)} · {phase?.name ?? c.phase}
                      </p>
                      {posts.length > 0 ? (
                        <ul className="mt-3 space-y-1.5">
                          {posts.map((p) => (
                            <li key={p.post_id}>
                              <Link
                                to={`/post/${p.slug}`}
                                className="text-sm font-semibold text-foreground/90 hover:text-primary"
                              >
                                {p.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Conteúdo por fase chega conforme publicamos.{" "}
                          <Link to="/blog" className="font-bold text-primary">
                            Ver o Blog
                          </Link>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 9. Mercado do pai hoje — só com dado em market_cache */}
          {d.market ? (
            <Card title="Mercado do pai hoje">
              <ul className="space-y-1.5 text-sm">
                {d.market.usdBrl != null && (
                  <li className="flex justify-between">
                    <span>Dólar</span>
                    <strong>{brl(d.market.usdBrl)}</strong>
                  </li>
                )}
                {d.market.eurBrl != null && (
                  <li className="flex justify-between">
                    <span>Euro</span>
                    <strong>{brl(d.market.eurBrl)}</strong>
                  </li>
                )}
                {d.market.btcBrl != null && (
                  <li className="flex justify-between">
                    <span>Bitcoin</span>
                    <strong>{brl(d.market.btcBrl)}</strong>
                  </li>
                )}
                {d.market.selic != null && (
                  <li className="flex justify-between">
                    <span>Selic</span>
                    <strong>{d.market.selic.toFixed(2).replace(".", ",")}% a.a.</strong>
                  </li>
                )}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                {d.market.fetchedAt ? `Dados de ${formatDateShort(d.market.fetchedAt)}. ` : ""}
                Informação educativa.{" "}
                <Link to="/ferramentas/mercado-financeiro" className="font-bold text-primary">
                  Ver mercado completo
                </Link>
              </p>
            </Card>
          ) : (
            <Card title="Caixa de Ferramentas">
              <p className="text-sm text-muted-foreground">
                Conversor de moedas, Mercado do pai e calculadoras práticas.
              </p>
              <Link to="/ferramentas" className={cn(secondaryBtn, "mt-3")}>
                <TrendingUp className="h-4 w-4" /> Abrir ferramentas
              </Link>
            </Card>
          )}

          {/* 3. Salvos */}
          <Card
            title={`Salvos (${d.savedCount})`}
            action={
              <Link
                to="/area-do-pai/salvos"
                className="text-sm font-bold text-primary hover:underline"
              >
                Ver todos
              </Link>
            }
          >
            {d.savedRecent.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <Bookmark className="mr-1 inline h-4 w-4" aria-hidden />
                Salve artigos, produtos e ferramentas para voltar depois.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {d.savedRecent.map((s) => (
                  <li key={s.id}>
                    <Link to={s.href} className="text-sm font-semibold hover:text-primary">
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 4. Trilhas (Fase 7) */}
          <Card
            title="Trilhas em andamento"
            action={
              <Link to="/formacao" className="text-sm font-bold text-primary hover:underline">
                Ver Formação
              </Link>
            }
          >
            {tracks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <RouteIcon className="mr-1 inline h-4 w-4" aria-hidden />
                Nenhuma trilha começada. Escolha uma na{" "}
                <Link to="/formacao" className="font-bold text-primary">
                  Formação
                </Link>{" "}
                e avance no seu ritmo.
              </p>
            ) : (
              <ul className="space-y-3">
                {tracks.map((t) => {
                  const pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
                  const next = t.next_step;
                  return (
                    <li key={t.slug}>
                      <Link
                        to={
                          next
                            ? `/formacao/${t.slug}?passo=${next.position}`
                            : `/formacao/${t.slug}`
                        }
                        className="text-sm font-bold hover:text-primary"
                      >
                        {t.title}
                      </Link>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t.done} de {t.total} passos
                        {next ? ` · próximo: ${next.title}` : " · trilha concluída"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* 5. Desafios (Fase 7) */}
          <Card
            title="Desafios ativos"
            action={
              <Link to="/desafios" className="text-sm font-bold text-primary hover:underline">
                Ver desafios
              </Link>
            }
          >
            {challenges.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                <Flag className="mr-1 inline h-4 w-4" aria-hidden />
                Nenhum desafio em andamento. São 30 dias, uma tarefa por dia, com recomeço suave.
              </p>
            ) : (
              <ul className="space-y-2">
                {challenges.map((c) => (
                  <li key={c.slug} className="text-sm">
                    <Link to={`/desafios/${c.slug}`} className="font-bold hover:text-primary">
                      {c.title}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      Dia {c.day} de {c.days}
                    </span>
                    {c.today && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        Hoje: {c.today.title}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* 6. Insígnias + streak (Fase 7) */}
          <Card
            title="Insígnias"
            className="lg:col-span-2"
            action={
              formacao ? (
                <StreakChip
                  streak={formacao.formacao.streak}
                  points={formacao.formacao.points}
                  title={formacao.formacao.title}
                />
              ) : undefined
            }
          >
            <BadgeGrid badges={badges} compact />
          </Card>

          {/* 8. Newsletter */}
          <Card title="Resumo semanal">
            <p className="text-sm text-muted-foreground">
              <Mail className="mr-1 inline h-4 w-4" aria-hidden />
              {d.newsletter.status === "confirmed"
                ? "Você recebe o resumo semanal por e-mail."
                : d.newsletter.status === "pending"
                  ? "Falta confirmar: abra o e-mail que enviamos."
                  : "Receba toda semana o essencial para a fase dos seus filhos."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {d.newsletter.status === "confirmed" ? (
                <button
                  type="button"
                  disabled={newsBusy}
                  onClick={() => toggleNewsletter(false)}
                  className={secondaryBtn}
                >
                  Sair da lista
                </button>
              ) : (
                <button
                  type="button"
                  disabled={newsBusy}
                  onClick={() => toggleNewsletter(true)}
                  className={primaryBtn}
                >
                  {newsBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {d.newsletter.status === "pending" ? "Reenviar confirmação" : "Assinar"}
                </button>
              )}
            </div>
          </Card>

          {/* 7. Minhas contribuições: Pai Indica Pai (Fase 6, MyPublications) + histórias */}
          <Card title="Minhas contribuições" className="lg:col-span-2">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" aria-hidden /> Pai Indica Pai
                </p>
                <MyPublications />
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <Link
                    to="/pai-indica-pai/vagas/nova"
                    className="font-bold text-primary hover:underline"
                  >
                    Publicar vaga
                  </Link>
                  <Link
                    to="/pai-indica-pai/indicacoes/nova"
                    className="font-bold text-primary hover:underline"
                  >
                    Indicar um pai
                  </Link>
                  <Link
                    to="/pai-indica-pai/profissionais/novo"
                    className="font-bold text-primary hover:underline"
                  >
                    Meu perfil profissional
                  </Link>
                </p>
              </div>
              <ContribList
                title="Minhas histórias"
                items={d.myStories.map((s) => ({
                  key: s.id,
                  title: s.title,
                  status: s.status,
                  href: `/historias/${s.id}`,
                }))}
                emptyHref="/historias/nova"
                emptyLabel="Contar minha história"
              />
            </div>
          </Card>

          {/* 10. Upsell */}
          {!d.plan.premium && (
            <div>
              <UpsellCard />
            </div>
          )}
        </div>
      )}
    </AreaShell>
  );
}

function ContribList({
  title,
  items,
  emptyHref,
  emptyLabel,
}: {
  title: string;
  items: Array<{ key: string; title: string; status: string; href: string }>;
  emptyHref: string;
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        <Briefcase className="h-3.5 w-3.5" aria-hidden /> {title}
      </p>
      {items.length === 0 ? (
        <Link to={emptyHref} className="text-sm font-bold text-primary hover:underline">
          {emptyLabel}
        </Link>
      ) : (
        <ul className="space-y-1">
          {items.map((i) => (
            <li key={i.key} className="flex items-center justify-between gap-2 text-sm">
              <Link to={i.href} className="truncate font-semibold hover:text-primary">
                {i.title}
              </Link>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                  i.status === "approved"
                    ? "bg-success/15 text-success"
                    : i.status === "rejected"
                      ? "bg-danger/15 text-danger"
                      : "bg-warning/20 text-foreground",
                )}
              >
                {STATUS_PT[i.status] ?? i.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
