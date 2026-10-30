import { Link } from "@/lib/router-compat";
import { AdSlot } from "@/components/blog/AdSlot";
import { CONTACT_TO_EMAIL, SITE_NAME } from "@/lib/site";

// /politica-de-privacidade (doc 03 §7): LGPD, cookies, GA4, AdSense, Supabase
// (dados em São Paulo), newsletter com dupla confirmação, Área do Pai,
// direitos do titular e contato do encarregado (DPO).
const UPDATED_AT = "30 de outubro de 2026";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Quem somos e a quem esta política se aplica",
    body: [
      `O ${SITE_NAME} (vocacaodepai.com.br) é um site editorial do grupo VDP, voltado ao pai e ao homem de família. Esta política explica, em linguagem direta, quais dados pessoais coletamos, para que usamos, com quem compartilhamos e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).`,
      "Ela vale para todas as páginas do site: blog, Pai Indica, Loja do Pai, Caixa de Ferramentas, Área do Pai, Pai Indica Pai, Irmandade e Formação, inclusive as seções que ainda estão em construção.",
    ],
  },
  {
    title: "2. Quais dados coletamos",
    body: [
      "Dados que você nos entrega: nome e e-mail ao assinar a newsletter ou enviar o formulário de contato; nome, e-mail e texto ao comentar um artigo; e, quando a Área do Pai estiver no ar, os dados da sua conta (nome de exibição, e-mail, cidade e estado, se quiser informar) e os dados dos filhos que você cadastrar (nome ou apelido, data de nascimento e sexo), usados só para mostrar o conteúdo certo para a idade deles.",
      "Dados de navegação: páginas visitadas, tempo de leitura, dispositivo e origem do acesso, coletados de forma agregada pelo Google Analytics 4 e por contadores próprios de visualização. Esses dados não identificam você pelo nome.",
      "Dados de uso das ferramentas: registramos que uma ferramenta foi usada (e, se você estiver logado, por qual conta), sem guardar os valores que você digitou.",
      "Não coletamos dados sensíveis, como saúde, religião ou convicções, além do que você mesmo decidir escrever em um comentário, história ou pergunta.",
    ],
  },
  {
    title: "3. Para que usamos os seus dados",
    body: [
      "Enviar a newsletter que você assinou, com confirmação dupla: só passamos a enviar depois que você clica no link de confirmação, e todo e-mail traz o link para cancelar.",
      "Responder mensagens de contato, moderar comentários e conteúdos enviados por membros (vagas, indicações, histórias e perguntas), personalizar a Área do Pai e medir quais conteúdos são mais úteis para melhorar o site.",
      "Cumprir obrigações legais e proteger o site contra abuso, spam e fraude.",
      "Não vendemos, alugamos nem cedemos os seus dados pessoais a terceiros para fins de marketing.",
    ],
  },
  {
    title: "4. Com quem compartilhamos e onde os dados ficam",
    body: [
      "Supabase (banco de dados e autenticação): seus dados ficam em servidores na região de São Paulo (sa-east-1), com acesso restrito à equipe editorial e protegido por regras de segurança por linha (RLS).",
      "Vercel (hospedagem) e Resend (envio de e-mails transacionais e da newsletter) processam os dados estritamente necessários para o site funcionar e os e-mails chegarem.",
      "Google (Analytics 4 e AdSense): recebem dados de navegação e, com o seu consentimento no aviso de cookies, podem usar cookies para medir audiência e exibir anúncios. Veja a seção 6.",
      "Amazon: ao clicar em um link de afiliado você sai do nosso site; a partir daí vale a política de privacidade da Amazon. Não recebemos os seus dados de compra, só estatísticas agregadas de cliques e comissões.",
    ],
  },
  {
    title: "5. Publicidade",
    body: [
      `O ${SITE_NAME} exibe anúncios do Google AdSense e links de afiliado da Amazon. O AdSense pode usar cookies para mostrar anúncios com base nas suas visitas anteriores a este e a outros sites.`,
      "Você pode desativar a personalização de anúncios do Google em adssettings.google.com e saber mais em aboutads.info. Nossa política de afiliados explica como os links de compra funcionam.",
    ],
  },
  {
    title: "6. Cookies e consentimento",
    body: [
      "Cookies essenciais: lembram o tema (claro ou escuro), a sua sessão na Área do Pai e a sua escolha no aviso de cookies. Sem eles o site não funciona direito.",
      "Cookies de análise e publicidade: só são ativados depois que você aceita no aviso de cookies (Modo de Consentimento do Google). Você pode mudar a escolha a qualquer momento em “Preferências de cookies”, no rodapé.",
      "Você também pode bloquear cookies no navegador; nesse caso, algumas funções podem parar de funcionar.",
    ],
  },
  {
    title: "7. Por quanto tempo guardamos",
    body: [
      "Newsletter: enquanto a assinatura estiver ativa; ao cancelar, o e-mail fica marcado como descadastrado para não voltarmos a enviar.",
      "Contato e comentários: pelo tempo necessário para responder e manter o histórico editorial, ou até você pedir a exclusão.",
      "Conta na Área do Pai: enquanto a conta existir. Ao excluir a conta, apagamos os dados pessoais e dos filhos cadastrados; conteúdos públicos que você enviou podem permanecer de forma anônima.",
      "Dados de navegação agregados: pelos prazos padrão do Google Analytics.",
    ],
  },
  {
    title: "8. Segurança",
    body: [
      "Usamos HTTPS em todo o site, controle de acesso por função na equipe, regras de segurança por linha no banco de dados e senhas guardadas com hash. Nenhum sistema é infalível; se houver um incidente que afete os seus dados, avisaremos você e a autoridade competente como a LGPD exige.",
    ],
  },
  {
    title: "9. Seus direitos como titular",
    body: [
      "A LGPD garante a você: confirmar se tratamos os seus dados, acessá-los, corrigir dados incompletos ou desatualizados, pedir a anonimização, o bloqueio ou a exclusão, solicitar a portabilidade, saber com quem compartilhamos e revogar o consentimento (por exemplo, cancelando a newsletter ou desfazendo o aceite de cookies).",
      "Para exercer qualquer desses direitos, escreva para o nosso encarregado de dados (DPO) pelo e-mail abaixo ou pela página de contato. Respondemos em até 15 dias.",
    ],
  },
  {
    title: "10. Crianças e adolescentes",
    body: [
      "O site é destinado a adultos. Não coletamos intencionalmente dados de menores de 18 anos; os dados de filhos cadastrados na Área do Pai são informados pelo pai ou responsável, no seu interesse, e usados só para adequar o conteúdo à idade.",
    ],
  },
  {
    title: "11. Alterações desta política",
    body: [
      "Esta política pode ser atualizada quando o site ganhar novas funções. A versão vigente fica sempre nesta página, com a data da última atualização no topo. Mudanças relevantes serão avisadas por aqui e, para assinantes, por e-mail.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold">Política de privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: {UPDATED_AT}</p>

      <AdSlot format="leaderboard" className="mt-6" />

      <p className="mt-4 leading-relaxed text-foreground/80">
        Esta Política de Privacidade descreve como o {SITE_NAME} coleta, usa e protege os seus
        dados. Ao usar o site, você concorda com as práticas descritas abaixo. Se não concordar com
        algum ponto, fale com a gente antes de continuar.
      </p>

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
          <h2 className="font-display text-xl font-bold">
            12. Encarregado de dados (DPO) e contato
          </h2>
          <p className="mt-2 leading-relaxed text-foreground/80">
            Responsável pelo tratamento e encarregado de dados: {SITE_NAME}, grupo VDP. E-mail:{" "}
            <a href={`mailto:${CONTACT_TO_EMAIL}`} className="font-semibold text-primary">
              {CONTACT_TO_EMAIL}
            </a>
            . Você também pode usar a{" "}
            <Link to="/contato" className="font-semibold text-primary">
              página de contato
            </Link>
            . Veja também os{" "}
            <Link to="/termos-de-uso" className="font-semibold text-primary">
              Termos de uso
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
