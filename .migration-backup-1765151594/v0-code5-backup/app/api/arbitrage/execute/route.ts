import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest, getWalletUserId } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"
import { zxClient } from "@/lib/0x-client"
import { recordTrade } from "@/lib/trade-service"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { ethers } from "ethers"

/**
 * POST /api/arbitrage/execute
 * Execute an arbitrage opportunity
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit (stricter for execution)
    const rl = rateLimit(request, { capacity: 5, refillRatePerSecond: 0.1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Authenticate
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { opportunityId, sellToken, buyToken, sellAmount, chainId, txHash } = body

    if (!sellToken || !buyToken || !sellAmount || !chainId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Get quote for the arbitrage trade
    const sellAmountWei = ethers.parseUnits(sellAmount, 18).toString()
    
    // Get user address for better quote accuracy (optional)
    const takerAddress = auth.walletAddress || undefined
    
    const quote = await zxClient.getQuote(
      chainId,
      sellToken,
      buyToken,
      sellAmountWei,
      0.5,
      undefined, // method
      takerAddress // taker address for better quote accuracy
    )

    if (!quote) {
      return NextResponse.json({ error: "Failed to get execution quote" }, { status: 400 })
    }

    // If txHash provided, record the trade
    if (txHash) {
      if (!auth.isWalletOnly && auth.userId) {
        try {
          await recordTrade(auth.userId, {
            txHash,
            tokenIn: sellToken,
            tokenOut: buyToken,
            amountIn: sellAmount,
            amountOut: ethers.formatEther(quote.buyAmount),
            priceAtTime: Number.parseFloat(quote.price),
            slippage: 0.5,
            gasUsed: quote.gas,
            gasPrice: quote.gasPrice,
            chainId,
            tradeType: "arbitrage",
            mevProtected: true,
          })
        } catch (error) {
          console.error("[Arbitrage Execute] Failed to record trade:", error)
        }
      }

      return NextResponse.json({
        success: true,
        txHash,
        opportunityId,
        message: "Arbitrage trade executed successfully",
      })
    }

    // Return execution quote for user to sign
    return NextResponse.json({
      opportunityId,
      quote: {
        to: quote.to,
        data: quote.data,
        value: quote.value,
        gas: quote.gas,
        gasPrice: quote.gasPrice,
        buyAmount: quote.buyAmount,
        sellAmount: quote.sellAmount,
        price: quote.price,
        sources: quote.sources,
      },
      message: "Sign and submit this transaction to execute the arbitrage",
    })
  } catch (error) {
    console.error("[Arbitrage Execute] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute arbitrage" },
      { status: 500 },
    )
  }
}

