import { CORTES } from "@/lib/tools/cortes";

// SVG inline clicável do boi (doc 06 §3.6): um <path> por corte, foco de teclado e aria-pressed.
const PATHS: Record<string, string> = {
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
};
const LABELS: Record<string, [number, number]> = {
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
};

export function BeefDiagram({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 1000 560"
      role="group"
      aria-label="Diagrama do boi com os cortes"
      className="w-full max-w-3xl"
    >
      {/* contorno do boi, cabeça à esquerda */}
      <path
        d="M 60 300 Q 40 230 110 230 L 230 190 Q 300 110 480 125 L 650 120 Q 780 120 880 170 Q 930 230 905 320 L 890 380 L 860 500 L 820 500 L 830 420 L 780 430 L 770 500 L 730 500 L 735 390 L 560 395 L 330 365 L 250 380 L 230 500 L 190 500 L 180 400 L 130 410 L 120 500 L 85 500 L 100 350 Q 50 340 60 300 Z"
        fill="none"
        stroke="hsl(var(--foreground))"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <text x="70" y="290" fontSize="14" fill="hsl(var(--muted-foreground))">
        cabeça
      </text>
      {CORTES.map((c) => {
        const d = PATHS[c.svg_id];
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
      {Object.entries(LABELS).map(([id, [x, y]]) => {
        const c = CORTES.find((k) => k.svg_id === id);
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
            {c.nome_br.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}
