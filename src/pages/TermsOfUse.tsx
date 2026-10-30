import { useSeo } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { AdSlot } from "@/components/blog/AdSlot";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Aceitação dos termos",
    body: [
      `Ao acessar e usar o site ${SITE_NAME}, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte deles, pedimos que não utilize o site.`,
    ],
  },
  {
    title: "2. Natureza do conteúdo",
    body: [
      "Todo o conteúdo publicado neste blog tem caráter exclusivamente informativo e educacional, e não substitui orientação médica, psicológica, jurídica ou financeira profissional.",
      "Em caso de dúvidas sobre a sua saúde ou a da sua família, procure sempre um profissional qualificado. Nunca atrase ou ignore uma consulta com base em informações encontradas aqui.",
    ],
  },
  {
    title: "3. Propriedade intelectual",
    body: [
      "Todos os textos, imagens, marcas e elementos visuais do site pertencem ao Vocação de Pai ou aos seus licenciantes, e são protegidos por leis de direitos autorais.",
      "É proibida a reprodução total ou parcial dos conteúdos sem autorização prévia e por escrito. Citações curtas com atribuição e link para a fonte são permitidas.",
    ],
  },
  {
    title: "4. Comentários e interações",
    body: [
      "Os comentários são moderados e devem ser respeitosos. Não são permitidos: ofensas, discurso de ódio, spam, divulgação de dados pessoais de terceiros ou conteúdo que viole a legislação.",
      "Reservamo-nos o direito de excluir comentários que não cumpram estas regras, sem aviso prévio.",
    ],
  },
  {
    title: "5. Publicidade e links externos",
    body: [
      "O site pode conter anúncios e links para sites de terceiros. Não nos responsabilizamos pelo conteúdo ou pelas práticas de privacidade desses sites.",
    ],
  },
  {
    title: "6. Limitação de responsabilidade",
    body: [
      "Embora nos esforcemos para manter as informações atualizadas e precisas, o conteúdo é fornecido no estado em que se encontra, sem garantias de exatidão, integridade ou adequação a qualquer finalidade específica.",
      "O Vocação de Pai não se responsabiliza por decisões tomadas com base exclusivamente no conteúdo do blog.",
    ],
  },
  {
    title: "7. Alterações dos termos",
    body: [
      "Estes termos podem ser atualizados periodicamente. O uso continuado do site após alterações implica a aceitação dos novos termos.",
    ],
  },
  {
    title: "8. Contato",
    body: ["Para dúvidas sobre estes Termos de Uso, fale conosco pela página de contato."],
  },
];

export default function TermsOfUse() {
  useSeo({
    title: "Termos de Uso",
    description: `Termos de Uso do ${SITE_NAME}: regras de uso do conteúdo, comentários e responsabilidades.`,
    canonicalPath: "/termos-de-uso",
  });

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: 18 de agosto de 2026</p>

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
      </div>
    </div>
  );
}
