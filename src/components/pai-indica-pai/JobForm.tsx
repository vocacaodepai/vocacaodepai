import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/ga4";
import { translatePipError } from "@/lib/pai-indica-pai/client";
import { createJob } from "@/lib/pai-indica-pai/functions";
import { jobSchema, type JobInput, type JobOutput } from "@/lib/pai-indica-pai/schemas";
import { JOB_AREAS, JOB_TYPES, UFS } from "@/lib/pai-indica-pai/taxonomies";
import { JobDetail, type JobDetailJob } from "./JobDetail";
import { TurnstileField } from "./TurnstileField";
import { ConductNotice, Field, btnOutline, btnPrimary, inputCls } from "./shared";

/** Formulário de vaga (doc 08 §4.2): zod + react-hook-form, preview, honeypot, Turnstile, envio para `pending`. */
export function JobForm({ onCreated }: { onCreated: (slug: string) => void }) {
  const [preview, setPreview] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const form = useForm<JobInput, unknown, JobOutput>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      remote: false,
      consent_contact: false,
      type: "clt",
      area: "outros",
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
  const remote = watch("remote");
  const values = watch() as JobOutput;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await createJob({ data });
      trackEvent("job_submit", { status: "ok" });
      toast.success("Vaga enviada para moderação. Avisaremos por e-mail.");
      onCreated(res.slug);
    } catch (e) {
      trackEvent("job_submit", { status: "error" });
      toast.error(translatePipError(e));
      setValue("turnstile_token", "");
      setResetKey((k) => k + 1);
      setPreview(false);
    }
  });

  if (preview) {
    const job: JobDetailJob = {
      id: "preview",
      slug: "preview",
      title: values.title,
      company: values.company,
      city: values.remote ? null : values.city || null,
      uf: values.remote ? null : ((values.uf || null) as JobDetailJob["uf"]),
      remote: Boolean(values.remote),
      type: values.type,
      area: values.area,
      salary_min: Number(values.salary_min) || null,
      salary_max: Number(values.salary_max) || null,
      description: values.description,
      how_to_apply: values.how_to_apply,
      contact_email: values.consent_contact ? values.contact_email || null : null,
      contact_url: values.contact_url || null,
      contact_phone: values.consent_contact ? values.contact_phone || null : null,
      consent_contact: values.consent_contact,
      status: "pending",
      auto_hidden: false,
      report_count: 0,
      renewed_count: 0,
      expires_at: new Date(Date.now() + 45 * 86_400_000).toISOString(),
      moderated_at: null,
      views: 0,
      apply_clicks: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return (
      <div className="space-y-6">
        <p className="rounded-2xl border border-accent/40 bg-accent/10 p-4 text-sm">
          <strong>Pré-visualização.</strong> É assim que a vaga vai aparecer depois de aprovada.
        </p>
        <JobDetail job={job} live preview />
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
      <Field label="Título da vaga *" error={errors.title?.message}>
        <input
          className={inputCls}
          placeholder="Ex.: Eletricista industrial"
          {...register("title")}
        />
      </Field>
      <Field label="Empresa *" error={errors.company?.message}>
        <input
          className={inputCls}
          placeholder="Nome da empresa (real e verificável)"
          {...register("company")}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Tipo de contratação *" error={errors.type?.message}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(JOB_TYPES).map(([k, label]) => (
              <label
                key={k}
                className="cursor-pointer rounded-full border px-4 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/10"
              >
                <input type="radio" value={k} className="sr-only" {...register("type")} />
                {label}
              </label>
            ))}
          </div>
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
      </div>
      <label className="flex items-center gap-3 text-sm font-medium">
        <input type="checkbox" className="h-5 w-5 accent-primary" {...register("remote")} /> Vaga
        100% remota
      </label>
      <div className="grid gap-4 md:grid-cols-[1fr_140px]">
        <Field label="Cidade" error={errors.city?.message}>
          <input className={inputCls} disabled={remote} {...register("city")} />
        </Field>
        <Field label="UF" error={errors.uf?.message}>
          <select className={inputCls} disabled={remote} {...register("uf")}>
            <option value="">—</option>
            {UFS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Salário mínimo (R$/mês, opcional)" error={errors.salary_min?.message}>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            className={inputCls}
            {...register("salary_min")}
          />
        </Field>
        <Field label="Salário máximo (R$/mês, opcional)" error={errors.salary_max?.message}>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            className={inputCls}
            {...register("salary_max")}
          />
        </Field>
      </div>
      <Field
        label="Descrição da vaga *"
        hint={`${values.description?.length ?? 0}/8000`}
        error={errors.description?.message}
      >
        <textarea
          rows={10}
          className={inputCls}
          placeholder="Atividades, requisitos, horário, benefícios…"
          {...register("description")}
        />
      </Field>
      <Field label="Como se candidatar *" error={errors.how_to_apply?.message}>
        <textarea
          rows={3}
          className={inputCls}
          placeholder="Ex.: Envie currículo para o e-mail abaixo com o assunto 'Vaga eletricista'."
          {...register("how_to_apply")}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="E-mail para candidatura" error={errors.contact_email?.message}>
          <input type="email" className={inputCls} {...register("contact_email")} />
        </Field>
        <Field label="Link (site, LinkedIn, Gupy)" error={errors.contact_url?.message}>
          <input
            type="url"
            className={inputCls}
            placeholder="https://"
            {...register("contact_url")}
          />
        </Field>
        <Field label="WhatsApp" error={errors.contact_phone?.message}>
          <input
            type="tel"
            className={inputCls}
            placeholder="(11) 99999-9999"
            {...register("contact_phone")}
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
          Autorizo a exibição pública do e-mail/telefone acima nesta vaga (LGPD). Você pode pedir a
          remoção a qualquer momento.
        </span>
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
