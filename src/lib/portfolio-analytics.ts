// Comprehensive portfolio analytics and P&L calculations

import { createClient } from "./supabase/server"
import { priceFeed } from "./price-feed"

export interface PortfolioAnalytics {
  portfolioValue: number
  totalCostBasis: number
  unrealizedPnL: number
  realizedPnL: number
  totalPnL: number
  roi: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  sharpeRatio: number
  maxDrawdown: number
  holdingsCount: number
  assetAllocation: Record<string, { value: number; percentage: number }>
  dailyReturns: Array<{ date: string; return: number; value: number }>
  monthlyReturns: Array<{ month: string; return: number; value: number }>
}

/**
 * Calculate comprehensive portfolio analytics
 */
export async function calculatePortfolioAnalytics(
  userId: string,
  startDate?: Date,
  endDate?: Date,
): Promise<PortfolioAnalytics> {
  const supabase = await createClient()

  // Get portfolio holdings
  const { data: portfolio, error: portfolioError } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId)

  if (portfolioError) throw portfolioError

  // Get completed trades
  let tradesQuery = supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")

  if (startDate) {
    tradesQuery = tradesQuery.gte("created_at", startDate.toISOString())
  }
  if (endDate) {
    tradesQuery = tradesQuery.lte("created_at", endDate.toISOString())
  }

  const { data: trades, error: tradesError } = await tradesQuery.order("created_at", {
    ascending: false,
  })

  if (tradesError) throw tradesError

  // Calculate portfolio value and cost basis
  let portfolioValue = 0
  let totalCostBasis = 0
  const assetAllocation: Record<string, { value: number; percentage: number }> = {}

  for (const holding of portfolio || []) {
    const value = Number.parseFloat(String(holding.usd_value || 0))
    const costBasis = Number.parseFloat(String(holding.cost_basis || 0))

    portfolioValue += value
    totalCostBasis += costBasis

    const tokenSymbol = holding.token_symbol || "UNKNOWN"
    assetAllocation[tokenSymbol] = {
      value: (assetAllocation[tokenSymbol]?.value || 0) + value,
      percentage: 0, // Will calculate after total
    }
  }

  // Calculate percentages
  if (portfolioValue > 0) {
    for (const symbol in assetAllocation) {
      assetAllocation[symbol].percentage = (assetAllocation[symbol].value / portfolioValue) * 100
    }
  }

  // Calculate unrealized P&L
  const unrealizedPnL = portfolioValue - totalCostBasis

  // Calculate realized P&L from trades
  let realizedPnL = 0
  let totalTrades = trades?.length || 0
  let winningTrades = 0
  let losingTrades = 0
  let totalWins = 0
  let totalLosses = 0

  for (const trade of trades || []) {
    const pnl = Number.parseFloat(String(trade.profit_loss || 0))
    realizedPnL += pnl

    if (pnl > 0) {
      winningTrades++
      totalWins += pnl
    } else if (pnl < 0) {
      losingTrades++
      totalLosses += Math.abs(pnl)
    }
  }

  // Calculate metrics
  const totalPnL = unrealizedPnL + realizedPnL
  const roi = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0
  const averageWin = winningTrades > 0 ? totalWins / winningTrades : 0
  const averageLoss = losingTrades > 0 ? totalLosses / losingTrades : 0
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0

  // Calculate daily returns (simplified - would need historical data)
  const dailyReturns: Array<{ date: string; return: number; value: number }> = []
  // In production, you'd fetch historical portfolio values and calculate actual returns

  // Calculate monthly returns (simplified)
  const monthlyReturns: Array<{ month: string; return: number; value: number }> = []
  // In production, you'd calculate actual monthly returns

  // Calculate Sharpe Ratio (simplified - would need risk-free rate and volatility)
  const sharpeRatio = 0 // Placeholder - requires historical return data and risk-free rate

  // Calculate Max Drawdown (simplified - would need historical portfolio values)
  const maxDrawdown = 0 // Placeholder - requires historical peak and trough data

  return {
    portfolioValue,
    totalCostBasis,
    unrealizedPnL,
    realizedPnL,
    totalPnL,
    roi,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate,
    averageWin,
    averageLoss,
    profitFactor,
    sharpeRatio,
    maxDrawdown,
    holdingsCount: portfolio?.length || 0,
    assetAllocation,
    dailyReturns,
    monthlyReturns,
  }
}

/**
 * Get portfolio performance over time
 */
export async function getPortfolioPerformance(
  userId: string,
  period: "7d" | "30d" | "90d" | "1y" | "all" = "30d",
): Promise<Array<{ date: string; value: number; pnl: number }>> {
  const supabase = await createClient()

  // Calculate date range
  const endDate = new Date()
  let startDate = new Date()

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
    case "all":
      startDate = new Date(0) // Beginning of time
      break
  }

  // Get trades in period
  const { data: trades, error } = await supabase
    .from("trades")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString())
    .order("created_at", { ascending: true })

  if (error) throw error

  // Group by date and calculate daily values
  const dailyData: Record<string, { value: number; pnl: number }> = {}

  let runningValue = 0
  let runningPnL = 0

  for (const trade of trades || []) {
    const date = new Date(trade.created_at).toISOString().split("T")[0]
    const pnl = Number.parseFloat(String(trade.profit_loss || 0))
    const tradeValue = Number.parseFloat(String(trade.amount_out || 0)) * Number.parseFloat(String(trade.price_at_time || 0))

    runningPnL += pnl
    runningValue += tradeValue

    if (!dailyData[date]) {
      dailyData[date] = { value: 0, pnl: 0 }
    }

    dailyData[date].value = runningValue
    dailyData[date].pnl = runningPnL
  }

  // Convert to array and sort by date
  return Object.entries(dailyData)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

