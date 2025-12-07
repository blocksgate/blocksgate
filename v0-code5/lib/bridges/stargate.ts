// Stargate Finance bridge integration
// Documentation: https://stargateprotocol.gitbook.io/stargate/

import { config } from "@/lib/config"

export interface StargateQuote {
  bridgeName: "stargate"
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

export interface StargatePool {
  poolId: number
  chainId: number
  tokenAddress: string
  symbol: string
  decimals: number
  liquidity: string
}

// Stargate pool IDs for common tokens
const STARGATE_POOLS: Record<number, Record<string, number>> = {
  // Ethereum
  1: {
    USDC: 1,
    USDT: 2,
    ETH: 13,
  },
  // Arbitrum
  42161: {
    USDC: 1,
    USDT: 2,
    ETH: 13,
  },
  // Optimism
  10: {
    USDC: 1,
    ETH: 13,
  },
  // Polygon
  137: {
    USDC: 1,
    USDT: 2,
  },
  // Avalanche
  43114: {
    USDC: 1,
    USDT: 2,
  },
  // Base
  8453: {
    USDC: 1,
    ETH: 13,
  },
}

const STARGATE_API_BASE = "https://api.stargate.finance"

export class StargateBridge {
  /**
   * Get a quote for bridging tokens via Stargate
   */
  async getQuote(
    fromChain: number,
    toChain: number,
    token: string,
    amount: string,
  ): Promise<StargateQuote | null> {
    try {
      // For production, you would call Stargate's API
      // Since we don't have direct API access, we'll use a simplified calculation
      // based on Stargate's fee structure (typically 0.06% fee)

      const feePercent = 0.0006 // 0.06% Stargate fee
      const amountNum = Number.parseFloat(amount)
      const fee = amountNum * feePercent
      const estimatedReceived = amountNum - fee

      // Estimate time based on chain (Stargate is typically 15-30 minutes)
      let estimatedTime = 1200 // 20 minutes default
      if (fromChain === 1 || toChain === 1) {
        // Ethereum mainnet is slower
        estimatedTime = 1800 // 30 minutes
      } else if ([10, 42161, 137].includes(fromChain) && [10, 42161, 137].includes(toChain)) {
        // L2 to L2 is faster
        estimatedTime = 900 // 15 minutes
      }

      // Get token price for USD fee calculation
      // In production, you'd fetch from price feed
      const tokenPrice = 1 // Assume stablecoin for now
      const feeUSD = (fee * tokenPrice).toFixed(2)

      return {
        bridgeName: "stargate",
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
        liquidity: "high",
      }
    } catch (error) {
      console.error("[StargateBridge] Error getting quote:", error)
      return null
    }
  }

  /**
   * Get supported pools for a chain
   */
  getPools(chainId: number): StargatePool[] {
    const pools = STARGATE_POOLS[chainId] || {}
    return Object.entries(pools).map(([symbol, poolId]) => ({
      poolId,
      chainId,
      tokenAddress: "", // Would be fetched from Stargate API
      symbol,
      decimals: symbol === "ETH" ? 18 : 6,
      liquidity: "high",
    }))
  }

  /**
   * Check if Stargate supports a chain pair
   */
  isSupported(fromChain: number, toChain: number): boolean {
    const supportedChains = [1, 10, 42161, 137, 43114, 8453]
    return supportedChains.includes(fromChain) && supportedChains.includes(toChain)
  }

  /**
   * Get bridge contract address for a chain
   */
  getBridgeAddress(chainId: number): string {
    // Stargate Router addresses (would be fetched from Stargate docs)
    const addresses: Record<number, string> = {
      1: "0x8731d54E9D02c286767d56ac03e8037C07e01e98", // Ethereum
      10: "0xB0D502E938ed5f4df2E681fE6E419ff29631d62b", // Optimism
      42161: "0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614", // Arbitrum
      137: "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd", // Polygon
      43114: "0x45A01E4e04F14f7A4a6702c74187c5F6222033cd", // Avalanche
      8453: "0x45f1A95A4D3f3836523F5c83673c797f4d4d9BEE", // Base
    }
    return addresses[chainId] || ""
  }
}

export const stargateBridge = new StargateBridge()

