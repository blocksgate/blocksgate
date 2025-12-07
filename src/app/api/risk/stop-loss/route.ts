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
    const orders = await riskManager.getStopLossOrders(userId)

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("[Stop-Loss API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get stop-loss orders" },
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
    const { token, positionSize, entryPrice, stopLossPrice, takeProfitPrice } = body

    if (!token || !positionSize || !entryPrice || !stopLossPrice) {
      return NextResponse.json(
        { error: "Missing required parameters: token, positionSize, entryPrice, stopLossPrice" },
        { status: 400 }
      )
    }

    const userId = auth.userId || ""
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }
    const order = await riskManager.createStopLossOrder(
      userId,
      token,
      Number.parseFloat(positionSize),
      Number.parseFloat(entryPrice),
      Number.parseFloat(stopLossPrice),
      takeProfitPrice ? Number.parseFloat(takeProfitPrice) : undefined
    )

    if (!order) {
      return NextResponse.json(
        { error: "Failed to create stop-loss order" },
        { status: 500 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("[Stop-Loss API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create stop-loss order" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")

    if (!orderId) {
      return NextResponse.json(
        { error: "Missing orderId parameter" },
        { status: 400 }
      )
    }

    const userId = auth.userId || ""
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }
    const success = await riskManager.cancelStopLossOrder(orderId, userId)

    if (!success) {
      return NextResponse.json(
        { error: "Failed to cancel stop-loss order" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Stop-Loss API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel stop-loss order" },
      { status: 500 }
    )
  }
}

