import { createFileRoute } from "@tanstack/react-router";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// GET /api/newsletter/sair?token=<uuid> — descadastro com um clique (link do rodapé
// do resumo semanal; doc 07 §6.3). Marca status='unsubscribed' via newsletter_unsubscribe(token).

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${title} — ${SITE_NAME}</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F4EFE6;color:#1B1F23;font-family:Inter,system-ui,sans-serif;padding:24px}main{max-width:480px;background:#fff;border:1px solid #DED7CA;border-radius:8px;padding:32px;text-align:center}h1{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:700;font-size:32px;color:#14505C;margin:0 0 12px}p{line-height:1.6;margin:0 0 20px}a.btn{display:inline-block;background:#14505C;color:#fff;text-decoration:none;font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:600;font-size:18px;padding:10px 22px;border-radius:8px}</style></head><body><main><h1>${title}</h1>${body}<a class="btn" href="${SITE_URL}/">Voltar ao ${SITE_NAME}</a></main></body></html>`;
  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const Route = createFileRoute("/api/newsletter/sair")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const news = await import("@/lib/newsletter.server");
        const ip = news.getClientIp(request);
        if (!news.checkRateLimit("newsletter-sair", ip)) {
          return page(
            "Muitas tentativas",
            "<p>Espere alguns minutos e abra o link de novo.</p>",
            429,
          );
        }
        const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
        if (!UUID_RE.test(token)) {
          return page("Link incompleto", "<p>Abra o link exatamente como veio no e-mail.</p>", 400);
        }
        try {
          const srv = await import("@/lib/area-do-pai/area.server");
          const { data, error } = await srv
            .getAnonClient()
            .rpc("newsletter_unsubscribe", { p_token: token });
          if (error) throw error;
          if (!data) {
            return page(
              "Link inválido",
              "<p>Não encontramos uma inscrição com esse link. Talvez você já tenha saído da lista.</p>",
              404,
            );
          }
          return page(
            "Você saiu da lista",
            `<p>Pronto. Não enviamos mais o resumo semanal para esse e-mail. Se mudar de ideia, assine de novo no rodapé do ${SITE_NAME} ou na sua Área do Pai.</p>`,
          );
        } catch (err) {
          console.error("[newsletter] falha ao descadastrar", err);
          return page(
            "Não deu certo",
            "<p>Houve um erro do nosso lado. Tente abrir o link de novo daqui a pouco.</p>",
            500,
          );
        }
      },
    },
  },
});
