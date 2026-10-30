import { createFileRoute } from "@tanstack/react-router";

// POST/GET /api/market/refresh — chamado a cada 30 min por .github/workflows/market-refresh.yml.
// Segredo único: CRON_SECRET (CLAUDE.md §13), header "Authorization: Bearer <CRON_SECRET>".
const SECURITY_HEADERS = { "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store" };

async function sameSecret(got: string | null, expected: string | undefined) {
  if (!got || !expected) return false;
  const { timingSafeEqual } = await import("node:crypto");
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(request: Request) {
  const got = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  if (!(await sameSecret(got, process.env["CRON_SECRET"]))) {
    return new Response("unauthorized", { status: 401, headers: SECURITY_HEADERS });
  }
  const { refreshAll } = await import("@/lib/market/refresh");
  const result = await refreshAll();
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 207,
    headers: { ...SECURITY_HEADERS, "content-type": "application/json" },
  });
}

export const Route = createFileRoute("/api/market/refresh")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
