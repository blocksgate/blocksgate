// Across Protocol bridge integration
// Documentation: https://docs.across.to/

import { config } from "@/lib/config"

export interface AcrossQuote {
  bridgeName: "across"
  fromChain: number
  toChain: number
  fromToken: string
  toToken: string
  amount: string
  fee: string
  feeUSD: string
  estimatedReceived: string
  estimatedTime: number // seconds
  minAmount: string
  maxAmount: string
  liquidity: string
  relayFeePercent: number
}

const ACROSS_API_BASE = "https://api.across.to"

export class AcrossBridge {
  /**
   * Get a quote for bridging tokens via Across
   */
  async getQuote(
    fromChain: number,
    toChain: number,
    token: string,
    amount: string,
  ): Promise<AcrossQuote | null> {
    try {
      // Across uses a relay fee model (typically 0.03-0.05%)
      // For production, you would call Across's API: https://api.across.to/api/quote
      
      const relayFeePercent = 0.0004 // 0.04% average relay fee
      const amountNum = Number.parseFloat(amount)
      const fee = amountNum * relayFeePercent
      const estimatedReceived = amountNum - fee

      // Across is typically faster than Stargate (10-20 minutes)
      let estimatedTime = 900 // 15 minutes default
      if (fromChain === 1 || toChain === 1) {
        estimatedTime = 1200 // 20 minutes for Ethereum
      } else {
        estimatedTime = 600 // 10 minutes for L2 to L2
      }

      const tokenPrice = 1 // Assume stablecoin
      const feeUSD = (fee * tokenPrice).toFixed(2)

      return {
        bridgeName: "across",
        fromChain,
        toChain,
        fromToken: token,
        toToken: token,
        amount,
        fee: fee.toFixed(6),
        feeUSD,
        estimatedReceived: estimatedReceived.toFixed(6),
        estimatedTime,
        minAmount: "0.01",
        maxAmount: "500000",
        liquidity: "high",
        relayFeePercent,
      }
    } catch (error) {
      console.error("[AcrossBridge] Error getting quote:", error)
      return null
    }
  }

  /**
   * Check if Across supports a chain pair
   */
  isSupported(fromChain: number, toChain: number): boolean {
    const supportedChains = [1, 10, 42161, 137, 8453]
    return supportedChains.includes(fromChain) && supportedChains.includes(toChain)
  }

  /**
   * Get bridge contract address for a chain
   */
  getBridgeAddress(chainId: number): string {
    // Across SpokePool addresses
    const addresses: Record<number, string> = {
      1: "0x4D9079Bb4165aeb4084c526a32695dCfd2F77381", // Ethereum
      10: "0xa420b2d1c0841415A695b81E24B0E09cD91B4e7C", // Optimism
      42161: "0xa420b2d1c0841415A695b81E24B0E09cD91B4e7C", // Arbitrum
      137: "0x69B5c72837769eF1e7C164Abc6515DcF217D9E5D", // Polygon
      8453: "0x6f26Bf09B1C792e3228e5467807a900A503c2741", // Base
    }
    return addresses[chainId] || ""
  }
}

export const acrossBridge = new AcrossBridge()

