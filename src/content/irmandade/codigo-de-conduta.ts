// Código de conduta da Irmandade (doc 09 §1.3). Texto fixo: exibido em /irmandade e aceito por
// checkbox em /historias/nova, /perguntas/nova e no formulário de resposta.
export const CODIGO_DE_CONDUTA_IRMANDADE: string[] = [
  "1. Fale como homem adulto: direto, respeitoso, sem palavrão, sem vulgaridade.",
  "2. Honre a esposa e a mãe dos seus filhos, mesmo quando contar uma dificuldade. Aqui ninguém fala mal da mulher.",
  "3. Família é pai, mãe e filhos. Não publicamos conteúdo que contradiga a visão católica de família.",
  "4. Conte o que você viveu, não o que você ouviu dizer. História é testemunho, não boato.",
  "5. Resposta é ajuda, não sentença: quem responde diz o que fez e o que aprendeu, e indica profissional quando a questão é médica, jurídica ou financeira.",
  "6. Sem política partidária, sem venda, sem link de afiliado, sem pirâmide, sem 'renda extra'.",
  "7. Sem foto de criança com rosto visível sem ser a sua, e nunca com dado que identifique a escola ou a casa.",
  "8. Sem ironia barata, sem 'coach', sem vitimismo. Firmeza e acolhimento andam juntos.",
  "9. Denuncie o que fere estas regras pelo botão 'Denunciar'. Três denúncias tiram o conteúdo do ar até a moderação olhar.",
  "10. Quem quebra a regra é avisado; quem insiste é bloqueado. A Irmandade é de todos, por isso tem porta.",
];

export const AVISO_PROFISSIONAL =
  "A Irmandade é troca entre pais. Nada aqui substitui médico, advogado, contador ou padre. Em caso de risco, procure ajuda profissional.";

export const IRMANDADE_POSICIONAMENTO =
  "Comunidade de homens que querem ser pais melhores: histórias, perguntas e respostas, encontros e grupos pequenos.";

/** Chave do localStorage que guarda o aceite do código de conduta neste navegador. */
export const CONDUTA_STORAGE_KEY = "vocacao-de-pai-conduta-aceita";
