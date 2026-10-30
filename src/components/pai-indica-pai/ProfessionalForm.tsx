import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { translatePipError } from "@/lib/pai-indica-pai/client";
import { createProfessional } from "@/lib/pai-indica-pai/functions";
import {
  professionalSchema,
  type ProfessionalInput,
  type ProfessionalOutput,
} from "@/lib/pai-indica-pai/schemas";
import { JOB_AREAS, MENTORSHIP_AREAS, UFS } from "@/lib/pai-indica-pai/taxonomies";
import type { ProfessionalRow } from "@/lib/pai-indica-pai/types";
import { TurnstileField } from "./TurnstileField";
import { ConductNotice, Field, btnPrimary, inputCls } from "./shared";

/** Perfil Pai Profissional (doc 08 §3.5): um por usuário; editar devolve para a fila. */
export function ProfessionalForm({
  existing,
  mentorDefault = false,
  onSaved,
}: {
  existing?: ProfessionalRow | null;
  mentorDefault?: boolean;
  onSaved: (slug: string, updated: boolean) => void;
}) {
  const [resetKey, setResetKey] = useState(0);
  const form = useForm<ProfessionalInput, unknown, ProfessionalOutput>({
    resolver: zodResolver(professionalSchema),
    defaultValues: existing
      ? {
          profession: existing.profession,
          area: existing.area ?? "outros",
          description: existing.description,
          city: existing.city ?? "",
          uf: existing.uf ?? "",
          remote: existing.remote,
          contact_phone: existing.contact_phone ?? "",
          contact_email: existing.contact_email ?? "",
          contact_url: existing.contact_url ?? "",
          consent_contact: existing.consent_contact,
          is_mentor: existing.is_mentor,
          mentor_areas: existing.mentor_areas ?? [],
          mentor_capacity: existing.mentor_capacity ?? 2,
          turnstile_token: "",
          website: "",
        }
      : {
          area: "outros",
          remote: false,
          consent_contact: false,
          is_mentor: mentorDefault,
          mentor_areas: [],
          mentor_capacity: 2,
          turnstile_token: "",
          website: "",
        },
    mode: "onBlur",
  });
  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const isMentor = watch("is_mentor");
  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await createProfessional({ data });
      toast.success(
        res.updated
          ? "Perfil atualizado e enviado para nova moderação."
          : "Perfil enviado para moderação. Avisaremos por e-mail.",
      );
      onSaved(res.slug, res.updated);
    } catch (e) {
      toast.error(translatePipError(e));
      setValue("turnstile_token", "");
      setResetKey((k) => k + 1);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Field label="Profissão / ofício *" error={errors.profession?.message}>
        <input
          className={inputCls}
          placeholder="Ex.: Eletricista residencial, Contador, Desenvolvedor"
          {...register("profession")}
        />
      </Field>
      <Field label="Área *" error={errors.area?.message}>
        <select className={inputCls} {...register("area")}>
          {Object.entries(JOB_AREAS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Apresente seu trabalho *"
        hint={`${values.description?.length ?? 0}/3000`}
        error={errors.description?.message}
      >
        <textarea
          rows={7}
          className={inputCls}
          placeholder="O que você faz, há quanto tempo, como trabalha, o que diferencia seu serviço…"
          {...register("description")}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-[1fr_140px]">
        <Field label="Cidade" error={errors.city?.message}>
          <input className={inputCls} {...register("city")} />
        </Field>
        <Field label="UF" error={errors.uf?.message}>
          <select className={inputCls} {...register("uf")}>
            <option value="">—</option>
            {UFS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" className="h-5 w-5 accent-primary" {...register("remote")} /> Atendo
        remotamente (todo o Brasil)
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="WhatsApp" error={errors.contact_phone?.message}>
          <input
            type="tel"
            className={inputCls}
            placeholder="(11) 99999-9999"
            {...register("contact_phone")}
          />
        </Field>
        <Field label="E-mail" error={errors.contact_email?.message}>
          <input type="email" className={inputCls} {...register("contact_email")} />
        </Field>
        <Field label="Site ou Instagram" error={errors.contact_url?.message}>
          <input
            type="url"
            className={inputCls}
            placeholder="https://"
            {...register("contact_url")}
          />
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 accent-primary"
          {...register("consent_contact")}
        />
        <span>
          Autorizo a exibição pública dos contatos acima no meu perfil (LGPD). Posso pedir a remoção
          a qualquer momento.
        </span>
      </label>
      {errors.consent_contact && (
        <p className="text-sm text-destructive">{errors.consent_contact.message}</p>
      )}

      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
        <label className="flex items-start gap-3 text-sm font-bold">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-primary"
            {...register("is_mentor")}
          />
          <span>
            Quero ser mentor: orientar outro pai, de graça, numa área em que já tenho estrada.
          </span>
        </label>
        {isMentor && (
          <div className="mt-4 space-y-4">
            <Field label="Áreas de mentoria (até 4) *" error={errors.mentor_areas?.message}>
              <div className="flex flex-wrap gap-2">
                {Object.entries(MENTORSHIP_AREAS).map(([k, l]) => (
                  <label
                    key={k}
                    className="cursor-pointer rounded-full border px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
                  >
                    <input
                      type="checkbox"
                      value={k}
                      className="sr-only"
                      {...register("mentor_areas")}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </Field>
            <Field
              label="Quantos pais consigo acompanhar ao mesmo tempo (0 a 10)"
              error={errors.mentor_capacity?.message}
            >
              <input
                type="number"
                min={0}
                max={10}
                className={inputCls}
                {...register("mentor_capacity")}
              />
            </Field>
          </div>
        )}
      </div>

      <ConductNotice compact />
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 h-5 w-5 accent-primary"
          {...register("accept_conduct")}
        />
        <span>Li e aceito o código de conduta do Pai Indica Pai. *</span>
      </label>
      {errors.accept_conduct && (
        <p className="text-sm text-destructive">{errors.accept_conduct.message}</p>
      )}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
        {...register("website")}
      />
      <Controller
        control={control}
        name="turnstile_token"
        render={({ field }) => (
          <TurnstileField
            onToken={field.onChange}
            resetKey={resetKey}
            error={errors.turnstile_token?.message}
          />
        )}
      />
      <button type="submit" disabled={isSubmitting} className={btnPrimary}>
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{" "}
        {existing ? "Salvar e reenviar para moderação" : "Enviar para moderação"}
      </button>
    </form>
  );
}
