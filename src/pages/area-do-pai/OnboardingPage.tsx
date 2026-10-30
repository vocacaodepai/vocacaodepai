import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Baby, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link, useNavigate } from "@/lib/router-compat";
import { db } from "@/lib/area-do-pai/client";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken, ptError } from "@/lib/auth";
import { sendWelcomeEmail, setNewsletterPref } from "@/lib/area-do-pai/area.functions";
import { INTERESTS, UFS, childPhase, phaseBySlug } from "@/lib/phases";
import { inputClass, primaryBtn, secondaryBtn } from "@/components/area-do-pai/AreaShell";
import { cn } from "@/lib/utils";

// Onboarding em 3 passos (doc 07 §4.8): quem é você → seus filhos → interesses.
// Grava profiles (consentimentos, interesses, newsletter), children, chama
// complete_onboarding() e grant_badges_for_me(), dispara o e-mail de boas-vindas.

const DRAFT_KEY = "vdp_onboarding_draft";

interface DraftChild {
  key: string;
  name: string;
  birth_date: string;
  sex: "M" | "F" | "";
  expecting: boolean;
}

interface Draft {
  step: number;
  displayName: string;
  city: string;
  uf: string;
  children: DraftChild[];
  interests: string[];
  newsletter: boolean;
}

const newChild = (expecting = false): DraftChild => ({
  key: Math.random().toString(36).slice(2),
  name: "",
  birth_date: "",
  sex: "",
  expecting,
});

function loadDraft(): Partial<Draft> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<Draft>) : null;
  } catch {
    return null;
  }
}

