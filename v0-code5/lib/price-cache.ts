// Simple in-memory price cache with TTL

interface CachedPrice {
  price: number
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const priceCache = new Map<string, CachedPrice>()

export function getCachedPrice(tokenId: string): number | null {
  const cached = priceCache.get(tokenId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.price
  }
  return null
}

export function setCachedPrice(tokenId: string, price: number) {
  priceCache.set(tokenId, {
    price,
    timestamp: Date.now(),
  })
}

export function clearPriceCache(tokenId?: string) {
  if (tokenId) {
    priceCache.delete(tokenId)
  } else {
    priceCache.clear()
  }
}
