import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest, getWalletUserId } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"
import { zxClient } from "@/lib/0x-client"
import { recordTrade } from "@/lib/trade-service"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { getFlashLoanAggregator } from "@/lib/flash-loan-aggregator"
import { ethers } from "ethers"

/**
 * POST /api/flash-swaps/execute
 * Execute a flash swap strategy with flash loan aggregator
 * Note: Flash swaps require a smart contract to execute atomically
 * This endpoint returns the transaction data for the user to execute
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { capacity: 5, refillRatePerSecond: 0.1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tokenIn, tokenOut, amount, chainId = 1, txHash, useFlashLoan = true } = body

    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Convert amount to wei
    const amountWei = ethers.parseEther(amount).toString()

    // Get quotes for both legs of the flash swap
    const quote1 = await zxClient.getQuote(chainId, tokenIn, tokenOut, amountWei, 0.5)
    const quote2 = await zxClient.getQuote(chainId, tokenOut, tokenIn, quote1.buyAmount, 0.5)

    // Calculate profit
    const amountIn = Number.parseFloat(amount)
    const amountOut = Number.parseFloat(ethers.formatEther(quote1.buyAmount))
    const amountBack = Number.parseFloat(ethers.formatEther(quote2.buyAmount))
    const profit = amountBack - amountIn

    // Get flash loan aggregator if using flash loans
    let flashLoanData = null
    if (useFlashLoan && profit > 0) {
      try {
        const aggregator = getFlashLoanAggregator()
        const profitEstimate = profit * 1000 // Convert to wei-like value
        flashLoanData = await aggregator.aggregateFlashLoan(amountWei, tokenIn, profitEstimate)
      } catch (error) {
        console.warn("[FlashSwap Execute] Flash loan aggregation failed:", error)
        // Continue without flash loan
      }
    }

    // If txHash provided, record the trade
    if (txHash) {
      if (!auth.isWalletOnly && auth.userId) {
        try {
          await recordTrade(auth.userId, {
            txHash,
            tokenIn,
            tokenOut,
            amountIn: amount,
            amountOut: ethers.formatEther(quote1.buyAmount),
            priceAtTime: Number.parseFloat(quote1.price),
            slippage: 0.5,
            gasUsed: quote1.gas,
            gasPrice: quote1.gasPrice,
            chainId,
            tradeType: "flash",
            mevProtected: true,
          })
        } catch (error) {
          console.error("[FlashSwap Execute] Failed to record trade:", error)
        }
      }

      return NextResponse.json({
        success: true,
        txHash,
        message: "Flash swap executed successfully",
      })
    }

    // Return execution data for user to sign
    // Note: Flash swaps require a smart contract that implements the flash loan callback
    // The user would need to deploy or use an existing flash swap contract
    return NextResponse.json({
      strategy: {
        tokenIn,
        tokenOut,
        amount,
        chainId,
        profit: profit.toFixed(6),
        profitPercent: ((profit / amountIn) * 100).toFixed(2),
      },
      quotes: {
        leg1: {
          to: quote1.to,
          data: quote1.data,
          value: quote1.value,
          gas: quote1.gas,
          gasPrice: quote1.gasPrice,
          buyAmount: quote1.buyAmount,
          sellAmount: quote1.sellAmount,
        },
        leg2: {
          to: quote2.to,
          data: quote2.data,
          value: quote2.value,
          gas: quote2.gas,
          gasPrice: quote2.gasPrice,
          buyAmount: quote2.buyAmount,
          sellAmount: quote2.sellAmount,
        },
      },
      flashLoan: flashLoanData
        ? {
            provider: flashLoanData.optimalProvider.name,
            address: flashLoanData.optimalProvider.address,
            fee: flashLoanData.totalFee,
            estimatedProfit: flashLoanData.estimatedProfit,
            gasEstimate: flashLoanData.executionPath.gasEstimate,
          }
        : null,
      execution: {
        totalGas: (Number.parseInt(quote1.gas || "0") + Number.parseInt(quote2.gas || "0")).toString(),
        estimatedProfit: profit.toFixed(6),
        isProfitable: profit > 0,
      },
      message:
        "Flash swaps require a smart contract. Use the provided transaction data to execute via a flash loan contract.",
      warning:
        "Flash swaps must be executed atomically in a single transaction. Consider using a flash loan aggregator or deploying a custom contract.",
    })
  } catch (error) {
    console.error("[FlashSwap Execute] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute flash swap" },
      { status: 500 },
    )
  }
}

