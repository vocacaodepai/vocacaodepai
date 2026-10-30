// Marcos do desenvolvimento (doc 06 §3.15): dados PRÓPRIOS, escritos a partir da Caderneta da Criança do Ministério
// da Saúde (marcos por faixa etária, 0 a 5 anos), na voz do pai. Nada copiado do VDM. Marcos são faixas, não datas;
// a ferramenta nunca usa "atraso" como diagnóstico: só "observar e comentar com o pediatra".
export type Dominio = "motor" | "linguagem" | "social" | "cognitivo";
export interface FaseMarco {
  meses: number;
  titulo: string;
  marcos: Array<{ dominio: Dominio; texto: string }>;
  oQueOPaiFaz: string[];
  sinalDeAtencao: string;
  sinalDeAlerta: string;
}
export const ATUALIZADO_EM = "2026-10-30"; // conferência na Caderneta da Criança (gov.br/saude)
export const FONTE = {
  nome: "Caderneta da Criança — Ministério da Saúde (marcos do desenvolvimento por idade)",
  url: "https://www.gov.br/saude/pt-br/composicao/saps/caderneta-da-crianca",
};
export const DOMINIOS: Record<Dominio, string> = {
  motor: "Motor",
  linguagem: "Linguagem",
  social: "Social",
  cognitivo: "Cognitivo",
};

