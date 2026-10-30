import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// URL e chave pública (anon/publishable) do projeto Supabase do Vocação de Pai.
// Lidas de VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (CLAUDE.md §13); o fallback
// é substituído pelos valores reais no fim da Etapa 1 do doc 03.
const RAW_URL = import.meta.env.VITE_SUPABASE_URL || "<SUPABASE_URL>";
const RAW_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "<SUPABASE_PUBLISHABLE_KEY>";
// Sem variáveis (placeholder ainda não preenchido), o site precisa renderizar com estados vazios
// em vez de quebrar na importação do módulo ("Invalid supabaseUrl").
const SUPABASE_URL = /^https?:\/\//.test(RAW_URL) ? RAW_URL : "https://placeholder.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = RAW_KEY.startsWith("<") ? "placeholder-key" : RAW_KEY;
if (SUPABASE_URL === "https://placeholder.supabase.co" && typeof console !== "undefined") {
  console.warn("[vocacaodepai] VITE_SUPABASE_URL não definida: usando placeholder (sem dados).");
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
