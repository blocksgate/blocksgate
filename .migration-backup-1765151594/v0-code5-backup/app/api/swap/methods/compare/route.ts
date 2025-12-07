import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { swapMethodSelector } from "@/lib/swap-method-selector"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const chainId = Number(searchParams.get("chainId")) || 1
    const sellToken = searchParams.get("sellToken")
    const buyToken = searchParams.get("buyToken")
    const sellAmount = searchParams.get("sellAmount")
    const userAddress = searchParams.get("userAddress") || auth.walletAddress

    if (!sellToken || !buyToken || !sellAmount || !userAddress) {
      return NextResponse.json(
        { error: "Missing required parameters: sellToken, buyToken, sellAmount, userAddress" },
        { status: 400 }
      )
    }

    const comparisons = await swapMethodSelector.compareMethods(
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      userAddress
    )

    const recommended = await swapMethodSelector.getRecommendedMethod(
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      userAddress
    )

    return NextResponse.json({
      comparisons,
      recommended,
    })
  } catch (error) {
    console.error("[Swap Methods Compare API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to compare swap methods" },
      { status: 500 }
    )
  }
}

