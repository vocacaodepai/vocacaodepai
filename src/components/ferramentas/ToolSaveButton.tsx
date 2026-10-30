import { SaveButton } from "@/components/area-do-pai/SaveButton";

/**
 * "Salvar na Área do Pai" da ferramenta (saved_items, item_type 'tool', item_id = slug).
 * Casca fina sobre o SaveButton genérico da Fase 5 (anônimo → /entrar?next=), com a
 * mesma altura do ToolShareButton ao lado.
 */
export function ToolSaveButton({ slug }: { slug: string }) {
  return <SaveButton itemType="tool" itemId={slug} className="h-10" />;
}
