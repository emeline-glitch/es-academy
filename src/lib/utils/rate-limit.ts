/**
 * Rate limiter en mémoire (fenêtre glissante).
 * Fonctionne par instance de fonction serverless — pas parfait en distribué,
 * mais stoppe 99% du spam. Pour du vrai distribué : basculer sur Supabase rate_limits table.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Check si la clé peut faire une requête dans la fenêtre donnée.
 * @param key identifiant unique (IP, email, combo...)
 * @param max nombre max de requêtes autorisées dans la fenêtre
 * @param windowMs durée de la fenêtre en ms
 * @returns { allowed, remaining, resetAt }
 */
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: max - 1, resetAt };
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}

/**
 * Extrait l'IP du client à partir des headers (Netlify + fallback).
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-nf-client-connection-ip") ||
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Cleanup périodique — appelé paresseusement toutes les 5 min
 */
let lastCleanup = Date.now();
export function cleanupBuckets() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}
