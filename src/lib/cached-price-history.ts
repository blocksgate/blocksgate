import { Redis } from "ioredis"
import type { PriceHistory, PriceHistoryProvider, HistoricalPriceOptions } from "./types/price-history"

export class CachedPriceHistoryProvider implements PriceHistoryProvider {
  private readonly redis: Redis
  private readonly ttl: number // Cache TTL in seconds

  constructor(
    private readonly provider: PriceHistoryProvider,
    redisUrl: string,
    ttl: number = 3600 // Default 1 hour
  ) {
    this.redis = new Redis(redisUrl)
    this.ttl = ttl
  }

  async getPriceHistory(
    token: string,
    options: HistoricalPriceOptions
  ): Promise<PriceHistory> {
    const cacheKey = this.getCacheKey(token, options)
    
    // Try to get from cache
    const cached = await this.redis.get(cacheKey)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch (error) {
        console.warn(`Failed to parse cached price history: ${error}`)
        // Continue to fetch fresh data
      }
    }

    // Fetch fresh data
    const history = await this.provider.getPriceHistory(token, options)

    // Cache the result
    try {
      await this.redis.set(
        cacheKey,
        JSON.stringify(history),
        "EX",
        this.calculateTTL(options)
      )
    } catch (error) {
      console.warn(`Failed to cache price history: ${error}`)
    }

    return history
  }

  private getCacheKey(token: string, options: HistoricalPriceOptions): string {
    return `price_history:${token}:${options.timeframe}:${options.startTime || ""}:${options.endTime || ""}:${options.limit || ""}`
  }

  private calculateTTL(options: HistoricalPriceOptions): number {
    // Use shorter TTL for shorter timeframes
    switch (options.timeframe) {
      case "1m": return 60 // 1 minute
      case "5m": return 300 // 5 minutes
      case "15m": return 900 // 15 minutes
      case "1h": return 3600 // 1 hour
      case "4h": return 14400 // 4 hours
      case "1d": return 86400 // 1 day
      default: return this.ttl
    }
  }

  async close(): Promise<void> {
    await this.redis.quit()
  }
}