import { useEffect, useState } from "react";
import { Lock, MessagesSquare, Send } from "lucide-react";
import { fetchApprovedComments, submitComment } from "@/lib/db";
import type { Comment } from "@/lib/types";
import { formatDate } from "@/lib/site";
import { useAuth } from "@/lib/auth-context";

export function Comments({ postId }: { postId: string }) {
  const { user, profile, openLogin } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchApprovedComments(postId)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openLogin();
      return;
    }
    const authorName = (name || profile?.full_name || user.email?.split("@")[0] || "Pai").trim();
    if (!authorName || !content.trim()) return;
    setSending(true);
    try {
      // RLS da 0002: o comentário nasce `pending` com `user_id = auth.uid()`.
      await submitComment({
        post_id: postId,
        user_id: user.id,
        author_name: authorName,
        content: content.trim(),
      });
      setSent(true);
      setName("");
      setEmail("");
      setContent("");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="comentarios" className="mt-12" aria-label={"Comentários"}>
      <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
        <MessagesSquare className="h-6 w-6 text-primary" />
        {"Comentários"}
        {comments.length > 0 && (
          <span className="text-base font-normal text-muted-foreground">
            ({comments.length} {"comentários"})
          </span>
        )}
      </h2>

      <div className="mt-6 space-y-5">
        {comments.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">
            {"Seja o primeiro a comentar este artigo."}
          </p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
                {c.author_name.charAt(0).toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-bold">{c.author_name}</p>
                <time className="text-xs text-muted-foreground">{formatDate(c.created_at)}</time>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{c.content}</p>
          </div>
        ))}
      </div>

      {sent ? (
        <div className="mt-8 rounded-2xl bg-secondary/50 p-5 text-sm font-semibold text-secondary-foreground">
          {"Obrigado! Seu comentário foi enviado e aparece depois da aprovação."}
        </div>
      ) : !user ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-secondary bg-secondary/25 p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70 text-secondary-foreground">
            <Lock className="h-6 w-6" />
          </span>
          <p className="font-display text-lg font-bold">{"Faça login para comentar"}</p>
          <button
            onClick={openLogin}
            className="inline-flex h-11 items-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            {"Entrar / Criar conta"}
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <p className="mb-4 font-display text-lg font-bold">{"Comentários"}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              value={name || (profile?.full_name ?? "")}
              onChange={(e) => setName(e.target.value)}
              placeholder={"Nome"}
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
            <input
              required
              type="email"
              value={email || (user.email ?? "")}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={"E-mail"}
              className="h-11 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <textarea
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Seu comentário"}
            rows={4}
            className="mt-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={sending}
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {"Enviar comentário"}
          </button>
        </form>
      )}
    </section>
  );
}
