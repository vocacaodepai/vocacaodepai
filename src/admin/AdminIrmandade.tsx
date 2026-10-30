import { useEffect, useState } from "react";
import { Check, Flag, X } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { formatDateShort } from "@/lib/site";
import { cn } from "@/lib/utils";
import { EVENT_KIND_LABEL, REJECTION_REASONS, type EventRow } from "@/lib/irmandade/types";
import { storyCategoryLabel } from "@/lib/irmandade/story-categories";
import {
  fetchAdminAnswers,
  fetchAdminChallenges,
  fetchAdminEvents,
  fetchAdminQuestions,
  fetchAdminStories,
  fetchAdminTracks,
  fetchEventRsvps,
  fetchReports,
  moderate,
  saveEvent,
  setEventStatus,
  setFormacaoStatus,
  type AdminAnswer,
  type AdminEventInput,
} from "./admin-irmandade-db";
import type { QuestionRow, StoryRow } from "@/lib/irmandade/types";

export type AdminIrmandadeTab =
  "historias" | "perguntas" | "respostas" | "denuncias" | "eventos" | "formacao";
const TABS: { key: AdminIrmandadeTab; label: string }[] = [
  { key: "historias", label: "Histórias" },
  { key: "perguntas", label: "Perguntas" },
  { key: "respostas", label: "Respostas" },
  { key: "denuncias", label: "Denúncias" },
  { key: "eventos", label: "Eventos" },
  { key: "formacao", label: "Trilhas e desafios" },
];
const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha na operação.");

/** Diálogo de rejeição (motivo ≥ 10, motivos prontos — doc 09 §13). */
function RejectBox({
  onConfirm,
  onCancel,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="mt-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
      <div className="flex flex-wrap gap-1">
        {REJECTION_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className="rounded-full border border-border bg-card px-2 py-0.5 text-xs"
          >
            {r}
          </button>
        ))}
      </div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (mín. 10 caracteres) — vai por e-mail ao autor"
        className="mt-2 w-full rounded-lg border border-border bg-background p-2 text-sm"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={reason.trim().length < 10}
          onClick={() => onConfirm(reason.trim())}
          className="rounded-full bg-destructive px-4 py-1 text-xs font-bold text-destructive-foreground disabled:opacity-50"
        >
          Rejeitar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-border px-4 py-1 text-xs font-bold"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function ModerationRow({
  title,
  meta,
  body,
  link,
  onApprove,
  onReject,
}: {
  title: string;
  meta: string;
  body: string;
  link?: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  return (
    <li className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {link ? (
              <Link to={link} className="hover:text-primary">
                {title}
              </Link>
            ) : (
              title
            )}
          </p>
          <p className="text-xs text-muted-foreground">{meta}</p>
          <p
            className={cn(
              "mt-2 whitespace-pre-line text-sm text-foreground/80",
              !open && "line-clamp-3",
            )}
          >
            {body}
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-1 text-xs font-semibold text-primary"
          >
            {open ? "Recolher" : "Ver completo"}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="inline-flex h-9 items-center gap-1 rounded-full bg-success px-3 text-xs font-bold text-white"
          >
            <Check className="h-3.5 w-3.5" /> Aprovar
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            className="inline-flex h-9 items-center gap-1 rounded-full border border-destructive px-3 text-xs font-bold text-destructive"
          >
            <X className="h-3.5 w-3.5" /> Rejeitar
          </button>
        </div>
      </div>
      {rejecting && (
        <RejectBox
          onConfirm={(r) => {
            setRejecting(false);
            onReject(r);
          }}
          onCancel={() => setRejecting(false)}
        />
      )}
    </li>
  );
}

const EMPTY_EVENT: AdminEventInput = {
  slug: "",
  title: "",
  description: "",
  starts_at: "",
  ends_at: null,
  mode: "online",
  kind: "encontro",
  city: null,
  uf: null,
  address: null,
  url: null,
  cover_image_url: null,
  capacity: null,
  status: "draft",
  organizer: "Vocação de Pai",
  price_text: "Gratuito",
};

