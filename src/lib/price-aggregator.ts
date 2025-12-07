import { EventEmitter } from "events"
import { priceFeed } from "./price-feed"
import { wsPrice } from "./websocket-price-feed"
import { getCachedPrice, setCachedPrice } from "./price-cache"
import { ZxClient } from "./0x-client"
import { priceHistoryProvider } from "./price-history"
import type { PriceBar } from "./types/price-history"

export interface PriceData {
  token: string
  price: number
  source: string
  timestamp: number
  confidence: number
  changePercent24h?: number
}

export class PriceAggregator extends EventEmitter {
  private readonly zeroEx: ZxClient
  private readonly updateInterval = 10000 // 10 seconds
  private readonly confidenceThreshold = 0.95
  private readonly maxPriceDeviation = 0.02 // 2% max deviation
  
  constructor() {
    super()
    this.zeroEx = new ZxClient()
    this.initializeWebSocket()
    this.startPeriodicUpdates()
  }

  private initializeWebSocket() {
    wsPrice.on("price", async ({ token, price }) => {
      await this.handlePriceUpdate(token, price, "websocket")
    })
  }

  private startPeriodicUpdates() {
    setInterval(() => this.updateAllPrices(), this.updateInterval)
  }

  private async handlePriceUpdate(token: string, price: number, source: string) {
    const cachedPrice = getCachedPrice(token)
    if (!cachedPrice) {
      setCachedPrice(token, price)
      this.emit("price", { token, price, source, timestamp: Date.now() })
      return
    }

    // Check for significant price deviation
    const deviation = Math.abs(price - cachedPrice) / cachedPrice
    if (deviation > this.maxPriceDeviation) {
      // Verify with other sources
      const prices = await this.getAllSourcePrices(token)
      const validPrice = this.calculateConsensusPrice(prices)
      if (validPrice) {
        setCachedPrice(token, validPrice.price)
        this.emit("price", validPrice)
      }
    } else {
      setCachedPrice(token, price)
      this.emit("price", { token, price, source, timestamp: Date.now() })
    }
  }

  private async getAllSourcePrices(token: string): Promise<PriceData[]> {
    const promises = [
      this.getPriceFromCoinGecko(token),
      this.getPriceFrom0x(token),
      this.getPriceFromWebSocket(token)
    ]

    const results = await Promise.allSettled(promises)
    return results
      .filter((result): result is PromiseFulfilledResult<PriceData> => 
        result.status === "fulfilled")
      .map(result => result.value)
  }

  private async getPriceFromCoinGecko(token: string): Promise<PriceData> {
    const price = await priceFeed.getPrice(token)
    return {
      token,
      price,
      source: "coingecko",
      timestamp: Date.now(),
      confidence: 0.95
    }
  }

  private async getPriceFrom0x(token: string): Promise<PriceData> {
    const price = await this.zeroEx.getPrices(1, [token])
    return {
      token,
      price: parseFloat(price[token] || "0"),
      source: "0x",
      timestamp: Date.now(),
      confidence: 0.98
    }
  }

  private async getPriceFromWebSocket(token: string): Promise<PriceData> {
    const price = await wsPrice.getPrice(token)
    return {
      token,
      price,
      source: "websocket",
      timestamp: Date.now(),
      confidence: 0.9
    }
  }

  private calculateConsensusPrice(prices: PriceData[]): PriceData | null {
    if (prices.length < 2) return null

    // Sort by confidence
    prices.sort((a, b) => b.confidence - a.confidence)

    // Check if highest confidence price is within deviation threshold of second highest
    const deviation = Math.abs(prices[0].price - prices[1].price) / prices[0].price
    if (deviation <= this.maxPriceDeviation) {
      // Use highest confidence price
      return prices[0]
    }

    // If deviation is too high, calculate weighted average
    const totalConfidence = prices.reduce((sum, p) => sum + p.confidence, 0)
    const weightedPrice = prices.reduce((sum, p) => 
      sum + (p.price * p.confidence), 0) / totalConfidence

    return {
      token: prices[0].token,
      price: weightedPrice,
      source: "consensus",
      timestamp: Date.now(),
      confidence: Math.min(...prices.map(p => p.confidence))
    }
  }

  private async updateAllPrices() {
    const tokens = Array.from(new Set([
      ...wsPrice.getSubscribedTokens(),
      // Add any additional tokens being tracked
    ]))

    for (const token of tokens) {
      try {
        const prices = await this.getAllSourcePrices(token)
        const consensusPrice = this.calculateConsensusPrice(prices)
        if (consensusPrice) {
          this.handlePriceUpdate(token, consensusPrice.price, consensusPrice.source)
        }
      } catch (error) {
        console.error(`Failed to update price for ${token}:`, error)
      }
    }
  }

  async getPrice(token: string): Promise<number> {
    const cachedPrice = getCachedPrice(token)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    const prices = await this.getAllSourcePrices(token)
    const consensusPrice = this.calculateConsensusPrice(prices)
    if (!consensusPrice) {
      throw new Error(`Unable to get reliable price for ${token}`)
    }

    setCachedPrice(token, consensusPrice.price)
    return consensusPrice.price
  }

  async getMultiplePrices(tokens: string[]): Promise<Record<string, number>> {
    const uniqueTokens = Array.from(new Set(tokens))
    const results = await Promise.all(
      uniqueTokens.map(async token => {
        try {
          const price = await this.getPrice(token)
          return [token, price] as [string, number]
        } catch (error) {
          console.error(`Failed to fetch price for ${token}:`, error)
          return [token, 0] as [string, number]
        }
      })
    )
    return Object.fromEntries(results)
  }

  async getPriceHistory(
    token: string,
    timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d",
    options: { startTime?: number; endTime?: number; limit?: number } = {}
  ): Promise<PriceBar[]> {
    try {
      const history = await priceHistoryProvider.getPriceHistory(token, {
        timeframe,
        ...options
      })
      return history.bars
    } catch (error) {
      console.error(`Failed to fetch price history for ${token}:`, error)
      throw new Error(`Failed to fetch price history: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

export const priceAggregator = new PriceAggregator()