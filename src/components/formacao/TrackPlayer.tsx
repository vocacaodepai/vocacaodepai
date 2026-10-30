import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, ExternalLink, Lock, Loader2 } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { tiptapToHtml } from "@/lib/tiptap-html";
import type { TipTapNode } from "@/lib/content";
import {
  STEP_TYPE_LABEL,
  type TrackProgressRow,
  type TrackRow,
  type TrackStepRow,
} from "@/lib/formacao/types";
import { cn } from "@/lib/utils";

interface Props {
  track: TrackRow;
  steps: TrackStepRow[];
  progress: TrackProgressRow[];
  loggedIn: boolean;
  busy: boolean;
  onComplete: (stepId: string, note?: string) => Promise<void>;
}

function embedUrl(url: string): string | null {
  const yt = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/.exec(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = /vimeo\.com\/(\d+)/.exec(url);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?dnt=1`;
  return null;
}

/** Conteúdo do passo por tipo (doc 09 §5.1) + botão conforme completion_rule. */
function StepContent({
  step,
  done,
  note,
  locked,
  loggedIn,
  busy,
  onComplete,
  onNext,
  hasNext,
}: {
  step: TrackStepRow;
  done: boolean;
  note: string | null;
  locked: boolean;
  loggedIn: boolean;
  busy: boolean;
  onComplete: (note?: string) => void;
  onNext: () => void;
  hasNext: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [text, setText] = useState(note ?? "");
  const body = step.body as unknown as TipTapNode;
  const checklistItems = useMemo(() => {
    const items: string[] = [];
    const walk = (n: TipTapNode) => {
      if (n.type === "taskItem")
        items.push(
          (n.content ?? [])
            .map((c) => (c.content ?? []).map((t) => t.text ?? "").join(""))
            .join(" "),
        );
      (n.content ?? []).forEach(walk);
    };
    walk(body);
    return items;
  }, [body]);
  const [checked, setChecked] = useState<boolean[]>([]);
  useEffect(() => {
    setText(note ?? "");
    setOpened(false);
    setSeconds(0);
    let saved: boolean[] = [];
    try {
      saved = note ? (JSON.parse(note) as boolean[]) : [];
    } catch {
      saved = [];
    }
    setChecked(checklistItems.map((_, i) => saved[i] ?? false));
  }, [step.id, note, checklistItems]);
  useEffect(() => {
    if (step.completion_rule !== "video" || !step.video_url) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [step.id, step.completion_rule, step.video_url]);

  const video = step.video_url ? embedUrl(step.video_url) : null;
  const rule = step.completion_rule === "video" && !video ? "manual" : step.completion_rule;
  const canComplete =
    rule === "manual"
      ? true
      : rule === "read_post"
        ? opened || !step.post
        : rule === "video"
          ? seconds >= 120
          : rule === "checklist_all"
            ? checklistItems.length > 0 && checked.every(Boolean)
            : text.trim().length >= 80;
  const html = useMemo(
    () => (step.type === "checklist" ? "" : tiptapToHtml(body)),
    [body, step.type],
  );

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
        {step.module ? `${step.module} · ` : ""}Passo {step.position} · {STEP_TYPE_LABEL[step.type]}
        {step.estimated_minutes ? ` · ${step.estimated_minutes} min` : ""}
      </p>
      <h2 className="mt-1 font-display text-2xl font-bold">{step.title}</h2>
      {locked ? (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" /> Conclua o passo anterior para abrir este.
        </p>
      ) : (
        <>
          {step.type === "artigo" && step.post && (
            <a
              href={`/post/${step.post.slug}`}
              target="_blank"
              rel="noopener"
              onClick={() => setOpened(true)}
              className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:border-primary"
            >
              {step.post.cover_image_url && (
                <img
                  src={step.post.cover_image_url}
                  alt=""
                  className="h-16 w-24 rounded-lg object-cover"
                />
              )}
              <span className="flex-1 text-sm font-bold">{step.post.title}</span>
              <ExternalLink className="h-4 w-4 text-primary" />
            </a>
          )}
          {video && (
            <div className="mt-4 aspect-video overflow-hidden rounded-xl">
              <iframe
                src={video}
                title={step.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {step.type === "checklist" ? (
            <div className="mt-4 space-y-2">
              {step.summary && <p className="text-sm text-muted-foreground">{step.summary}</p>}
              {checklistItems.map((item, i) => (
                <label
                  key={i}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checked[i] ?? false}
                    disabled={!loggedIn}
                    onChange={(e) =>
                      setChecked((c) => c.map((v, j) => (j === i ? e.target.checked : v)))
                    }
                    className="mt-0.5 h-4 w-4 accent-primary"
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          ) : (
            <div
              className="prose mt-4 max-w-none text-foreground/90"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
          {step.type === "exercicio" && (
            <label className="mt-4 block text-sm font-semibold">
              Sua resposta{" "}
              <span className="font-normal text-muted-foreground">
                (mínimo 80 caracteres; fica guardada no seu Caderno do Pai)
              </span>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 4000))}
                rows={8}
                disabled={!loggedIn}
                className="mt-1 w-full rounded-xl border border-border bg-background p-3 text-sm"
              />
            </label>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            {!loggedIn ? (
              <Link
                to={`/entrar?next=/formacao/${encodeURIComponent(step.track_id)}`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground"
              >
                <Lock className="h-4 w-4" /> Entre para marcar seu progresso
              </Link>
            ) : done && step.type !== "exercicio" && step.type !== "checklist" ? (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-success">
                <Check className="h-4 w-4" /> Passo concluído
              </span>
            ) : (
              <button
                type="button"
                disabled={busy || !canComplete}
                onClick={() =>
                  onComplete(
                    step.type === "checklist"
                      ? JSON.stringify(checked)
                      : step.type === "exercicio"
                        ? text
                        : undefined,
                  )
                }
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}{" "}
                {done ? "Salvar" : "Concluir passo"}
              </button>
            )}
            {rule === "read_post" && !opened && step.post && loggedIn && !done && (
              <span className="text-xs text-muted-foreground">
                Abra o artigo para liberar a conclusão.
              </span>
            )}
            {rule === "video" && video && seconds < 120 && !done && (
              <span className="text-xs text-muted-foreground">
                Libera após 2 minutos na página ou 60% do vídeo.
              </span>
            )}
            {hasNext && done && (
              <button
                type="button"
                onClick={onNext}
                className="ml-auto inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                Próximo passo <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Player da trilha (doc 09 §5.4 e §10.3): lista de módulos/passos à esquerda, conteúdo à direita; `?passo=N`. */
export function TrackPlayer({ track, steps, progress, loggedIn, busy, onComplete }: Props) {
  const doneIds = useMemo(() => new Set(progress.map((p) => p.step_id)), [progress]);
  const noteOf = (id: string) => progress.find((p) => p.step_id === id)?.note ?? null;
  const firstOpen = steps.findIndex((s) => !doneIds.has(s.id));
  const [current, setCurrent] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const n = Number(new URLSearchParams(window.location.search).get("passo"));
      if (n >= 1 && n <= steps.length) return n - 1;
    }
    return firstOpen === -1 ? Math.max(0, steps.length - 1) : firstOpen;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("passo", String(current + 1));
    window.history.replaceState(null, "", url.toString());
  }, [current]);
  const step = steps[current];
  if (!step) return null;
  const isLocked = (i: number) =>
    loggedIn &&
    i > 0 &&
    !doneIds.has(steps[i - 1]!.id) &&
    !doneIds.has(steps[i]!.id) &&
    i > firstOpen;
  const modules = steps.reduce<{ name: string; items: { s: TrackStepRow; i: number }[] }[]>(
    (acc, s, i) => {
      const name = s.module ?? "Passos";
      const last = acc[acc.length - 1];
      if (last && last.name === name) last.items.push({ s, i });
      else acc.push({ name, items: [{ s, i }] });
      return acc;
    },
    [],
  );

  return (
    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
      <nav
        aria-label="Passos da trilha"
        className="self-start rounded-2xl border border-border bg-card p-3 md:sticky md:top-24"
      >
        {modules.map((m) => (
          <div key={m.name} className="mb-3">
            <p className="px-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {m.name}
            </p>
            <ol className="mt-1 space-y-0.5">
              {m.items.map(({ s, i }) => {
                const d = doneIds.has(s.id);
                const l = isLocked(i);
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setCurrent(i)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
                        i === current ? "bg-primary/10 font-bold text-primary" : "hover:bg-muted",
                        l && "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                          d ? "border-success bg-success text-white" : "border-border",
                        )}
                      >
                        {d ? (
                          <Check className="h-3 w-3" />
                        ) : l ? (
                          <Lock className="h-2.5 w-2.5" />
                        ) : (
                          s.position
                        )}
                      </span>
                      <span className="line-clamp-2">{s.title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </nav>
      <StepContent
        key={step.id}
        step={{ ...step, track_id: track.slug }}
        done={doneIds.has(step.id)}
        note={noteOf(step.id)}
        locked={isLocked(current)}
        loggedIn={loggedIn}
        busy={busy}
        onComplete={(note) => void onComplete(step.id, note)}
        onNext={() => setCurrent((c) => Math.min(c + 1, steps.length - 1))}
        hasNext={current < steps.length - 1}
      />
    </div>
  );
}
