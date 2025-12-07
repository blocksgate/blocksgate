// Simple in-memory token-bucket rate limiter.
// Note: in-memory only; in production use Redis or platform rate-limiter for global limits.

type Bucket = {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, Bucket>()

export interface RateLimitOptions {
  capacity?: number
  refillRatePerSecond?: number
}

const DEFAULTS: Required<RateLimitOptions> = {
  capacity: 60, // tokens
  refillRatePerSecond: 1, // tokens per second
}

function keyFromRequest(request: Request): string {
  // Try common headers, fall back to generic key
  const forwarded = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
  if (forwarded) return forwarded.split(",")[0].trim()
  return "anonymous"
}

export function rateLimit(request: Request, opts?: RateLimitOptions): { allowed: true } | { allowed: false; retryAfter: number } {
  const options = { ...DEFAULTS, ...(opts || {}) }
  const key = keyFromRequest(request)
  let bucket = buckets.get(key)
  const now = Date.now()

  if (!bucket) {
    bucket = { tokens: options.capacity, lastRefill: now }
    buckets.set(key, bucket)
  }

  // refill
  const elapsed = (now - bucket.lastRefill) / 1000
  const toAdd = Math.floor(elapsed * options.refillRatePerSecond)
  if (toAdd > 0) {
    bucket.tokens = Math.min(options.capacity, bucket.tokens + toAdd)
    bucket.lastRefill = now
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1
    return { allowed: true }
  }

  // estimate when a token will be available
  const retryAfter = Math.ceil(1 / options.refillRatePerSecond)
  return { allowed: false, retryAfter }
}

// For tests and debug
export function resetRateLimiter() {
  buckets.clear()
}
