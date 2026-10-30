import { useCallback, useEffect, useState } from "react";
import { Baby, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/area-do-pai/client";
import { useAuth } from "@/lib/auth-context";
import { ptError } from "@/lib/auth";
import type { Child, ChildSex } from "@/lib/area-do-pai/types";
import { childPhase, humanAge, monthsToNextPhase, phaseBySlug } from "@/lib/phases";
import {
  AreaShell,
  Card,
  dangerBtn,
  inputClass,
  primaryBtn,
  secondaryBtn,
} from "@/components/area-do-pai/AreaShell";

// /area-do-pai/filhos (doc 07 §4.10): CRUD direto em `children` (RLS: só o dono).
// Validações: nascimento entre hoje−60 anos e hoje+10 meses; máximo 12; sexo obrigatório.

const MAX_CHILDREN = 12;

const iso = (d: Date) => d.toISOString().slice(0, 10);
const minDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 60);
  return iso(d);
};
const maxDate = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 10);
  return iso(d);
};

interface Form {
  id?: string;
  name: string;
  birth_date: string;
  sex: ChildSex | "";
}

const emptyForm: Form = { name: "", birth_date: "", sex: "" };

export default function FilhosPage() {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await db
        .from("children")
        .select("*")
        .eq("user_id", user.id)
        .order("birth_date");
      if (error) throw error;
      setChildren((data ?? []) as Child[]);
    } catch {
      setChildren([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form) return;
    if (!form.birth_date) return void toast.error("Informe a data de nascimento (ou prevista).");
    if (form.birth_date < minDate() || form.birth_date > maxDate())
      return void toast.error(
        "Data fora do intervalo aceito (até 60 anos atrás ou 10 meses à frente).",
      );
    if (form.sex !== "M" && form.sex !== "F") return void toast.error("Informe o sexo.");
    if (!form.id && children.length >= MAX_CHILDREN)
      return void toast.error(`Limite de ${MAX_CHILDREN} filhos cadastrados.`);
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim() || null,
        birth_date: form.birth_date,
        sex: form.sex,
      };
      const { error } = form.id
        ? await db.from("children").update(payload).eq("id", form.id)
        : await db.from("children").insert(payload);
      if (error) throw error;
      await db.rpc("grant_badges_for_me").then(
        () => undefined,
        () => undefined,
      );
      toast.success(form.id ? "Dados atualizados." : "Filho cadastrado.");
      setForm(null);
      await load();
    } catch (err) {
      toast.error(ptError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Child) => {
    if (!confirm(`Remover ${c.name || "este filho"} do cadastro?`)) return;
    try {
      const { error } = await db.from("children").delete().eq("id", c.id);
      if (error) throw error;
      toast.success("Removido.");
      await load();
    } catch (err) {
      toast.error(ptError(err));
    }
  };

  return (
    <AreaShell
      title="Seus filhos"
      description="Usamos a idade para mostrar o conteúdo certo na hora certa. Só nome ou apelido, data e sexo: nunca documentos nem fotos."
      actions={
        !form && (
          <button
            type="button"
            onClick={() => setForm(emptyForm)}
            disabled={children.length >= MAX_CHILDREN}
            className={primaryBtn}
          >
            <Plus className="h-4 w-4" /> Adicionar filho
          </button>
        )
      }
    >
      {form && (
        <Card title={form.id ? "Editar filho" : "Novo filho"} className="mb-5">
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-[1fr_170px_130px_auto]">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nome ou apelido (opcional)
              </span>
              <input
                value={form.name}
                maxLength={60}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Ex.: João"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Nascimento ou previsão
              </span>
              <input
                type="date"
                value={form.birth_date}
                min={minDate()}
                max={maxDate()}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Sexo
              </span>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value as ChildSex | "" })}
                className={inputClass}
              >
                <option value="">—</option>
                <option value="M">Menino</option>
                <option value="F">Menina</option>
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" disabled={saving} className={primaryBtn}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
              </button>
              <button
                type="button"
                onClick={() => setForm(null)}
                className={secondaryBtn}
                aria-label="Cancelar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando…
        </p>
      ) : children.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <Baby className="mx-auto h-10 w-10 text-primary" aria-hidden />
            <p className="mt-3 font-display text-xl font-bold">Nenhum filho cadastrado ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cadastre seu filho e receba conteúdo para a fase dele. Esperando um bebê? Informe a
              data prevista do parto.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((c) => {
            const phase = phaseBySlug(childPhase(c.birth_date));
            const nextIn = monthsToNextPhase(c.birth_date);
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-bold">
                      {c.name || (c.sex === "F" ? "Sua filha" : "Seu filho")}
                    </p>
                    <p className="text-sm text-muted-foreground">{humanAge(c.birth_date)}</p>
                    <p className="mt-2 text-sm">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {phase?.name ?? "—"}
                      </span>
                      {nextIn != null && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          próxima fase em {nextIn} {nextIn === 1 ? "mês" : "meses"}
                        </span>
                      )}
                    </p>
                    {phase && (
                      <p className="mt-2 text-xs text-muted-foreground">Temas: {phase.themes}.</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          id: c.id,
                          name: c.name ?? "",
                          birth_date: c.birth_date,
                          sex: c.sex,
                        })
                      }
                      aria-label="Editar"
                      className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(c)}
                      aria-label="Remover"
                      className={`${dangerBtn} h-9 w-9 px-0`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AreaShell>
  );
}
