// Conversor de unidades (doc 06 §3.11): fatores para a unidade-base de cada categoria; temperatura e consumo são especiais.
export type Categoria =
  | "comprimento"
  | "peso"
  | "volume"
  | "temperatura"
  | "area"
  | "velocidade"
  | "consumo"
  | "pressao"
  | "potencia"
  | "torque";

export interface Unidade {
  id: string;
  nome: string;
  /** fator para a base (ex.: 1 polegada = 0,0254 m) */
  fator: number;
}

export const CATEGORIAS: Array<{ id: Categoria; nome: string; base: string; unidades: Unidade[] }> =
  [
    {
      id: "comprimento",
      nome: "Comprimento",
      base: "m",
      unidades: [
        { id: "mm", nome: "milímetro (mm)", fator: 0.001 },
        { id: "cm", nome: "centímetro (cm)", fator: 0.01 },
        { id: "m", nome: "metro (m)", fator: 1 },
        { id: "km", nome: "quilômetro (km)", fator: 1000 },
        { id: "in", nome: "polegada (in)", fator: 0.0254 },
        { id: "ft", nome: "pé (ft)", fator: 0.3048 },
        { id: "yd", nome: "jarda (yd)", fator: 0.9144 },
        { id: "mi", nome: "milha (mi)", fator: 1609.344 },
      ],
    },
    {
      id: "peso",
      nome: "Peso",
      base: "kg",
      unidades: [
        { id: "g", nome: "grama (g)", fator: 0.001 },
        { id: "kg", nome: "quilo (kg)", fator: 1 },
        { id: "t", nome: "tonelada (t)", fator: 1000 },
        { id: "lb", nome: "libra (lb)", fator: 0.45359237 },
        { id: "oz", nome: "onça (oz)", fator: 0.028349523 },
        { id: "arroba", nome: "arroba (@)", fator: 14.688 },
      ],
    },
    {
      id: "volume",
      nome: "Volume",
      base: "l",
      unidades: [
        { id: "ml", nome: "mililitro (ml)", fator: 0.001 },
        { id: "l", nome: "litro (l)", fator: 1 },
        { id: "m3", nome: "metro cúbico (m³)", fator: 1000 },
        { id: "xicara", nome: "xícara (240 ml)", fator: 0.24 },
        { id: "csopa", nome: "colher de sopa (15 ml)", fator: 0.015 },
        { id: "ccha", nome: "colher de chá (5 ml)", fator: 0.005 },
        { id: "gal", nome: "galão americano", fator: 3.785 },
        { id: "floz", nome: "onça fluida (fl oz)", fator: 0.0295735 },
        { id: "lata", nome: "lata (350 ml)", fator: 0.35 },
        { id: "garrafa", nome: "garrafa (600 ml)", fator: 0.6 },
      ],
    },
    {
      id: "temperatura",
      nome: "Temperatura",
      base: "C",
      unidades: [
        { id: "C", nome: "Celsius (°C)", fator: 1 },
        { id: "F", nome: "Fahrenheit (°F)", fator: 1 },
        { id: "K", nome: "Kelvin (K)", fator: 1 },
      ],
    },
    {
      id: "area",
      nome: "Área",
      base: "m2",
      unidades: [
        { id: "m2", nome: "metro quadrado (m²)", fator: 1 },
        { id: "ha", nome: "hectare (ha)", fator: 10000 },
        { id: "alqsp", nome: "alqueire paulista", fator: 24200 },
        { id: "alqmg", nome: "alqueire mineiro", fator: 48400 },
        { id: "acre", nome: "acre", fator: 4046.86 },
      ],
    },
    {
      id: "velocidade",
      nome: "Velocidade",
      base: "km/h",
      unidades: [
        { id: "kmh", nome: "km/h", fator: 1 },
        { id: "ms", nome: "m/s", fator: 3.6 },
        { id: "mph", nome: "mph", fator: 1.609344 },
        { id: "no", nome: "nó", fator: 1.852 },
      ],
    },
    {
      id: "consumo",
      nome: "Consumo",
      base: "km/l",
      unidades: [
        { id: "kml", nome: "km/l", fator: 1 },
        { id: "l100", nome: "l/100 km", fator: 1 },
        { id: "mpg", nome: "mpg (EUA)", fator: 1 },
      ],
    },
    {
      id: "pressao",
      nome: "Pressão",
      base: "bar",
      unidades: [
        { id: "psi", nome: "psi", fator: 0.0689476 },
        { id: "bar", nome: "bar", fator: 1 },
        { id: "kpa", nome: "kPa", fator: 0.01 },
        { id: "kgfcm2", nome: "kgf/cm²", fator: 0.980665 },
      ],
    },
    {
      id: "potencia",
      nome: "Potência",
      base: "kW",
      unidades: [
        { id: "cv", nome: "cavalo-vapor (cv)", fator: 0.73549875 },
        { id: "hp", nome: "horsepower (hp)", fator: 0.7457 },
        { id: "kw", nome: "quilowatt (kW)", fator: 1 },
        { id: "w", nome: "watt (W)", fator: 0.001 },
      ],
    },
    {
      id: "torque",
      nome: "Torque",
      base: "N·m",
      unidades: [
        { id: "nm", nome: "N·m", fator: 1 },
        { id: "kgfm", nome: "kgf·m", fator: 9.80665 },
        { id: "lbft", nome: "lb·ft", fator: 1.355818 },
      ],
    },
  ];

