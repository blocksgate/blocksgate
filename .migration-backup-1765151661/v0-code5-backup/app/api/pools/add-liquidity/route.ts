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
    const { token0, token1, amount0, amount1, feeTier, slippage, chainId } = body

    if (!token0 || !token1 || !amount0 || !amount1 || !feeTier) {
      return NextResponse.json(
        { error: "Missing required parameters: token0, token1, amount0, amount1, feeTier" },
        { status: 400 }
      )
    }

    const position = await liquidityPoolManager.addLiquidity(
      auth.userId,
      {
        token0,
        token1,
        amount0,
        amount1,
        feeTier: Number.parseFloat(feeTier),
        slippage: slippage ? Number.parseFloat(slippage) : 0.5,
      },
      chainId || 1
    )

    if (!position) {
      return NextResponse.json(
        { error: "Failed to add liquidity" },
        { status: 500 }
      )
    }

    return NextResponse.json({ position })
  } catch (error) {
    console.error("[Add Liquidity API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add liquidity" },
      { status: 500 }
    )
  }
}

