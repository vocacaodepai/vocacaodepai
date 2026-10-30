import { createFileRoute } from "@tanstack/react-router";
import { SITE_NAME, SITE_URL } from "@/lib/site";

// GET /api/newsletter/confirmar?token=<uuid> — double opt-in, passo 2.
// Marca status='confirmed' e confirmed_at=now(). Responde uma página mínima
// (noindex, sem anúncio) porque a rota de conteúdo `/newsletter/confirmar`
// (doc 03 §4.6) é de outra etapa; quando ela existir, basta trocar este
// handler por um redirect 302 para lá.

function page(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${title} — ${SITE_NAME}</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700&family=Inter:wght@400;600&display=swap"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F4EFE6;color:#1B1F23;font-family:Inter,system-ui,sans-serif;padding:24px}main{max-width:480px;background:#fff;border:1px solid #DED7CA;border-radius:8px;padding:32px;text-align:center}h1{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:700;font-size:32px;color:#14505C;margin:0 0 12px;letter-spacing:-.02em}p{line-height:1.6;margin:0 0 20px}a.btn{display:inline-block;background:#14505C;color:#fff;text-decoration:none;font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:600;font-size:18px;padding:10px 22px;border-radius:8px}a.btn:hover{background:#1b6372}</style></head><body><main><h1>${title}</h1>${body}<a class="btn" href="${SITE_URL}/">Voltar ao ${SITE_NAME}</a></main></body></html>`;
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

export const Route = createFileRoute("/api/newsletter/confirmar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const srv = await import("@/lib/newsletter.server");
        const ip = srv.getClientIp(request);
        if (!srv.checkRateLimit("newsletter-confirmar", ip)) {
          return page(
            "Muitas tentativas",
            "<p>Espere alguns minutos e abra o link do e-mail de novo.</p>",
            429,
          );
        }
        const token = new URL(request.url).searchParams.get("token")?.trim() ?? "";
        if (!token)
          return page(
            "Link incompleto",
            "<p>Abra o link exatamente como veio no e-mail de confirmação.</p>",
            400,
          );

        try {
          const result = await srv.confirmSubscriber(token);
          if (result === "invalid") {
            return page(
              "Link inválido ou expirado",
              "<p>Não encontramos uma inscrição com esse link. Cadastre o e-mail de novo no rodapé do site para receber um link novo.</p>",
              404,
            );
          }
          if (result === "already") {
            return page(
              "Inscrição já confirmada",
              "<p>Esse e-mail já está confirmado. Você vai receber a newsletter normalmente.</p>",
            );
          }
          return page(
            "Inscrição confirmada",
            `<p>Pronto. A partir de agora você recebe a newsletter do ${SITE_NAME}: o essencial para o homem que segura a casa, sem enrolação.</p>`,
          );
        } catch (err) {
          console.error("[newsletter] falha ao confirmar", err);
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