const MPG_FACTOR = 2.35214583; // 1 km/l = 2,352 mpg (US)

export function convert(categoria: Categoria, de: string, para: string, valor: number): number {
  if (!Number.isFinite(valor)) return NaN;
  if (de === para) return valor;
  if (categoria === "temperatura") {
    const c = de === "C" ? valor : de === "F" ? ((valor - 32) * 5) / 9 : valor - 273.15;
    return para === "C" ? c : para === "F" ? (c * 9) / 5 + 32 : c + 273.15;
  }
  if (categoria === "consumo") {
    // base km/l
    const kml =
      de === "kml" ? valor : de === "l100" ? (valor > 0 ? 100 / valor : NaN) : valor / MPG_FACTOR;
    return para === "kml" ? kml : para === "l100" ? (kml > 0 ? 100 / kml : NaN) : kml * MPG_FACTOR;
  }
  const cat = CATEGORIAS.find((c) => c.id === categoria)!;
  const a = cat.unidades.find((u) => u.id === de);
  const b = cat.unidades.find((u) => u.id === para);
  if (!a || !b) return NaN;
  return (valor * a.fator) / b.fator;
}

export const BROCAS_POLEGADA: Array<{ pol: string; mm: number }> = [
  { pol: '1/8"', mm: 3.175 },
  { pol: '3/16"', mm: 4.7625 },
  { pol: '1/4"', mm: 6.35 },
  { pol: '5/16"', mm: 7.9375 },
  { pol: '3/8"', mm: 9.525 },
  { pol: '1/2"', mm: 12.7 },
  { pol: '5/8"', mm: 15.875 },
  { pol: '3/4"', mm: 19.05 },
  { pol: '1"', mm: 25.4 },
];
export const BUCHAS: Array<{ bucha: string; brocaMm: number; parafuso: string }> = [
  { bucha: "Bucha 5", brocaMm: 5, parafuso: "3,5 mm (quadro leve)" },
  { bucha: "Bucha 6", brocaMm: 6, parafuso: "4 a 4,5 mm (prateleira, suporte de TV pequeno)" },
  { bucha: "Bucha 8", brocaMm: 8, parafuso: "5 a 6 mm (armário, suporte de TV)" },
  { bucha: "Bucha 10", brocaMm: 10, parafuso: "6 a 8 mm (rede, varal, carga pesada)" },
  { bucha: "Bucha 12", brocaMm: 12, parafuso: "8 a 10 mm (portão, carga muito pesada)" },
];
export const FORNO = [
  { nome: "Forno baixo", c: 150 },
  { nome: "Forno médio", c: 180 },
  { nome: "Forno alto", c: 220 },
];
export const PONTO_CARNE = [
  { nome: "Mal passada", c: "50–52 °C" },
  { nome: "Ao ponto para mal", c: "55–58 °C" },
  { nome: "Ao ponto", c: "60–63 °C" },
  { nome: "Bem passada (bovina)", c: "70 °C+" },
  { nome: "Frango, linguiça e moída (sempre)", c: "74 °C" },
];
