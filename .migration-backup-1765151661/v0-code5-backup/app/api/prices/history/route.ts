import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase/client"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const tokenId = searchParams.get("token_id")
    const period = searchParams.get("period") || "24h" // Default to 24 hours
    const interval = searchParams.get("interval") || "1h" // Default to 1 hour intervals

    if (!tokenId) {
      return NextResponse.json({ error: "token_id is required" }, { status: 400 })
    }

    // Calculate time range based on period
    const now = new Date()
    let startTime = new Date()
    switch (period) {
      case "1h":
        startTime.setHours(now.getHours() - 1)
        break
      case "24h":
        startTime.setDate(now.getDate() - 1)
        break
      case "7d":
        startTime.setDate(now.getDate() - 7)
        break
      case "30d":
        startTime.setDate(now.getDate() - 30)
        break
      default:
        return NextResponse.json({ error: "Invalid period" }, { status: 400 })
    }

    // Query price history from database
    const { data, error } = await supabase
      .from("price_history")
      .select("timestamp, price")
      .eq("token_id", tokenId)
      .gte("timestamp", startTime.toISOString())
      .lte("timestamp", now.toISOString())
      .order("timestamp", { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch price history" }, { status: 500 })
    }

    return NextResponse.json({
      token: tokenId,
      period,
      interval,
      history: data
    })
  } catch (error) {
    console.error("Error in price history endpoint:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}