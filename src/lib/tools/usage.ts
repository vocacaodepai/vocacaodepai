import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Tipos gerados ainda são os do VDM: cliente sem o genérico Database (decisão F1/F4).
const db = supabase as unknown as SupabaseClient;

/** Registro anônimo de uso (tool_usage): uma vez por aba/sessão por ferramenta. */
export async function logToolUsage(toolSlug: string, userId: string | null) {
  if (typeof window === "undefined") return;
  const key = `vdp:tool_usage:${toolSlug}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* sessionStorage indisponível: registra mesmo assim */
  }
  try {
    const { error } = await db.from("tool_usage").insert({ tool_slug: toolSlug, user_id: userId });
    if (error) console.warn("tool_usage insert failed", error.message);
  } catch (e) {
    console.warn("tool_usage insert failed", (e as Error).message);
  }
}
