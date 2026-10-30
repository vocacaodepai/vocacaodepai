/**
 * Minimal HTML shell rendered when SSR fails catastrophically.
 */
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Erro inesperado</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fdf6ef;
        color: #3b2f36;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      .card { max-width: 28rem; padding: 2rem; text-align: center; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { font-size: 0.9rem; color: #6b5b63; margin: 0 0 1.5rem; }
      a {
        display: inline-block;
        padding: 0.6rem 1.1rem;
        border-radius: 0.75rem;
        background: #e0687f;
        color: #fff;
        text-decoration: none;
        font-size: 0.875rem;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Esta página não carregou</h1>
      <p>Algo deu errado do nosso lado. Tente novamente em instantes.</p>
      <a href="/">Voltar ao início</a>
    </div>
  </body>
</html>`;
}
