"use server"

import { bridgeAggregator } from "@/lib/bridges/bridge-aggregator"
import { BridgeQuote, BestRoute } from "@/lib/bridges/bridge-aggregator"

/**
 * Get the best cross-chain route for a token transfer
 */
export async function getCrossChainQuote(
  fromChain: number,
  toChain: number,
  token: string,
  amount: string,
  preferences?: {
    prioritizeSpeed?: boolean
    prioritizeCost?: boolean
    minLiquidity?: "low" | "medium" | "high"
  }
): Promise<BestRoute[]> {
  try {
    const routes = await bridgeAggregator.getBestRoute(
      fromChain,
      toChain,
      token,
      amount,
      preferences
    )

    return routes
  } catch (error) {
    console.error("[Cross-Chain Action] Error getting quote:", error)
    throw new Error("Failed to get cross-chain quote")
  }
}

/**
 * Get all available cross-chain routes
 */
export async function getAllCrossChainRoutes(
  fromChain: number,
  toChain: number,
  token: string,
  amount: string
): Promise<BridgeQuote[]> {
  try {
    const routes = await bridgeAggregator.getAllRoutes(
      fromChain,
      toChain,
      token,
      amount
    )

    return routes
  } catch (error) {
    console.error("[Cross-Chain Action] Error getting routes:", error)
    throw new Error("Failed to get cross-chain routes")
  }
}

