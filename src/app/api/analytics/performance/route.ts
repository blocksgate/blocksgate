import { NextResponse, type NextRequest } from "next/server"
import { supabase } from "@/lib/supabase/client"
import { rpcClient } from "@/lib/supabase/rpc-client"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { isRpcError } from "@/lib/types/supabase-functions"
import type { Trade } from "@/lib/types/supabase"

interface TradeMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageReturn: number
  bestTrade: number
  worstTrade: number
  totalVolume: number
  totalFees: number
  netPnL: number
}

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rl = rateLimit(request, { capacity: 30, refillRatePerSecond: 0.5 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    // Get authenticated user info from middleware
    const userId = request.headers.get("x-user-id")
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30d" // Default to 30 days
    const token = searchParams.get("token") // Optional token filter

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30d":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "90d":
        startDate.setDate(endDate.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        return NextResponse.json({ error: "Invalid period" }, { status: 400 })
    }

    // Build query
    let query = supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .gte("executed_at", startDate.toISOString())
      .lte("executed_at", endDate.toISOString())

    if (token) {
      query = query.eq("token", token)
    }

    // Fetch trades
    const { data: trades, error } = await query as unknown as { data: Trade[]; error: Error | null }

    if (error) {
      throw error
    }

    if (!trades) {
      throw new Error("Failed to fetch trades")
    }

    // Calculate metrics
    const metrics: TradeMetrics = {
      totalTrades: trades.length,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      averageReturn: 0,
      bestTrade: 0,
      worstTrade: 0,
      totalVolume: 0,
      totalFees: 0,
      netPnL: 0,
    }

    let totalReturn = 0

    trades.forEach(trade => {
      const volume = parseFloat(trade.amount) * parseFloat(trade.price)
      metrics.totalVolume += volume
      metrics.totalFees += parseFloat(trade.fee)

      // Calculate trade PnL
      const pnl = trade.side === "buy" 
        ? -(volume + parseFloat(trade.fee))
        : volume - parseFloat(trade.fee)

      metrics.netPnL += pnl

      if (pnl > 0) {
        metrics.winningTrades++
        metrics.bestTrade = Math.max(metrics.bestTrade, pnl)
      } else {
        metrics.losingTrades++
        metrics.worstTrade = Math.min(metrics.worstTrade, pnl)
      }

      totalReturn += (pnl / volume) * 100 // Calculate return percentage
    })

    // Calculate derived metrics
    metrics.winRate = metrics.totalTrades > 0 
      ? (metrics.winningTrades / metrics.totalTrades) * 100 
      : 0
    
    metrics.averageReturn = metrics.totalTrades > 0
      ? totalReturn / metrics.totalTrades
      : 0

    // Get daily PnL data for chart
    const dailyPnL = await rpcClient.getDailyPnL({
      user_id: userId,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      token_filter: token
    })

    return NextResponse.json({
      metrics,
      dailyPnL,
      period,
      token,
    })
  } catch (error) {
    console.error("Error calculating performance metrics:", error)
    
    if (isRpcError(error)) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}