export const FASES: FaseMarco[] = [
  {
    meses: 1,
    titulo: "1 mês",
    marcos: [
      { dominio: "motor", texto: "Mexe braços e pernas; de bruços, vira a cabeça para o lado" },
      { dominio: "social", texto: "Fixa o olhar no rosto de quem fala com ele" },
      { dominio: "linguagem", texto: "Reage a som alto; chora para pedir" },
      { dominio: "cognitivo", texto: "Acalma-se com a voz conhecida e o colo" },
    ],
    oQueOPaiFaz: [
      "Converse olhando nos olhos, a 30 cm do rosto",
      "Faça contato pele a pele depois do banho",
      "Coloque de bruços por 1 a 2 minutos, acordado e vigiado",
    ],
    sinalDeAtencao:
      "Sinal de atenção: se não fixa o olhar ou não reage a som, observe e comente na consulta do mês.",
    sinalDeAlerta:
      "Sinal de alerta: não suga, está muito molinho ou muito rígido, ou não ganha peso — procure o pediatra ou a UBS hoje.",
  },
  {
    meses: 2,
    titulo: "2 meses",
    marcos: [
      { dominio: "social", texto: "Sorri em resposta ao seu sorriso" },
      { dominio: "motor", texto: "Abre as mãos; de bruços, levanta a cabeça por instantes" },
      { dominio: "linguagem", texto: 'Emite sons de vogal ("aaa", "ooo")' },
      { dominio: "cognitivo", texto: "Acompanha um objeto com os olhos até a linha do meio" },
    ],
    oQueOPaiFaz: [
      "Responda cada som com uma frase, como numa conversa",
      "Cante baixo a mesma música todo dia",
      "Mostre objetos coloridos a 20–30 cm e mova devagar",
    ],
    sinalDeAtencao:
      "Sinal de atenção: ainda sem sorriso social no fim do 2º mês — observe e fale com o pediatra.",
    sinalDeAlerta:
      "Sinal de alerta: não reage a barulho, não acompanha o rosto com os olhos ou perdeu algo que já fazia — procure o pediatra agora.",
  },
  {
    meses: 4,
    titulo: "4 meses",
    marcos: [
      {
        dominio: "motor",
        texto: "Sustenta a cabeça firme; leva as mãos à boca; segura o chocalho",
      },
      { dominio: "social", texto: "Ri alto; gosta de brincar e reclama quando a brincadeira para" },
      { dominio: "cognitivo", texto: "Acompanha objeto com os olhos em todas as direções" },
      { dominio: "linguagem", texto: "Vocaliza de volta quando você fala; muda o tom do choro" },
    ],
    oQueOPaiFaz: [
      "Brinque de esconder o rosto",
      "Ofereça objetos seguros para pegar e levar à boca",
      "Leia em voz alta: o ritmo da sua voz importa mais que o texto",
    ],
    sinalDeAtencao:
      "Sinal de atenção: cabeça ainda cai para trás ao ser puxado para sentar — comente na consulta.",
    sinalDeAlerta:
      "Sinal de alerta: não sustenta a cabeça, não leva as mãos à boca, não sorri — procure o pediatra agora.",
  },
  {
    meses: 6,
    titulo: "6 meses",
    marcos: [
      {
        dominio: "motor",
        texto: "Rola nos dois sentidos; senta com apoio; passa objeto de uma mão para a outra",
      },
      { dominio: "linguagem", texto: 'Balbucia consoantes ("ba", "da"); vira-se para a voz' },
      { dominio: "social", texto: "Reconhece pessoas conhecidas e estranha desconhecidos" },
      { dominio: "cognitivo", texto: "Procura com os olhos o objeto que caiu" },
    ],
    oQueOPaiFaz: [
      "Comece a introdução alimentar junto com a esposa: sente-o à mesa com vocês",
      "Deixe cair e pegar objetos (é brincadeira, não bagunça)",
      "Brinque no chão, de bruços, com você na mesma altura",
    ],
    sinalDeAtencao:
      "Sinal de atenção: não rola nem tenta alcançar objetos — observe por 2 semanas e comente.",
    sinalDeAlerta:
      "Sinal de alerta: não balbucia, não vira para a voz, não sustenta peso nas pernas quando apoiado — procure o pediatra agora.",
  },
  {
    meses: 9,
    titulo: "9 meses",
    marcos: [
      {
        dominio: "motor",
        texto: "Senta sem apoio; engatinha ou se arrasta; faz pinça com os dedos",
      },
      { dominio: "linguagem", texto: 'Diz "mama"/"papa" sem sentido ainda; entende "não"' },
      { dominio: "social", texto: "Dá tchau; estranha; procura objeto escondido" },
      {
        dominio: "cognitivo",
        texto: "Bate dois objetos um no outro; explora com a boca e as mãos",
      },
    ],
    oQueOPaiFaz: [
      "Esconda um brinquedo sob o pano e deixe-o achar",
      "Ofereça pedaços de comida para a pinça",
      "Faça o 'cadê? achou!' todo dia",
    ],
    sinalDeAtencao: "Sinal de atenção: não senta sem apoio — comente na consulta dos 9 meses.",
    sinalDeAlerta:
      "Sinal de alerta: não transfere objetos entre as mãos, não balbucia, não responde ao nome — procure o pediatra agora.",
  },
  {
    meses: 12,
    titulo: "12 meses",
    marcos: [
      {
        dominio: "motor",
        texto: "Fica em pé com apoio; dá passos segurando; anda sozinho entre 12 e 15 meses",
      },
      { dominio: "linguagem", texto: "Fala 1 a 3 palavras com sentido; aponta para pedir" },
      { dominio: "social", texto: "Imita gestos; mostra afeto; estranha" },
      {
        dominio: "cognitivo",
        texto: "Coloca e tira objetos de um pote; usa objetos pelo uso certo (copo, pente)",
      },
    ],
    oQueOPaiFaz: [
      "Nomeie tudo o que ele aponta",
      "Brinque de empilhar e derrubar",
      "Caminhe segurando as duas mãos dele, depois uma",
    ],
    sinalDeAtencao: "Sinal de atenção: não aponta nem imita gestos — observe e comente.",
    sinalDeAlerta:
      "Sinal de alerta: não fica em pé com apoio, não fala nenhuma palavra, não procura você quando se machuca — procure o pediatra agora.",
  },
  {
    meses: 18,
    titulo: "18 meses",
    marcos: [
      { dominio: "motor", texto: "Anda bem; sobe degrau com apoio; rabisca" },
      { dominio: "linguagem", texto: "Fala 10 a 20 palavras; obedece ordem simples" },
      { dominio: "social", texto: "Brinca de faz de conta simples; quer fazer sozinho" },
      { dominio: "cognitivo", texto: "Aponta figuras no livro; encaixa peça simples" },
    ],
    oQueOPaiFaz: [
      "Dê tarefas pequenas: guardar o brinquedo, levar a fralda ao lixo",
      "Leia o mesmo livro mil vezes, apontando figuras",
      "Brinque de bola no quintal",
    ],
    sinalDeAtencao:
      "Sinal de atenção: menos de 6 palavras ou não aponta para mostrar — comente na consulta.",
    sinalDeAlerta:
      "Sinal de alerta: não anda sozinho, não olha quando chamado, perdeu palavras que falava — procure o pediatra agora.",
  },
  {
    meses: 24,
    titulo: "2 anos",
    marcos: [
      { dominio: "motor", texto: "Corre; chuta bola; sobe e desce escada com apoio" },
      {
        dominio: "linguagem",
        texto: 'Junta 2 palavras ("quer água"); metade do que fala é compreensível',
      },
      { dominio: "social", texto: "Brinca ao lado de outras crianças; birra é esperada" },
      {
        dominio: "cognitivo",
        texto: "Separa objetos por forma e cor; segue instrução de 2 passos",
      },
    ],
    oQueOPaiFaz: [
      "Converse em frases completas e espere a resposta",
      "Ensine a lavar as mãos e a guardar os brinquedos",
      "Inclua-o em tarefas de homem da casa: regar planta, levar o lixo com você",
    ],
    sinalDeAtencao:
      "Sinal de atenção: não junta 2 palavras ou não imita — comente na consulta dos 2 anos.",
    sinalDeAlerta:
      "Sinal de alerta: não anda com firmeza, não fala palavras com sentido, não faz contato visual, perdeu habilidades — procure o pediatra agora.",
  },
  {
    meses: 36,
    titulo: "3 anos",
    marcos: [
      { dominio: "motor", texto: "Pedala triciclo; pula com os dois pés; desenha círculo" },
      {
        dominio: "linguagem",
        texto: "Frases de 3 palavras; diz nome e idade; estranhos entendem a maior parte",
      },
      {
        dominio: "social",
        texto: "Brinca com outras crianças; começa a dividir; controla o xixi de dia",
      },
      {
        dominio: "cognitivo",
        texto: "Entende 'dois'; brinca de faz de conta com enredo; monta quebra-cabeça simples",
      },
    ],
    oQueOPaiFaz: [
      "Leve-o para brincar com outras crianças toda semana",
      "Conte histórias da sua infância e da fé",
      "Deixe-o ajudar na oficina, na horta e no churrasco com tarefas seguras",
    ],
    sinalDeAtencao:
      "Sinal de atenção: fala pouco compreensível ou não brinca com outras crianças — comente na consulta.",
    sinalDeAlerta:
      "Sinal de alerta: não forma frases, não se interessa por outras crianças, perdeu habilidades — procure o pediatra agora.",
  },
  {
    meses: 48,
    titulo: "4 anos",
    marcos: [
      {
        dominio: "motor",
        texto:
          "Pula num pé só; pega bola com as mãos; usa tesoura sem ponta; desenha pessoa com 3 partes",
      },
      {
        dominio: "linguagem",
        texto:
          "Frases completas com 4 a 5 palavras; conta uma história; pergunta 'por quê?' o tempo todo",
      },
      {
        dominio: "social",
        texto:
          "Prefere brincar com outras crianças; tem um melhor amigo; coopera e segue regras simples",
      },
      {
        dominio: "cognitivo",
        texto: "Conta até 4 ou mais; conhece cores; entende 'igual' e 'diferente'",
      },
    ],
    oQueOPaiFaz: [
      "Jogue bola e corra com ele: o pai é o parceiro de brincadeira física",
      "Responda os 'por quês' com paciência e verdade",
      "Dê responsabilidades fixas: arrumar a cama, pôr a mesa, cuidar do animal",
    ],
    sinalDeAtencao:
      "Sinal de atenção: fala difícil de entender fora de casa, não brinca de faz de conta ou não segue regras simples — comente na consulta.",
    sinalDeAlerta:
      "Sinal de alerta: não consegue pular, não fala frases, não se interessa por outras crianças, perdeu habilidades — procure o pediatra agora.",
  },
  {
    meses: 60,
    titulo: "5 anos",
    marcos: [
      {
        dominio: "motor",
        texto:
          "Equilibra-se num pé por 10 segundos; cambalhota; copia triângulo e quadrado; escreve algumas letras",
      },
      {
        dominio: "linguagem",
        texto:
          "Fala claro, em frases longas; conta história com começo, meio e fim; diz nome completo e endereço",
      },
      {
        dominio: "social",
        texto:
          "Quer agradar e ser como os amigos; distingue fantasia de realidade; segue regras de jogo",
      },
      {
        dominio: "cognitivo",
        texto:
          "Conta 10 ou mais objetos; conhece letras; entende rotina e tempo (manhã, tarde, amanhã)",
      },
    ],
    oQueOPaiFaz: [
      "Ensine um esporte ou uma habilidade manual com paciência",
      "Reze com ele todo dia e explique a missa",
      "Dê pequenas escolhas e deixe-o arcar com as consequências",
    ],
    sinalDeAtencao:
      "Sinal de atenção: muito medroso, agressivo ou disperso, ou fala pouco clara — comente na consulta de rotina e na escola.",
    sinalDeAlerta:
      "Sinal de alerta: não consegue se concentrar em nada por 5 minutos, não brinca com outras crianças, perdeu habilidades — procure o pediatra agora.",
  },
];

/** Fase atual para a idade em meses (a última com `meses` ≤ idade; antes do 1º mês, a de 1 mês). */
export function faseParaIdade(idadeMeses: number): {
  atual: FaseMarco;
  anterior: FaseMarco | null;
  proxima: FaseMarco | null;
} {
  let idx = 0;
  for (let i = 0; i < FASES.length; i++) if (idadeMeses >= FASES[i].meses) idx = i;
  return { atual: FASES[idx], anterior: FASES[idx - 1] ?? null, proxima: FASES[idx + 1] ?? null };
}
