import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ConductCheckbox } from "@/components/irmandade/ConductCheckbox";
import { createQuestionFn, getQuestionCategoriesFn } from "@/lib/community.functions";
import { LoginNeeded } from "./NovaHistoriaPage";

/** /perguntas/nova (doc 09 §4.1): título, corpo, categoria obrigatória, até 3 tags, honeypot, conduta. */
export default function NovaPerguntaPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState("");
  const [conduct, setConduct] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getQuestionCategoriesFn()
      .then((c) => {
        setCategories(c);
        if (c[0] && !categoryId) setCategoryId(c[0].id);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (ready && !user) return <LoginNeeded next="/perguntas/nova" title="Faça uma pergunta" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return;
    if (!conduct) return toast.error("Aceite o código de conduta para enviar.");
    setBusy(true);
    try {
      await createQuestionFn({
        data: {
          title,
          body,
          categoryId,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 3),
          acceptedConduct: true,
        },
      });
      toast.success("Pergunta enviada. Ela passa pela moderação antes de ir ao ar.");
      navigate("/perguntas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setBusy(false);
    }
  };
  const field = "w-full rounded-xl border border-border bg-background p-3 text-sm";
  return (
    <div className="container py-8">
      <Breadcrumbs
        items={[
          { name: "Irmandade", path: "/irmandade" },
          { name: "Perguntas", path: "/perguntas" },
          { name: "Nova pergunta", path: "/perguntas/nova" },
        ]}
      />
      <form onSubmit={submit} className="mx-auto mt-6 max-w-2xl space-y-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Irmandade</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Faça uma pergunta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seja direto: o que está acontecendo, o que você já tentou e o que quer saber. A pergunta
            passa pela moderação antes de ir ao ar.
          </p>
        </header>
        <label className="block text-sm font-semibold">
          Pergunta
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={10}
            maxLength={160}
            required
            className={`mt-1 ${field}`}
            placeholder="Ex.: Como dividir as noites com o bebê sem brigar?"
          />
        </label>
        <label className="block text-sm font-semibold">
          Detalhes ({body.length}/6000)
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            minLength={20}
            maxLength={6000}
            required
            className={`mt-1 ${field}`}
            placeholder="Contexto, o que você já tentou, idade dos filhos. No máximo 2 links."
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Categoria
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className={`mt-1 ${field}`}
            >
              {categories.length === 0 && <option value="">Carregando…</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Tags (até 3, separadas por vírgula)
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className={`mt-1 ${field}`}
              placeholder="sono, recém-nascido"
            />
          </label>
        </div>
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden
        />
        <ConductCheckbox checked={conduct} onChange={setConduct} />
        <button
          type="submit"
          disabled={busy || !categoryId}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{" "}
          Enviar pergunta
        </button>
      </form>
    </div>
  );
}
