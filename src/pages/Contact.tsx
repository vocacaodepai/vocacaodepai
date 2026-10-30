import { useEffect, useState } from "react";
import { Mail, Send } from "lucide-react";
import { sendContactMessage, fetchPublishedPosts } from "@/lib/db";
import type { PostWithRelations } from "@/lib/types";
import { PostCard } from "@/components/blog/PostCard";
import { useSeo } from "@/lib/seo";
import { toast } from "sonner";
import { AdSlot } from "@/components/blog/AdSlot";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [latest, setLatest] = useState<PostWithRelations[]>([]);

  useEffect(() => {
    fetchPublishedPosts({ limit: 3 })
      .then((res) => setLatest(res.posts))
      .catch(() => setLatest([]));
  }, []);

  useSeo({
    title: "Fale conosco",
    description: "Fale com a equipe do Vocação de Pai: dúvidas, sugestões de pauta e parcerias.",
    canonicalPath: "/contato",
  });

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setSending(true);
    try {
      await sendContactMessage(form);
      setSent(true);
    } catch {
      toast.error("Ops, não foi possível assinar. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="container max-w-2xl py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70 text-secondary-foreground">
          <Mail className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold">{"Fale conosco"}</h1>
          <p className="text-sm text-muted-foreground">
            {"Dúvidas, sugestões de pauta ou parcerias: escreva para a gente."}
          </p>
        </div>
      </div>

      <AdSlot format="leaderboard" className="mt-6" />

      {sent ? (
        <div className="mt-10 rounded-2xl bg-secondary/50 p-6 font-semibold text-secondary-foreground">
          {"Mensagem enviada! Em breve entraremos em contato."}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-name" className="sr-only">
                {"Seu nome"}
              </label>
              <input
                id="contact-name"
                name="name"
                autoComplete="name"
                required
                value={form.name}
                onChange={set("name")}
                placeholder={"Seu nome"}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="sr-only">
                {"Seu e-mail"}
              </label>
              <input
                id="contact-email"
                name="email"
                autoComplete="email"
                required
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder={"Seu e-mail"}
                className={inputCls}
              />
            </div>
          </div>
          <label htmlFor="contact-subject" className="sr-only">
            {"Assunto"}
          </label>
          <input
            id="contact-subject"
            name="subject"
            value={form.subject}
            onChange={set("subject")}
            placeholder={"Assunto"}
            className={inputCls}
          />
          <label htmlFor="contact-message" className="sr-only">
            {"Mensagem"}
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            value={form.message}
            onChange={set("message")}
            placeholder={"Mensagem"}
            rows={6}
            className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {"Enviar mensagem"}
          </button>
        </form>
      )}

      {latest.length > 0 && (
        <section className="mt-14" aria-labelledby="contact-articles-title">
          <h2 id="contact-articles-title" className="font-display text-2xl font-bold">
            {"Continue lendo"}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* TODO Fase 3 (Loja do Pai): StorePromo */}
    </div>
  );
}
