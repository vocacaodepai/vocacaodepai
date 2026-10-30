import { ArrowRight, Bookmark, Flag, GraduationCap, Users } from "lucide-react";
import { Link } from "@/lib/router-compat";

// Seção 6 da home: faixa da Área do Pai. Na Fase 1 o botão leva ao placeholder
// /area-do-pai; a Fase 5 troca o destino para /cadastro.
const PERKS = [
  { icon: GraduationCap, label: "Trilhas de formação" },
  { icon: Flag, label: "Desafios de 30 dias" },
  { icon: Bookmark, label: "Conteúdos salvos" },
  { icon: Users, label: "Irmandade" },
];

export function AreaDoPaiCta() {
  return (
    <section
      aria-labelledby="area-do-pai-title"
      className="rounded-3xl bg-secondary p-8 text-secondary-foreground shadow-elegant md:p-12"
    >
      <div className="grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Área do Pai</p>
          <h2 id="area-do-pai-title" className="mt-2 font-display text-3xl font-bold md:text-4xl">
            Trilhas de formação, desafios de 30 dias, conteúdos salvos e a Irmandade. Grátis.
          </h2>
          <p className="mt-3 max-w-xl text-sm opacity-90 md:text-base">
            Cadastre seus filhos e receba o conteúdo certo para a idade deles. Seu painel de pai,
            sem mensalidade e sem enrolação.
          </p>
          <Link
            to="/area-do-pai"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-soft transition-colors hover:bg-primary/90"
          >
            Criar minha conta
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {PERKS.map((perk) => (
            <li
              key={perk.label}
              className="flex items-center gap-3 rounded-2xl bg-background/10 p-4 text-sm font-semibold backdrop-blur"
            >
              <perk.icon className="h-5 w-5 shrink-0 text-primary" />
              {perk.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
