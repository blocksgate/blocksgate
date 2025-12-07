import { supabase } from "./supabase/client"
import type {
  PriceBar,
  PriceHistory,
  PriceHistoryProvider,
  HistoricalPriceOptions,
} from "./types/price-history"

export class DatabasePriceHistoryProvider implements PriceHistoryProvider {
  async getPriceHistory(
    token: string,
    options: HistoricalPriceOptions
  ): Promise<PriceHistory> {
    try {
      let query = supabase
        .from("price_history")
        .select("timestamp, open, high, low, close, volume")
        .eq("token", token)
        .eq("timeframe", options.timeframe)
        .order("timestamp", { ascending: true })

      if (options.startTime) {
        query = query.gte("timestamp", new Date(options.startTime).toISOString())
      }

      if (options.endTime) {
        query = query.lte("timestamp", new Date(options.endTime).toISOString())
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error

      const bars = data?.map((row: Record<string, any>) => ({
        timestamp: new Date(row.timestamp).getTime(),
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseFloat(row.volume)
      })) || []

      return {
        token,
        timeframe: options.timeframe,
        bars
      }
    } catch (error) {
      console.error(`Failed to fetch price history for ${token}:`, error)
      throw error
    }
  }
}

// Create a provider that combines multiple sources
export class CompositePriceHistoryProvider implements PriceHistoryProvider {
  private providers: PriceHistoryProvider[] = []

  addProvider(provider: PriceHistoryProvider) {
    this.providers.push(provider)
  }

  async getPriceHistory(
    token: string,
    options: HistoricalPriceOptions
  ): Promise<PriceHistory> {
    let lastError: Error | undefined

    for (const provider of this.providers) {
      try {
        return await provider.getPriceHistory(token, options)
      } catch (error) {
        lastError = error as Error
        continue
      }
    }

    throw lastError || new Error(`No provider could fetch price history for ${token}`)
  }
}

export const priceHistoryProvider = new CompositePriceHistoryProvider()
priceHistoryProvider.addProvider(new DatabasePriceHistoryProvider())