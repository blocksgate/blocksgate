import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { zxClient } from "@/lib/0x-client"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    // Authenticate
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chainId = Number.parseInt(searchParams.get("chainId") || "1")
    const sellToken = searchParams.get("sellToken")
    const buyToken = searchParams.get("buyToken")
    const sellAmount = searchParams.get("sellAmount")
    const slippagePercentage = searchParams.get("slippagePercentage")

    if (!sellToken || !buyToken || !sellAmount) {
      return NextResponse.json(
        { error: "Missing required parameters: sellToken, buyToken, sellAmount" },
        { status: 400 }
      )
    }

    // Get user address for better quote accuracy (optional but recommended)
    // 0x API v2 can provide more accurate quotes when taker address is known
    const takerAddress = auth.walletAddress || undefined
    
    // Get quote from 0x Protocol
    const quote = await zxClient.getQuote(
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      slippagePercentage ? Number.parseFloat(slippagePercentage) : undefined,
      undefined, // method (defaults to allowance-holder)
      takerAddress // taker address for better quote accuracy (optional)
    )

    return NextResponse.json({
      quote,
      chainId,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("[Swap Quote Error]:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to get swap quote",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

