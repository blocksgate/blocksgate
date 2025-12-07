import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { liquidityPoolManager } from "@/lib/liquidity-pool-manager"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth || auth.isWalletOnly) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rl = rateLimit(request, { capacity: 10, refillRatePerSecond: 0.1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const body = await request.json()
    const { positionId, lpTokens, slippage } = body

    if (!positionId || !lpTokens) {
      return NextResponse.json(
        { error: "Missing required parameters: positionId, lpTokens" },
        { status: 400 }
      )
    }

    const success = await liquidityPoolManager.removeLiquidity(
      auth.userId,
      {
        positionId,
        lpTokens,
        slippage: slippage ? Number.parseFloat(slippage) : 0.5,
      }
    )

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove liquidity" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Remove Liquidity API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to remove liquidity" },
      { status: 500 }
    )
  }
}

