import { CORTES, type Animal } from "@/lib/tools/cortes";

// SVG inline clicável (doc 06 §3.6): um <path> por corte, foco de teclado e aria-pressed. Três animais:
// boi (cabeça à esquerda), porco e frango. Regiões são esboços didáticos, não desenho anatômico.
const PATHS: Record<Animal, Record<string, string>> = {
  boi: {
    cupim: "M 300 150 L 380 130 L 460 140 L 440 190 L 320 200 Z",
    acem: "M 220 190 L 320 200 L 330 290 L 230 300 Z",
    peito: "M 230 300 L 330 290 L 330 360 L 240 370 Z",
    paleta: "M 120 240 L 220 200 L 230 300 L 160 330 Z",
    musculo: "M 140 330 L 230 370 L 220 450 L 160 450 Z M 760 420 L 830 420 L 820 490 L 770 490 Z",
    costela: "M 330 200 L 560 200 L 560 330 L 330 330 Z",
    contrafile: "M 460 140 L 640 140 L 640 200 L 440 200 Z",
    "file-mignon": "M 640 190 L 720 190 L 720 230 L 640 230 Z",
    alcatra: "M 640 140 L 760 150 L 760 230 L 640 230 Z",
    picanha: "M 760 150 L 850 180 L 840 240 L 760 230 Z",
    maminha: "M 760 230 L 840 240 L 820 300 L 740 290 Z",
    fraldinha: "M 560 330 L 740 290 L 740 360 L 560 380 Z",
    "coxao-mole": "M 740 240 L 850 260 L 840 360 L 740 360 Z",
    "coxao-duro": "M 840 260 L 900 300 L 880 380 L 840 360 Z",
    lagarto: "M 760 360 L 840 360 L 830 420 L 770 420 Z",
    patinho: "M 740 360 L 770 420 L 760 480 L 700 470 Z",
  },
  porco: {
    "copa-lombo": "M 260 170 L 400 150 L 400 230 L 270 240 Z",
    "lombo-suino": "M 400 150 L 700 150 L 700 220 L 400 230 Z",
    "file-mignon-suino": "M 560 220 L 700 220 L 700 260 L 560 260 Z",
    bisteca: "M 400 230 L 560 230 L 560 300 L 400 300 Z",
    "costela-suina": "M 400 300 L 640 300 L 640 370 L 400 380 Z",
    barriga: "M 400 380 L 660 370 L 660 430 L 400 440 Z",
    "paleta-suina": "M 150 240 L 270 240 L 280 380 L 170 370 Z",
    pernil: "M 700 150 L 860 190 L 870 360 L 720 380 L 700 260 Z",
    "joelho-suino":
      "M 170 370 L 260 380 L 250 490 L 180 490 Z M 740 380 L 850 370 L 840 490 L 760 490 Z",
  },
  frango: {
    "dorso-pescoco":
      "M 420 130 L 640 130 L 660 200 L 420 200 Z M 280 150 L 420 130 L 420 200 L 300 220 Z",
    "peito-de-frango": "M 380 200 L 660 200 L 640 330 L 400 330 Z",
    asa: "M 180 220 L 300 180 L 380 220 L 360 290 L 220 300 Z",
    sobrecoxa: "M 640 230 L 820 220 L 840 330 L 650 330 Z",
    coxa: "M 660 330 L 830 330 L 850 450 L 700 460 Z",
    coracao: "M 440 350 L 560 350 L 560 440 L 440 440 Z",
  },
};
const OUTLINE: Record<Animal, string> = {
  boi: "M 60 300 Q 40 230 110 230 L 230 190 Q 300 110 480 125 L 650 120 Q 780 120 880 170 Q 930 230 905 320 L 890 380 L 860 500 L 820 500 L 830 420 L 780 430 L 770 500 L 730 500 L 735 390 L 560 395 L 330 365 L 250 380 L 230 500 L 190 500 L 180 400 L 130 410 L 120 500 L 85 500 L 100 350 Q 50 340 60 300 Z",
  porco:
    "M 90 300 Q 80 220 150 220 L 260 160 Q 300 130 420 135 L 700 135 Q 820 140 880 200 Q 910 300 880 380 L 850 500 L 760 500 L 740 400 L 260 400 L 250 500 L 180 500 L 160 390 Q 100 380 90 300 Z",
  frango:
    "M 300 150 Q 280 110 320 110 L 420 120 Q 560 100 680 150 Q 850 200 850 330 Q 850 420 800 470 L 700 470 L 660 340 L 420 340 Q 330 320 180 300 Q 150 240 200 200 Z",
};
const LABEL_AT: Record<Animal, Record<string, [number, number]>> = {
  boi: {
    cupim: [380, 170],
    acem: [275, 250],
    peito: [283, 332],
    paleta: [178, 270],
    musculo: [185, 405],
    costela: [445, 268],
    contrafile: [545, 172],
    alcatra: [700, 188],
    picanha: [803, 205],
    fraldinha: [650, 345],
    "coxao-mole": [792, 305],
    lagarto: [800, 392],
    patinho: [742, 435],
  },
  porco: {
    "copa-lombo": [330, 200],
    "lombo-suino": [550, 188],
    bisteca: [480, 268],
    "costela-suina": [520, 340],
    barriga: [530, 408],
    "paleta-suina": [215, 310],
    pernil: [790, 275],
    "joelho-suino": [215, 440],
  },
  frango: {
    "dorso-pescoco": [540, 168],
    peito: [520, 268],
    asa: [280, 250],
    sobrecoxa: [740, 278],
    coxa: [760, 395],
    coracao: [500, 400],
  },
};
const TITULO: Record<Animal, string> = {
  boi: "Diagrama do boi com os cortes",
  porco: "Diagrama do porco com os cortes",
  frango: "Diagrama do frango com os cortes",
};

export function BeefDiagram({
  animal,
  selected,
  onSelect,
}: {
  animal: Animal;
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  const cortes = CORTES.filter((c) => c.animal === animal);
  const paths = PATHS[animal];
  return (
    <svg
      viewBox="0 0 1000 560"
      role="group"
      aria-label={TITULO[animal]}
      className="w-full max-w-3xl"
    >
      <path
        d={OUTLINE[animal]}
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text x="70" y="290" fontSize="14" fill="hsl(var(--muted-foreground))">
        {animal === "frango" ? "" : "cabeça"}
      </text>
      {cortes.map((c) => {
        const d = paths[c.svg_id];
        if (!d) return null;
        const sel = selected === c.slug;
        return (
          <path
            key={c.slug}
            id={c.svg_id}
            d={d}
            role="button"
            tabIndex={0}
            aria-label={c.nome_br}
            aria-pressed={sel}
            onClick={() => onSelect(c.slug)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(c.slug);
              }
            }}
            className="cursor-pointer outline-none transition-colors hover:fill-accent focus-visible:stroke-[3]"
            fill={sel ? "hsl(var(--primary))" : "hsl(var(--muted))"}
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
          >
            <title>{c.nome_br}</title>
          </path>
        );
      })}
      {Object.entries(LABEL_AT[animal]).map(([id, [x, y]]) => {
        const c = cortes.find((k) => k.svg_id === id);
        if (!c) return null;
        const sel = selected === c.slug;
        return (
          <text
            key={id}
            x={x}
            y={y}
            textAnchor="middle"
            fontSize="13"
            fontWeight="700"
            pointerEvents="none"
            fill={sel ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))"}
          >
            {c.nome_br.split(" (")[0].split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}