const todayIso = () => new Date().toISOString().slice(0, 10);
const addMonths = (months: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, member, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [children, setChildren] = useState<DraftChild[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [newsletter, setNewsletter] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Rascunho local + pré-preenchimento do perfil.
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      if (d.step) setStep(d.step);
      if (d.displayName) setDisplayName(d.displayName);
      if (d.city) setCity(d.city);
      if (d.uf) setUf(d.uf);
      if (d.children) setChildren(d.children);
      if (d.interests) setInterests(d.interests);
      if (typeof d.newsletter === "boolean") setNewsletter(d.newsletter);
    }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!member || !hydrated) return;
    setDisplayName((v) => v || (member.display_name !== "Pai" ? member.display_name : ""));
    setCity((v) => v || member.city || "");
    setUf((v) => v || member.uf || "");
    if (member.onboarding_done) navigate("/area-do-pai", { replace: true });
  }, [member, hydrated, navigate]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step,
          displayName,
          city,
          uf,
          children,
          interests,
          newsletter,
        } satisfies Draft),
      );
    } catch {
      /* sem localStorage */
    }
  }, [hydrated, step, displayName, city, uf, children, interests, newsletter]);

  const validChildren = useMemo(
    () => children.filter((c) => c.birth_date && (c.sex === "M" || c.sex === "F")),
    [children],
  );

  const updateChild = (key: string, patch: Partial<DraftChild>) =>
    setChildren((list) => list.map((c) => (c.key === key ? { ...c, ...patch } : c)));

  const next1 = () => {
    if (displayName.trim().length < 2) return void toast.error("Digite como quer ser chamado.");
    setStep(2);
  };
  const next2 = () => {
    const incomplete = children.find((c) => !c.birth_date || !c.sex);
    if (incomplete)
      return void toast.error(
        "Preencha data de nascimento e sexo de cada filho, ou remova a linha.",
      );
    setStep(3);
  };

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error: pErr } = await db
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          city: city.trim() || null,
          uf: uf || null,
          interests,
          newsletter_opt_in: newsletter,
          consent_terms_at: now,
          consent_privacy_at: now,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      if (validChildren.length) {
        const rows = validChildren.map((c) => ({
          user_id: user.id,
          name: c.name.trim() || null,
          birth_date: c.birth_date,
          sex: c.sex,
        }));
        const { error: cErr } = await db.from("children").insert(rows);
        if (cErr) throw cErr;
      }

      const { error: oErr } = await db.rpc("complete_onboarding");
      if (oErr) throw oErr;
      await db.rpc("grant_badges_for_me").then(
        () => undefined,
        () => undefined,
      );

      const accessToken = await getAccessToken();
      if (accessToken) {
        if (newsletter) {
          setNewsletterPref({ data: { accessToken, optIn: true } }).catch(() => undefined);
        }
        sendWelcomeEmail({ data: { accessToken } }).catch(() => undefined);
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      await refreshProfile();
      toast.success("Bem-vindo à Área do Pai.");
      navigate("/area-do-pai", { replace: true });
    } catch (e) {
      toast.error(ptError(e));
    } finally {
      setSaving(false);
    }
  };

  const StepDot = ({ n, label }: { n: number; label: string }) => (
    <li className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
          step > n
            ? "bg-success text-white"
            : step === n
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
        )}
      >
        {step > n ? <Check className="h-4 w-4" /> : n}
      </span>
      <span
        className={cn(
          "text-sm font-bold",
          step === n ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </li>
  );

  return (
    <div className="container max-w-2xl py-10 md:py-14">
      <ol className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2">
        <StepDot n={1} label="Quem é você" />
        <StepDot n={2} label="Seus filhos" />
        <StepDot n={3} label="Interesses" />
      </ol>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-elegant sm:p-8">
        {step === 1 && (
          <>
            <h1 className="font-display text-3xl font-bold">Quem é você?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              O básico para a Área do Pai falar com você pelo nome.
            </p>
            <div className="mt-6 space-y-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nome de exibição
                </span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  className={inputClass}
                  placeholder="Como quer ser chamado"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Cidade (opcional)
                  </span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    maxLength={80}
                    className={inputClass}
                    placeholder="Sua cidade"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    UF
                  </span>
                  <select value={uf} onChange={(e) => setUf(e.target.value)} className={inputClass}>
                    <option value="">—</option>
                    {UFS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={next1} className={primaryBtn}>
                Continuar <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="font-display text-3xl font-bold">Quem são seus filhos?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Usamos a idade para mostrar o conteúdo certo na hora certa. Informe apenas o
              necessário: não pedimos documentos nem fotos dos seus filhos.
            </p>
            <div className="mt-6 space-y-4">
              {children.map((c) => {
                const phase = c.birth_date ? phaseBySlug(childPhase(c.birth_date)) : null;
                return (
                  <div key={c.key} className="rounded-2xl border border-border p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_160px_120px]">
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Nome ou apelido (opcional)
                        </span>
                        <input
                          value={c.name}
                          onChange={(e) => updateChild(c.key, { name: e.target.value })}
                          maxLength={60}
                          className={inputClass}
                          placeholder={c.expecting ? "Bebê" : "Ex.: João"}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {c.expecting ? "Data prevista do parto" : "Nascimento"}
                        </span>
                        <input
                          type="date"
                          value={c.birth_date}
                          min={c.expecting ? todayIso() : "1950-01-01"}
                          max={c.expecting ? addMonths(10) : todayIso()}
                          onChange={(e) => updateChild(c.key, { birth_date: e.target.value })}
                          className={inputClass}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Sexo
                        </span>
                        <select
                          value={c.sex}
                          onChange={(e) =>
                            updateChild(c.key, { sex: e.target.value as "M" | "F" | "" })
                          }
                          className={inputClass}
                        >
                          <option value="">—</option>
                          <option value="M">Menino</option>
                          <option value="F">Menina</option>
                        </select>
                      </label>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-primary">
                        {phase ? `Fase: ${phase.name}` : "Informe a data para ver a fase"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChildren((l) => l.filter((x) => x.key !== c.key))}
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setChildren((l) => [...l, newChild()])}
                  disabled={children.length >= 12}
                  className={secondaryBtn}
                >
                  <Plus className="h-4 w-4" /> Adicionar filho
                </button>
                <button
                  type="button"
                  onClick={() => setChildren((l) => [...l, newChild(true)])}
                  disabled={children.length >= 12}
                  className={secondaryBtn}
                >
                  <Baby className="h-4 w-4" /> Estamos esperando um bebê
                </button>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(1)} className={secondaryBtn}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <div className="flex gap-2">
                {children.length === 0 && (
                  <button type="button" onClick={() => setStep(3)} className={secondaryBtn}>
                    Ainda não tenho filhos
                  </button>
                )}
                <button type="button" onClick={next2} className={primaryBtn}>
                  Continuar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="font-display text-3xl font-bold">O que você quer ver mais?</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha quantos quiser. Dá para mudar depois em Minha conta.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {INTERESTS.map((i) => {
                const on = interests.includes(i.slug);
                return (
                  <button
                    key={i.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setInterests((l) => (on ? l.filter((s) => s !== i.slug) : [...l, i.slug]))
                    }
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-bold transition-colors",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary",
                    )}
                  >
                    {i.label}
                  </button>
                );
              })}
            </div>
            <label className="mt-6 flex items-start gap-2 text-sm text-foreground/85">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              Quero receber o resumo semanal por e-mail, com conteúdo para a fase dos meus filhos.
            </label>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Ao entrar, você confirma que leu os{" "}
              <Link to="/termos-de-uso" className="underline underline-offset-2">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link to="/politica-de-privacidade" className="underline underline-offset-2">
                Política de Privacidade
              </Link>
              . Registramos a data desse consentimento (LGPD).
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" onClick={() => setStep(2)} className={secondaryBtn}>
                <ArrowLeft className="h-4 w-4" /> Voltar
              </button>
              <button type="button" onClick={finish} disabled={saving} className={primaryBtn}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Entrar na Área do Pai
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
