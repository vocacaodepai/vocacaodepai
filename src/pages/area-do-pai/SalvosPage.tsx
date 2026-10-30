import { useCallback, useEffect, useState } from "react";
import { Bookmark, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/lib/auth-context";
import { getAccessToken, ptError } from "@/lib/auth";
import { getSavedItems, toggleSavedItem } from "@/lib/area-do-pai/area.functions";
import type { SavedItemType, SavedItemView } from "@/lib/area-do-pai/types";
import { AreaShell, Card } from "@/components/area-do-pai/AreaShell";
import { formatDateShort } from "@/lib/site";
import { cn } from "@/lib/utils";

// /area-do-pai/salvos (doc 07 §4.11): filtros por tipo e "Remover" via toggleSavedItem.

const FILTERS: Array<{ value: SavedItemType | "all"; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "post", label: "Artigos" },
  { value: "product", label: "Produtos" },
  { value: "tool", label: "Ferramentas" },
  { value: "job", label: "Vagas" },
  { value: "track", label: "Trilhas" },
];

export default function SalvosPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedItemView[]>([]);
  const [filter, setFilter] = useState<SavedItemType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return setLoading(false);
    try {
      setItems(await getSavedItems({ data: { accessToken } }));
    } catch (e) {
      toast.error(ptError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const remove = async (it: SavedItemView) => {
    setBusy(it.id);
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("Sessão expirada. Entre novamente.");
      await toggleSavedItem({ data: { accessToken, itemType: it.item_type, itemId: it.item_id } });
      setItems((l) => l.filter((x) => x.id !== it.id));
      toast.success("Removido dos salvos.");
    } catch (e) {
      toast.error(ptError(e));
    } finally {
      setBusy(null);
    }
  };

  const visible = filter === "all" ? items : items.filter((i) => i.item_type === filter);

  return (
    <AreaShell
      title="Salvos"
      description="Artigos, produtos, ferramentas, vagas e trilhas que você guardou."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.value === "all" ? items.length : items.filter((i) => i.item_type === f.value).length;
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
              )}
            >
              {f.label} <span className="opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Carregando…
        </p>
      ) : visible.length === 0 ? (
        <Card>
          <div className="py-6 text-center">
            <Bookmark className="mx-auto h-10 w-10 text-primary" aria-hidden />
            <p className="mt-3 font-display text-xl font-bold">Nada salvo por aqui ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use o botão "Salvar" nos artigos do{" "}
              <Link to="/blog" className="font-bold text-primary">
                Blog
              </Link>
              , nos produtos da{" "}
              <Link to="/loja" className="font-bold text-primary">
                Loja do Pai
              </Link>{" "}
              e na{" "}
              <Link to="/ferramentas" className="font-bold text-primary">
                Caixa de Ferramentas
              </Link>
              .
            </p>
          </div>
        </Card>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((it) => (
            <li
              key={it.id}
              className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft"
            >
              {it.image ? (
                <img
                  src={it.image}
                  alt=""
                  loading="lazy"
                  className="h-20 w-24 shrink-0 rounded-lg bg-muted object-cover"
                />
              ) : (
                <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Bookmark className="h-5 w-5" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {FILTERS.find((f) => f.value === it.item_type)?.label ?? it.item_type} ·{" "}
                  {formatDateShort(it.created_at)}
                </p>
                <Link
                  to={it.href}
                  className={cn(
                    "line-clamp-2 font-semibold hover:text-primary",
                    !it.found && "text-muted-foreground",
                  )}
                >
                  {it.title}
                </Link>
                <button
                  type="button"
                  onClick={() => remove(it)}
                  disabled={busy === it.id}
                  className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-destructive disabled:opacity-60"
                >
                  {busy === it.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AreaShell>
  );
}
