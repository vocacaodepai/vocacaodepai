import { useMemo, useState } from "react";
import { Heart, Shuffle } from "lucide-react";
import { CHILD_NAMES, ORIGENS, type ChildName } from "@/lib/tools/nomes-data";
import { usePersisted } from "@/hooks/usePersisted";
import { SelectField } from "@/components/ferramentas/NumberField";
import { ToolShareButton } from "@/components/ferramentas/ToolShareButton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/lib/router-compat";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const LETRAS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_FAV = 10;

function somEstranho(nome: string, sobrenome: string) {
  if (!sobrenome) return false;
  const a = norm(nome).slice(-1);
  const b = norm(sobrenome.trim()).slice(0, 1);
  return Boolean(a && b && a === b);
}

export default function ChildNames() {
  const [sexo, setSexo] = useState<"todos" | "menino" | "menina">("todos");
  const [letra, setLetra] = useState("");
  const [origem, setOrigem] = useState("todas");
  const [soSantos, setSoSantos] = useState(false);
  const [soBiblicos, setSoBiblicos] = useState(false);
  const [busca, setBusca] = useState("");
  const [sobrenome, setSobrenome] = useState("");
  const [sorteio, setSorteio] = useState<string[] | null>(null);
  const [favoritos, setFavoritos] = usePersisted<string[]>("vdp:tool:nomes-de-filhos", []);

  const filtrados = useMemo(() => {
    const q = norm(busca.trim());
    return CHILD_NAMES.filter(
      (n) =>
        (sexo === "todos" || n.sex === sexo || n.sex === "unissex") &&
        (!letra || norm(n.name).startsWith(norm(letra))) &&
        (origem === "todas" || n.origin === origem) &&
        (!soSantos || n.saint) &&
        (!soBiblicos || n.biblical) &&
        (!q || norm(n.name).includes(q) || norm(n.meaning).includes(q)),
    );
  }, [sexo, letra, origem, soSantos, soBiblicos, busca]);
  const lista = sorteio
    ? filtrados.filter((n) => sorteio.includes(n.name))
    : filtrados.slice(0, 120);

  const sortear = () => {
    const pool = [...filtrados];
    const out: string[] = [];
    while (pool.length && out.length < 5)
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].name);
    setSorteio(out);
  };
  const toggleFav = (name: string) =>
    setFavoritos((p) =>
      p.includes(name) ? p.filter((x) => x !== name) : p.length >= MAX_FAV ? p : [...p, name],
    );
  const favs = favoritos
    .map((f) => CHILD_NAMES.find((n) => n.name === f))
    .filter(Boolean) as ChildName[];

  const Card = ({ n }: { n: ChildName }) => {
    const fav = favoritos.includes(n.name);
    const estranho = somEstranho(n.name, sobrenome);
    return (
      <li className="flex flex-col rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-display text-xl font-bold">
              {sobrenome.trim() ? `${n.name} ${sobrenome.trim()}` : n.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {n.sex} · {n.origin}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggleFav(n.name)}
            aria-pressed={fav}
            aria-label={fav ? "Remover dos favoritos" : "Favoritar"}
            className={`rounded-full border p-2 ${fav ? "border-destructive text-destructive" : "border-border hover:border-primary"}`}
          >
            <Heart className="h-4 w-4" fill={fav ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="mt-2 text-sm">{n.meaning}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {n.saint && (
            <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              Santo
            </span>
          )}
          {n.biblical && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Bíblico
            </span>
          )}
          {estranho && (
            <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              som emenda com o sobrenome
            </span>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <form
        className="space-y-4 rounded-2xl border border-border bg-card p-5"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <Label htmlFor="busca">Buscar nome ou significado</Label>
          <Input
            id="busca"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setSorteio(null);
            }}
            className="mt-1"
            placeholder="ex.: forte, luz, Mig…"
          />
        </div>
        <SelectField
          id="sexo"
          label="Para"
          value={sexo}
          onChange={(v) => {
            setSexo(v as typeof sexo);
            setSorteio(null);
          }}
          options={[
            { value: "todos", label: "Menino ou menina" },
            { value: "menino", label: "Menino" },
            { value: "menina", label: "Menina" },
          ]}
        />
        <div>
          <Label>Letra inicial</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => {
                setLetra("");
                setSorteio(null);
              }}
              className={`h-7 rounded px-2 text-xs font-bold ${!letra ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              Todas
            </button>
            {LETRAS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLetra(l);
                  setSorteio(null);
                }}
                className={`h-7 w-7 rounded text-xs font-bold ${letra === l ? "bg-primary text-primary-foreground" : "bg-muted"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <SelectField
          id="origem"
          label="Origem"
          value={origem}
          onChange={(v) => {
            setOrigem(v);
            setSorteio(null);
          }}
          options={[
            { value: "todas", label: "Todas as origens" },
            ...ORIGENS.map((o) => ({ value: o, label: o })),
          ]}
        />
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={soSantos}
              onCheckedChange={(v) => {
                setSoSantos(Boolean(v));
                setSorteio(null);
              }}
            />{" "}
            Só nomes de santos
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={soBiblicos}
              onCheckedChange={(v) => {
                setSoBiblicos(Boolean(v));
                setSorteio(null);
              }}
            />{" "}
            Só bíblicos
          </label>
        </div>
        <div>
          <Label htmlFor="sobrenome">Sobrenome da família (opcional)</Label>
          <Input
            id="sobrenome"
            value={sobrenome}
            onChange={(e) => setSobrenome(e.target.value)}
            className="mt-1"
            placeholder="ex.: Danello"
          />
        </div>
        <button
          type="button"
          onClick={sortear}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold hover:border-primary"
        >
          <Shuffle className="h-4 w-4" /> Sortear 5
        </button>
        {favs.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Favoritos ({favs.length}/{MAX_FAV})
            </p>
            <p className="mt-1 text-sm">{favs.map((f) => f.name).join(", ")}</p>
            <div className="mt-2">
              <ToolShareButton
                title="Nomes de filhos — Vocação de Pai"
                text={`Nomes que estamos pensando: ${favs.map((f) => f.name).join(", ")} — Vocação de Pai`}
              />
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Mais ideias de pai em{" "}
          <Link
            to="/categoria/paternidade-por-fase"
            className="font-bold text-primary hover:underline"
          >
            Paternidade por fase
          </Link>
          .
        </p>
      </form>
      <section aria-live="polite">
        <p className="mb-3 text-sm text-muted-foreground">
          {sorteio
            ? `Sorteio de ${lista.length} nomes`
            : `${filtrados.length} nomes encontrados${filtrados.length > 120 ? " (mostrando os 120 primeiros; refine o filtro)" : ""}`}
          {sorteio && (
            <button
              type="button"
              onClick={() => setSorteio(null)}
              className="ml-2 font-bold text-primary hover:underline"
            >
              ver todos
            </button>
          )}
        </p>
        {lista.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum nome com esses filtros. Tire um filtro e tente de novo.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((n) => (
              <Card key={n.name} n={n} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
