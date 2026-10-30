import data from "./cortes.json" with { type: "json" };

export type Animal = "boi" | "porco" | "frango";
export interface Corte {
  slug: string;
  animal: Animal;
  nome_br: string;
  nome_eua: string;
  regiao: string;
  textura: string;
  maciez: number;
  gordura: number;
  preco_relativo: number;
  preparo: string[];
  ponto: string;
  faixa_preco: {
    min: number | null;
    max: number | null;
    unidade: string;
    pesquisado_em: string | null;
    fontes: Array<{ loja: string; url: string }>;
  };
  erro_comum_semaforo: { sinal: "atencao" | "alerta"; texto: string };
  dica_do_pai: string;
  svg_id: string;
  artigos: string[];
}
export const CORTES_DATA = data as unknown as {
  atualizado_em: string;
  preparos: string[];
  cortes: Corte[];
};
export const CORTES = CORTES_DATA.cortes;
export const ANIMAIS: Array<{ id: Animal; nome: string }> = [
  { id: "boi", nome: "Boi" },
  { id: "porco", nome: "Porco" },
  { id: "frango", nome: "Frango" },
];
export const cortesDoAnimal = (animal: Animal) => CORTES.filter((c) => c.animal === animal);
export const PREPAROS: Record<string, string> = {
  grelha: "Grelha",
  espeto: "Espeto",
  chapa: "Chapa",
  panela: "Panela",
  forno: "Forno",
  moida: "Moída",
};
export const corteBySlug = (slug: string) => CORTES.find((c) => c.slug === slug);
export const cortesPorPreparo = (preparo: string) =>
  CORTES.filter((c) => c.preparo.includes(preparo)).sort(
    (a, b) => a.preco_relativo - b.preco_relativo,
  );
