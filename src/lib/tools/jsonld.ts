import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";
import type { ToolDefinition } from "./registry";

export function toolSoftwareApplicationJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.title} — ${SITE_NAME}`,
    description: tool.description,
    url: `${SITE_URL}/ferramentas/${tool.slug}`,
    applicationCategory: tool.appCategory,
    operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
    inLanguage: "pt-BR",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
    image: tool.ogImage ? `${SITE_URL}${tool.ogImage}` : SITE_OG_IMAGE,
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  };
}

export function toolHowToJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `Como usar: ${tool.title}`,
    description: tool.description,
    inLanguage: "pt-BR",
    totalTime: "PT2M",
    step: tool.howTo.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `${SITE_URL}/ferramentas/${tool.slug}#como-usar-${i + 1}`,
    })),
  };
}

export function toolFaqJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: tool.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

export function toolBreadcrumbJsonLd(tool: ToolDefinition) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Ferramentas", item: `${SITE_URL}/ferramentas` },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.title,
        item: `${SITE_URL}/ferramentas/${tool.slug}`,
      },
    ],
  };
}

/** Os 4 blocos JSON-LD da página de uma ferramenta, prontos para head().scripts */
export function toolJsonLd(tool: ToolDefinition) {
  return [
    toolBreadcrumbJsonLd(tool),
    toolSoftwareApplicationJsonLd(tool),
    toolHowToJsonLd(tool),
    toolFaqJsonLd(tool),
  ];
}
