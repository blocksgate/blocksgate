// Bridge aggregator that compares quotes from multiple bridges

import { stargateBridge, StargateQuote } from "./stargate"
import { acrossBridge, AcrossQuote } from "./across"
import { axelarBridge, AxelarQuote } from "./axelar"
import { lifiBridge, LiFiQuote } from "./lifi"

export type BridgeQuote = StargateQuote | AcrossQuote | AxelarQuote | LiFiQuote

export interface BestRoute {
  quote: BridgeQuote
  rank: number
  reasons: string[]
}

export class BridgeAggregator {
  /**
   * Get quotes from all supported bridges and return the best route
   */
  async getBestRoute(
    fromChain: number,
    toChain: number,
    token: string,
    amount: string,
    preferences?: {
      prioritizeSpeed?: boolean
      prioritizeCost?: boolean
      minLiquidity?: "low" | "medium" | "high"
    },
  ): Promise<BestRoute[]> {
    const quotes: BridgeQuote[] = []

    // Get quotes from all bridges
    const quotePromises: Promise<BridgeQuote | null>[] = []

    if (stargateBridge.isSupported(fromChain, toChain)) {
      quotePromises.push(stargateBridge.getQuote(fromChain, toChain, token, amount))
    }

    if (acrossBridge.isSupported(fromChain, toChain)) {
      quotePromises.push(acrossBridge.getQuote(fromChain, toChain, token, amount))
    }

    if (axelarBridge.isSupported(fromChain, toChain)) {
      quotePromises.push(axelarBridge.getQuote(fromChain, toChain, token, amount))
    }

    if (lifiBridge.isSupported(fromChain, toChain)) {
      quotePromises.push(lifiBridge.getQuote(fromChain, toChain, token, amount))
    }

    const results = await Promise.allSettled(quotePromises)
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        quotes.push(result.value)
      }
    }

    // Sort quotes based on preferences
    const rankedQuotes = this.rankQuotes(quotes, preferences || {})

    return rankedQuotes
  }

  /**
   * Rank quotes based on user preferences
   */
  private rankQuotes(quotes: BridgeQuote[], preferences: {
    prioritizeSpeed?: boolean
    prioritizeCost?: boolean
    minLiquidity?: "low" | "medium" | "high"
  }): BestRoute[] {
    const liquidityRank = { low: 1, medium: 2, high: 3 }
    const minLiquidityRank = liquidityRank[preferences.minLiquidity || "medium"]

    return quotes
      .filter((quote) => {
        const quoteLiquidityRank = liquidityRank[quote.liquidity as keyof typeof liquidityRank] || 1
        return quoteLiquidityRank >= minLiquidityRank
      })
      .map((quote) => {
        let score = 0
        const reasons: string[] = []

        // Cost scoring (lower fee = higher score)
        const feePercent = (Number.parseFloat(quote.fee) / Number.parseFloat(quote.amount)) * 100
        const costScore = (0.1 - feePercent) * 100 // Higher score for lower fees
        score += preferences.prioritizeCost ? costScore * 2 : costScore
        if (feePercent < 0.04) {
          reasons.push("Low fee")
        }

        // Speed scoring (faster = higher score)
        const timeScore = (3600 - quote.estimatedTime) / 36 // Higher score for faster times
        score += preferences.prioritizeSpeed ? timeScore * 2 : timeScore
        if (quote.estimatedTime < 1200) {
          reasons.push("Fast transfer")
        }

        // Liquidity scoring
        const liquidityScore = liquidityRank[quote.liquidity as keyof typeof liquidityRank] || 1
        score += liquidityScore * 10
        if (quote.liquidity === "high") {
          reasons.push("High liquidity")
        }

        // Reliability scoring (based on bridge reputation)
        let reliabilityScore = 50 // Base score
        if (quote.bridgeName === "stargate") {
          reliabilityScore = 90 // Stargate is very reliable
          reasons.push("Highly reliable")
        } else if (quote.bridgeName === "across") {
          reliabilityScore = 85
          reasons.push("Reliable")
        } else if (quote.bridgeName === "lifi") {
          reliabilityScore = 80 // Aggregator, good for options
          reasons.push("Multiple routes")
        } else if (quote.bridgeName === "axelar") {
          reliabilityScore = 75
        }
        score += reliabilityScore

        return {
          quote,
          rank: score,
          reasons: reasons.length > 0 ? reasons : ["Good option"],
        }
      })
      .sort((a, b) => b.rank - a.rank) // Sort by rank (highest first)
  }

  /**
   * Get all available routes (not just the best)
   */
  async getAllRoutes(
    fromChain: number,
    toChain: number,
    token: string,
    amount: string,
  ): Promise<BridgeQuote[]> {
    const quotes: BridgeQuote[] = []

    if (stargateBridge.isSupported(fromChain, toChain)) {
      const quote = await stargateBridge.getQuote(fromChain, toChain, token, amount)
      if (quote) quotes.push(quote)
    }

    if (acrossBridge.isSupported(fromChain, toChain)) {
      const quote = await acrossBridge.getQuote(fromChain, toChain, token, amount)
      if (quote) quotes.push(quote)
    }

    if (axelarBridge.isSupported(fromChain, toChain)) {
      const quote = await axelarBridge.getQuote(fromChain, toChain, token, amount)
      if (quote) quotes.push(quote)
    }

    if (lifiBridge.isSupported(fromChain, toChain)) {
      const quote = await lifiBridge.getQuote(fromChain, toChain, token, amount)
      if (quote) quotes.push(quote)
    }

    return quotes
  }
}

export const bridgeAggregator = new BridgeAggregator()

