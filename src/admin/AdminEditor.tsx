import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
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
  AlertTriangle,
  Bold,
  BookOpen,
  CalendarClock,
  CheckSquare,
  ExternalLink,
  Eye,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Plus,
  Quote,
  Redo2,
  Save,
  Search,
  Send,
  Table as TableIcon,
  TrafficCone,
  Trash2,
  Undo2,
} from "lucide-react";
import type { TipTapNode } from "@/lib/content";
import { jsonToPlainText } from "@/lib/content";
import { compressToWebP } from "@/lib/image";
import { slugify, slugifyUnique } from "@/lib/slugify";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSeo } from "@/lib/seo";
import { ImageSearchDialog } from "./ImageSearchDialog";
import {
  fetchAdminCategories,
  fetchAdminPostById,
  fetchAllPostSlugs,
  fetchPublishedPostIndex,
  uploadCoverDataUrl,
  upsertAdminPost,
  type AdminCategory,
  type AdminFaqItem,
  type AdminPostInput,
  type AdminPostStatus,
  type AdminQuizItem,
  type PostKind,
} from "./admin-db";
import { CHECKLIST_ULTIMO_ITEM, SEMAFORO, validatePadraoA, type PadraoAResult } from "./padrao-a";

interface FormState {
  title: string;
  subtitle: string;
  slug: string;
  category_id: string;
  kind: PostKind;
  excerpt: string;
  cover_image_url: string;
  cover_image_alt: string;
  seo_title: string;
  seo_description: string;
  review_json: string;
  comparison_json: string;
  product_category: string;
  product_subcategory: string;
  product_score: string;
  faq: AdminFaqItem[];
  quiz: AdminQuizItem[];
}

const EMPTY_FORM: FormState = {
  title: "",
  subtitle: "",
  slug: "",
  category_id: "",
  kind: "artigo",
  excerpt: "",
  cover_image_url: "",
  cover_image_alt: "",
  seo_title: "",
  seo_description: "",
  review_json: "",
  comparison_json: "",
  product_category: "",
  product_subcategory: "",
  product_score: "",
  faq: [],
  quiz: [],
};

const KIND_LABEL: Record<PostKind, string> = {
  artigo: "Artigo (Padrão A do Pai)",
  noticia: "Notícia",
  review: "Pai Indica · review (1 produto)",
  comparativo: "Pai Indica · comparativo",
  lista: "Pai Indica · lista",
};

type PostIndexItem = { slug: string; title: string; kind: PostKind };

function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseJsonField(label: string, raw: string): Record<string, unknown> | null {
  if (!raw.trim()) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new Error("precisa ser um objeto JSON");
    return value as Record<string, unknown>;
  } catch (err) {
    throw new Error(`${label}: JSON inválido (${err instanceof Error ? err.message : "erro"})`);
  }
}

const internalLinkMark = (href: string) => ({
  type: "link",
  attrs: { href, class: null, rel: null, target: null },
});

/** Parágrafo "Continue lendo: A, B, C e D." no formato do Padrão A. */
function buildContinueLendo(posts: PostIndexItem[]): TipTapNode {
  const content: TipTapNode[] = [{ type: "text", text: "Continue lendo: " }];
  posts.forEach((p, i) => {
    content.push({
      type: "text",
      text: p.title,
      marks: [internalLinkMark(`/post/${p.slug}`)],
    } as TipTapNode);
    if (i < posts.length - 2) content.push({ type: "text", text: ", " });
    else if (i === posts.length - 2) content.push({ type: "text", text: " e " });
  });
  content.push({ type: "text", text: "." });
  return { type: "paragraph", content };
}

