import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { riskManager } from "@/lib/risk-manager"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
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

    const userId = auth.userId || ""
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }
    const limits = await riskManager.getRiskLimits(userId)

    if (!limits) {
      return NextResponse.json(
        { error: "Failed to get risk limits" },
        { status: 500 }
      )
    }

    return NextResponse.json({ limits })
  } catch (error) {
    console.error("[Risk Limits API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get risk limits" },
      { status: 500 }
    )
  }
}

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
    const userId = auth.userId || ""
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }
    const limits = await riskManager.updateRiskLimits(userId, body)

    if (!limits) {
      return NextResponse.json(
        { error: "Failed to update risk limits" },
        { status: 500 }
      )
    }

    return NextResponse.json({ limits })
  } catch (error) {
    console.error("[Risk Limits API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update risk limits" },
      { status: 500 }
    )
  }
}

