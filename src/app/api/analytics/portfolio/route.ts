import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { calculatePortfolioAnalytics, getPortfolioPerformance } from "@/lib/portfolio-analytics"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // For wallet-only users, return mock/demo data
    if (auth.isWalletOnly) {
      return NextResponse.json({
        portfolio_value: 0,
        total_cost_basis: 0,
        unrealized_pnl: 0,
        realized_pnl: 0,
        total_pnl: 0,
        roi: 0,
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        average_win: 0,
        average_loss: 0,
        profit_factor: 0,
        sharpe_ratio: 0,
        max_drawdown: 0,
        holdings_count: 0,
        asset_allocation: {},
        message: "Wallet-only mode: Connect with email to track portfolio history"
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") as "7d" | "30d" | "90d" | "1y" | "all" | null
    const startDate = searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined
    const endDate = searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined

    const userId = auth.userId || ""
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    // Calculate comprehensive analytics
    const analytics = await calculatePortfolioAnalytics(userId, startDate, endDate)

    // Get performance data if period specified
    let performance = null
    if (period) {
      performance = await getPortfolioPerformance(userId, period)
    }

    return NextResponse.json({
      ...analytics,
      // Map to API response format
      portfolio_value: analytics.portfolioValue,
      total_cost_basis: analytics.totalCostBasis,
      unrealized_pnl: analytics.unrealizedPnL,
      realized_pnl: analytics.realizedPnL,
      total_pnl: analytics.totalPnL,
      roi: analytics.roi,
      total_trades: analytics.totalTrades,
      winning_trades: analytics.winningTrades,
      losing_trades: analytics.losingTrades,
      win_rate: analytics.winRate,
      average_win: analytics.averageWin,
      average_loss: analytics.averageLoss,
      profit_factor: analytics.profitFactor,
      sharpe_ratio: analytics.sharpeRatio,
      max_drawdown: analytics.maxDrawdown,
      holdings_count: analytics.holdingsCount,
      asset_allocation: analytics.assetAllocation,
      performance,
    })
  } catch (error) {
    console.error("[Portfolio Analytics] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch analytics" },
      { status: 500 },
    )
  }
}
