// `@lovable.dev/vite-tanstack-config` é um wrapper de config do Vite que já inclui
// TanStack devtools (dev), tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro,
// injeção de VITE_* e o alias `@`. Não adicionar esses plugins manualmente (duplicaria).
// Mantido na Fase 1 (doc 03 §2, decisão "Lovable"); troca por config manual fica para a Fase 8.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Entrada SSR em src/server.ts (wrapper de erro); nitro/vite buildam a partir dela.
    server: { entry: "server" },
  },
  nitro: {
    // Gera `.vercel/output/` no `vite build` (deploy na Vercel).
    preset: "vercel",
  },
});
