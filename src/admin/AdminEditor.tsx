import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CalloutExtension } from "@/components/blog/Callout";
import { ToolEmbedExtension } from "@/components/blog/ToolEmbed";
import { DecisorRapidoExtension } from "@/components/blog/DecisorRapidoExtension";
import { FotosModelosExtension } from "@/components/blog/FotosModelosExtension";
import { BuyCardExtension, GaleriaProdutoExtension } from "@/components/blog/dataNodes";
import {
  Bold,
  CalendarClock,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Redo2,
  Save,
  Search,
  Send,
  Trash2,
  Undo2,
  Plus,
} from "lucide-react";
import {
  createPost,
  fetchAllSlugs,
  fetchCategories,
  fetchMyProfile,
  fetchPostById,
  updatePost,
  uploadImage,
} from "@/lib/db";
import type { Category, FaqItem, Post, PostStatus } from "@/lib/types";
import { buildExcerpt, buildSearchContent } from "@/lib/content";
import { compressToWebP } from "@/lib/image";
import { slugify, slugifyUnique } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";
import { ImageSearchDialog } from "./ImageSearchDialog";

interface FormState {
  title: string;
  subtitle: string;
  slug: string;
  category_id: string;
  tags: string;
  cover_image_url: string;
  cover_image_alt: string;
  seo_meta_title: string;
  seo_meta_description: string;
  faq: FaqItem[];
}

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  slug: "",
  category_id: "",
  tags: "",
  cover_image_url: "",
  cover_image_alt: "",
  seo_meta_title: "",
  seo_meta_description: "",
  faq: [],
};

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<PostStatus>("draft");
  const [publishAt, setPublishAt] = useState("");
  const [postId, setPostId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [inlineAlt, setInlineAlt] = useState("");
  const [inlineFile, setInlineFile] = useState<File | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [coverSearchOpen, setCoverSearchOpen] = useState(false);
  const [inlineSearchOpen, setInlineSearchOpen] = useState(false);

  const existingSlugs = useRef<string[]>([]);
  const formRef = useRef(form);
  formRef.current = form;
  const dirtyRef = useRef(false);
  const postIdRef = useRef<string | null>(null);
  useEffect(() => {
    postIdRef.current = postId;
  }, [postId]);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useSeo({ title: "Editor", noindex: true });

  useEffect(() => {
    Promise.all([fetchCategories(), fetchAllSlugs(), fetchMyProfile()]).then(
      ([cats, slugs, profile]) => {
        existingSlugs.current = slugs;
        setIsStaff(profile?.role === "admin" || profile?.role === "editor");
      },
    );
  }, []);

  const editor = useEditor({
    extensions: [
      // O StarterKit v3 já inclui o Link; registrar @tiptap/extension-link de
      // novo gerava "Duplicate extension names found: ['link']".
      StarterKit.configure({ link: { openOnClick: false } }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Escreva o conteúdo do artigo aqui..." }),
      CalloutExtension,
      ToolEmbedExtension,
      DecisorRapidoExtension,
      FotosModelosExtension,
      BuyCardExtension,
      GaleriaProdutoExtension,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: {},
    onUpdate: () => {
      dirtyRef.current = true;
    },
  });

  // Load existing post
  useEffect(() => {
    if (!id || !editor) return;
    fetchPostById(id)
      .then((post) => {
        if (!post) return;
        setPostId(post.id);
        setStatus(post.status);
        setPublishAt(toLocalInput(post.publish_at));
        setForm({
          title: post.title,
          subtitle: post.subtitle ?? "",
          slug: post.slug,
          category_id: post.category_id ?? "",
          tags: (post.tags ?? []).join(", "),
          cover_image_url: post.cover_image_url ?? "",
          cover_image_alt: post.cover_image_alt ?? "",
          seo_meta_title: post.seo_meta_title ?? "",
          seo_meta_description: post.seo_meta_description ?? "",
          faq: post.faq ?? [],
        });
        editor.commands.setContent(post.body);
        if (post.status === "published") {
          toast.info("Artigo publicado. Edite com cuidado e republicar para atualizar.");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, editor]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      dirtyRef.current = true;
      if (key === "title" && !f.slug) {
        next.slug = slugify(value as string);
      }
      return next;
    });
  };

  const buildPayload = useCallback(
    (mode: "draft" | "schedule" | "publish"): Partial<Post> => {
      const body = editor?.getJSON() ?? {};
      const tags = formRef.current.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const title = formRef.current.title.trim() || "Artigo sem título";
      const slug = formRef.current.slug.trim() || slugifyUnique(title, existingSlugs.current);
      const search_content = buildSearchContent(title, formRef.current.subtitle, body, tags);
      const excerpt = buildExcerpt(body) || formRef.current.subtitle || title;
      const publish_at =
        mode === "publish"
          ? new Date().toISOString()
          : mode === "schedule" && publishAt
            ? new Date(publishAt).toISOString()
            : null;

      return {
        title,
        subtitle: formRef.current.subtitle || null,
        slug,
        category_id: formRef.current.category_id || null,
        tags,
        body,
        search_content,
        excerpt,
        cover_image_url: formRef.current.cover_image_url || null,
        cover_image_alt: formRef.current.cover_image_alt || null,
        seo_meta_title: formRef.current.seo_meta_title || null,
        seo_meta_description: formRef.current.seo_meta_description || null,
        faq: formRef.current.faq.filter((f) => f.question.trim()),
        status: mode === "publish" ? "published" : mode === "schedule" ? "scheduled" : "draft",
        publish_at,
      };
    },
    [editor, publishAt],
  );

  const save = async (mode: "draft" | "schedule" | "publish") => {
    if (saving) return;
    if (mode !== "draft" && !formRef.current.cover_image_alt.trim()) {
      toast.error("O texto alternativo é obrigatório para publicar.");
      return;
    }
    setSaving(true);
    try {
      let targetId = postIdRef.current;
      if (!targetId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const created = await createPost({
          ...buildPayload(mode),
          author_id: user?.id ?? null,
        });
        targetId = created.id;
        setPostId(targetId);
        postIdRef.current = targetId;
        setForm((f) => ({ ...f, slug: created.slug }));
        existingSlugs.current.push(created.slug);
        navigate(`/admin/editor/${targetId}`, { replace: true });
      } else {
        await updatePost(targetId, buildPayload(mode));
      }
      dirtyRef.current = false;
      const now = new Date();
      setSavedAt(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      );
      if (mode === "publish") {
        setStatus("published");
        toast.success("Artigo publicado!");
      } else if (mode === "schedule") {
        setStatus("scheduled");
        toast.success("Publicação agendada!");
      } else {
        setStatus("draft");
        toast.success("Rascunho salvo.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  // Autosave: every 4s, if dirty, save as draft
  useEffect(() => {
    const interval = setInterval(() => {
      if (dirtyRef.current && editor && !saving) {
        save("draft");
      }
    }, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await compressToWebP(file);
      const url = await uploadImage(dataUrl, "covers");
      setForm((f) => ({ ...f, cover_image_url: url }));
      dirtyRef.current = true;
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Falha no upload da imagem.");
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const handleInlineImage = async () => {
    if (!inlineFile || !editor) return;
    setUploading(true);
    try {
      const dataUrl = await compressToWebP(inlineFile, 1200);
      const url = await uploadImage(dataUrl, "inline");
      editor
        .chain()
        .focus()
        .setImage({ src: url, alt: inlineAlt.trim() || "Imagem do artigo" })
        .run();
      setImageDialog(false);
      setInlineFile(null);
      setInlineAlt("");
      toast.success("Imagem inserida!");
    } catch {
      toast.error("Falha no upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Carregando...</div>;
  }

  const toolbar = editor
    ? [
        {
          icon: Undo2,
          action: () => editor.chain().focus().undo().run(),
          disabled: !editor.can().undo(),
        },
        {
          icon: Redo2,
          action: () => editor.chain().focus().redo().run(),
          disabled: !editor.can().redo(),
        },
        {
          icon: Heading2,
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive("heading", { level: 2 }),
        },
        {
          icon: Heading3,
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active: editor.isActive("heading", { level: 3 }),
        },
        {
          icon: Bold,
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive("bold"),
        },
        {
          icon: Italic,
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive("italic"),
        },
        {
          icon: List,
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: editor.isActive("bulletList"),
        },
        {
          icon: ListOrdered,
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: editor.isActive("orderedList"),
        },
        {
          icon: Quote,
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: editor.isActive("blockquote"),
        },
        {
          icon: Link2,
          action: () => {
            const prev = editor.getAttributes("link").href as string | undefined;
            const href = window.prompt("Link (URL):", prev ?? "https://");
            if (href === null) return;
            if (!href) {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
            } else {
              editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
            }
          },
          active: editor.isActive("link"),
        },
        { icon: ImagePlus, action: () => setImageDialog(true), active: false },
      ]
    : [];

  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">
          {id ? "Editar artigo" : "Novo artigo"}
          {status !== "draft" && (
            <span className="ml-3 rounded-full bg-secondary px-3 py-1 align-middle text-xs font-bold capitalize text-secondary-foreground">
              {status}
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {savedAt && (
            <span>
              {"Salvo às"} {savedAt}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Title & slug */}
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder={"Título" + " *"}
          className="h-14 w-full rounded-2xl border border-input bg-background px-5 font-display text-xl font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder={"Subtítulo"}
            className={inputCls}
          />
          <div>
            <input
              value={form.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder={"Slug (URL)"}
              className={inputCls}
            />
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              /post/{form.slug || slugify(form.title) || "..."}
            </p>
          </div>
        </div>

        {/* Category + tags */}
        <div className="grid gap-4 sm:grid-cols-2">
          <select
            value={form.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            className={inputCls}
          >
            <option value="">{"Categoria"}...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            value={form.tags}
            onChange={(e) => set("tags", e.target.value)}
            placeholder={"Tags (separadas por vírgula)"}
            className={inputCls}
          />
        </div>

        {/* Cover */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="mb-3 text-sm font-bold">{"Imagem de capa"}</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            {form.cover_image_url ? (
              <img
                src={form.cover_image_url}
                alt={form.cover_image_alt || "capa"}
                className="aspect-video w-full rounded-xl object-cover sm:w-64"
              />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-xs text-muted-foreground sm:w-64">
                Sem imagem
              </div>
            )}
            <div className="flex flex-1 flex-col gap-3">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
                className="text-sm"
              />
              <button
                type="button"
                onClick={() => setCoverSearchOpen(true)}
                className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
              >
                <Search className="h-4 w-4" />
                Buscar foto gratuita
              </button>
              <input
                value={form.cover_image_alt}
                onChange={(e) => set("cover_image_alt", e.target.value)}
                placeholder={"Texto alternativo da capa (obrigatório)" + " *"}
                className={inputCls}
              />
              {uploading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
            {toolbar.map((btn, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={btn.action}
                disabled={btn.disabled}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors disabled:opacity-40",
                  btn.active
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-muted hover:text-foreground",
                )}
                aria-label={`toolbar-${i}`}
              >
                <btn.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          <div className="px-4 py-3">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{"Perguntas frequentes (FAQ)"}</p>
            <button
              type="button"
              onClick={() => set("faq", [...form.faq, { question: "", answer: "" }])}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              {"Adicionar pergunta"}
            </button>
          </div>
          {form.faq.map((item, i) => (
            <div key={i} className="mt-3 flex gap-2">
              <div className="flex-1 space-y-2">
                <input
                  value={item.question}
                  onChange={(e) =>
                    set(
                      "faq",
                      form.faq.map((f, j) => (j === i ? { ...f, question: e.target.value } : f)),
                    )
                  }
                  placeholder="Pergunta"
                  className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={item.answer}
                  onChange={(e) =>
                    set(
                      "faq",
                      form.faq.map((f, j) => (j === i ? { ...f, answer: e.target.value } : f)),
                    )
                  }
                  placeholder="Resposta"
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  set(
                    "faq",
                    form.faq.filter((_, j) => j !== i),
                  )
                }
                className="h-9 w-9 shrink-0 self-start rounded-lg text-muted-foreground hover:text-destructive"
                aria-label="Remover pergunta"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* SEO */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="mb-3 text-sm font-bold">SEO</p>
          <div className="space-y-3">
            <input
              value={form.seo_meta_title}
              onChange={(e) => set("seo_meta_title", e.target.value)}
              placeholder={"Meta título (SEO)"}
              className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"
            />
            <textarea
              value={form.seo_meta_description}
              onChange={(e) => set("seo_meta_description", e.target.value)}
              placeholder={"Meta descrição (SEO)"}
              rows={2}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              {"Deixe vazio para gerar a partir do título e subtítulo."}
            </p>
          </div>
        </div>

        {/* Publish controls */}
        <div className="sticky bottom-4 z-30 rounded-2xl border border-border bg-card/95 p-4 shadow-elegant backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            {isStaff && (
              <>
                <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                  <CalendarClock className="h-4 w-4" />
                  {"Data e hora de publicação"}
                </label>
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => save("schedule")}
                  disabled={saving || !publishAt}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary px-5 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  <CalendarClock className="h-4 w-4" />
                  {"Agendar publicação"}
                </button>
                <button
                  type="button"
                  onClick={() => save("publish")}
                  disabled={saving}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {"Publicar agora"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => save("draft")}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {"Salvar"}
            </button>
            {!isStaff && (
              <p className="text-xs text-muted-foreground">
                Você é autora: pode salvar rascunhos. Para publicar, a administração precisa
                aprovar.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Inline image dialog */}
      {imageDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setImageDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold">{"Inserir imagem"}</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setInlineFile(e.target.files?.[0] ?? null)}
              className="mt-4 w-full text-sm"
            />
            <button
              type="button"
              onClick={() => setInlineSearchOpen(true)}
              className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
            >
              <Search className="h-4 w-4" />
              Buscar foto gratuita
            </button>
            <input
              value={inlineAlt}
              onChange={(e) => setInlineAlt(e.target.value)}
              placeholder={"Texto alternativo da imagem" + " *"}
              className="mt-3 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setImageDialog(false)}
                className="h-10 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleInlineImage}
                disabled={!inlineFile || uploading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free image search dialogs */}
      <ImageSearchDialog
        title="Buscar foto para a capa"
        open={coverSearchOpen}
        onClose={() => setCoverSearchOpen(false)}
        onSelect={(url, alt) => {
          setForm((f) => ({ ...f, cover_image_url: url, cover_image_alt: alt }));
          dirtyRef.current = true;
          setCoverSearchOpen(false);
          toast.success("Imagem escolhida!");
        }}
      />
      <ImageSearchDialog
        title="Buscar foto para o artigo"
        open={inlineSearchOpen}
        onClose={() => setInlineSearchOpen(false)}
        onSelect={(url, alt) => {
          editor?.chain().focus().setImage({ src: url, alt }).run();
          setInlineSearchOpen(false);
          setImageDialog(false);
          setInlineFile(null);
          setInlineAlt("");
          toast.success("Imagem inserida!");
        }}
      />
    </div>
  );
}
