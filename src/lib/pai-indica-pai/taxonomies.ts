// Taxonomias fixas do Pai Indica Pai (doc 08 §1.8) e textos oficiais (§1.5, §1.7).
// Chaves são as gravadas no banco; rótulos em PT-BR vão para a UI.

export const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
] as const;
export type UF = (typeof UFS)[number];

export const JOB_TYPES = {
  clt: "CLT",
  pj: "PJ",
  freela: "Freelancer",
  estagio: "Estágio",
  temporario: "Temporário",
} as const;
export type JobType = keyof typeof JOB_TYPES;

export const JOB_AREAS = {
  administrativo: "Administrativo",
  comercial: "Comercial e vendas",
  construcao: "Construção civil",
  educacao: "Educação",
  financeiro: "Financeiro e contábil",
  industria: "Indústria e produção",
  logistica: "Logística e transporte",
  marketing: "Marketing e comunicação",
  saude: "Saúde",
  servicos: "Serviços gerais",
  ti: "Tecnologia",
  juridico: "Jurídico",
  agro: "Agro",
  outros: "Outros",
} as const;
export type JobArea = keyof typeof JOB_AREAS;

export const REFERRAL_KINDS = {
  profissional: "Profissional",
  servico: "Serviço",
  empresa: "Empresa",
} as const;
export type ReferralKind = keyof typeof REFERRAL_KINDS;

export const MENTORSHIP_AREAS = {
  carreira: "Carreira e emprego",
  empreender: "Empreendedorismo",
  financas: "Finanças da família",
  paternidade: "Paternidade",
  fe: "Fé e vida espiritual",
  casamento: "Casamento",
  saude: "Saúde do homem",
  estudos: "Estudos e concursos",
  oficio: "Ofício e trabalho manual",
} as const;
export type MentorshipArea = keyof typeof MENTORSHIP_AREAS;

export const REPORT_REASONS = {
  golpe: "Golpe ou pedido de dinheiro",
  vaga_falsa: "Vaga/indicação falsa",
  conteudo_improprio: "Conteúdo impróprio",
  discriminacao: "Discriminação",
  spam: "Spam",
  outro: "Outro",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;

export const JOB_ORDERS = {
  recentes: "Mais recentes",
  expiram: "Encerram antes",
  vistas: "Mais vistas",
} as const;
export type JobOrder = keyof typeof JOB_ORDERS;

/** Motivos de rejeição pré-prontos do admin (doc 08 §6). */
export const REJECTION_PRESETS = [
  "Empresa/vaga não identificável",
  "Pede pagamento ou dados bancários",
  "Conteúdo fora da linha editorial",
  "Duplicada",
  "Contato inválido",
  "Discriminação",
  "Outro",
] as const;

/** Código de conduta (doc 08 §1.7): exibido no hub e aceito em todo formulário. */
export const CODIGO_DE_CONDUTA: readonly string[] = [
  "Vaga ou indicação verdadeira, com empresa e cidade reais.",
  'Sem discriminação por idade, origem, religião, deficiência ou estado civil. Vagas são abertas a qualquer trabalhador; "Pai Indica Pai" é o espírito da rede, não um filtro de candidatos.',
  'Sem pirâmide, "renda extra garantida", apostas, conteúdo adulto, agiotagem ou qualquer esquema.',
  "Sem cobrar nada do candidato ou do indicado.",
  "Respeito na linguagem — somos pais ensinando pelo exemplo.",
  "Quem quebra a regra é removido e pode ser bloqueado.",
];

/** Rodapé antifraude fixo de cada vaga (doc 08 §1.5). */
export const AVISO_ANTIFRAUDE =
  'O Vocação de Pai não cobra taxa, não pede dados bancários e não intermedia contratações. Desconfie de quem pedir pagamento para "garantir a vaga". Denuncie.';

/** Prazo de uma vaga aprovada (0005: 45 dias) e de uma indicação (90 dias). */
export const JOB_DAYS = 45;
export const REFERRAL_DAYS = 90;
export const DAILY_LIMIT = 3;
