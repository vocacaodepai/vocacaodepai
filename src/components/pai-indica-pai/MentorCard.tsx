import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Compass, Loader2, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/ga4";
import { translatePipError } from "@/lib/pai-indica-pai/client";
import { requestMentorship } from "@/lib/pai-indica-pai/functions";
import {
  mentorshipRequestSchema,
  type MentorshipRequestInput,
  type MentorshipRequestOutput,
} from "@/lib/pai-indica-pai/schemas";
import { MENTORSHIP_AREAS } from "@/lib/pai-indica-pai/taxonomies";
import type { ProfessionalRow } from "@/lib/pai-indica-pai/types";
import { Field, btnOutline, btnPrimary, inputCls } from "./shared";

/** Diálogo "Pedir mentoria" (doc 08 §3.7): área + mensagem; RLS valida capacidade do mentor. */
export function MentorshipRequestDialog({
  mentor,
  trigger,
}: {
  mentor: ProfessionalRow;
  trigger?: React.ReactNode;
}) {
  const { user, openLogin } = useAuth();
  const [open, setOpen] = useState(false);
  const areas = mentor.mentor_areas.length
    ? mentor.mentor_areas
    : (Object.keys(MENTORSHIP_AREAS) as (keyof typeof MENTORSHIP_AREAS)[]);
  const form = useForm<MentorshipRequestInput, unknown, MentorshipRequestOutput>({
    resolver: zodResolver(mentorshipRequestSchema),
    defaultValues: { mentor_id: mentor.user_id, area: areas[0], message: "", website: "" },
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = form;
  const full = (mentor.mentor_slots ?? mentor.mentor_capacity) <= 0;
  const isSelf = user?.id === mentor.user_id;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await requestMentorship({ data });
      trackEvent("mentorship_request", { area: data.area });
      toast.success("Pedido enviado. O mentor recebe por e-mail e responde pela Área do Pai.");
      setOpen(false);
      form.reset();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      toast.error(
        /AGENDA_CHEIA/.test(msg)
          ? "Este mentor está com a agenda cheia no momento."
          : translatePipError(e),
      );
    }
  });

  const button = trigger ?? (
    <button type="button" className={btnPrimary} disabled={full || isSelf}>
      <Compass className="h-4 w-4" /> {full ? "Agenda cheia" : "Pedir mentoria"}
    </button>
  );

  if (!user) {
    return (
      <button type="button" onClick={openLogin} className={btnPrimary}>
        <Compass className="h-4 w-4" /> Entre para pedir mentoria
      </button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pedir mentoria a {mentor.profile?.display_name ?? "este pai"}</DialogTitle>
          <DialogDescription>
            Conte seu momento com sinceridade. Não é terapia nem consultoria paga: é um pai com
            estrada ajudando outro. Sugestão: uma conversa por semana, por 4 a 8 semanas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Área" error={errors.area?.message}>
            <select className={inputCls} {...register("area")}>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {MENTORSHIP_AREAS[a]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sua mensagem (30 a 1.500 caracteres)" error={errors.message?.message}>
            <textarea
              rows={6}
              className={inputCls}
              placeholder="Onde você está, o que busca e por que escolheu este mentor."
              {...register("message")}
            />
          </Field>
          <Controller
            control={control}
            name="share_contact"
            render={({ field }) => (
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-primary"
                  checked={Boolean(field.value)}
                  onChange={(e) => field.onChange(e.target.checked ? true : undefined)}
                />
                <span>
                  Autorizo compartilhar meu e-mail com o mentor se ele aceitar o pedido (LGPD).
                </span>
              </label>
            )}
          />
          {errors.share_contact && (
            <p className="text-sm text-destructive">{errors.share_contact.message}</p>
          )}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="hidden"
            {...register("website")}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className={btnOutline}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting} className={btnPrimary}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}{" "}
              Enviar pedido
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Card de mentor (doc 08 §3.7): áreas, vagas disponíveis e botão de pedido. */
export function MentorCard({ mentor }: { mentor: ProfessionalRow }) {
  const name = mentor.profile?.display_name ?? "Pai";
  const slots = mentor.mentor_slots ?? mentor.mentor_capacity;
  return (
    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        {mentor.profile?.avatar_url ? (
          <img
            src={mentor.profile.avatar_url}
            alt={`Foto de ${name}`}
            className="h-12 w-12 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 font-display text-lg font-bold text-accent"
            aria-hidden
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-bold">{name}</p>
          <Link
            to="/pai-indica-pai/profissionais/$id"
            params={{ id: mentor.slug }}
            className="truncate font-display text-lg font-bold leading-tight text-primary hover:underline"
          >
            {mentor.profession}
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 text-xs">
        {mentor.mentor_areas.map((a) => (
          <span key={a} className="rounded-full bg-accent/15 px-2.5 py-0.5 font-bold text-accent">
            {MENTORSHIP_AREAS[a] ?? a}
          </span>
        ))}
      </div>
      <p className="line-clamp-3 text-sm">{mentor.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" />
          {mentor.city && mentor.uf
            ? `${mentor.city}/${mentor.uf}`
            : mentor.remote
              ? "Remoto"
              : (mentor.uf ?? "Brasil")}
        </span>
        <span>{slots > 0 ? `${slots} ${slots === 1 ? "vaga" : "vagas"}` : "Agenda cheia"}</span>
      </div>
      <MentorshipRequestDialog mentor={mentor} />
    </article>
  );
}
