import { Link } from "@/lib/router-compat";
import { AdSlot } from "@/components/blog/AdSlot";
import { SITE_NAME } from "@/lib/site";

// /termos-de-uso (doc 03 §7): conteúdo informativo (não substitui médico,
// advogado ou contador), regras de convivência da comunidade, conta na Área
// do Pai, links de afiliado e propriedade intelectual.
const UPDATED_AT = "30 de outubro de 2026";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Aceitação dos termos",
    body: [
      `Ao acessar e usar o ${SITE_NAME} (vocacaodepai.com.br), você concorda com estes Termos de Uso e com a nossa Política de Privacidade. Se não concordar com qualquer parte deles, pedimos que não utilize o site.`,
    ],
  },
  {
    title: "2. Natureza do conteúdo: informação, não parecer profissional",
    body: [
      "Todo o conteúdo do site (artigos, reviews, comparativos, ferramentas, trilhas, desafios, respostas na Irmandade) tem caráter informativo e educacional. Ele não substitui a orientação de médico, psicólogo, advogado, contador, consultor financeiro ou sacerdote.",
      "Em caso de dúvida sobre a sua saúde ou a da sua família, sobre um direito, um contrato, uma dívida ou um investimento, procure um profissional qualificado. Nunca adie nem ignore uma consulta por causa de algo que leu aqui. O Semáforo do Pai, presente nos artigos, existe justamente para dizer quando é hora de buscar ajuda.",
      "As ferramentas da Caixa de Ferramentas (conversor de moedas, mercado financeiro, calculadoras) usam dados públicos que podem atrasar ou conter erro, e não constituem recomendação de investimento.",
    ],
  },
  {
    title: "3. Conta na Área do Pai",
    body: [
      "A conta é pessoal, gratuita e destinada a maiores de 18 anos. Você é responsável por manter a senha em sigilo e por tudo o que for feito com a sua conta. Informe dados verdadeiros; os dados dos filhos cadastrados são usados só para adequar o conteúdo à idade deles.",
      "Podemos suspender ou encerrar contas que violem estes termos, usem o site para spam, fraude ou assédio, ou publiquem conteúdo proibido pela seção 4. Você pode excluir a sua conta a qualquer momento.",
    ],
  },
  {
    title: "4. Comunidade: regras de convivência",
    body: [
      "Comentários, histórias, perguntas, respostas, vagas e indicações enviados por membros passam por moderação antes de aparecer publicamente. Ao enviar, você garante que o conteúdo é seu ou que tem autorização para publicá-lo.",
      "É proibido: ofensa, ataque pessoal e discurso de ódio; vulgaridade, pornografia ou sensualidade; apologia a drogas ou a crime; propaganda política partidária; promessa de ganho financeiro fácil; venda ou divulgação não autorizada; divulgação de dados pessoais de terceiros; desprezo pela mulher, pela mãe ou pela família; e qualquer conteúdo contrário à linha editorial do site, que é a visão católica de família formada por pai, mãe e filhos.",
      "A conversa aqui é de homem para homem: direta, firme e respeitosa. Reservamo-nos o direito de editar, recusar ou remover conteúdos que não cumpram estas regras, sem aviso prévio, e de registrar as decisões de moderação.",
      "Vagas, profissionais e mentorias do Pai Indica Pai são indicações entre pais. Não garantimos a veracidade das informações nem o resultado de qualquer contratação; confira sempre antes de fechar negócio.",
    ],
  },
  {
    title: "5. Links de afiliado, anúncios e links externos",
    body: [
      `O ${SITE_NAME} participa do Programa de Associados da Amazon e pode exibir anúncios. Quando você compra por um link de afiliado, recebemos uma comissão, sem custo extra para você. Isso não muda a nota nem a opinião sobre o produto. Os preços mostrados são faixas pesquisadas, não valores exatos; o preço do dia é o da loja no momento da compra.`,
      "Links para sites de terceiros (lojas, fontes, sites do grupo VDP) são oferecidos como conveniência. Não respondemos pelo conteúdo, pelas práticas de privacidade nem pelas transações feitas fora do nosso site.",
    ],
  },
  {
    title: "6. Propriedade intelectual",
    body: [
      `Textos, imagens próprias, marcas, logotipos, nomes de seções (Pai Indica, Loja do Pai, Caixa de Ferramentas, Área do Pai, Pai Indica Pai, Irmandade, Formação, Semáforo do Pai) e elementos visuais pertencem ao ${SITE_NAME} ou aos seus licenciantes e são protegidos pela legislação de direitos autorais.`,
      "É proibida a reprodução total ou parcial sem autorização prévia e por escrito. Citações curtas com atribuição e link para a página de origem são permitidas. Fotos de terceiros (bancos de imagem, Wikimedia Commons, fabricantes) seguem as licenças indicadas em cada uso.",
      "Ao enviar conteúdo à comunidade, você nos concede licença gratuita, não exclusiva e por prazo indeterminado para publicá-lo, editá-lo e divulgá-lo no site e nos canais do grupo VDP, sempre com respeito à sua autoria.",
    ],
  },
  {
    title: "7. Limitação de responsabilidade",
    body: [
      "Trabalhamos para manter as informações corretas e atualizadas, mas o conteúdo é fornecido no estado em que se encontra, sem garantia de exatidão, integridade ou adequação a uma finalidade específica. Preços, especificações e disponibilidade de produtos mudam sem aviso.",
      `O ${SITE_NAME} não se responsabiliza por decisões tomadas com base exclusivamente no conteúdo do site, nem por danos decorrentes do uso ou da indisponibilidade dele.`,
    ],
  },
  {
    title: "8. Alterações dos termos",
    body: [
      "Estes termos podem ser atualizados quando o site ganhar novas seções. A versão vigente fica sempre nesta página, com a data no topo. O uso continuado do site após a mudança significa que você aceitou os novos termos.",
    ],
  },
  {
    title: "9. Lei aplicável",
    body: [
      "Estes termos são regidos pelas leis da República Federativa do Brasil. Para qualquer questão, fica eleito o foro do domicílio do consumidor, conforme o Código de Defesa do Consumidor.",
    ],
  },
];

export default function TermsOfUse() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold">Termos de uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {UPDATED_AT}</p>

      <AdSlot format="leaderboard" className="mt-6" />

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="font-display text-xl font-bold">{section.title}</h2>
            {section.body.map((p, i) => (
              <p key={i} className="mt-2 leading-relaxed text-foreground/80">
                {p}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="font-display text-xl font-bold">10. Contato</h2>
          <p className="mt-2 leading-relaxed text-foreground/80">
            Dúvidas sobre estes termos? Fale com a gente pela{" "}
            <Link to="/contato" className="font-semibold text-primary">
              página de contato
            </Link>
            . Veja também a{" "}
            <Link to="/politica-de-privacidade" className="font-semibold text-primary">
              Política de privacidade
            </Link>{" "}
            e a{" "}
            <Link to="/politica-de-afiliados" className="font-semibold text-primary">
              Política de afiliados
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
