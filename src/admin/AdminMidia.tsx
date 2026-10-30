import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "@/lib/router-compat";
import { Clapperboard, ExternalLink, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { ClassIndSeal, MoralChip } from "@/components/pai-indica-midia/MediaBadge";
import { ReviewBadge } from "@/components/pai-indica/ReviewBadge";
import { formatDateShort } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { jsonToPlainText } from "@/lib/content";
import {
  CLASSIND_CONSULTA,
  PLATFORMS,
  ageTiers,
  classindConsultaUrl,
  contentCategories,
  mediaTypeLabels,
  moralScale,
  tierOf,
} from "@/lib/pai-indica-midia/taxonomia";
import {
  CLASSIND_VALUES,
  MEDIA_TYPES,
  type MediaStatus,
  type MediaType,
} from "@/lib/pai-indica-midia/types";
import {
  emptyMedia,
  fetchAdminMedia,
  fetchAdminMediaById,
  fetchMediaSlugs,
  paragraphsToDoc,
  setAdminMediaStatus,
  upsertAdminMedia,
  validateMediaInput,
  type AdminMediaInput,
  type AdminMediaRow,
} from "./admin-midia-db";

// Admin do Pai Indica Mídia (doc 14 §6): lista + criar/editar com validação. Rotas em
// src/routes/_admin/admin/midia/*. O body é escrito como texto (parágrafos separados por linha
// em branco; "## " abre seção) e convertido para Tiptap; JSON avançado entra pelo campo próprio.

function Shell({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            Pai Indica Mídia
          </p>
          <h1 className="font-display text-3xl font-bold">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          <Link
            to="/admin/midia/novo"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Nova ficha
          </Link>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

const chip = (active: boolean) =>
  cn(
    "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
    active ? "bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground",
  );

const field =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const label = "block text-xs font-bold uppercase tracking-wider text-muted-foreground";

/* ============================================================ Lista */

export function AdminMidiaList() {
  const [rows, setRows] = useState<AdminMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"todos" | MediaStatus>("todos");
  const [type, setType] = useState<"todos" | MediaType>("todos");
  const [query, setQuery] = useState("");

  const reload = () => {
    setLoading(true);
    fetchAdminMedia()
      .then(setRows)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  };
  useEffect(reload, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (status === "todos" || r.status === status) &&
        (type === "todos" || r.type === type) &&
        (!q || r.title.toLowerCase().includes(q) || r.slug.includes(q)),
    );
  }, [rows, status, type, query]);

  const toggle = async (r: AdminMediaRow) => {
    const next: MediaStatus = r.status === "published" ? "archived" : "published";
    try {
      await setAdminMediaStatus(r.id, next);
      toast.success(next === "published" ? "Ficha publicada." : "Ficha arquivada.");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao alterar o status.");
    }
  };

  return (
    <Shell title="Fichas de mídia">
      <div className="flex flex-wrap items-center gap-2">
        {(["todos", "draft", "published", "archived"] as const).map((s) => (
          <button key={s} type="button" className={chip(status === s)} onClick={() => setStatus(s)}>
            {s === "todos"
              ? "Todos"
              : s === "draft"
                ? "Rascunhos"
                : s === "published"
                  ? "Publicadas"
                  : "Arquivadas"}
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <button type="button" className={chip(type === "todos")} onClick={() => setType("todos")}>
          Todos os tipos
        </button>
        {MEDIA_TYPES.map((t) => (
          <button key={t} type="button" className={chip(type === t)} onClick={() => setType(t)}>
            {mediaTypeLabels[t].plural}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar título ou slug"
          aria-label="Buscar"
          className="ml-auto h-9 w-56 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>
      {loading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nenhuma ficha. Crie a primeira em "Nova ficha".
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Título</th>
                <th className="px-3 py-2 font-semibold">Tipo</th>
                <th className="px-3 py-2 font-semibold">ClassInd</th>
                <th className="px-3 py-2 font-semibold">Pai</th>
                <th className="px-3 py-2 font-semibold">Notas</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Atualizada</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <span className="font-semibold">{r.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {r.slug}
                      {r.year ? ` · ${r.year}` : ""}
                    </span>
                  </td>
                  <td className="px-3 py-2">{mediaTypeLabels[r.type]?.label ?? r.type}</td>
                  <td className="px-3 py-2">
                    <ClassIndSeal classind={r.classind} />
                  </td>
                  <td className="px-3 py-2">
                    {r.pai_age_min <= 0 ? "livre" : `${r.pai_age_min}+`}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1">
                      <ReviewBadge score={Number(r.score_quality)} />
                      <MoralChip value={Number(r.score_moral)} />
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-bold",
                        r.status === "published"
                          ? "bg-success/15 text-success"
                          : r.status === "draft"
                            ? "bg-warning/20 text-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                      title={r.status === "published" ? "Arquivar" : "Publicar"}
                    >
                      {r.status}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {formatDateShort(r.updated_at)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="inline-flex items-center gap-1">
                      {r.status === "published" && (
                        <a
                          href={`/pai-indica/midia/${r.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                          aria-label="Abrir no site"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <Link
                        to={`/admin/midia/${r.id}`}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
                        aria-label="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}

/* ============================================================ Formulário */

export function AdminMidiaForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [m, setM] = useState<AdminMediaInput>(emptyMedia());
  const [bodyText, setBodyText] = useState("");
  const [bodyJson, setBodyJson] = useState("");
  const [useJson, setUseJson] = useState(false);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    fetchMediaSlugs()
      .then(setSlugs)
      .catch(() => {});
    if (!id) return;
    fetchAdminMediaById(id)
      .then((row) => {
        if (!row) {
          toast.error("Ficha não encontrada.");
          navigate("/admin/midia");
          return;
        }
        const { id: _id, created_at: _c, updated_at: _u, ...rest } = row;
        setM({ ...rest, id: row.id });
        setBodyJson(JSON.stringify(row.body ?? { type: "doc", content: [] }, null, 2));
        setBodyText(jsonToPlainText(row.body));
        setUseJson(true);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const set = <K extends keyof AdminMediaInput>(k: K, v: AdminMediaInput[K]) =>
    setM((s) => ({ ...s, [k]: v }));
  const listField = (v: string) =>
    v
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const buildInput = (): AdminMediaInput | null => {
    let body = m.body;
    if (useJson) {
      try {
        body = JSON.parse(bodyJson || "{}");
      } catch {
        setErrors(["Body: JSON inválido."]);
        return null;
      }
    } else body = paragraphsToDoc(bodyText);
    return { ...m, body, slug: m.slug || slugify(m.title) };
  };

  const save = async (status?: MediaStatus) => {
    const input = buildInput();
    if (!input) return;
    if (status) input.status = status;
    const errs = validateMediaInput(input);
    if (!input.id && slugs.includes(input.slug)) errs.push("Slug já existe.");
    setErrors(errs);
    if (errs.length) {
      toast.error("Corrija os campos marcados.");
      return;
    }
    setSaving(true);
    try {
      const saved = await upsertAdminMedia(input);
      toast.success(saved.status === "published" ? "Ficha publicada." : "Ficha salva.");
      navigate(`/admin/midia/${saved.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Carregando…</p>;
  const consulta = classindConsultaUrl(m.type);
  const tier = tierOf(m.pai_age_min);

  return (
    <Shell
      title={id ? "Editar ficha" : "Nova ficha"}
      actions={
        <>
          <button
            type="button"
            disabled={saving}
            onClick={() => save()}
            className="inline-flex h-10 items-center rounded-full border border-border bg-card px-5 text-sm font-bold text-muted-foreground hover:text-foreground"
          >
            Salvar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save("published")}
            className="inline-flex h-10 items-center rounded-full bg-success px-5 text-sm font-bold text-white shadow-soft hover:bg-success/90"
          >
            Publicar
          </button>
        </>
      }
    >
      {errors.length > 0 && (
        <ul className="mb-4 list-disc rounded-xl border border-danger/40 bg-danger/5 p-4 pl-8 text-sm text-danger">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label}>
                Título
                <input
                  className={field}
                  value={m.title}
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (!id && !m.slug) set("slug", slugify(e.target.value));
                  }}
                />
              </label>
            </div>
            <label className={label}>
              Slug
              <input
                className={field}
                value={m.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </label>
            <label className={label}>
              Título original
              <input
                className={field}
                value={m.original_title ?? ""}
                onChange={(e) => set("original_title", e.target.value || null)}
              />
            </label>
            <label className={label}>
              Tipo
              <select
                className={field}
                value={m.type}
                onChange={(e) => {
                  const t = e.target.value as MediaType;
                  set("type", t);
                  if (t === "livro") set("classind", null);
                  else if (!m.classind) set("classind", "L");
                }}
              >
                {MEDIA_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {mediaTypeLabels[t].label}
                  </option>
                ))}
              </select>
            </label>
            <label className={label}>
              Ano
              <input
                type="number"
                className={field}
                value={m.year ?? ""}
                onChange={(e) => set("year", e.target.value ? Number(e.target.value) : null)}
              />
            </label>
            <div className="sm:col-span-2">
              <label className={label}>
                Plataformas (uma por linha; sugestões: {PLATFORMS.slice(0, 6).join(", ")}…)
                <textarea
                  className={`${field} min-h-16`}
                  value={m.platforms.join("\n")}
                  onChange={(e) => set("platforms", listField(e.target.value))}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={label}>
                Resumo (40 a 300 caracteres, sem spoiler)
                <textarea
                  className={`${field} min-h-20`}
                  value={m.summary}
                  onChange={(e) => set("summary", e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4">
            <p className="font-display text-lg font-bold">Análise (body)</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={chip(!useJson)} onClick={() => setUseJson(false)}>
                Texto (parágrafos; "## " abre seção)
              </button>
              <button type="button" className={chip(useJson)} onClick={() => setUseJson(true)}>
                JSON Tiptap
              </button>
            </div>
            {useJson ? (
              <textarea
                className={`${field} min-h-64 font-mono text-xs`}
                value={bodyJson}
                onChange={(e) => setBodyJson(e.target.value)}
              />
            ) : (
              <textarea
                className={`${field} min-h-64`}
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder={"## Do que trata\n\nParágrafo…\n\n## O que tem de bom\n\nParágrafo…"}
              />
            )}
          </div>

          <label className={label}>
            O que o pai precisa saber (texto corrido; obrigatório para publicar)
            <textarea
              className={`${field} min-h-28`}
              value={m.what_parents_need_to_know ?? ""}
              onChange={(e) => set("what_parents_need_to_know", e.target.value || null)}
            />
          </label>
          <label className={label}>
            Para conversar com seu filho (3 a 5 perguntas, uma por linha)
            <textarea
              className={`${field} min-h-24`}
              value={m.talk_with_your_kids.join("\n")}
              onChange={(e) => set("talk_with_your_kids", listField(e.target.value))}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={label}>
              SEO title (≤ 60)
              <input
                className={field}
                value={m.seo_title ?? ""}
                onChange={(e) => set("seo_title", e.target.value || null)}
              />
            </label>
            <label className={label}>
              SEO description (≤ 155)
              <input
                className={field}
                value={m.seo_description ?? ""}
                onChange={(e) => set("seo_description", e.target.value || null)}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-bold">Selo oficial ClassInd</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Copiar do portal do Ministério da Justiça
              {consulta ? (
                <>
                  {" "}
                  (
                  <a
                    href={consulta}
                    target="_blank"
                    rel="noopener"
                    className="font-semibold text-primary hover:underline"
                  >
                    consulta
                  </a>
                  )
                </>
              ) : (
                " — livro não recebe ClassInd"
              )}
              . Dúvida: escreva "verificar no portal ClassInd" na nota de idade.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CLASSIND_VALUES.map((c) => (
                <button
                  key={c}
                  type="button"
                  disabled={m.type === "livro"}
                  onClick={() => set("classind", c)}
                  className={cn(
                    "rounded-md ring-offset-2 disabled:opacity-40",
                    m.classind === c && "ring-2 ring-primary",
                  )}
                  aria-pressed={m.classind === c}
                >
                  <ClassIndSeal classind={c} />
                </button>
              ))}
            </div>
            <label className={`${label} mt-3`}>
              Descritores (um por linha: violência, drogas lícitas…)
              <textarea
                className={`${field} min-h-16`}
                value={m.classind_descriptors.join("\n")}
                onChange={(e) => set("classind_descriptors", listField(e.target.value))}
              />
            </label>
            <a
              href={CLASSIND_CONSULTA.sobre}
              target="_blank"
              rel="noopener"
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              Sobre a Classificação Indicativa
            </a>
          </div>

          <div className="rounded-2xl border-2 border-accent/50 bg-accent/5 p-5">
            <p className="font-display text-lg font-bold">Nota tripla do pai</p>
            <label className={`${label} mt-3`}>
              Idade mínima (0 = livre … 18) · faixa: {tier.name}
              <input
                type="number"
                min={0}
                max={18}
                className={field}
                value={m.pai_age_min}
                onChange={(e) => set("pai_age_min", Number(e.target.value))}
              />
            </label>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {ageTiers.map((t) => `${t.name}: ${t.help}`).join(" · ")}
            </p>
            <label className={`${label} mt-3`}>
              Nota de idade (explica a diferença para o ClassInd; "verificar no portal ClassInd" se
              houver dúvida)
              <textarea
                className={`${field} min-h-16`}
                value={m.pai_age_note ?? ""}
                onChange={(e) => set("pai_age_note", e.target.value || null)}
              />
            </label>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className={label}>
                Qualidade (0-10)
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  className={field}
                  value={m.score_quality}
                  onChange={(e) => set("score_quality", Number(e.target.value))}
                />
              </label>
              <label className={label}>
                Moral (-4..+4)
                <select
                  className={field}
                  value={m.score_moral}
                  onChange={(e) => set("score_moral", Number(e.target.value))}
                >
                  {moralScale.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.value > 0 ? `+${s.value}` : s.value} · {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-bold">Conteúdo em bolinhas (0-5)</p>
            <div className="mt-2 space-y-2">
              {contentCategories.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center justify-between gap-3 text-sm"
                  title={c.help}
                >
                  <span className={c.positive ? "text-success" : ""}>{c.name}</span>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    value={m.content_scores[c.key]}
                    onChange={(e) =>
                      set("content_scores", {
                        ...m.content_scores,
                        [c.key]: Number(e.target.value),
                      })
                    }
                    className="w-32 accent-primary"
                    aria-label={`${c.name}: ${m.content_scores[c.key]}`}
                  />
                  <span className="w-4 font-mono text-xs">{m.content_scores[c.key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-display text-lg font-bold">Pôster e afiliado</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Pôster só do Wikimedia Commons (CC/PD), com crédito. Sem pôster → cartão tipográfico.
              Nunca imagem gerada por IA. Afiliado só para livro e jogo (amazon.com.br com tag).
            </p>
            <label className={`${label} mt-3`}>
              poster_url
              <input
                className={field}
                value={m.poster_url ?? ""}
                onChange={(e) => set("poster_url", e.target.value || null)}
              />
            </label>
            <label className={`${label} mt-2`}>
              Crédito
              <input
                className={field}
                value={m.poster_credit ?? ""}
                onChange={(e) => set("poster_credit", e.target.value || null)}
              />
            </label>
            <label className={`${label} mt-2`}>
              Licença (CC BY-SA 4.0, domínio público…)
              <input
                className={field}
                value={m.poster_license ?? ""}
                onChange={(e) => set("poster_license", e.target.value || null)}
              />
            </label>
            <label className={`${label} mt-2`}>
              affiliate_url (livro/jogo)
              <input
                className={field}
                value={m.affiliate_url ?? ""}
                onChange={(e) => set("affiliate_url", e.target.value || null)}
              />
            </label>
            <label className={`${label} mt-2`}>
              Status
              <select
                className={field}
                value={m.status}
                onChange={(e) => set("status", e.target.value as MediaStatus)}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="archived">archived</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <p className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Clapperboard className="h-3.5 w-3.5" aria-hidden />
        Linha editorial do CLAUDE.md §3 vale aqui: visão católica de família, sem spoiler
        desnecessário, de homem para homem.
      </p>
    </Shell>
  );
}
