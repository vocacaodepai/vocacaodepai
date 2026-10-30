import { ArrowRight, ExternalLink, Users } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { AdSlot } from "@/components/blog/AdSlot";
import { ArticlesStrip } from "@/components/blog/ArticlesStrip";
import { DEFAULT_AUTHOR, SITE_NAME } from "@/lib/site";

// /sobre (doc 03 §7): Manifesto do Vocação de Pai (doc 00 §8, colado sem
// alterar), quem faz e o grupo VDP. H1 fixo "Sobre o Vocação de Pai".
const GROUP_SITES = [
  {
    name: "Vocação de Mãe",
    url: "https://vocacaodemae.com.br",
    text: "Para a sua esposa: o site irmão, feito pela mãe da casa para as outras mães.",
  },
  {
    name: "Portal da AI",
    url: "https://www.portaldaai.com.br",
    text: "Inteligência artificial explicada para quem trabalha e cuida de família.",
  },
  {
    name: "Review Produtos",
    url: "https://reviewprodutos.com.br",
    text: "Reviews e comparativos de produto com o mesmo padrão de honestidade.",
  },
];

export default function About() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold md:text-5xl">Sobre o {SITE_NAME}</h1>

      <AdSlot format="leaderboard" className="mt-6" />

      <article className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-display prose-headings:font-bold prose-p:leading-relaxed prose-p:text-foreground/85 prose-a:text-primary prose-strong:text-foreground">
        <p>
          <strong>Ser pai é um chamado. A gente ajuda você a atender.</strong>
        </p>
        <p>
          Ninguém nasce sabendo ser pai. A maioria de nós aprendeu olhando para o próprio pai:
          alguns para imitar, outros para fazer diferente. Quase todos chegamos à maternidade com a
          mulher que amamos sabendo mais do berço, da febre e do choro do que nós. E, no primeiro
          dia em casa com o bebê, descobrimos que o mundo tem muito conteúdo para a mãe e quase nada
          para o homem que está ali do lado, querendo acertar.
        </p>
        <p>
          O Vocação de Pai nasceu dessa falta. Nasceu numa casa de verdade, ao lado do Vocação de
          Mãe, feito por um marido para os outros maridos. É um site para o homem inteiro: o que
          troca a fralda e o que troca o pneu, o que reza o terço e o que acende a churrasqueira, o
          que negocia o salário e o que ensina o filho a andar de bicicleta. Porque a casa precisa
          de tudo isso, e precisa que venha do mesmo homem.
        </p>

        <h2>No que acreditamos</h2>
        <p>
          Acreditamos que família é pai, mãe e filhos, e que o casamento entre um homem e uma mulher
          é a base de uma casa que dura. Acreditamos que o pai é chamado a liderar servindo: a
          autoridade dele se mede pelo quanto protege, provê, ensina e dá o exemplo, não pelo quanto
          grita. Acreditamos que os filhos são dom, não fardo, e que cada um deles tem o direito de
          crescer com um pai presente. E acreditamos que nada disso se sustenta sem Deus: São José,
          o homem silencioso que segurou a casa de Nazaré, é o nosso modelo.
        </p>
        <p>
          Somos católicos e não escondemos isso. Mas a porta está aberta para todo homem que quer
          ser um pai melhor, seja qual for o ponto em que ele está: o noivo que se prepara, o pai de
          primeira viagem, o pai de cinco, o pai separado que quer continuar presente, o viúvo que
          agora cuida de tudo, o avô que quer deixar legado.
        </p>

        <h2>O que você encontra aqui</h2>
        <p>
          <strong>Artigos</strong> escritos para homem adulto, fase por fase: o que fazer, por que
          fazer e para quem serve. <strong>Pai Indica</strong>, reviews honestos de produto para a
          casa, o carro, a churrasqueira e o filho, com nota de 0 a 10 e defeito no mesmo tamanho do
          elogio. <strong>Loja do Pai</strong>, porque o pai também quer desconto, com faixa de
          preço pesquisada e sem truque. <strong>Caixa de Ferramentas</strong>: conversor de moedas,
          mercado financeiro, cortes de carne, calculadora de churrasco, orçamento familiar.{" "}
          <strong>Área do Pai</strong>, o seu painel, com conteúdo pela idade dos seus filhos.{" "}
          <strong>Pai Indica Pai</strong>, onde um pai indica vaga, profissional e mentoria para
          outro pai. <strong>Irmandade</strong>, para você não caminhar sozinho.{" "}
          <strong>Formação</strong>, trilhas e desafios para crescer como pai, marido e homem de fé.
        </p>

        <h2>O que prometemos</h2>
        <p>
          Resposta antes da explicação. Para quem é e para quem não é. Falar com você como homem
          adulto. Família tradicional, sem exceção. Honestidade com produto e dinheiro: faixa de
          preço, nunca preço inventado; nota ruim quando o produto é ruim, mesmo com link de
          afiliado. Cautela em saúde, direito e investimento: informamos, e dizemos quando procurar
          um médico, um advogado ou um padre. E sempre um próximo passo.
        </p>

        <h2>O que não fazemos</h2>
        <p>
          Não fazemos piada do pai atrapalhado. Não falamos mal da sua esposa. Não vendemos aposta,
          atalho financeiro nem remédio milagroso. Não publicamos vulgaridade, pornografia nem
          machismo de internet. Não tratamos família como opinião.
        </p>

        <h2>Quem faz</h2>
        <p>
          O Vocação de Pai é um site do grupo VDP, o mesmo do Vocação de Mãe, do Portal da AI, do
          Review Produtos e do Blog do Bitcoin. É feito por uma família que acredita no que escreve.
          Participamos do Programa de Associados da Amazon: quando você compra pelos nossos links,
          recebemos uma comissão, sem custo extra para você. Isso paga o site e não muda nenhuma
          nota.
        </p>
        <p>
          Se você chegou até aqui, provavelmente é um homem que quer acertar. Então seja bem-vindo.
          Cadastre-se na <Link to="/area-do-pai">Área do Pai</Link>, receba a Jogada do Dia e venha
          para a <Link to="/irmandade">Irmandade</Link>. A casa precisa de você inteiro.
        </p>
        <p>
          <strong>Vocação de Pai. Para o homem que segura a casa.</strong>
        </p>
      </article>

      <section className="mt-12" aria-labelledby="quem-faz-title">
        <h2 id="quem-faz-title" className="font-display text-2xl font-bold">
          Quem está por trás
        </h2>
        <div className="mt-4 flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary font-display text-2xl font-bold text-primary-foreground">
            {DEFAULT_AUTHOR.charAt(0)}
          </span>
          <div>
            <p className="font-display text-lg font-bold">{DEFAULT_AUTHOR}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Fundador e editor
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Marido, pai e católico. Cuida do Vocação de Pai e dos outros sites do grupo VDP ao
              lado da esposa, que faz o Vocação de Mãe. Escreve de homem para homem, com a
              experiência de quem segura a própria casa e a honestidade de quem não precisa vender
              nada que não indicaria a um irmão.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="grupo-title">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 id="grupo-title" className="font-display text-2xl font-bold">
            O grupo VDP
          </h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Mesma família, mesma fé, mesmo padrão de honestidade. Sites irmãos do Vocação de Pai:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {GROUP_SITES.map((site) => (
            <a
              key={site.url}
              href={site.url}
              target="_blank"
              rel="noopener"
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-elegant"
            >
              <span className="inline-flex items-center gap-1.5 font-display text-base font-bold">
                {site.name}
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground transition-colors group-hover:text-primary" />
              </span>
              <span className="mt-1 text-sm text-muted-foreground">{site.text}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-gradient-primary p-6 text-primary-foreground">
        <h2 className="font-display text-xl font-bold">Fale com a gente</h2>
        <p className="mt-2 text-sm leading-relaxed opacity-95">
          Achou um erro, quer sugerir uma pauta ou propor uma parceria? A porta está aberta.{" "}
          <Link
            to="/contato"
            className="inline-flex items-center gap-1 font-bold underline underline-offset-2"
          >
            Escreva para a gente
            <ArrowRight className="h-4 w-4" />
          </Link>
        </p>
      </section>

      <ArticlesStrip />
    </div>
  );
}
