// Rate limit simples em memória (por instância do servidor), doc 07 §4.5 / doc 09 §3.2.
// Suficiente para frear abuso de formulário; não substitui o Turnstile nem o RLS.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    throw new Error("Calma: você atingiu o limite de envios por enquanto. Tente mais tarde.");
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
}
