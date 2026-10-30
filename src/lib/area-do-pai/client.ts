import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Client "solto" (sem o genérico Database) para a Área do Pai: os tipos gerados
// em src/integrations/supabase/types.ts ainda são os herdados do VDM (sem
// children/saved_items e com outra assinatura de get_my_profile). Mesmo padrão
// de src/lib/db.ts; os tipos locais ficam em ./types.ts.
export const db = supabase as unknown as SupabaseClient;
