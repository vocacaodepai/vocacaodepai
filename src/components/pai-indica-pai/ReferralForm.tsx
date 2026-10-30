import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { translatePipError } from "@/lib/pai-indica-pai/client";
import { createReferral } from "@/lib/pai-indica-pai/functions";
import {
  referralSchema,
  type ReferralInput,
  type ReferralOutput,
} from "@/lib/pai-indica-pai/schemas";
import { JOB_AREAS, REFERRAL_KINDS, UFS } from "@/lib/pai-indica-pai/taxonomies";
import type { ReferralRow } from "@/lib/pai-indica-pai/types";
import { ReferralCard } from "./ReferralCard";
import { TurnstileField } from "./TurnstileField";
import { ConductNotice, Field, btnOutline, btnPrimary, inputCls } from "./shared";

/** Nova indicação de profissional, serviço ou empresa (doc 08 §3.6). */
export function ReferralForm({ onCreated }: { onCreated: (slug: string) => void }) {
  const [preview, setPreview] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const form = useForm<ReferralInput, unknown, ReferralOutput>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      kind: "profissional",
      consent_contact: false,
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
  const values = watch() as ReferralOutput;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await createReferral({ data });
      toast.success("Indicação enviada para moderação. Avisaremos por e-mail.");
      onCreated(res.slug);
    } catch (e) {
      toast.error(translatePipError(e));
      setValue("turnstile_token", "");
      setResetKey((k) => k + 1);
      setPreview(false);
    }
  });

  if (preview) {
    const r: ReferralRow = {
      id: "preview",
      slug: "preview",
      kind: values.kind,
      title: values.title,
      category: values.category,
      city: values.city || null,
      uf: (values.uf || null) as ReferralRow["uf"],
      description: values.description,
      contact_phone: values.consent_contact ? values.contact_phone || null : null,
      contact_email: values.consent_contact ? values.contact_email || null : null,
      contact_url: values.contact_url || null,
      consent_contact: values.consent_contact,
      referred_by: null,
      status: "pending",
      rejection_reason: null,
      auto_hidden: false,
      report_count: 0,
      renewed_count: 0,
      expires_at: null,
      moderated_by: null,
      moderated_at: null,
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return (
      <div className="space-y-6">
        <p className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <strong>Pré-visualização.</strong> É assim que a indicação vai aparecer depois de
          aprovada.
        </p>
        <div className="[&_button]:hidden">
          <ReferralCard referral={r} />
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setPreview(false)} className={btnOutline}>
            Voltar e editar
          </button>
          <button type="button" onClick={onSubmit} disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}{" "}
            Enviar para moderação
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Field label="O que você indica? *" error={errors.kind?.message}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(REFERRAL_KINDS).map(([k, l]) => (
            <label
              key={k}
              className="cursor-pointer rounded-full border px-4 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
            >
              <input type="radio" value={k} className="sr-only" {...register("kind")} />
              {l}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Nome do profissional, serviço ou empresa *" error={errors.title?.message}>
        <input
          className={inputCls}
          placeholder="Ex.: João Eletricista, Oficina do Zé, Contabilidade Silva"
          {...register("title")}
        />
      </Field>
      <Field
        label="Categoria *"
        hint="Escolha da lista ou escreva"
        error={errors.category?.message}
      >
        <input
          list="pip-categorias"
          className={inputCls}
          placeholder="Ex.: Elétrica, Contabilidade, Pintura"
          {...register("category")}
        />
        <datalist id="pip-categorias">
          {Object.values(JOB_AREAS).map((l) => (
            <option key={l} value={l} />
          ))}
        </datalist>
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
      <Field
        label="Por que você indica? *"
        hint={`${values.description?.length ?? 0}/4000`}
        error={errors.description?.message}
      >
        <textarea
          rows={6}
          className={inputCls}
          placeholder="Conte sua experiência real: o que foi feito, prazo, preço justo, atendimento…"
          {...register("description")}
        />
      </Field>
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
        <span>Tenho autorização do indicado para publicar o e-mail/telefone acima (LGPD).</span>
      </label>
      {errors.consent_contact && (
        <p className="text-sm text-destructive">{errors.consent_contact.message}</p>
      )}
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
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={async () => {
            if (await form.trigger()) setPreview(true);
          }}
          className={btnOutline}
        >
          <Eye className="h-4 w-4" /> Pré-visualizar
        </button>
        <button type="submit" disabled={isSubmitting} className={btnPrimary}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}{" "}
          Enviar para moderação
        </button>
      </div>
    </form>
  );
}
