import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { liquidityPoolManager } from "@/lib/liquidity-pool-manager"
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
    const userId = searchParams.get("userId")

    // Get available pools
    const pools = await liquidityPoolManager.getPools(chainId)

    // If userId is provided and user is authenticated, get their positions
    let positions: any[] = []
    if (userId && !auth.isWalletOnly) {
      positions = await liquidityPoolManager.getPositions(auth.userId)
    }

    return NextResponse.json({ pools, positions })
  } catch (error) {
    console.error("[Pools API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get pools" },
      { status: 500 }
    )
  }
}

