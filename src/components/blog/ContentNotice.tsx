import { Link } from "@/lib/router-compat";
import { HeartPulse, Info, LifeBuoy, Scale, ShoppingBag, type LucideIcon } from "lucide-react";

/**
 * Avisos automáticos do layout (doc 00 §4.4 / doc 03 §4.6 item 2).
 *
 * Recebe a categoria (slug da categoria do post e, se houver, da categoria-mãe),
 * o `kind`, as tags, se a página tem link de afiliado e, nas ferramentas, o slug
 * da ferramenta. Renderiza só os avisos que casarem; sem aviso, não renderiza nada.
 * Usado no topo do corpo em /post/$slug (Fase 1), /pai-indica/$slug e /loja/$slug
 * (Fases 2 e 3) e nas ferramentas de dinheiro (Fase 4).
 */
export interface ContentNoticeProps {
  category?: string | null;
  parentCategory?: string | null;
  kind?: string | null;
  tags?: string[] | null;
  hasAffiliate?: boolean;
  tool?: string | null;
  className?: string;
}

interface Notice {
  key: string;
  icon: LucideIcon;
  text: string;
  /** Link opcional ao fim do aviso. */
  link?: { to: string; label: string };
}

const AFFILIATE_KINDS = new Set(["review", "comparativo", "lista"]);
const MONEY_TOOLS = new Set(["mercado-financeiro", "conversor-de-moedas"]);
// Temas de luto, vício e depressão (subcategorias da 0002 e tags equivalentes).
const CVV_THEMES = new Set([
  "luto-e-esperanca",
  "vicios-e-liberdade",
  "saude-mental-e-estresse",
  "luto",
  "vicio",
  "vicios",
  "depressao",
  "saude-mental",
]);

function resolveNotices(props: ContentNoticeProps): Notice[] {
  const cats = new Set(
    [props.category, props.parentCategory]
      .filter((c): c is string => !!c)
      .map((c) => c.toLowerCase()),
  );
  const tags = new Set((props.tags ?? []).map((t) => t.toLowerCase()));
  const kind = (props.kind ?? "").toLowerCase();
  const tool = (props.tool ?? "").toLowerCase();
  const notices: Notice[] = [];

  if (cats.has("corpo-e-saude-do-homem") || tags.has("saude")) {
    notices.push({
      key: "saude",
      icon: HeartPulse,
      text: "Conteúdo informativo. Não substitui consulta com médico. Em emergência, ligue 192 (SAMU).",
    });
  }
  if (cats.has("direitos-do-pai")) {
    notices.push({
      key: "direitos",
      icon: Scale,
      text: "Informação geral sobre a lei brasileira. Cada caso é um caso: procure um advogado ou a Defensoria Pública da sua cidade.",
    });
  }
  if (cats.has("dinheiro-do-pai") || MONEY_TOOLS.has(tool)) {
    notices.push({
      key: "dinheiro",
      icon: Info,
      text: "Conteúdo educativo. Não é recomendação de investimento. Cotações têm atraso e podem variar.",
    });
  }
  if (AFFILIATE_KINDS.has(kind) || props.hasAffiliate) {
    notices.push({
      key: "afiliado",
      icon: ShoppingBag,
      text: "O Vocação de Pai participa do Programa de Associados da Amazon. Quando você compra pelos nossos links, recebemos uma comissão, sem custo extra para você. Isso não muda a nota.",
      link: { to: "/politica-de-afiliados", label: "Política de afiliados" },
    });
  }
  // Fé e virtude (luto, vício, depressão) e qualquer tag desses temas.
  const cvvTheme =
    [...cats].some((c) => CVV_THEMES.has(c)) || [...tags].some((t) => CVV_THEMES.has(t));
  if (cvvTheme) {
    notices.push({
      key: "cvv",
      icon: LifeBuoy,
      text: "Se você está em sofrimento, fale com alguém hoje: CVV 188 (24h) ou o padre da sua paróquia.",
    });
  }
  return notices;
}

export function ContentNotice(props: ContentNoticeProps) {
  const notices = resolveNotices(props);
  if (notices.length === 0) return null;
  return (
    <div className={`space-y-2 ${props.className ?? ""}`} role="note">
      {notices.map((n) => {
        const Icon = n.icon;
        return (
          <p
            key={n.key}
            className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>
              {n.text}
              {n.link && (
                <>
                  {" "}
                  <Link
                    to={n.link.to}
                    className="font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    {n.link.label}
                  </Link>
                  .
                </>
              )}
            </span>
          </p>
        );
      })}
    </div>
  );
}
