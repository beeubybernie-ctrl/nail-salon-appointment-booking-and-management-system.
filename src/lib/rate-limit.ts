type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Minimal in-memory rate limiter. Good for basic abuse protection on
 * serverless functions where a shared store isn't available. Each warm
 * function instance tracks its own counts, so this limits per-instance
 * request volume rather than globally — sufficient to stop casual spam.
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  // Clean expired entries occasionally.
  if (buckets.size > 10_000) {
    const now = Date.now();
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}