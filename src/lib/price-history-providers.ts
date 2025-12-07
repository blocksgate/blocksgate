import axios from "axios"
import type {
  PriceHistoryProvider,
  PriceHistory,
  HistoricalPriceOptions
} from "./types/price-history"
import { PriceHistoryError } from "./types/price-history"

export class CoinGeckoPriceHistoryProvider implements PriceHistoryProvider {
  private readonly baseUrl = "https://api.coingecko.com/api/v3"
  private readonly tokenIdMap: Record<string, string> = {
    "ETH": "ethereum",
    "BTC": "bitcoin",
    // Add more mappings as needed
  }

  async getPriceHistory(
    token: string,
    options: HistoricalPriceOptions
  ): Promise<PriceHistory> {
    try {
      const tokenId = this.tokenIdMap[token.toUpperCase()]
      if (!tokenId) {
        throw new PriceHistoryError(`Unsupported token: ${token}`, token)
      }

      const days = this.calculateDays(options)
      const interval = this.mapTimeframe(options.timeframe)

      const response = await axios.get(`${this.baseUrl}/coins/${tokenId}/market_chart`, {
        params: {
          vs_currency: "usd",
          days,
          interval
        }
      })

      const { prices, total_volumes } = response.data
      const bars = this.convertToPriceBars(prices, total_volumes)

      return {
        token,
        timeframe: options.timeframe,
        bars
      }
    } catch (error) {
      throw new PriceHistoryError(
        `Failed to fetch CoinGecko price history: ${error instanceof Error ? error.message : String(error)}`,
        token,
        error instanceof Error ? error : undefined
      )
    }
  }

  private calculateDays(options: HistoricalPriceOptions): number {
    if (options.startTime && options.endTime) {
      return Math.ceil((options.endTime - options.startTime) / (24 * 60 * 60 * 1000))
    }
    return 1 // Default to 1 day
  }

  private mapTimeframe(timeframe: string): string {
    switch (timeframe) {
      case "1m":
      case "5m":
      case "15m":
        return "minute"
      case "1h":
      case "4h":
        return "hour"
      case "1d":
        return "daily"
      default:
        return "hour"
    }
  }

  private convertToPriceBars(prices: [number, number][], volumes: [number, number][]): PriceHistory["bars"] {
    return prices.map((price, index) => ({
      timestamp: price[0],
      open: price[1],
      high: price[1],
      low: price[1],
      close: price[1],
      volume: volumes[index] ? volumes[index][1] : 0
    }))
  }
}

export class BinancePriceHistoryProvider implements PriceHistoryProvider {
  private readonly baseUrl = "https://api.binance.com/api/v3"
  private readonly tokenSymbolMap: Record<string, string> = {
    "ETH": "ETHUSDT",
    "BTC": "BTCUSDT",
    // Add more mappings as needed
  }

  async getPriceHistory(
    token: string,
    options: HistoricalPriceOptions
  ): Promise<PriceHistory> {
    try {
      const symbol = this.tokenSymbolMap[token.toUpperCase()]
      if (!symbol) {
        throw new PriceHistoryError(`Unsupported token: ${token}`, token)
      }

      const interval = this.mapTimeframe(options.timeframe)
      const params: Record<string, string> = {
        symbol,
        interval,
        limit: String(options.limit || 500)
      }

      if (options.startTime) {
        params.startTime = String(options.startTime)
      }
      if (options.endTime) {
        params.endTime = String(options.endTime)
      }

      const response = await axios.get(`${this.baseUrl}/klines`, { params })
      const bars = this.convertToPriceBars(response.data)

      return {
        token,
        timeframe: options.timeframe,
        bars
      }
    } catch (error) {
      throw new PriceHistoryError(
        `Failed to fetch Binance price history: ${error instanceof Error ? error.message : String(error)}`,
        token,
        error instanceof Error ? error : undefined
      )
    }
  }

  private mapTimeframe(timeframe: string): string {
    switch (timeframe) {
      case "1m": return "1m"
      case "5m": return "5m"
      case "15m": return "15m"
      case "1h": return "1h"
      case "4h": return "4h"
      case "1d": return "1d"
      default: return "1h"
    }
  }

  private convertToPriceBars(klines: any[]): PriceHistory["bars"] {
    return klines.map(k => ({
      timestamp: k[0],
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5])
    }))
  }
}