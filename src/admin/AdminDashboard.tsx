import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  Archive,
  Check,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Search,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDateShort } from "@/lib/site";
import { cn } from "@/lib/utils";
import {
  fetchAdminComments,
  fetchAdminContactMessages,
  fetchAdminPosts,
  fetchAdminSubscribers,
  fetchSeoSnapshot,
  moderateAdminComment,
  setAdminPostStatus,
  type AdminComment,
  type AdminContactMessage,
  type AdminPostRow,
  type AdminPostStatus,
  type AdminSubscriber,
  type PostKind,
} from "./admin-db";

// TODO Fase 2+ (admin): abas de produtos, vagas, indicações, histórias e perguntas.
type Tab = "posts" | "comments" | "subscribers" | "messages";

const STATUS_LABEL: Record<AdminPostStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  archived: "Arquivado",
};
const STATUS_STYLES: Record<AdminPostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-accent/20 text-accent-foreground",
  published: "bg-primary/15 text-primary",
  archived: "bg-destructive/10 text-destructive",
};
const KIND_LABEL: Record<PostKind, string> = {
  artigo: "Artigo",
  noticia: "Notícia",
  review: "Pai Indica · review",
  comparativo: "Pai Indica · comparativo",
  lista: "Pai Indica · lista",
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<AdminPostRow[]>([]);
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [subscribers, setSubscribers] = useState<AdminSubscriber[]>([]);
  const [messages, setMessages] = useState<AdminContactMessage[]>([]);
  const [seo, setSeo] = useState<Awaited<ReturnType<typeof fetchSeoSnapshot>> | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | AdminPostStatus>("all");
  const [kindFilter, setKindFilter] = useState<"all" | PostKind>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = (next: Tab) => {
    setLoading(true);
    setTab(next);
    const run =
      next === "posts"
        ? fetchAdminPosts().then(setPosts)
        : next === "comments"
          ? fetchAdminComments().then(setComments)
          : next === "subscribers"
            ? fetchAdminSubscribers().then(setSubscribers)
            : fetchAdminContactMessages().then(setMessages);
    run
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload("posts");
    fetchSeoSnapshot()
      .then(setSeo)
      .catch(() => setSeo(null));
  }, []);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (statusFilter === "all" || p.status === statusFilter) &&
        (kindFilter === "all" || p.kind === kindFilter) &&
        (!q || p.title.toLowerCase().includes(q) || p.slug.includes(q)),
    );
  }, [posts, statusFilter, kindFilter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: posts.length };
    for (const p of posts) c[p.status] = (c[p.status] ?? 0) + 1;
    return c;
  }, [posts]);

  const changeStatus = async (post: AdminPostRow, status: AdminPostStatus) => {
    const label = status === "archived" ? "Arquivar" : "Despublicar (voltar a rascunho)";
    if (!confirm(`${label} "${post.title}"?`)) return;
    try {
      await setAdminPostStatus(post.id, status);
      setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, status } : p)));
      toast.success(status === "archived" ? "Artigo arquivado." : "Artigo voltou a rascunho.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao alterar o status.");
    }
  };

  const moderate = async (id: string, status: AdminComment["status"]) => {
    try {
      await moderateAdminComment(id, status);
      setComments((c) => c.map((x) => (x.id === id ? { ...x, status } : x)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao moderar.");
    }
  };

  const exportSubscribersCsv = () => {
    const header = "email;origem;status;data";
    const rows = subscribers.map((r) => `${r.email};${r.source ?? ""};${r.status};${r.created_at}`);
    const blob = new Blob(["﻿" + [header, ...rows].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assinantes-newsletter.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingComments = comments.filter((c) => c.status === "pending").length;

  const tabs: { key: Tab; label: string; icon: typeof FileText; badge?: number }[] = [
    { key: "posts", label: "Artigos", icon: FileText },
    { key: "comments", label: "Comentários", icon: MessageSquare, badge: pendingComments },
    { key: "subscribers", label: "Assinantes", icon: Users },
    { key: "messages", label: "Mensagens", icon: Mail },
  ];

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
      active ? "bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground",
    );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Painel do Vocação de Pai</h1>
        <div className="flex flex-wrap gap-2">
          {/* Fase 7 (doc 09 §13): filas de moderação da Irmandade, eventos e Formação. */}
          <Link
            to="/admin/moderacao"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Moderação
          </Link>
          <Link
            to="/admin/eventos"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Eventos
          </Link>
          <Link
            to="/admin/formacao"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Formação
          </Link>
          <Link
            to="/admin/editor"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Novo artigo
          </Link>
        </div>
      </div>

      {/* Cartões-resumo */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Publicados
          </p>
          <p className="mt-1 font-display text-3xl font-bold">{counts.published ?? 0}</p>
          <p className="text-xs text-muted-foreground">
            {counts.draft ?? 0} rascunhos · {counts.scheduled ?? 0} agendados
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Views (total)
          </p>
          <p className="mt-1 font-display text-3xl font-bold">
            {posts.reduce((a, p) => a + (p.view_count ?? 0), 0)}
          </p>
          <p className="text-xs text-muted-foreground">contagem por leitor/dia</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Search Console
          </p>
          {seo?.snapshot_date ? (
            <>
              <p className="mt-1 font-display text-3xl font-bold">{seo.clicks} cliques</p>
              <p className="text-xs text-muted-foreground">
                {seo.impressions} impressões · {formatDateShort(seo.snapshot_date)}
              </p>
            </>
          ) : (
            <>
              <p className="mt-1 font-display text-3xl font-bold">—</p>
              <p className="text-xs text-muted-foreground">
                Sem dados ainda (a sincronização é agendada na Fase 8).
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => reload(tb.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              tab === tb.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <tb.icon className="h-4 w-4" />
            {tb.label}
            {tb.badge ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {tb.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : tab === "posts" ? (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(["all", "draft", "scheduled", "published", "archived"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={chip(statusFilter === f)}
              >
                {f === "all" ? "Todos" : STATUS_LABEL[f]} ({counts[f] ?? 0})
              </button>
            ))}
            <span className="mx-1 h-5 w-px bg-border" />
            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value as "all" | PostKind)}
              className="h-9 rounded-full border border-border bg-card px-3 text-xs font-bold text-muted-foreground"
            >
              <option value="all">Todos os tipos</option>
              {(Object.keys(KIND_LABEL) as PostKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <label className="relative ml-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título ou slug"
                className="h-9 w-64 rounded-full border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {filteredPosts.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum artigo.</p>
            )}
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                        STATUS_STYLES[post.status],
                      )}
                    >
                      {STATUS_LABEL[post.status]}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {KIND_LABEL[post.kind] ?? post.kind}
                    </span>
                    {post.category && (
                      <span className="text-xs text-muted-foreground">{post.category.name}</span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-display font-bold">{post.title}</p>
                  <p className="text-xs text-muted-foreground">
                    /post/{post.slug} · {formatDateShort(post.publish_at ?? post.updated_at)} ·{" "}
                    {post.view_count} views
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    to={`/admin/editor/${post.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <a
                    href={`/post/${post.slug}${post.status === "published" ? "" : "?preview=1"}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden h-9 items-center rounded-full border border-border px-3 text-xs font-bold text-muted-foreground hover:text-foreground sm:inline-flex"
                  >
                    Ver
                  </a>
                  {post.status === "published" ? (
                    <button
                      onClick={() => changeStatus(post, "draft")}
                      className="inline-flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                      title="Despublicar (volta a rascunho)"
                    >
                      <X className="h-3.5 w-3.5" />
                      Despublicar
                    </button>
                  ) : post.status !== "archived" ? (
                    <button
                      onClick={() => changeStatus(post, "archived")}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                      aria-label="Arquivar"
                      title="Arquivar (nunca apagamos artigos)"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : tab === "comments" ? (
        <div className="mt-4 space-y-2">
          {comments.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum comentário.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">{c.author_name}</span>
                {c.post && (
                  <a
                    href={`/post/${c.post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-muted-foreground hover:underline"
                  >
                    em "{c.post.title}"
                  </a>
                )}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    c.status === "approved"
                      ? "bg-primary/15 text-primary"
                      : c.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-accent/20 text-accent-foreground",
                  )}
                >
                  {c.status === "approved"
                    ? "aprovado"
                    : c.status === "rejected"
                      ? "rejeitado"
                      : "pendente"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDateShort(c.created_at)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed">{c.content}</p>
              <div className="mt-3 flex gap-2">
                {c.status !== "approved" && (
                  <button
                    onClick={() => moderate(c.id, "approved")}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-primary/15 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                  >
                    <Check className="h-3.5 w-3.5" /> Aprovar
                  </button>
                )}
                {c.status !== "rejected" && (
                  <button
                    onClick={() => moderate(c.id, "rejected")}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-destructive/10 px-3 text-xs font-bold text-destructive"
                  >
                    <X className="h-3.5 w-3.5" /> Rejeitar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : tab === "subscribers" ? (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl font-bold">Assinantes da newsletter</h3>
            <button
              onClick={exportSubscribersCsv}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Origem</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((row) => (
                  <tr key={row.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3 font-semibold">{row.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateShort(row.created_at)}
                    </td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum assinante ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {messages.map((row) => (
            <div key={row.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-sm font-bold">{row.subject || "Sem assunto"}</p>
              <p className="text-xs text-muted-foreground">
                {row.name} · {row.email} · {formatDateShort(row.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{row.message}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem.</p>
          )}
        </div>
      )}
    </div>
  );
}
