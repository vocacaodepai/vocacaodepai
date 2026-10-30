// `@lovable.dev/vite-tanstack-config` é um wrapper de config do Vite que já inclui
// TanStack devtools (dev), tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro,
// injeção de VITE_* e o alias `@`. Não adicionar esses plugins manualmente (duplicaria).
// Mantido na Fase 1 (doc 03 §2, decisão "Lovable"); troca por config manual fica para a Fase 8.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Prefixos que chegam ao cliente (doc 02 §8): VITE_*, PUBLIC_* e a site key do Turnstile.
  vite: { envPrefix: ["VITE_", "PUBLIC_", "TURNSTILE_SITE_KEY"] },
  tanstackStart: {
    // Entrada SSR em src/server.ts (wrapper de erro); nitro/vite buildam a partir dela.
    server: { entry: "server" },
  },
  nitro: {
    // Gera `.vercel/output/` no `vite build` (deploy na Vercel).
    preset: "vercel",
  },
});
