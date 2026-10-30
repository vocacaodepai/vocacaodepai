import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { ToolFaqItem } from "@/lib/tools/registry";

export function ToolFaq({ items }: { items: ToolFaqItem[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-ferramenta" className="mt-12 max-w-3xl">
      <h2 id="faq-ferramenta" className="font-display text-2xl font-bold">
        Perguntas frequentes
      </h2>
      <Accordion type="single" collapsible className="mt-4">
        {items.map((f, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-left">
              <h3 className="font-bold">{f.question}</h3>
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
              {f.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
