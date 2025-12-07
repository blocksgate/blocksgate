import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { riskManager } from "@/lib/risk-manager"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth || auth.isWalletOnly) {
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

    const body = await request.json()
    const { token, amount, slippage, price } = body

    if (!token || !amount || !slippage || !price) {
      return NextResponse.json(
        { error: "Missing required parameters: token, amount, slippage, price" },
        { status: 400 }
      )
    }

    const assessment = await riskManager.assessTradeRisk(
      auth.userId,
      token,
      Number.parseFloat(amount),
      Number.parseFloat(slippage),
      Number.parseFloat(price)
    )

    return NextResponse.json({ assessment })
  } catch (error) {
    console.error("[Risk Assess API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to assess trade risk" },
      { status: 500 }
    )
  }
}