function EventsEditor() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [form, setForm] = useState<AdminEventInput | null>(null);
  const [rsvps, setRsvps] = useState<{
    id: string;
    rows: Awaited<ReturnType<typeof fetchEventRsvps>>;
  } | null>(null);
  const reload = () => fetchAdminEvents().then(setEvents).catch(err);
  useEffect(() => {
    void reload();
  }, []);
  const f = form;
  const set = (k: keyof AdminEventInput, v: unknown) => setForm((x) => (x ? { ...x, [k]: v } : x));
  const save = async () => {
    if (!f) return;
    try {
      const payload = {
        ...f,
        starts_at: new Date(f.starts_at).toISOString(),
        ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null,
        capacity: f.capacity ? Number(f.capacity) : null,
        uf: f.uf ? f.uf.toUpperCase().slice(0, 2) : null,
      };
      await saveEvent(payload);
      toast.success("Evento salvo.");
      setForm(null);
      await reload();
    } catch (e) {
      err(e);
    }
  };
  const status = async (id: string, s: EventRow["status"]) => {
    if (
      s === "canceled" &&
      !confirm("Cancelar o evento? Os confirmados devem ser avisados por e-mail.")
    )
      return;
    try {
      await setEventStatus(id, s);
      toast.success(
        s === "done"
          ? "Marcado como realizado (libera a insígnia Presente no encontro)."
          : "Status atualizado.",
      );
      await reload();
    } catch (e) {
      err(e);
    }
  };
  const exportCsv = (rows: NonNullable<typeof rsvps>["rows"], slug: string) => {
    const csv = [
      "nome;status;data",
      ...rows.map((r) => `${r.member?.display_name ?? r.user_id};${r.status};${r.created_at}`),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = `rsvps-${slug}.csv`;
    a.click();
  };
  const field = "w-full rounded-lg border border-border bg-background p-2 text-sm";
  const local = (iso: string | null) =>
    iso
      ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Eventos</h2>
        <button
          type="button"
          onClick={() => setForm({ ...EMPTY_EVENT })}
          className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
        >
          Novo evento
        </button>
      </div>
      {f && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Título
            <input
              className={field}
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </label>
          <label className="text-xs font-bold">
            Slug
            <input className={field} value={f.slug} onChange={(e) => set("slug", e.target.value)} />
          </label>
          <label className="text-xs font-bold">
            Início
            <input
              type="datetime-local"
              className={field}
              value={local(f.starts_at)}
              onChange={(e) => set("starts_at", e.target.value)}
            />
          </label>
          <label className="text-xs font-bold">
            Fim
            <input
              type="datetime-local"
              className={field}
              value={local(f.ends_at)}
              onChange={(e) => set("ends_at", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold">
            Modo
            <select className={field} value={f.mode} onChange={(e) => set("mode", e.target.value)}>
              <option value="online">On-line</option>
              <option value="presencial">Presencial</option>
            </select>
          </label>
          <label className="text-xs font-bold">
            Tipo
            <select className={field} value={f.kind} onChange={(e) => set("kind", e.target.value)}>
              {Object.entries(EVENT_KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            Cidade
            <input
              className={field}
              value={f.city ?? ""}
              onChange={(e) => set("city", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold">
            UF
            <input
              className={field}
              maxLength={2}
              value={f.uf ?? ""}
              onChange={(e) => set("uf", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Endereço
            <input
              className={field}
              value={f.address ?? ""}
              onChange={(e) => set("address", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold">
            Link (on-line)
            <input
              className={field}
              value={f.url ?? ""}
              onChange={(e) => set("url", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold">
            Capa (URL)
            <input
              className={field}
              value={f.cover_image_url ?? ""}
              onChange={(e) => set("cover_image_url", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold">
            Organização
            <input
              className={field}
              value={f.organizer ?? ""}
              onChange={(e) => set("organizer", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold">
            Investimento (texto)
            <input
              className={field}
              value={f.price_text ?? ""}
              onChange={(e) => set("price_text", e.target.value || null)}
            />
          </label>
          <label className="text-xs font-bold">
            Vagas
            <input
              type="number"
              className={field}
              value={f.capacity ?? ""}
              onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : null)}
            />
          </label>
          <label className="text-xs font-bold">
            Status
            <select
              className={field}
              value={f.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="canceled">Cancelado</option>
              <option value="done">Realizado</option>
            </select>
          </label>
          <label className="text-xs font-bold sm:col-span-2">
            Descrição (parágrafos separados por linha em branco)
            <textarea
              rows={5}
              className={field}
              value={f.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={save}
              className="rounded-full bg-primary px-5 py-1.5 text-xs font-bold text-primary-foreground"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="rounded-full border border-border px-5 py-1.5 text-xs font-bold"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {events.map((e) => (
          <li key={e.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold">
                  {e.title}{" "}
                  <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold">
                    {e.status}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(e.starts_at)} · {EVENT_KIND_LABEL[e.kind]} · {e.mode} ·{" "}
                  {e.rsvp_count} confirmados
                </p>
              </div>
              <div className="flex flex-wrap gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setForm({ ...e })}
                  className="rounded-full border border-border px-3 py-1 font-bold"
                >
                  Editar
                </button>
                {e.status !== "published" && (
                  <button
                    type="button"
                    onClick={() => status(e.id, "published")}
                    className="rounded-full border border-success px-3 py-1 font-bold text-success"
                  >
                    Publicar
                  </button>
                )}
                {e.status === "published" && (
                  <button
                    type="button"
                    onClick={() => status(e.id, "done")}
                    className="rounded-full border border-primary px-3 py-1 font-bold text-primary"
                  >
                    Marcar como realizado
                  </button>
                )}
                {e.status === "published" && (
                  <button
                    type="button"
                    onClick={() => status(e.id, "canceled")}
                    className="rounded-full border border-destructive px-3 py-1 font-bold text-destructive"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    fetchEventRsvps(e.id)
                      .then((rows) => setRsvps({ id: e.id, rows }))
                      .catch(err)
                  }
                  className="rounded-full border border-border px-3 py-1 font-bold"
                >
                  RSVPs
                </button>
              </div>
            </div>
            {rsvps?.id === e.id && (
              <div className="mt-3 rounded-xl bg-muted/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold">{rsvps.rows.length} RSVPs</span>
                  <button
                    type="button"
                    onClick={() => exportCsv(rsvps.rows, e.slug)}
                    className="font-bold text-primary"
                  >
                    Exportar CSV
                  </button>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {rsvps.rows.map((r) => (
                    <li key={r.user_id}>
                      {r.member?.display_name ?? r.user_id} · {r.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormacaoAdmin() {
  const [tracks, setTracks] = useState<Awaited<ReturnType<typeof fetchAdminTracks>>>([]);
  const [challenges, setChallenges] = useState<Awaited<ReturnType<typeof fetchAdminChallenges>>>(
    [],
  );
  const reload = () =>
    Promise.all([
      fetchAdminTracks().then(setTracks),
      fetchAdminChallenges().then(setChallenges),
    ]).catch(err);
  useEffect(() => {
    void reload();
  }, []);
  const toggle = async (table: "tracks" | "challenges", id: string, status: string) => {
    try {
      await setFormacaoStatus(table, id, status === "published" ? "draft" : "published");
      await reload();
    } catch (e) {
      err(e);
    }
  };
  const row = (
    table: "tracks" | "challenges",
    r: {
      id: string;
      slug: string;
      title: string;
      status: string;
      count: number;
      label: string;
      href: string;
    },
  ) => (
    <li
      key={r.id}
      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3 text-sm"
    >
      <div>
        <Link to={r.href} className="font-bold hover:text-primary">
          {r.title}
        </Link>
        <p className="text-xs text-muted-foreground">
          {r.slug} · {r.count} {r.label} · {r.status}
        </p>
      </div>
      <button
        type="button"
        onClick={() => toggle(table, r.id, r.status)}
        className="rounded-full border border-border px-3 py-1 text-xs font-bold"
      >
        {r.status === "published" ? "Despublicar" : "Publicar"}
      </button>
    </li>
  );
  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Conteúdo das trilhas e desafios vem do seed (`supabase/seed/*.json` →
        `scripts/seed-formacao.mjs` → `0016_seed_formacao.sql`). Aqui: listagem e
        publicar/despublicar; o editor de passos chega na Fase 8.
      </p>
      <div>
        <h2 className="font-display text-xl font-bold">Trilhas</h2>
        <ul className="mt-2 space-y-2">
          {tracks.map((t) =>
            row("tracks", {
              id: t.id,
              slug: t.slug,
              title: t.title,
              status: t.status,
              count: t.steps_count,
              label: "passos",
              href: `/formacao/${t.slug}`,
            }),
          )}
        </ul>
      </div>
      <div>
        <h2 className="font-display text-xl font-bold">Desafios</h2>
        <ul className="mt-2 space-y-2">
          {challenges.map((c) =>
            row("challenges", {
              id: c.id,
              slug: c.slug,
              title: c.title,
              status: c.status,
              count: c.days_count,
              label: "dias",
              href: `/desafios/${c.slug}`,
            }),
          )}
        </ul>
      </div>
    </div>
  );
}

/** /admin/irmandade (doc 09 §13): moderação (histórias, perguntas, respostas, denúncias), eventos, formação. */
export default function AdminIrmandade({
  initialTab = "historias",
}: {
  initialTab?: AdminIrmandadeTab;
}) {
  const [tab, setTab] = useState<AdminIrmandadeTab>(initialTab);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [answers, setAnswers] = useState<AdminAnswer[]>([]);
  const [reports, setReports] = useState<Awaited<ReturnType<typeof fetchReports>>>([]);
  const [loading, setLoading] = useState(false);

  const reload = () => {
    setLoading(true);
    const run =
      tab === "historias"
        ? fetchAdminStories(status).then(setStories)
        : tab === "perguntas"
          ? fetchAdminQuestions(status).then(setQuestions)
          : tab === "respostas"
            ? fetchAdminAnswers(status).then(setAnswers)
            : tab === "denuncias"
              ? fetchReports().then(setReports)
              : Promise.resolve();
    run.catch(err).finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
  }, [tab, status]);

  const act = async (
    entity: "story" | "question" | "answer",
    id: string,
    action: "approve" | "reject",
    reason?: string,
  ) => {
    try {
      await moderate(entity, id, action, reason);
      toast.success(
        action === "approve"
          ? "Aprovado. O autor recebe o aviso por e-mail quando o Resend estiver configurado."
          : "Rejeitado com motivo.",
      );
      reload();
    } catch (e) {
      err(e);
    }
  };
  const chip = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
      active ? "bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground",
    );

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Irmandade e Formação</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={chip(tab === t.key)}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {(tab === "historias" || tab === "perguntas" || tab === "respostas") && (
        <div className="mt-3 flex gap-2 text-xs">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              className={chip(status === s)}
              onClick={() => setStatus(s)}
            >
              {s === "pending" ? "Pendentes" : s === "approved" ? "Aprovados" : "Rejeitados"}
            </button>
          ))}
        </div>
      )}
      <div className="mt-6">
        {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {tab === "historias" && (
          <ul className="space-y-3">
            {stories.map((s) => (
              <ModerationRow
                key={s.id}
                title={s.title}
                meta={`${s.author_name} · ${storyCategoryLabel(s.category)} · ${formatDateShort(s.created_at)}${s.report_count ? ` · ${s.report_count} denúncias` : ""}`}
                body={s.content}
                link={s.status === "approved" ? `/historias/${s.id}` : undefined}
                onApprove={() => act("story", s.id, "approve")}
                onReject={(r) => act("story", s.id, "reject", r)}
              />
            ))}
            {!loading && stories.length === 0 && (
              <p className="text-sm text-muted-foreground">Nada aqui.</p>
            )}
          </ul>
        )}
        {tab === "perguntas" && (
          <ul className="space-y-3">
            {questions.map((q) => (
              <ModerationRow
                key={q.id}
                title={q.title}
                meta={`${q.author?.display_name ?? "?"} · ${q.categories?.name ?? "sem categoria"} · ${formatDateShort(q.created_at)}${q.report_count ? ` · ${q.report_count} denúncias` : ""}`}
                body={q.body}
                link={q.status === "approved" ? `/perguntas/${q.slug}` : undefined}
                onApprove={() => act("question", q.id, "approve")}
                onReject={(r) => act("question", q.id, "reject", r)}
              />
            ))}
            {!loading && questions.length === 0 && (
              <p className="text-sm text-muted-foreground">Nada aqui.</p>
            )}
          </ul>
        )}
        {tab === "respostas" && (
          <ul className="space-y-3">
            {answers.map((a) => (
              <ModerationRow
                key={a.id}
                title={a.question?.title ?? "Resposta"}
                meta={`${a.author?.display_name ?? "?"} · ${formatDateShort(a.created_at)} · ${a.like_count} votos${a.report_count ? ` · ${a.report_count} denúncias` : ""}`}
                body={a.body}
                link={a.question ? `/perguntas/${a.question.slug}#resposta-${a.id}` : undefined}
                onApprove={() => act("answer", a.id, "approve")}
                onReject={(r) => act("answer", a.id, "reject", r)}
              />
            ))}
            {!loading && answers.length === 0 && (
              <p className="text-sm text-muted-foreground">Nada aqui.</p>
            )}
          </ul>
        )}
        {tab === "denuncias" && (
          <ul className="space-y-2">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3 text-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" /> <strong>{r.entity}</strong>{" "}
                  {r.entity_id.slice(0, 8)}… · {r.note ?? "sem motivo"} ·{" "}
                  {formatDateShort(r.created_at)}
                </span>
                <span className="flex gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => act(r.entity as "story", r.entity_id, "approve")}
                    className="rounded-full border border-success px-3 py-1 font-bold text-success"
                  >
                    Manter
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      act(
                        r.entity as "story",
                        r.entity_id,
                        "reject",
                        "Removido após denúncia da Irmandade",
                      )
                    }
                    className="rounded-full border border-destructive px-3 py-1 font-bold text-destructive"
                  >
                    Remover
                  </button>
                </span>
              </li>
            ))}
            {!loading && reports.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma denúncia.</p>
            )}
          </ul>
        )}
        {tab === "eventos" && <EventsEditor />}
        {tab === "formacao" && <FormacaoAdmin />}
      </div>
    </div>
  );
}
