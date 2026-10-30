import { getRouteApi } from "@tanstack/react-router";
import { AdSlot } from "@/components/blog/AdSlot";
import { AreaDoPaiCta } from "@/components/home/AreaDoPaiCta";
import { HomeCategories } from "@/components/home/HomeCategories";
import { HomeHero } from "@/components/home/HomeHero";
import { LatestArticles } from "@/components/home/LatestArticles";
import { LojaTeaser } from "@/components/home/LojaTeaser";
import { MostRead } from "@/components/home/MostRead";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { PaiIndicaTeaser } from "@/components/home/PaiIndicaTeaser";
import { ToolsTeaser } from "@/components/home/ToolsTeaser";
import { unwirePosts } from "@/lib/hub.functions";
import { unwirePaiIndica } from "@/lib/home.functions";

const homeRouteApi = getRouteApi("/_site/");

// Home da Fase 1 (doc 03 §5.2), nas 9 seções e na ordem fixa do plano:
// 1 Hero · 2 Últimos artigos · 3 Pai Indica · 4 Caixa de Ferramentas ·
// 5 Categorias · 6 CTA Área do Pai · 7 Newsletter · 8 Loja do Pai · 9 Mais lidos.
// Tudo vem do loader da rota (SSR): o HTML chega pronto, sem esqueleto.
// Com banco vazio cada seção mostra um estado vazio amigável.
export default function Home() {
  const data = homeRouteApi.useLoaderData();
  const latest = unwirePosts(data.latest);
  const popular = unwirePosts(data.popular);
  const paiIndica = unwirePaiIndica(data.paiIndica);
  // Se a consulta das categorias-mãe falhar, cai nas categorias do hub
  // (sem as técnicas, sort_order >= 900) para a seção nunca sumir.
  const categories =
    data.mainCategories.length > 0
      ? data.mainCategories
      : data.categories.filter((c) => c.sort_order < 900).slice(0, 14);

  return (
    <div>
      <HomeHero latest={latest[0]} />

      <AdSlot format="leaderboard" className="container mt-8" />

      <div className="container mt-12 space-y-16 md:space-y-20">
        <LatestArticles posts={latest} />
        <PaiIndicaTeaser posts={paiIndica} />
        <ToolsTeaser />
        <HomeCategories categories={categories} />
        <AreaDoPaiCta />
        <NewsletterSection />
        <LojaTeaser />
        <MostRead posts={popular} />
      </div>
    </div>
  );
}
