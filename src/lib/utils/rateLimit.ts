/**
 * Simple in-memory sliding-window rate limiter.
 * Suitable for a single-instance deployment (personal app / Vercel).
 * Limits are per IP address.
 */

interface Window {
  count: number
  resetAt: number
}

const store = new Map<string, Window>()

/**
 * Returns true if the request should be allowed, false if it should be blocked.
 * @param key      Unique identifier (e.g. IP + route)
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || now > existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (existing.count >= limit) {
    return false
  }

  existing.count++
  return true
}

export function rateLimitResponse(): Response {
  return new Response(JSON.stringify({ error: 'Too many requests. Please slow down.' }), {
    status: 429,
    headers: { 'Content-Type': 'application/json', 'Retry-After': '60' },
  })
}
