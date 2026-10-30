import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/home/ComingSoon";
import { SITE_NAME } from "@/lib/site";

// Placeholder da Fase 1 (doc 03 §5.3): noindex e fora do sitemap até a seção abrir.
export const Route = createFileRoute("/_site/ferramentas/")({
  head: () => ({
    meta: [
      { title: `Caixa de Ferramentas | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Calculadoras e ferramentas práticas do pai: conversor de moedas, mercado financeiro, churrasco e orçamento.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <ComingSoon
      title="Caixa de Ferramentas"
      description="Calculadoras e ferramentas práticas do pai: conversor de moedas, mercado financeiro, cortes de carne, churrasco, orçamento e idade do filho."
      eta="As duas primeiras ferramentas chegam com a seção: Conversor de Moedas e Mercado Financeiro."
      source="em-breve-ferramentas"
      highlights={[
        "Conversor de moedas do Pai: dólar, euro e bitcoin em reais",
        "Mercado financeiro em um minuto: Selic, IPCA, poupança e bolsa",
        "Calculadora de churrasco e orçamento da família",
        "Tudo de graça, sem cadastro e sem conselho de investimento",
      ]}
    />
  );
}
