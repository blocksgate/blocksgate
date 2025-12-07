import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { rateLimit } from "@/lib/middleware/rateLimiter"

/**
 * GET /api/bot/strategies/[id]/status
 * Get real-time status and metrics for a bot strategy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (auth.isWalletOnly) {
      return NextResponse.json({ error: "Wallet-only users cannot access bot strategies" }, { status: 403 })
    }

    const { id } = await params
    const supabase = await createClient()

    // Get strategy
    const { data: strategy, error: strategyError } = await supabase
      .from("bot_strategies")
      .select("*")
      .eq("id", id)
      .eq("user_id", auth.userId)
      .single()

    if (strategyError || !strategy) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    // Get recent executions
    const { data: executions, error: executionsError } = await supabase
      .from("bot_executions")
      .select("*")
      .eq("strategy_id", id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (executionsError) {
      console.error("[Bot Status] Error fetching executions:", executionsError)
    }

    // Calculate metrics
    const totalExecutions = executions?.length || 0
    const successfulExecutions = executions?.filter((e) => e.status === "completed").length || 0
    const failedExecutions = executions?.filter((e) => e.status === "failed").length || 0
    const pendingExecutions = executions?.filter((e) => e.status === "pending").length || 0

    const totalProfit = executions?.reduce((sum, e) => sum + (e.profit_loss || 0), 0) || 0
    const winRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0

    // Get last execution time
    const lastExecution = executions && executions.length > 0 ? executions[0].created_at : strategy.last_executed_at

    // Calculate uptime (time since last execution or creation)
    const createdAt = new Date(strategy.created_at)
    const lastExecutedAt = lastExecution ? new Date(lastExecution) : createdAt
    const uptimeMs = Date.now() - lastExecutedAt.getTime()
    const uptimeHours = uptimeMs / (1000 * 60 * 60)

    return NextResponse.json({
      strategy: {
        id: strategy.id,
        name: strategy.name,
        status: strategy.status,
        strategy_type: strategy.strategy_type,
        token_pair: strategy.token_pair,
        chain_id: strategy.chain_id,
      },
      metrics: {
        totalExecutions,
        successfulExecutions,
        failedExecutions,
        pendingExecutions,
        totalProfit: totalProfit.toFixed(4),
        winRate: winRate.toFixed(2),
        uptimeHours: uptimeHours.toFixed(2),
        lastExecution,
      },
      recentExecutions: executions?.slice(0, 10) || [],
      performance: {
        totalTrades: strategy.total_trades || 0,
        totalProfit: strategy.total_profit || 0,
        winRate: strategy.win_rate || 0,
      },
    })
  } catch (error) {
    console.error("[Bot Status] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get strategy status" },
      { status: 500 },
    )
  }
}