export default function AdminEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [postIndex, setPostIndex] = useState<PostIndexItem[]>([]);
  const [status, setStatus] = useState<AdminPostStatus>("draft");
  const [publishAt, setPublishAt] = useState("");
  const [postId, setPostId] = useState<string | null>(id ?? null);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageDialog, setImageDialog] = useState(false);
  const [inlineAlt, setInlineAlt] = useState("");
  const [inlineFile, setInlineFile] = useState<File | null>(null);
  const [coverSearchOpen, setCoverSearchOpen] = useState(false);
  const [inlineSearchOpen, setInlineSearchOpen] = useState(false);
  const [linkDialog, setLinkDialog] = useState<null | "link" | "continue">(null);
  const [validation, setValidation] = useState<PadraoAResult | null>(null);

  const existingSlugs = useRef<string[]>([]);
  const formRef = useRef(form);
  formRef.current = form;
  const dirtyRef = useRef(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useSeo({ title: "Editor", noindex: true });

  useEffect(() => {
    fetchAdminCategories()
      .then(setCategories)
      .catch(() => toast.error("Não foi possível carregar as categorias."));
    fetchAllPostSlugs()
      .then((s) => (existingSlugs.current = s))
      .catch(() => {});
    fetchPublishedPostIndex()
      .then(setPostIndex)
      .catch(() => {});
  }, []);

  // Aviso ao sair com alterações não salvas (sem autosave: um autosave em
  // rascunho despublicaria um artigo publicado sem querer).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const editor = useEditor({
    extensions: [
      // O StarterKit v3 já inclui o Link. Atributos nulos por padrão para o
      // link interno sair no formato do Padrão A ({href, class, rel, target}).
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: false,
          HTMLAttributes: { target: null, rel: null, class: null },
        },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: "Abertura: 1-2 parágrafos com a dor do pai e o que o artigo resolve…",
      }),
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
      TaskItem.configure({ nested: false }),
    ],
    content: { type: "doc", content: [] },
    immediatelyRender: false,
    onUpdate: () => {
      dirtyRef.current = true;
    },
  });

  // Carrega o post existente
  useEffect(() => {
    if (!id || !editor) return;
    let mounted = true;
    fetchAdminPostById(id)
      .then((post) => {
        if (!post || !mounted) {
          if (!post) toast.error("Artigo não encontrado.");
          return;
        }
        setPostId(post.id);
        setStatus(post.status);
        setPublishAt(toLocalInput(post.publish_at));
        setForm({
          title: post.title,
          subtitle: post.subtitle ?? "",
          slug: post.slug,
          category_id: post.category_id ?? "",
          kind: post.kind ?? "artigo",
          excerpt: post.excerpt ?? "",
          cover_image_url: post.cover_image_url ?? "",
          cover_image_alt: post.cover_image_alt ?? "",
          seo_title: post.seo_title ?? "",
          seo_description: post.seo_description ?? "",
          review_json: post.review ? JSON.stringify(post.review, null, 2) : "",
          comparison_json: post.comparison ? JSON.stringify(post.comparison, null, 2) : "",
          product_category: post.product_category ?? "",
          product_subcategory: post.product_subcategory ?? "",
          product_score: post.product_score != null ? String(post.product_score) : "",
          faq: Array.isArray(post.faq) ? post.faq : [],
          quiz: Array.isArray(post.quiz) ? post.quiz : [],
        });
        editor.commands.setContent(post.body as never);
        dirtyRef.current = false;
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao carregar."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [id, editor]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      dirtyRef.current = true;
      if (key === "title" && !f.slug) next.slug = slugify(value as string);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const parents = categories.filter((c) => !c.parent_id);
    return parents.map((p) => ({
      parent: p,
      children: categories.filter((c) => c.parent_id === p.id),
    }));
  }, [categories]);

  const isPaiIndica =
    form.kind === "review" || form.kind === "comparativo" || form.kind === "lista";

  /* ---------------- Montagem do payload e salvamento ---------------- */

  const buildPayload = useCallback(
    async (mode: "draft" | "schedule" | "publish"): Promise<AdminPostInput> => {
      const f = formRef.current;
      const body = (editor?.getJSON() ?? { type: "doc", content: [] }) as TipTapNode;
      const title = f.title.trim();
      if (!title) throw new Error("Informe o título.");
      const slug = f.slug.trim() || slugifyUnique(title, existingSlugs.current);
      const review = f.kind === "review" ? parseJsonField("review", f.review_json) : null;
      const comparison =
        f.kind === "comparativo" || f.kind === "lista"
          ? parseJsonField("comparison", f.comparison_json)
          : null;
      if (f.kind === "review" && !review) throw new Error("Review exige o JSON `review`.");
      if ((f.kind === "comparativo" || f.kind === "lista") && !comparison)
        throw new Error("Comparativo/lista exige o JSON `comparison`.");
      const score = f.product_score.trim() ? Number(f.product_score.replace(",", ".")) : null;
      if (score != null && (Number.isNaN(score) || score < 0 || score > 10))
        throw new Error("product_score deve ficar entre 0 e 10.");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const excerpt =
        f.excerpt.trim() || jsonToPlainText(body).slice(0, 157).trimEnd() || f.subtitle || title;

      let publish_at: string | null = publishAt ? new Date(publishAt).toISOString() : null;
      if (mode === "publish" && (!publish_at || new Date(publish_at) > new Date()))
        publish_at = new Date().toISOString();
      if (mode === "schedule" && !publish_at)
        throw new Error("Escolha a data e hora para agendar.");

      return {
        id: postId ?? undefined,
        slug,
        title,
        subtitle: f.subtitle.trim() || null,
        excerpt: excerpt.slice(0, 160),
        body,
        cover_image_url: f.cover_image_url.trim() || null,
        cover_image_alt: f.cover_image_alt.trim() || null,
        category_id: f.category_id || null,
        author_id: user?.id ?? null,
        kind: f.kind,
        review,
        comparison,
        product_category: isPaiIndica ? f.product_category.trim() || null : null,
        product_subcategory: isPaiIndica ? f.product_subcategory.trim() || null : null,
        product_score: isPaiIndica ? (score != null ? Math.round(score * 10) / 10 : null) : null,
        faq: f.faq.filter((x) => x.question.trim() && x.answer.trim()),
        quiz: f.quiz.filter((q) => q.question.trim()),
        status:
          mode === "publish"
            ? "published"
            : mode === "schedule"
              ? "scheduled"
              : status === "published" && mode === "draft"
                ? "draft"
                : "draft",
        publish_at,
        seo_title: f.seo_title.trim() || null,
        seo_description: f.seo_description.trim() || null,
      };
    },
    [editor, publishAt, postId, status, isPaiIndica],
  );

  const save = async (mode: "draft" | "schedule" | "publish") => {
    if (saving) return;
    if (mode !== "draft" && !formRef.current.cover_image_alt.trim()) {
      toast.error("O texto alternativo da capa é obrigatório para publicar.");
      return;
    }
    if (
      mode === "draft" &&
      status === "published" &&
      !confirm("Este artigo está publicado. Salvar como rascunho vai tirá-lo do ar. Continuar?")
    )
      return;
    setSaving(true);
    try {
      const payload = await buildPayload(mode);
      const saved = await upsertAdminPost(payload);
      const isNew = !postId;
      setPostId(saved.id);
      setForm((f) => ({ ...f, slug: saved.slug }));
      if (!existingSlugs.current.includes(saved.slug)) existingSlugs.current.push(saved.slug);
      setStatus(saved.status);
      setPublishAt(toLocalInput(saved.publish_at));
      dirtyRef.current = false;
      const now = new Date();
      setSavedAt(
        `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      );
      if (mode === "publish") toast.success("Artigo publicado!");
      else if (mode === "schedule") toast.success("Publicação agendada!");
      else toast.success("Rascunho salvo.");
      if (isNew) navigate(`/admin/editor/${saved.id}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- Validar Padrão A ---------------- */

  const runValidation = () => {
    const f = formRef.current;
    const result = validatePadraoA({
      kind: f.kind,
      title: f.title,
      slug: f.slug || slugify(f.title),
      subtitle: f.subtitle,
      excerpt: f.excerpt,
      seo_title: f.seo_title,
      seo_description: f.seo_description,
      cover_image_url: f.cover_image_url,
      cover_image_alt: f.cover_image_alt,
      category_id: f.category_id,
      body: (editor?.getJSON() ?? null) as TipTapNode | null,
      faq: f.faq,
      quiz: f.quiz,
      knownSlugs: postIndex.map((p) => p.slug),
    });
    setValidation(result);
    if (result.errors.length === 0) toast.success("Padrão A do Pai: tudo certo.");
    else toast.error(`${result.errors.length} ponto(s) a corrigir.`);
  };

  /* ---------------- Imagens ---------------- */

  const handleCoverUpload = async (file: File) => {
    setUploading(true);
    try {
      const dataUrl = await compressToWebP(file);
      const url = await uploadCoverDataUrl(dataUrl, formRef.current.slug || "capa");
      setForm((f) => ({ ...f, cover_image_url: url }));
      dirtyRef.current = true;
      toast.success("Capa enviada para o bucket covers.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload da capa.");
    } finally {
      setUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const insertInlineImage = (src: string, alt: string) => {
    if (!editor) return;
    const base = (u: string) => u.split("?")[0];
    if (formRef.current.cover_image_url && base(src) === base(formRef.current.cover_image_url)) {
      toast.error("Essa é a capa: a foto do corpo precisa ser outra.");
      return;
    }
    editor
      .chain()
      .focus()
      .setImage({ src, alt: alt.trim() || "Imagem do artigo" })
      .run();
    setImageDialog(false);
    setInlineSearchOpen(false);
    setInlineFile(null);
    setInlineAlt("");
    toast.success("Imagem inserida!");
  };

  const handleInlineImage = async () => {
    if (!inlineFile) return;
    setUploading(true);
    try {
      const dataUrl = await compressToWebP(inlineFile, 1200);
      const url = await uploadCoverDataUrl(dataUrl, `${formRef.current.slug || "artigo"}-corpo`);
      insertInlineImage(url, inlineAlt);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload da imagem.");
    } finally {
      setUploading(false);
    }
  };

  /* ---------------- Blocos do Padrão A ---------------- */

  const insertSemaforo = (ed: Editor) => {
    ed.chain()
      .focus()
      .insertContent([
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Semáforo do pai: " }],
        },
        ...SEMAFORO.map(([tone, prefix]) => ({
          type: "callout",
          attrs: { tone },
          content: [{ type: "paragraph", content: [{ type: "text", text: prefix }] }],
        })),
        { type: "paragraph" },
      ])
      .run();
  };

  const insertChecklist = (ed: Editor) => {
    const item = (text: string) => ({
      type: "taskItem",
      attrs: { checked: false },
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    });
    ed.chain()
      .focus()
      .insertContent([
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Checklist do pai: " }],
        },
        {
          type: "taskList",
          content: [
            item("Item 1"),
            item("Item 2"),
            item("Item 3"),
            item("Item 4"),
            item(CHECKLIST_ULTIMO_ITEM),
          ],
        },
        { type: "paragraph" },
      ])
      .run();
  };

  const insertTable = (ed: Editor) => {
    ed.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const setExternalLink = (ed: Editor) => {
    const prev = ed.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link externo (URL):", prev ?? "https://");
    if (href === null) return;
    if (!href) {
      ed.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    const isInternal = href.startsWith("/");
    ed.chain()
      .focus()
      .extendMarkRange("link")
      .setLink(
        isInternal
          ? { href }
          : {
              href,
              target: "_blank",
              rel: /amazon\./.test(href) ? "sponsored nofollow noopener" : "noopener noreferrer",
            },
      )
      .run();
  };

  const pickInternalLink = (p: PostIndexItem) => {
    if (!editor) return;
    const href = `/post/${p.slug}`;
    const { from, to } = editor.state.selection;
    if (from === to) {
      editor
        .chain()
        .focus()
        .insertContent({ type: "text", text: p.title, marks: [internalLinkMark(href)] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkDialog(null);
  };

  const insertContinueLendo = (posts: PostIndexItem[]) => {
    if (!editor) return;
    editor.chain().focus("end").insertContent(buildContinueLendo(posts)).run();
    setLinkDialog(null);
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Carregando…</div>;
  }

  type ToolbarButton = {
    icon: typeof Bold;
    label: string;
    action: () => void;
    active?: boolean;
    disabled?: boolean;
    highlight?: boolean;
  };

  const toolbar: ToolbarButton[] = editor
    ? [
        { icon: Undo2, label: "Desfazer", action: () => editor.chain().focus().undo().run() },
        { icon: Redo2, label: "Refazer", action: () => editor.chain().focus().redo().run() },
        {
          icon: Heading2,
          label: "Título de seção (H2)",
          action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active: editor.isActive("heading", { level: 2 }),
        },
        {
          icon: Heading3,
          label: "Subtítulo (H3)",
          action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          active: editor.isActive("heading", { level: 3 }),
        },
        {
          icon: Bold,
          label: "Negrito",
          action: () => editor.chain().focus().toggleBold().run(),
          active: editor.isActive("bold"),
        },
        {
          icon: Italic,
          label: "Itálico",
          action: () => editor.chain().focus().toggleItalic().run(),
          active: editor.isActive("italic"),
        },
        {
          icon: List,
          label: "Lista",
          action: () => editor.chain().focus().toggleBulletList().run(),
          active: editor.isActive("bulletList"),
        },
        {
          icon: ListOrdered,
          label: "Lista numerada (passo a passo)",
          action: () => editor.chain().focus().toggleOrderedList().run(),
          active: editor.isActive("orderedList"),
        },
        {
          icon: Quote,
          label: "Citação",
          action: () => editor.chain().focus().toggleBlockquote().run(),
          active: editor.isActive("blockquote"),
        },
        {
          icon: ExternalLink,
          label: "Link externo (URL)",
          action: () => setExternalLink(editor),
          active: editor.isActive("link"),
        },
        {
          icon: Link2,
          label: "Link interno (buscar artigo)",
          action: () => setLinkDialog("link"),
          highlight: true,
        },
        { icon: ImagePlus, label: "Imagem no corpo", action: () => setImageDialog(true) },
        {
          icon: TrafficCone,
          label: "Semáforo do Pai (3 sinais)",
          action: () => insertSemaforo(editor),
          highlight: true,
        },
        {
          icon: TableIcon,
          label: "Tabela",
          action: () => insertTable(editor),
          highlight: true,
        },
        {
          icon: CheckSquare,
          label: "Checklist do pai",
          action: () => insertChecklist(editor),
          highlight: true,
        },
        {
          icon: BookOpen,
          label: "Continue lendo (fechamento)",
          action: () => setLinkDialog("continue"),
          highlight: true,
        },
      ]
    : [];

  const inputCls =
    "h-12 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30";
  const smallInputCls =
    "h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary";
  const counter = (len: number, max: number, min = 0) => (
    <span
      className={cn(
        "text-[11px]",
        len > max || (min > 0 && len > 0 && len < min)
          ? "font-bold text-destructive"
          : "text-muted-foreground",
      )}
    >
      {len}/{max}
      {min > 0 ? ` (mín. ${min})` : ""}
    </span>
  );

  const previewHref = form.slug
    ? `/post/${form.slug}${status === "published" ? "" : "?preview=1"}`
    : null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">
          {id ? "Editar artigo" : "Novo artigo"}
          <span
            className={cn(
              "ml-3 rounded-full px-3 py-1 align-middle text-xs font-bold",
              status === "published"
                ? "bg-primary/15 text-primary"
                : status === "scheduled"
                  ? "bg-accent/20 text-accent-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {status === "published"
              ? "Publicado"
              : status === "scheduled"
                ? "Agendado"
                : status === "archived"
                  ? "Arquivado"
                  : "Rascunho"}
          </span>
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {savedAt && <span>Salvo às {savedAt}</span>}
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Título, subtítulo, slug */}
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Título (frase ou pergunta) *"
          className="h-14 w-full rounded-2xl border border-input bg-background px-5 font-display text-xl font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <input
              value={form.subtitle}
              onChange={(e) => set("subtitle", e.target.value)}
              placeholder="Subtítulo (50 a 220 caracteres)"
              className={inputCls}
            />
            <div className="mt-1 text-right">{counter(form.subtitle.length, 220, 50)}</div>
          </div>
          <div>
            <input
              value={form.slug}
              onChange={(e) => set("slug", slugify(e.target.value))}
              placeholder="Slug (URL)"
              className={inputCls}
            />
            <p className="mt-1 truncate text-[11px] text-muted-foreground">
              /post/{form.slug || slugify(form.title) || "…"}
            </p>
          </div>
        </div>

        {/* Categoria e tipo */}
        <div className="grid gap-4 sm:grid-cols-2">
          <select
            value={form.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            className={inputCls}
          >
            <option value="">Categoria…</option>
            {grouped.map(({ parent, children }) => (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.id}>{parent.name} (categoria-mãe)</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    — {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <select
            value={form.kind}
            onChange={(e) => set("kind", e.target.value as PostKind)}
            className={inputCls}
          >
            {(Object.keys(KIND_LABEL) as PostKind[]).map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>

        {/* Pai Indica: campos JSON (a Fase 2 traz o formulário completo) */}
        {isPaiIndica && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <p className="text-sm font-bold">Pai Indica — dados do review</p>
            <p className="text-xs text-muted-foreground">
              Preencha `product_category`, `product_subcategory` e `product_score` (0-10, uma casa)
              e o JSON de{" "}
              {form.kind === "review" ? "`review` (doc 02 §5.3)" : "`comparison` (doc 02 §5.4)"}.
              Chaves só em inglês; nunca "R$" em campo algum. O formulário guiado chega na Fase 2.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                value={form.product_category}
                onChange={(e) => set("product_category", e.target.value)}
                placeholder="product_category (slug)"
                className={smallInputCls}
              />
              <input
                value={form.product_subcategory}
                onChange={(e) => set("product_subcategory", e.target.value)}
                placeholder="product_subcategory (slug)"
                className={smallInputCls}
              />
              <input
                value={form.product_score}
                onChange={(e) => set("product_score", e.target.value)}
                placeholder="product_score (ex.: 8,4)"
                inputMode="decimal"
                className={smallInputCls}
              />
            </div>
            {form.kind === "review" ? (
              <textarea
                value={form.review_json}
                onChange={(e) => set("review_json", e.target.value)}
                rows={10}
                spellCheck={false}
                placeholder='{"product_slug": "...", "score": 8.4, "criteria": [...], "pros": [...], "cons": [...], "ideal_for": "...", "not_ideal_for": "...", "verdict": "...", "how_we_evaluated": "...", "sources": [...], "other_buyers": {}}'
                className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-xs outline-none focus:border-primary"
              />
            ) : (
              <textarea
                value={form.comparison_json}
                onChange={(e) => set("comparison_json", e.target.value)}
                rows={10}
                spellCheck={false}
                placeholder='{"criteria": [...], "products": [...], "table": {"columns": [...], "rows": [...]}, "winner_slug": "...", "verdict_by_profile": [...], "how_we_evaluated": "..."}'
                className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-xs outline-none focus:border-primary"
              />
            )}
          </div>
        )}

        {/* Capa */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="mb-1 text-sm font-bold">Imagem de capa</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Linha editorial: pai com filhos, casal homem-mulher, família, trabalho, natureza,
            igreja. Upload vai para o bucket <code>covers</code>; a busca grava a URL da própria
            fonte.
          </p>
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
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCoverSearchOpen(true)}
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
                >
                  <Search className="h-4 w-4" />
                  Buscar foto gratuita
                </button>
                {uploading && <Loader2 className="h-5 w-5 self-center animate-spin text-primary" />}
              </div>
              <input
                value={form.cover_image_url}
                onChange={(e) => set("cover_image_url", e.target.value)}
                placeholder="URL da capa (CDN da fonte ou bucket covers)"
                className={smallInputCls}
              />
              <input
                value={form.cover_image_alt}
                onChange={(e) => set("cover_image_alt", e.target.value)}
                placeholder="Texto alternativo da capa em PT-BR (obrigatório) *"
                className={smallInputCls}
              />
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
            {toolbar.map((btn) => (
              <button
                key={btn.label}
                type="button"
                title={btn.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={btn.action}
                disabled={btn.disabled}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:opacity-40",
                  btn.active
                    ? "bg-secondary text-secondary-foreground"
                    : btn.highlight
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                aria-label={btn.label}
              >
                <btn.icon className="h-4 w-4" />
              </button>
            ))}
            <span className="mx-1 h-6 w-px bg-border" />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={runValidation}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition-colors hover:bg-primary/15"
            >
              <ListChecks className="h-4 w-4" />
              Validar Padrão A
            </button>
          </div>
          <div className="prose prose-sm max-w-none px-4 py-3 [&_.ProseMirror]:min-h-[420px] [&_.ProseMirror]:outline-none">
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Resultado da validação */}
        {validation && (
          <div
            className={cn(
              "rounded-2xl border p-5 shadow-soft",
              validation.errors.length
                ? "border-destructive/30 bg-destructive/5"
                : "border-primary/30 bg-primary/5",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold">
                {validation.errors.length
                  ? `Padrão A do Pai: ${validation.errors.length} ponto(s) a corrigir`
                  : "Padrão A do Pai: tudo certo"}
              </p>
              <p className="text-xs text-muted-foreground">
                {validation.words} palavras · {validation.links} links internos ·{" "}
                {validation.distinct} destinos
              </p>
            </div>
            {validation.errors.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {validation.errors.map((msg, i) => (
                  <li key={i} className="flex gap-2 text-destructive">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{msg}</span>
                  </li>
                ))}
              </ul>
            )}
            {validation.warnings.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {validation.warnings.map((msg, i) => (
                  <li key={i}>Aviso: {msg}</li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] text-muted-foreground">
              A validação completa (slugs no banco, termos proibidos, imagens) é a de{" "}
              <code>scripts/validate-content.mjs</code>.
            </p>
          </div>
        )}

        {/* Resumo e SEO */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <p className="mb-3 text-sm font-bold">Resumo e SEO</p>
          <div className="space-y-3">
            <div>
              <textarea
                value={form.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Excerpt (até 160 caracteres; vazio = início do texto)"
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <div className="text-right">{counter(form.excerpt.length, 160)}</div>
            </div>
            <div>
              <input
                value={form.seo_title}
                onChange={(e) => set("seo_title", e.target.value)}
                placeholder="seo_title (até 60 caracteres; vazio = título)"
                className={smallInputCls}
              />
              <div className="text-right">{counter(form.seo_title.length, 60)}</div>
            </div>
            <div>
              <textarea
                value={form.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
                placeholder="seo_description (120 a 155 caracteres)"
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <div className="text-right">{counter(form.seo_description.length, 155, 120)}</div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Perguntas frequentes (FAQ)</p>
              <p className="text-xs text-muted-foreground">3 a 6 itens; FAQ e/ou quiz.</p>
            </div>
            <button
              type="button"
              onClick={() => set("faq", [...form.faq, { question: "", answer: "" }])}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar pergunta
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
                  className={smallInputCls}
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

        {/* Quiz */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">Quiz do pai</p>
              <p className="text-xs text-muted-foreground">
                3 a 5 perguntas; opções uma por linha; marque a correta e explique.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                set("quiz", [
                  ...form.quiz,
                  { question: "", options: ["", ""], correct: 0, explanation: "" },
                ])
              }
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Adicionar pergunta
            </button>
          </div>
          {form.quiz.map((q, i) => {
            const update = (patch: Partial<AdminQuizItem>) =>
              set(
                "quiz",
                form.quiz.map((x, j) => (j === i ? { ...x, ...patch } : x)),
              );
            return (
              <div key={i} className="mt-3 flex gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    value={q.question}
                    onChange={(e) => update({ question: e.target.value })}
                    placeholder="Pergunta"
                    className={smallInputCls}
                  />
                  <textarea
                    value={q.options.join("\n")}
                    onChange={(e) => {
                      const options = e.target.value.split("\n");
                      update({
                        options,
                        correct: Math.min(q.correct, Math.max(0, options.length - 1)),
                      });
                    }}
                    placeholder={"Opção 1\nOpção 2\nOpção 3"}
                    rows={3}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
                    <select
                      value={q.correct}
                      onChange={(e) => update({ correct: Number(e.target.value) })}
                      className="h-11 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                    >
                      {q.options.map((o, k) => (
                        <option key={k} value={k}>
                          Correta: {k + 1}
                          {o.trim() ? ` — ${o.trim().slice(0, 30)}` : ""}
                        </option>
                      ))}
                    </select>
                    <input
                      value={q.explanation}
                      onChange={(e) => update({ explanation: e.target.value })}
                      placeholder="Explicação da resposta"
                      className={smallInputCls}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "quiz",
                      form.quiz.filter((_, j) => j !== i),
                    )
                  }
                  className="h-9 w-9 shrink-0 self-start rounded-lg text-muted-foreground hover:text-destructive"
                  aria-label="Remover pergunta do quiz"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Publicação */}
        <div className="sticky bottom-4 z-30 rounded-2xl border border-border bg-card/95 p-4 shadow-elegant backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
              <CalendarClock className="h-4 w-4" />
              Publicação
            </label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => {
                setPublishAt(e.target.value);
                dirtyRef.current = true;
              }}
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => save("schedule")}
              disabled={saving || !publishAt}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-primary px-4 text-sm font-bold text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
            >
              <CalendarClock className="h-4 w-4" />
              Agendar
            </button>
            <button
              type="button"
              onClick={() => save("publish")}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {status === "published" ? "Republicar" : "Publicar agora"}
            </button>
            <button
              type="button"
              onClick={() => save("draft")}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Salvar rascunho
            </button>
            {previewHref && postId && (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              >
                <Eye className="h-4 w-4" />
                Pré-visualizar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Imagem no corpo */}
      {imageDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setImageDialog(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold">Inserir imagem no corpo</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Nunca a capa; foto nova, coerente com a seção e com a linha editorial.
            </p>
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
              placeholder="Texto alternativo da imagem em PT-BR *"
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
                disabled={!inlineFile || uploading || !inlineAlt.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                Inserir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Busca de fotos */}
      <ImageSearchDialog
        title="Buscar foto para a capa"
        open={coverSearchOpen}
        onClose={() => setCoverSearchOpen(false)}
        onSelect={(url, alt) => {
          setForm((f) => ({ ...f, cover_image_url: url, cover_image_alt: alt }));
          dirtyRef.current = true;
          setCoverSearchOpen(false);
          toast.success("Capa escolhida. Revise o texto alternativo em PT-BR.");
        }}
      />
      <ImageSearchDialog
        title="Buscar foto para o corpo do artigo"
        open={inlineSearchOpen}
        onClose={() => setInlineSearchOpen(false)}
        onSelect={(url, alt) => insertInlineImage(url, inlineAlt || alt)}
      />

      {/* Link interno / Continue lendo */}
      {linkDialog && (
        <InternalLinkDialog
          mode={linkDialog}
          posts={postIndex.filter((p) => p.slug !== form.slug)}
          onClose={() => setLinkDialog(null)}
          onPick={pickInternalLink}
          onInsertContinue={insertContinueLendo}
        />
      )}
    </div>
  );
}

/* ---------------- Diálogo de link interno ---------------- */

function InternalLinkDialog({
  mode,
  posts,
  onClose,
  onPick,
  onInsertContinue,
}: {
  mode: "link" | "continue";
  posts: PostIndexItem[];
  onClose: () => void;
  onPick: (p: PostIndexItem) => void;
  onInsertContinue: (ps: PostIndexItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const q = query.trim().toLowerCase();
  const list = posts.filter((p) => !q || p.title.toLowerCase().includes(q) || p.slug.includes(q));
  const toggle = (slug: string) =>
    setPicked((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-2xl bg-card p-6 shadow-elegant"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold">
          {mode === "link" ? "Link interno" : "Continue lendo"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {mode === "link"
            ? "Só artigos publicados. Com texto selecionado, vira link; sem seleção, insere o título linkado."
            : "Escolha de 4 a 10 artigos; o parágrafo entra no fim do corpo com os títulos separados por vírgula e “e”."}
        </p>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título ou slug"
          className="mt-3 h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"
        />
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto">
          {list.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum artigo publicado encontrado.
            </p>
          )}
          {list.slice(0, 80).map((p) =>
            mode === "link" ? (
              <button
                key={p.slug}
                type="button"
                onClick={() => onPick(p)}
                className="flex w-full flex-col items-start rounded-xl px-3 py-2 text-left hover:bg-muted"
              >
                <span className="text-sm font-semibold">{p.title}</span>
                <span className="text-[11px] text-muted-foreground">/post/{p.slug}</span>
              </button>
            ) : (
              <label
                key={p.slug}
                className="flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(p.slug)}
                  onChange={() => toggle(p.slug)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold">{p.title}</span>
                  <span className="text-[11px] text-muted-foreground">/post/{p.slug}</span>
                </span>
              </label>
            ),
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {mode === "continue" ? `${picked.length} escolhido(s)` : `${posts.length} publicados`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-10 rounded-xl border border-border px-4 text-sm font-bold text-muted-foreground"
            >
              Cancelar
            </button>
            {mode === "continue" && (
              <button
                disabled={picked.length < 4 || picked.length > 10}
                onClick={() =>
                  onInsertContinue(picked.map((s) => posts.find((p) => p.slug === s)!))
                }
                className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                Inserir parágrafo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
