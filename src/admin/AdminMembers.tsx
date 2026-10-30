import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Navigate, useOutletContext } from "@/lib/router-compat";
import { db } from "@/lib/area-do-pai/client";
import { formatDateShort } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { AdminOutletContext } from "./AdminLayout";

// /admin/membros (doc 07 §10): somente role = 'admin' (editor é redirecionado para /admin).
// Dados via admin_list_members / admin_member_stats / admin_set_role (0013; log em moderation_log).

interface MemberRow {
  id: string;
  email: string;
  display_name: string;
  role: "member" | "editor" | "admin";
  city: string | null;
  uf: string | null;
  onboarding_done: boolean;
  newsletter_opt_in: boolean;
  plan_slug: string;
  children_count: number;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Stats {
  total: number;
  new_7d: number;
  onboarding_done: number;
  newsletter_confirmed: number;
  premium: number;
}

const PAGE = 50;

export default function AdminMembers() {
  const { profile } = useOutletContext<AdminOutletContext>();
  const isAdmin = profile.role === "admin";
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) toast.error("Acesso restrito a administradores");
  }, [isAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data, error }, { data: st }] = await Promise.all([
        db.rpc("admin_list_members", {
          p_search: query || null,
          p_limit: PAGE,
          p_offset: page * PAGE,
        }),
        db.rpc("admin_member_stats"),
      ]);
      if (error) throw error;
      setRows((data ?? []) as MemberRow[]);
      setStats((st as Stats | null) ?? null);
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível carregar os membros.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, load]);

  if (!isAdmin) return <Navigate to="/admin" replace />;

  const setRole = async (m: MemberRow, role: MemberRow["role"]) => {
    if (role === m.role) return;
    if (!confirm(`Mudar o papel de ${m.email} para "${role}"?`)) return;
    setChanging(m.id);
    try {
      const { error } = await db.rpc("admin_set_role", { p_user: m.id, p_role: role });
      if (error) throw error;
      setRows((l) => l.map((r) => (r.id === m.id ? { ...r, role } : r)));
      toast.success("Papel atualizado e registrado no log.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível alterar o papel.");
    } finally {
      setChanging(null);
    }
  };

  const copy = (email: string) => {
    navigator.clipboard?.writeText(email).then(
      () => toast.success("E-mail copiado."),
      () => toast.error("Não foi possível copiar."),
    );
  };

  const pct = stats && stats.total ? Math.round((stats.onboarding_done / stats.total) * 100) : 0;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
            <Users className="h-7 w-7 text-primary" aria-hidden /> Membros
          </h1>
          <p className="text-sm text-muted-foreground">Lista, busca e papéis da Área do Pai.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setPage(0);
            setQuery(search.trim());
          }}
          className="flex gap-2"
          role="search"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por e-mail ou nome"
            aria-label="Buscar membros"
            className="h-10 w-64 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-1 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground"
          >
            <Search className="h-4 w-4" /> Buscar
          </button>
        </form>
      </div>

      {stats && (
        <div className="mb-6 grid gap-3 sm:grid-cols-5">
          {[
            ["Membros", stats.total],
            ["Novos em 7 dias", stats.new_7d],
            ["Onboarding concluído", `${pct}%`],
            ["Newsletter confirmada", stats.newsletter_confirmed],
            ["Premium ativos", stats.premium],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-display text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">E-mail</th>
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2">Plano</th>
              <th className="px-3 py-2">Filhos</th>
              <th className="px-3 py-2">Onboarding</th>
              <th className="px-3 py-2">Newsletter</th>
              <th className="px-3 py-2">Cadastro</th>
              <th className="px-3 py-2">Último login</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Carregando…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-muted-foreground">
                  Nenhum membro encontrado.
                </td>
              </tr>
            ) : (
              rows.map((m) => (
                <tr key={m.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{m.email}</td>
                  <td className="px-3 py-2">
                    {m.display_name}
                    {m.city && (
                      <span className="block text-xs text-muted-foreground">
                        {m.city}
                        {m.uf ? `/${m.uf}` : ""}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={m.role}
                      disabled={m.id === profile.id || changing === m.id}
                      onChange={(e) => setRole(m, e.target.value as MemberRow["role"])}
                      className={cn(
                        "h-8 rounded-md border border-input bg-background px-2 text-xs font-bold",
                        m.role === "admin" && "text-destructive",
                        m.role === "editor" && "text-primary",
                      )}
                    >
                      <option value="member">member</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">{m.plan_slug}</td>
                  <td className="px-3 py-2">{m.children_count}</td>
                  <td className="px-3 py-2">{m.onboarding_done ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2">{m.newsletter_opt_in ? "Sim" : "Não"}</td>
                  <td className="px-3 py-2">{formatDateShort(m.created_at)}</td>
                  <td className="px-3 py-2">
                    {m.last_sign_in_at ? formatDateShort(m.last_sign_in_at) : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => copy(m.email)}
                      aria-label="Copiar e-mail"
                      className="flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-primary"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <button
          type="button"
          disabled={page === 0 || loading}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          className="rounded-lg border border-border px-3 py-1.5 font-bold disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-muted-foreground">Página {page + 1}</span>
        <button
          type="button"
          disabled={rows.length < PAGE || loading}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg border border-border px-3 py-1.5 font-bold disabled:opacity-50"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
