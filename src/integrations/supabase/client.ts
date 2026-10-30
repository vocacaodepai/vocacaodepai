import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// URL e chave pública (anon/publishable) do projeto Supabase do Vocação de Pai.
// Lidas de VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (CLAUDE.md §13); o fallback
// é substituído pelos valores reais no fim da Etapa 1 do doc 03.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "<SUPABASE_URL>";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "<SUPABASE_PUBLISHABLE_KEY>";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
