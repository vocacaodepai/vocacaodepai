import { useEffect, useState } from "react";
import { Link, useOutletContext } from "@/lib/router-compat";
import {
  Check,
  Download,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  deleteComment,
  deleteContactMessage,
  deletePost,
  fetchAllPosts,
  fetchCommentsAdmin,
  fetchContactMessages,
  fetchSubscribers,
  moderateComment,
} from "@/lib/db";
import type { Comment, PostWithRelations } from "@/lib/types";
import { formatDateShort } from "@/lib/site";
import { cn } from "@/lib/utils";

// TODO Fase 2+ (admin): abas de produtos, vagas, indicações, histórias e perguntas.
type Tab = "posts" | "comments" | "subscribers" | "messages";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-accent text-accent-foreground",
  published: "bg-primary/15 text-primary",
  archived: "bg-muted text-muted-foreground",
};

export default function AdminDashboard() {
  const { isStaff } = useOutletContext<{ isStaff: boolean }>();

  const statusLabel = (status: string) => {
    if (status === "draft") return "Rascunho";
    if (status === "scheduled") return "Agendado";
    if (status === "published") return "Publicado";
    return "Publicado";
  };
  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<PostWithRelations[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [subscribers, setSubscribers] = useState<unknown[]>([]);
  const [messages, setMessages] = useState<unknown[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const reload = (activeTab: Tab) => {
    setLoading(true);
    setTab(activeTab);
    if (activeTab === "posts") {
      fetchAllPosts()
        .then(setPosts)
        .catch(() => setPosts([]))
        .finally(() => setLoading(false));
    } else if (activeTab === "comments") {
      fetchCommentsAdmin()
        .then(setComments)
        .catch(() => setComments([]))
        .finally(() => setLoading(false));
    } else if (activeTab === "subscribers") {
      fetchSubscribers()
        .then(setSubscribers)
        .catch(() => setSubscribers([]))
        .finally(() => setLoading(false));
    } else {
      fetchContactMessages()
        .then(setMessages)
        .catch(() => setMessages([]))
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    reload("posts");
  }, []);

  /** Baixa a lista de assinantes em CSV (para estruturar o envio da newsletter). */
  const exportSubscribersCsv = () => {
    const header = "email;origem;status;data";
    const rows = subscribers.map((s) => {
      const r = s as { email: string; source: string; status: string; created_at: string };
      return `${r.email};${r.source ?? ""};${r.status};${r.created_at ?? ""}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assinantes-newsletter.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pendingComments = comments.filter((c) => c.status === "pending").length;

  const removePost = async (id: string) => {
    if (!confirm("Excluir este artigo?")) return;
    await deletePost(id);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  const moderate = async (id: string, status: Comment["status"]) => {
    await moderateComment(id, status);
    setComments((c) => c.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  const removeComment = async (id: string) => {
    await deleteComment(id);
    setComments((c) => c.filter((x) => x.id !== id));
  };

  const removeMessage = async (id: string) => {
    await deleteContactMessage(id);
    setMessages((m) => m.filter((x) => (x as { id: string }).id !== id));
  };

  const tabs: { key: Tab; label: string; icon: typeof FileText; badge?: number }[] = [
    { key: "posts", label: "Artigos", icon: FileText },
    {
      key: "comments",
      label: "Comentários",
      icon: MessageSquare,
      badge: isStaff ? pendingComments : 0,
    },
    { key: "subscribers", label: "Assinantes", icon: Users },
    { key: "messages", label: "Mensagens", icon: Mail },
  ];

  const filteredPosts = filter === "all" ? posts : posts.filter((p) => p.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">{"Artigos"}</h1>
        <Link
          to="/admin/editor"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
        >
          {"Novo artigo"}
        </Link>
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

      {!isStaff && tab !== "posts" && (
        <p className="mt-6 rounded-2xl bg-accent/40 p-4 text-sm text-accent-foreground">
          {"Você não tem permissão para acessar o painel."}
        </p>
      )}

      {loading ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-muted" />
      ) : tab === "posts" ? (
        <>
          <div className="mt-4 flex gap-2">
            {["all", "draft", "scheduled", "published"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
                  filter === f
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-card text-muted-foreground",
                )}
              >
                {f === "all" ? "Todos" : statusLabel(f)}
              </button>
            ))}
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
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize",
                        STATUS_STYLES[post.status],
                      )}
                    >
                      {statusLabel(post.status)}
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
                    {"Editar"}
                  </Link>
                  <Link
                    to={`/post/${post.slug}`}
                    className="hidden h-9 items-center rounded-full border border-border px-3 text-xs font-bold text-muted-foreground hover:text-foreground sm:inline-flex"
                  >
                    Ver
                  </Link>
                  <button
                    onClick={() => removePost(post.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                    aria-label={"Excluir"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : tab === "comments" && isStaff ? (
        <div className="mt-4 space-y-2">
          {comments.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhum comentário.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold">{c.author_name}</span>
                <span className="text-xs text-muted-foreground">{c.author_email}</span>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    c.status === "approved"
                      ? "bg-primary/15 text-primary"
                      : c.status === "rejected"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-accent text-accent-foreground",
                  )}
                >
                  {c.status}
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
                <button
                  onClick={() => removeComment(c.id)}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : tab === "subscribers" && isStaff ? (
        <div className="mt-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl font-bold">{"Assinantes"}</h3>
            <button
              onClick={exportSubscribersCsv}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Download className="h-4 w-4" />
              Exportar e-mails (CSV)
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
                {subscribers.map((s) => {
                  const row = s as {
                    id: string;
                    email: string;
                    source: string;
                    status: string;
                    created_at: string;
                  };
                  return (
                    <tr key={row.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3 font-semibold">{row.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.source}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateShort(row.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : tab === "messages" && isStaff ? (
        <div className="mt-4 space-y-2">
          {messages.map((m) => {
            const row = m as {
              id: string;
              name: string;
              email: string;
              subject: string;
              message: string;
              created_at: string;
            };
            return (
              <div
                key={row.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold">{row.subject || "Sem assunto"}</p>
                  <button
                    onClick={() => removeMessage(row.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-destructive"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {row.name} · {row.email} · {formatDateShort(row.created_at)}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{row.message}</p>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma mensagem.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
