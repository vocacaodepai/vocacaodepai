import { useState } from "react";
import { CheckCircle2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { AdSlot } from "@/components/blog/AdSlot";
import { ArticlesStrip } from "@/components/blog/ArticlesStrip";
import { sendContact, validateContact, type ContactInput } from "@/lib/contact.functions";
import { CONTACT_TO_EMAIL } from "@/lib/site";

// /contato (doc 03 §7): nome, e-mail, assunto e mensagem → server function
// sendContact (grava em contact_messages e avisa o dono via Resend quando a
// chave existir). O campo "website" é isca anti-spam: fica fora da tela.
const EMPTY: ContactInput = { name: "", email: "", subject: "", message: "", website: "" };

const REASONS = [
  "Sugestão de pauta: o que você queria ler e não achou",
  "Correção: algo errado ou desatualizado em um artigo",
  "Parceria editorial, produto para o Pai Indica ou marca para a Loja do Pai",
  "Vaga, profissional ou mentoria para o Pai Indica Pai",
];

export default function Contact() {
  const [form, setForm] = useState<ContactInput>(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set =
    (k: keyof ContactInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed: ContactInput = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      website: form.website,
    };
    const problem = validateContact(trimmed);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSending(true);
    try {
      const result = await sendContact({ data: trimmed });
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível enviar agora. Tente de novo em instantes.");
        return;
      }
      setSent(true);
      setForm(EMPTY);
    } catch {
      toast.error("Não foi possível enviar agora. Tente de novo em instantes.");
    } finally {
      setSending(false);
    }
  };

  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="container max-w-5xl py-12">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/70 text-secondary-foreground">
          <Mail className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Fale com a gente</h1>
          <p className="text-sm text-muted-foreground">
            Dúvida, sugestão de pauta, correção ou parceria: escreva de homem para homem.
          </p>
        </div>
      </div>

      <AdSlot format="leaderboard" className="mt-6" />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {sent ? (
            <div className="flex items-start gap-3 rounded-2xl bg-secondary/50 p-6 text-secondary-foreground">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <p className="font-display text-lg font-bold">Mensagem enviada.</p>
                <p className="mt-1 text-sm">
                  Recebemos o seu recado e respondemos por e-mail. Enquanto isso, continue lendo o
                  blog.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-3 text-sm font-bold text-primary hover:underline"
                >
                  Enviar outra mensagem
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="contact-name" className="mb-1 block text-sm font-semibold">
                    Seu nome
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Como você quer ser chamado"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="mb-1 block text-sm font-semibold">
                    Seu e-mail
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    required
                    type="email"
                    maxLength={320}
                    value={form.email}
                    onChange={set("email")}
                    placeholder="Para a gente responder"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="contact-subject" className="mb-1 block text-sm font-semibold">
                  Assunto
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  maxLength={200}
                  value={form.subject}
                  onChange={set("subject")}
                  placeholder="Em poucas palavras"
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="contact-message" className="mb-1 block text-sm font-semibold">
                  Mensagem
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  value={form.message}
                  onChange={set("message")}
                  placeholder="Conte o que precisa. Quanto mais direto, mais rápido a resposta."
                  rows={7}
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
                <p className="mt-1 text-xs text-muted-foreground">Entre 10 e 5.000 caracteres.</p>
              </div>
              {/* Isca anti-spam: invisível para pessoas, preenchida por robôs. */}
              <div
                className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden"
                aria-hidden
              >
                <label htmlFor="contact-website">Deixe em branco</label>
                <input
                  id="contact-website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website ?? ""}
                  onChange={set("website")}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Enviando..." : "Enviar mensagem"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Seus dados servem só para responder você.{" "}
                  <Link to="/politica-de-privacidade" className="font-semibold text-primary">
                    Política de privacidade
                  </Link>
                  .
                </p>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Sobre o que você pode escrever</h2>
            <ul className="mt-3 space-y-2 text-sm text-foreground/80">
              {REASONS.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-bold">Prefere e-mail direto?</h2>
            <a
              href={`mailto:${CONTACT_TO_EMAIL}`}
              className="mt-2 inline-block break-all text-sm font-bold text-primary hover:underline"
            >
              {CONTACT_TO_EMAIL}
            </a>
            <p className="mt-2 text-xs text-muted-foreground">
              Respondemos em dias úteis. Não damos parecer médico, jurídico nem financeiro por
              e-mail: nesses casos, procure um profissional.
            </p>
          </div>
        </aside>
      </div>

      <ArticlesStrip />
    </div>
  );
}
