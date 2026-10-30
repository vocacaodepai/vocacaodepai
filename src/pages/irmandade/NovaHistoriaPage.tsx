import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ConductCheckbox } from "@/components/irmandade/ConductCheckbox";
import { createStoryFn } from "@/lib/community.functions";
import { uploadImageFn } from "@/lib/media.functions";
import { STORY_CATEGORIES, type StoryCategory } from "@/lib/irmandade/story-categories";

function LoginNeeded({ next, title }: { next: string; title: string }) {
  return (
    <div className="container py-16 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Entre na Irmandade (gratuito) para continuar.
      </p>
      <Link
        to={`/entrar?next=${encodeURIComponent(next)}`}
        className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
      >
        Entrar ou criar conta
      </Link>
    </div>
  );
}
export { LoginNeeded };

/** /historias/nova (doc 09 §3): textarea (content text), categoria, foto opcional, conduta; nasce pending. */
export default function NovaHistoriaPage() {
  const { user, profile, ready } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StoryCategory>("paternidade");
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [conduct, setConduct] = useState(false);
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile?.full_name && !authorName) setAuthorName(profile.full_name);
  }, [profile, authorName]);

  if (ready && !user) return <LoginNeeded next="/historias/nova" title="Conte sua história" />;

  const onPhoto = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        const r = await uploadImageFn({
          data: { dataUrl: String(reader.result), folder: "stories" },
        });
        setPhotoUrl(r.url);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha no envio da foto.");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website) return;
    if (!conduct) return toast.error("Aceite o código de conduta para enviar.");
    setBusy(true);
    try {
      await createStoryFn({
        data: { title, category, authorName, content, photoUrl, acceptedConduct: true },
      });
      toast.success("História enviada. Ela passa pela moderação antes de ir ao ar (até 48 h).");
      navigate("/historias");
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
          { name: "Histórias", path: "/historias" },
          { name: "Conte sua história", path: "/historias/nova" },
        ]}
      />
      <form onSubmit={submit} className="mx-auto mt-6 max-w-2xl space-y-5">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Irmandade</p>
          <h1 className="mt-1 font-display text-3xl font-bold">Conte sua história</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua história passa pela moderação antes de ir ao ar (até 48 h). Conte o que você viveu,
            honre a mãe dos seus filhos e não publique rosto de criança que não seja a sua.
          </p>
        </header>
        <label className="block text-sm font-semibold">
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            minLength={5}
            maxLength={140}
            required
            className={`mt-1 ${field}`}
            placeholder="Ex.: O dia em que meu filho me ensinou a pedir perdão"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Categoria
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as StoryCategory)}
              className={`mt-1 ${field}`}
            >
              {STORY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Como assinar
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              minLength={2}
              maxLength={60}
              required
              className={`mt-1 ${field}`}
              placeholder="Seu nome ou apelido"
            />
          </label>
        </div>
        <label className="block text-sm font-semibold">
          Sua história ({content.length}/10000)
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            minLength={100}
            maxLength={10000}
            required
            className={`mt-1 ${field}`}
            placeholder="Mínimo de 100 caracteres. Separe os parágrafos com uma linha em branco."
          />
        </label>
        <label className="block text-sm font-semibold">
          Foto (opcional, própria)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPhoto(e.target.files?.[0])}
            className="mt-1 block text-sm"
          />
          {uploading && <span className="text-xs text-muted-foreground">Enviando foto…</span>}
          {photoUrl && (
            <img
              src={photoUrl}
              alt="Pré-visualização"
              className="mt-2 h-32 rounded-xl object-cover"
            />
          )}
        </label>
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
          disabled={busy || uploading}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-primary px-8 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{" "}
          Enviar para moderação
        </button>
      </form>
    </div>
  );
}
