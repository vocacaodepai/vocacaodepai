import { createFileRoute } from "@tanstack/react-router";

const BUCKET = "post-images";
const SAFE_PATH = /^[a-z]+\/[\w.-]+$/;
const MAX_SIZE = 10 * 1024 * 1024;
const RATE_LIMIT = 60;
const RATE_WINDOW = 60 * 1000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}
const TYPES: Record<string, string> = {
  webp: "image/webp",
  png: "image/png",
  jpg: "image/jpeg",
};

export const Route = createFileRoute("/api/img/$")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        if (!checkRateLimit(ip)) return new Response("rate limit exceeded", { status: 429 });
        const path = params._splat ?? "";
        if (!SAFE_PATH.test(path)) return new Response("not found", { status: 404 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
        if (error || !data) return new Response("not found", { status: 404 });
        if (data.size > MAX_SIZE) return new Response("file too large", { status: 413 });
        const ext = (path.split(".").pop() ?? "").toLowerCase();
        const contentType = TYPES[ext];
        if (!contentType) return new Response("not found", { status: 404 });
        return new Response(data, {
          headers: {
            ...SECURITY_HEADERS,
            "content-type": contentType,
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
