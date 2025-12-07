import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { zxClient } from "@/lib/0x-client"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { ethers } from "ethers"
import { priceFeed } from "@/lib/price-feed"

/**
 * POST /api/flash-swaps/analyze
 * Analyze a flash swap strategy for profitability
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 0.5 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tokenIn, tokenOut, amount, strategyType, chainId = 1 } = body

    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Convert amount to wei
    const amountWei = ethers.parseEther(amount).toString()

    // Get quotes for the flash swap path
    // For arbitrage: tokenIn -> tokenOut -> tokenIn (round trip)
    let quote1, quote2

    try {
      // First leg: tokenIn -> tokenOut
      quote1 = await zxClient.getQuote(chainId, tokenIn, tokenOut, amountWei, 0.5)

      // Second leg: tokenOut -> tokenIn (using output from first leg)
      quote2 = await zxClient.getQuote(chainId, tokenOut, tokenIn, quote1.buyAmount, 0.5)
    } catch (error) {
      console.error("[FlashSwap Analyze] Quote error:", error)
      return NextResponse.json(
        { error: "Failed to get quotes for flash swap analysis" },
        { status: 400 },
      )
    }

    // Calculate profit
    const amountIn = Number.parseFloat(ethers.formatEther(amountWei))
    const amountOut = Number.parseFloat(ethers.formatEther(quote1.buyAmount))
    const amountBack = Number.parseFloat(ethers.formatEther(quote2.buyAmount))

    // Flash loan fee (typically 0.09% for Aave, 0.01% for Uniswap V3)
    const flashLoanFeePercent = 0.09 // 0.09%
    const flashLoanFee = amountIn * (flashLoanFeePercent / 100)

    // Gas cost estimate (2 transactions: borrow + repay)
    const gasEstimate = Number.parseFloat(ethers.formatEther(quote1.gas || "0")) + Number.parseFloat(ethers.formatEther(quote2.gas || "0"))
    const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
    const gasCostUSD = gasEstimate * ethPrice

    // Calculate profit
    const grossProfit = amountBack - amountIn
    const netProfit = grossProfit - flashLoanFee
    const netProfitUSD = netProfit * ethPrice // Assuming tokenIn is ETH, adjust if needed

    // Profit percentage
    const profitPercent = (netProfit / amountIn) * 100

    // Risk analysis
    const riskScore = calculateRiskScore(profitPercent, gasCostUSD, amountIn)

    return NextResponse.json({
      strategyType: strategyType || "arbitrage",
      tokenIn,
      tokenOut,
      amount,
      analysis: {
        amountIn,
        amountOut,
        amountBack,
        flashLoanFee,
        gasCostUSD: gasCostUSD.toFixed(2),
        grossProfit: grossProfit.toFixed(6),
        netProfit: netProfit.toFixed(6),
        netProfitUSD: netProfitUSD.toFixed(2),
        profitPercent: profitPercent.toFixed(2),
        riskScore,
        isProfitable: netProfit > 0,
      },
      quotes: {
        leg1: {
          to: quote1.to,
          data: quote1.data,
          buyAmount: quote1.buyAmount,
          sellAmount: quote1.sellAmount,
        },
        leg2: {
          to: quote2.to,
          data: quote2.data,
          buyAmount: quote2.buyAmount,
          sellAmount: quote2.sellAmount,
        },
      },
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("[FlashSwap Analyze] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze flash swap" },
      { status: 500 },
    )
  }
}

/**
 * Calculate risk score (0-100, lower is better)
 */
function calculateRiskScore(profitPercent: number, gasCostUSD: number, amountIn: number): number {
  // Higher profit with lower gas = lower risk
  // Very high profit might indicate low liquidity = higher risk
  if (profitPercent < 0.1) return 80 // Very low profit, high risk
  if (profitPercent < 0.5) return 60 // Low profit
  if (profitPercent < 1.0) return 40 // Medium profit
  if (profitPercent < 2.0) return 25 // Good profit
  return 15 // Very good profit (but might be low liquidity)
}

