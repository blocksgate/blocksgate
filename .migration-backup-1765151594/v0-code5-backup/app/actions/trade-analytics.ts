"use server"

const ZX_API_BASE = "https://api.0x.org"
const ZX_API_KEY = process.env.ZX_API_KEY || ""

export interface TradeAnalytics {
  appName: string
  blockNumber: string
  buyToken: string
  buyAmount: string
  sellToken: string
  sellAmount: string
  chainId: number
  chainName: string
  fees: {
    integratorFee?: {
      token: string
      amount: string
      amountUsd: string
    }
    zeroExFee?: {
      token: string
      amount: string
      amountUsd: string
    }
  }
  transactionHash: string
  timestamp: number
  priceUsd: string
  profit?: string
}

export async function getTradeAnalyticsWithFilters(
  chainId: number,
  startTimestamp?: number,
  endTimestamp?: number,
  cursor?: string,
): Promise<{ trades: TradeAnalytics[]; nextCursor: string | null } | null> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    })

    if (startTimestamp) params.append("startTimestamp", startTimestamp.toString())
    if (endTimestamp) params.append("endTimestamp", endTimestamp.toString())
    if (cursor) params.append("cursor", cursor)

    const response = await fetch(`${ZX_API_BASE}/trade-analytics/swap?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch trade analytics")
    return await response.json()
  } catch (error) {
    console.error("Error fetching trade analytics:", error)
    return null
  }
}

export async function calculateTradeMetrics(trades: TradeAnalytics[]) {
  if (!trades.length) {
    return {
      totalVolume: "0",
      totalProfit: "0",
      totalFees: "0",
      averageSlippage: "0",
      tradeCount: 0,
    }
  }

  const totalVolume = trades.reduce((sum, trade) => {
    return sum + Number.parseFloat(trade.buyAmount || "0")
  }, 0)

  const totalFees = trades.reduce((sum, trade) => {
    const integratorFee = Number.parseFloat(trade.fees.integratorFee?.amountUsd || "0")
    const zeroExFee = Number.parseFloat(trade.fees.zeroExFee?.amountUsd || "0")
    return sum + integratorFee + zeroExFee
  }, 0)

  return {
    totalVolume: totalVolume.toFixed(2),
    totalFees: totalFees.toFixed(2),
    tradeCount: trades.length,
  }
}
