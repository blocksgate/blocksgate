import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { getGaslessSwapQuoteAction } from "@/app/actions/gasless"
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
    const takerAddress = searchParams.get("takerAddress") || auth.walletAddress

    if (!sellToken || !buyToken || !sellAmount || !takerAddress) {
      return NextResponse.json(
        { error: "Missing required parameters: sellToken, buyToken, sellAmount, takerAddress" },
        { status: 400 }
      )
    }

    const quote = await getGaslessSwapQuoteAction(
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      takerAddress
    )

    if (!quote) {
      return NextResponse.json(
        { error: "Failed to get gasless quote. Token may not support gasless swaps." },
        { status: 404 }
      )
    }

    return NextResponse.json({ quote })
  } catch (error) {
    console.error("[Gasless Quote API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get gasless quote" },
      { status: 500 }
    )
  }
}

