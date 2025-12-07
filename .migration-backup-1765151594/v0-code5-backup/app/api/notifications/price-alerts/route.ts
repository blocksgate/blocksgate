import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { notificationService } from "@/lib/notifications"
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

    // Get price alerts from database
    const { createClient } = await import("@/lib/supabase/server")
    const supabase = await createClient()
    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", auth.userId)
      .eq("active", true)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error("[Price Alerts API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get price alerts" },
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
    const { token, targetPrice, condition } = body

    if (!token || !targetPrice || !condition) {
      return NextResponse.json(
        { error: "Missing required parameters: token, targetPrice, condition" },
        { status: 400 }
      )
    }

    if (condition !== "above" && condition !== "below") {
      return NextResponse.json(
        { error: "Condition must be 'above' or 'below'" },
        { status: 400 }
      )
    }

    const success = await notificationService.createPriceAlert(
      auth.userId,
      token,
      Number.parseFloat(targetPrice),
      condition
    )

    if (!success) {
      return NextResponse.json(
        { error: "Failed to create price alert" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Price Alerts API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create price alert" },
      { status: 500 }
    )
  }
}

