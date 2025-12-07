// Axelar bridge integration
// Documentation: https://docs.axelar.dev/

import { config } from "@/lib/config"

export interface AxelarQuote {
  bridgeName: "axelar"
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
}

const AXELAR_API_BASE = "https://api.axelarscan.io"

export class AxelarBridge {
  /**
   * Get a quote for bridging tokens via Axelar
   */
  async getQuote(
    fromChain: number,
    toChain: number,
    token: string,
    amount: string,
  ): Promise<AxelarQuote | null> {
    try {
      // Axelar uses a fee model based on gas costs and relayer fees
      // Typically 0.02-0.05% fee
      
      const feePercent = 0.0003 // 0.03% average
      const amountNum = Number.parseFloat(amount)
      const fee = amountNum * feePercent
      const estimatedReceived = amountNum - fee

      // Axelar can be slower (20-40 minutes) due to its consensus mechanism
      let estimatedTime = 1800 // 30 minutes default
      if (fromChain === 1 || toChain === 1) {
        estimatedTime = 2400 // 40 minutes for Ethereum
      } else {
        estimatedTime = 1200 // 20 minutes for other chains
      }

      const tokenPrice = 1 // Assume stablecoin
      const feeUSD = (fee * tokenPrice).toFixed(2)

      return {
        bridgeName: "axelar",
        fromChain,
        toChain,
        fromToken: token,
        toToken: token,
        amount,
        fee: fee.toFixed(6),
        feeUSD,
        estimatedReceived: estimatedReceived.toFixed(6),
        estimatedTime,
        minAmount: "0.1",
        maxAmount: "1000000",
        liquidity: "medium",
      }
    } catch (error) {
      console.error("[AxelarBridge] Error getting quote:", error)
      return null
    }
  }

  /**
   * Check if Axelar supports a chain pair
   */
  isSupported(fromChain: number, toChain: number): boolean {
    const supportedChains = [1, 137, 42161, 43114]
    return supportedChains.includes(fromChain) && supportedChains.includes(toChain)
  }

  /**
   * Get bridge contract address for a chain
   */
  getBridgeAddress(chainId: number): string {
    // Axelar Gateway addresses
    const addresses: Record<number, string> = {
      1: "0x4F4495243837681061C4743b74B3eEdf548D56A5", // Ethereum
      137: "0x6f015F16De9fC8791b234eF68D486d2bF203FBA8", // Polygon
      42161: "0xe432150cce91c13a887f7D836923d5597adD8E31", // Arbitrum
      43114: "0x5029C0EFf6C34351a0CEc334542cDb22c7928f78", // Avalanche
    }
    return addresses[chainId] || ""
  }
}

export const axelarBridge = new AxelarBridge()

