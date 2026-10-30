import { useSeo } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";
import { AdSlot } from "@/components/blog/AdSlot";

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "1. Informações que coletamos",
    body: [
      `Coletamos informações que você nos fornece voluntariamente: nome e e-mail ao assinar a newsletter ou enviar mensagens pelo formulário de contato, e nome, e-mail e texto de comentários nos artigos.`,
      "Também coletamos dados de navegação anônimos (páginas visitadas, tempo de leitura) para entender quais conteúdos são mais úteis. Esses dados não identificam você pessoalmente.",
    ],
  },
  {
    title: "2. Como usamos suas informações",
    body: [
      "Usamos seus dados para: enviar a newsletter que você assinou, responder mensagens de contato, moderar comentários e melhorar o conteúdo do blog.",
      "Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins de marketing.",
    ],
  },
  {
    title: "3. Publicidade",
    body: [
      `O ${SITE_NAME} pode exibir anúncios de terceiros (como o Google AdSense). Esses provedores podem usar cookies para exibir anúncios baseados em suas visitas anteriores a este e a outros sites.`,
      "Você pode desativar a personalização de anúncios do Google em adssettings.google.com ou acessar aboutads.info para saber mais.",
    ],
  },
  {
    title: "4. Cookies",
    body: [
      "Usamos cookies essenciais para o funcionamento do site (como lembrar o tema claro ou escuro e o idioma) e cookies de análise para medir o tráfego.",
      "Você pode configurar seu navegador para recusar cookies, mas algumas funcionalidades podem não funcionar corretamente.",
    ],
  },
  {
    title: "5. Armazenamento e segurança",
    body: [
      "Seus dados são armazenados em servidores seguros com acesso restrito. Apenas a equipe editorial do blog acessa as informações necessárias para o funcionamento do site.",
    ],
  },
  {
    title: "6. Seus direitos",
    body: [
      "Você pode solicitar a qualquer momento a exclusão dos seus dados (por exemplo, cancelar a assinatura da newsletter ou solicitar a remoção de um comentário) escrevendo para nós pela página de contato.",
      "Também pode solicitar uma cópia das informações que temos sobre você.",
    ],
  },
  {
    title: "7. Crianças",
    body: [
      "O blog é destinado a adultos. Não coletamos intencionalmente dados de crianças menores de 13 anos.",
    ],
  },
  {
    title: "8. Alterações desta política",
    body: [
      "Esta política pode ser atualizada periodicamente. A versão vigente estará sempre publicada nesta página, com a data da última atualização.",
    ],
  },
];

export default function PrivacyPolicy() {
  useSeo({
    title: "Política de Privacidade",
    description: `Política de Privacidade do ${SITE_NAME}: quais dados coletamos, como usamos e os seus direitos.`,
    canonicalPath: "/politica-de-privacidade",
  });

  return (
    <div className="container max-w-3xl py-12">
      <h1 className="font-display text-4xl font-bold">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted-foreground">Última atualização: 18 de agosto de 2026</p>

      <AdSlot format="leaderboard" className="mt-6" />

      <p className="mt-4 leading-relaxed text-foreground/80">
        Esta Política de Privacidade descreve como o {SITE_NAME} coleta, usa e protege as
        informações dos seus visitantes. Ao usar o site, você concorda com as práticas descritas
        abaixo.
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
      </div>
    </div>
  );
}
