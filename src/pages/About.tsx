import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Author } from "@/lib/types";
import { useSeo, organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE_NAME, SITE_DESCRIPTION, DEFAULT_AUTHOR } from "@/lib/site";
import { AdSlot } from "@/components/blog/AdSlot";
import { ArticlesStrip } from "@/components/blog/ArticlesStrip";

export default function About() {
  const [team, setTeam] = useState<Author[]>([]);

  useSeo({
    title: "Sobre",
    description: `Conheça o ${SITE_NAME}: quem escreve, por que existimos e em que acreditamos. ${SITE_DESCRIPTION}`,
    canonicalPath: "/sobre",
    jsonLd: [organizationJsonLd(), websiteJsonLd()],
  });

  useEffect(() => {
    // "Quem escreve" apresenta o autor da casa (DEFAULT_AUTHOR).
    // TODO Fase 1 (etapa 7, páginas institucionais): usar get_public_profile do doc 02.
    supabase
      .from("public_authors")
      .select("id, full_name, bio, avatar_url, role")
      .eq("full_name", DEFAULT_AUTHOR)
      .maybeSingle()
      .then(
        ({ data }) => setTeam(data ? [data as Author] : []),
        () => {},
      );
  }, []);

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold">Sobre o {SITE_NAME}</h1>

      <AdSlot format="leaderboard" className="mt-6" />

      <section className="mt-8 space-y-4 leading-relaxed text-foreground/80">
        <p>
          O <strong>{SITE_NAME}</strong> nasceu de uma percepção simples: o homem que vira pai
          recebe cobrança demais e formação de menos. Entre conselhos contraditórios, pressa no
          trabalho e a vontade de acertar em casa, fica difícil saber por onde começar.
        </p>
        <p>
          Aqui, você encontra conteúdo sobre{" "}
          <strong>
            paternidade, casamento, família, trabalho, finanças da casa, fé e formação do homem
          </strong>{" "}
          — escrito com base em fontes confiáveis, mas com a linguagem direta de quem vive a
          paternidade na prática. É conversa de homem para homem.
        </p>
        <p>
          Não prometemos fórmulas mágicas nem rotinas perfeitas. Prometemos informação honesta,
          firme e útil para o seu dia a dia real como pai, marido e provedor.
        </p>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Sparkles,
            title: "Baseado em evidências",
            text: "Consultamos fontes confiáveis, como sociedades médicas, órgãos oficiais e a doutrina da Igreja.",
          },
          {
            icon: Heart,
            title: "Família em primeiro lugar",
            text: "Pai, mãe e filhos. Nosso papel é formar o homem para servir e liderar a sua família.",
          },
          {
            icon: ShieldCheck,
            title: "Privacidade em primeiro lugar",
            text: "Seus dados são usados apenas para o funcionamento do blog e da newsletter.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-border bg-card p-5 shadow-soft"
          >
            <item.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 font-display text-base font-bold">{item.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl font-bold">Quem escreve</h2>
        <div className="mt-4 grid gap-4">
          {team.length === 0 && (
            <p className="text-sm text-muted-foreground">Carregando equipe...</p>
          )}
          {team.map((author) => (
            <div
              key={author.id}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-2xl font-bold text-secondary-foreground">
                {author.full_name.charAt(0)}
              </span>
              <div>
                <p className="font-display text-lg font-bold">{author.full_name}</p>
                {author.bio && (
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {author.bio}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-gradient-primary p-6 text-primary-foreground">
        <h2 className="font-display text-xl font-bold">Nosso compromisso</h2>
        <p className="mt-2 text-sm leading-relaxed opacity-95">
          Este é um espaço feito com seriedade, sem pressa e sem sensacionalismo. Se você encontrou
          aqui uma informação que te ajudou, queremos saber. Se encontrou algo que gostaria de ver
          aprofundado, também.{" "}
          <Link to="/contato" className="font-bold underline underline-offset-2">
            Escreva para a gente
          </Link>
          .
        </p>
      </section>

      {/* Continue no ecossistema */}
      <ArticlesStrip />
      {/* TODO Fase 3 (Loja do Pai): StorePromo */}
    </div>
  );
}
