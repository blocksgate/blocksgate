import { type NextRequest, NextResponse } from "next/server"
import { priceFeed } from "@/lib/price-feed"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
  try {
    // Lightweight rate limit for price queries (public)
    const rl = rateLimit(request, { capacity: 120, refillRatePerSecond: 2 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }
    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("token_id")
    const tokens = searchParams.getAll("tokens")

    if (tokenId) {
      // Get single token price
      try {
        const price = await priceFeed.getPrice(tokenId)
        return NextResponse.json({ 
          token: tokenId, 
          price,
          change_24h: 0, // Add 24h change if needed
          timestamp: Date.now()
        })
      } catch (error) {
        console.error(`Failed to fetch price for ${tokenId}:`, error)
        // Return mock data to prevent UI breaks
        return NextResponse.json({ 
          token: tokenId, 
          price: 0,
          change_24h: 0,
          timestamp: Date.now(),
          error: "Failed to fetch price from provider"
        })
      }
    }

    if (tokens.length > 0) {
      // Get multiple token prices
      const prices: Record<string, number> = {}
      for (const token of tokens) {
        try {
          prices[token] = await priceFeed.getPrice(token)
        } catch (error) {
          console.error(`Failed to fetch price for ${token}:`, error)
          prices[token] = 0
        }
      }
      return NextResponse.json({ prices })
    }

    // Popular tokens by default
    const popularTokens = ["bitcoin", "ethereum", "usdc", "dai"]
    const prices: Record<string, number> = {}
    for (const token of popularTokens) {
      try {
        prices[token] = await priceFeed.getPrice(token)
      } catch (error) {
        console.error(`Failed to fetch price for ${token}:`, error)
        prices[token] = 0
      }
    }

    return NextResponse.json({ prices })
  } catch (error) {
    console.error("[Prices API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch prices", price: 0 },
      { status: 500 },
    )
  }
}
