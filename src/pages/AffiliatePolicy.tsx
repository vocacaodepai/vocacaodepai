import { BadgeCheck, Scale, ShoppingCart } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { AdSlot } from "@/components/blog/AdSlot";
import { SITE_NAME } from "@/lib/site";

// /politica-de-afiliados (doc 03 §7 e doc 11 §3.1): frase oficial da Amazon,
// aviso CONAR/CDC, redes de afiliados, faixa de preço pesquisada e as regras
// de honestidade do Pai Indica e da Loja do Pai.
const UPDATED_AT = "30 de outubro de 2026";

// Frase exata exigida pelo Programa de Associados da Amazon (doc 11 §3.1).
export const AMAZON_DISCLOSURE =
  "Como participante do Programa de Associados da Amazon, sou remunerado pelas compras qualificadas efetuadas.";

const PROMISES = [
  {
    icon: BadgeCheck,
    title: "A comissão não muda a nota",
    text: "Nota ruim quando o produto é ruim, mesmo com link de afiliado. O defeito aparece no mesmo tamanho do elogio, e dizemos para quem o produto não serve.",
  },
  {
    icon: ShoppingCart,
    title: "A comissão não muda o seu preço",
    text: "Você paga exatamente o mesmo valor que pagaria entrando direto na loja. A comissão sai da margem do varejista, não do seu bolso.",
  },
  {
    icon: Scale,
    title: "Recomendamos o que indicaríamos a um amigo",
    text: "Se não compraríamos para a nossa casa, não entra no Pai Indica nem na Loja do Pai. Não há produto pago para aparecer bem.",
  },
];

export default function AffiliatePolicy() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold">Política de afiliados</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {UPDATED_AT}</p>

      <AdSlot format="leaderboard" className="mt-6" />

      <aside
        className="aviso-afiliado mt-6 rounded-2xl border-l-4 border-primary bg-primary/10 p-5"
        aria-label="Aviso de afiliado"
      >
        <p className="font-display text-lg font-bold">{AMAZON_DISCLOSURE}</p>
        <p className="mt-2 text-sm text-foreground/80">
          Este conteúdo contém publicidade na forma de links de afiliado (CONAR/CDC art. 36).
        </p>
      </aside>

      <div className="mt-8 space-y-8 leading-relaxed text-foreground/80">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground">
            1. Como o {SITE_NAME} ganha dinheiro
          </h2>
          <p className="mt-2">
            O site é gratuito para você. Ele se paga de duas formas: anúncios do Google AdSense e
            links de afiliado. Quando você clica em um link de afiliado e compra na loja, recebemos
            uma pequena comissão sobre a venda, sem custo extra para você. É isso que paga
            hospedagem, pesquisa, fotos e o tempo de quem escreve.
          </p>
          <p className="mt-2">
            Participamos do Programa de Associados da Amazon Brasil. Outras redes (Mercado Livre,
            Shopee, Hotmart) poderão ser ativadas no futuro; quando isso acontecer, esta página será
            atualizada e cada link seguirá as mesmas regras descritas aqui.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">
            2. Como reconhecer um link de afiliado
          </h2>
          <p className="mt-2">
            O botão de compra do site tem sempre o mesmo texto:{" "}
            <strong>“Comprar agora na Amazon”</strong>. Ele abre a página do produto na Amazon em
            uma nova aba e leva o nosso identificador de associado. Toda página com link de afiliado
            mostra um aviso curto e aponta para esta política. Nunca usamos encurtadores escondidos,
            pop-ups nem links em e-mails que você não pediu.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">3. O que prometemos</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PROMISES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5 shadow-soft"
              >
                <item.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-display text-base font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">
            4. Preço: faixa pesquisada, nunca valor exato
          </h2>
          <p className="mt-2">
            Os preços exibidos no Pai Indica e na Loja do Pai são <strong>faixas</strong>, não
            valores exatos. A faixa é consultada na internet como um todo, em pelo menos duas lojas,
            para o mesmo produto (mesma marca, modelo e cor), e traz a data da pesquisa. Não é o
            preço da Amazon, que pode variar a qualquer momento: o valor do dia aparece ao clicar no
            botão de compra.
          </p>
          <p className="mt-2">
            Por isso você nunca verá no texto “desconto de X%”, “menor preço” ou promessa de
            promoção. Se uma faixa parecer errada, avise pela página de contato e nós refazemos a
            pesquisa.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">5. Como avaliamos</h2>
          <p className="mt-2">
            As análises do Pai Indica se baseiam em especificações oficiais do fabricante, manuais,
            fontes especializadas e relatos públicos de consumidores fora da Amazon. Não alegamos
            teste físico que não aconteceu: quando um produto foi usado em casa, o artigo diz isso
            com todas as letras. A nota vai de 0 a 10, com cinco critérios e pesos informados, e a
            régua é explicada no topo do Pai Indica. A nota de compradores da loja, quando aparece,
            é outra coisa e nunca substitui a nota editorial.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">
            6. O que a Amazon e a lei exigem de nós
          </h2>
          <p className="mt-2">
            Exibimos a frase oficial do Programa de Associados em destaque nesta página, no rodapé e
            acima do primeiro link de afiliado de cada review. Marcamos os links como patrocinados
            para os buscadores. Não sugerimos endosso da Amazon (“recomendado pela Amazon” ou
            “parceiro oficial”) e não oferecemos nenhum incentivo para você clicar. Seguimos o
            Código de Defesa do Consumidor e as normas do CONAR sobre publicidade identificada.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground">7. Dúvidas</h2>
          <p className="mt-2">
            Se algo nesta política não ficou claro, ou se você acha que um review deixou de dizer
            alguma coisa, fale com a gente pela{" "}
            <Link to="/contato" className="font-semibold text-primary">
              página de contato
            </Link>
            . Veja também a{" "}
            <Link to="/politica-de-privacidade" className="font-semibold text-primary">
              Política de privacidade
            </Link>{" "}
            e os{" "}
            <Link to="/termos-de-uso" className="font-semibold text-primary">
              Termos de uso
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
