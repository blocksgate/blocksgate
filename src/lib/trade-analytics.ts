import { supabase } from "./supabase/client"
import { priceAggregator } from "./price-aggregator"
import { portfolioManager } from "./portfolio-manager"

export interface TradeMetrics {
  totalTrades: number
  profitableTrades: number
  totalPnL: number
  averageReturn: number
  winRate: number
  largestGain: number
  largestLoss: number
  averageHoldTime: number
  sharpeRatio: number
  volatility: number
}

export interface TokenMetrics {
  token: string
  volume24h: number
  priceChange24h: number
  volatility24h: number
  liquidity: number
  marketCap: number
  correlation: Record<string, number>
}

export interface RiskMetrics {
  valueatRisk: number
  maxDrawdown: number
  betaToEth: number
  concentration: number
  leverageExposure: number
  impermanentLoss: number
}

class TradeAnalytics {
  private readonly annualRiskFreeRate = 0.04 // 4% annual risk-free rate
  private readonly confidenceLevel = 0.95 // 95% confidence for VaR
  private readonly timePeriods = {
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000
  }

  async getTradeMetrics(
    userId: string,
    timeframe: "day" | "week" | "month" | "all" = "all"
  ): Promise<TradeMetrics> {
    const { data: trades } = await this.getTradeHistory(userId, timeframe)
    if (!trades || trades.length === 0) {
      return this.getEmptyMetrics()
    }

    const profitableTrades = trades.filter(trade => parseFloat(trade.realized_pnl) > 0)
    const totalPnL = trades.reduce((sum, trade) => sum + parseFloat(trade.realized_pnl), 0)
    const returns = this.calculateTradeReturns(trades)
    const holdTimes = this.calculateHoldTimes(trades)

    const metrics: TradeMetrics = {
      totalTrades: trades.length,
      profitableTrades: profitableTrades.length,
      totalPnL,
      averageReturn: totalPnL / trades.length,
      winRate: profitableTrades.length / trades.length,
      largestGain: Math.max(...returns),
      largestLoss: Math.min(...returns),
      averageHoldTime: holdTimes.reduce((a, b) => a + b) / holdTimes.length,
      sharpeRatio: this.calculateSharpeRatio(returns),
      volatility: this.calculateVolatility(returns)
    }

    return metrics
  }

  async getTokenMetrics(tokens: string[]): Promise<Record<string, TokenMetrics>> {
    const metrics: Record<string, TokenMetrics> = {}
    const prices = await this.getPriceHistory(tokens, 24) // 24 hours of data

    for (const token of tokens) {
      const tokenPrices = prices[token] || []
      const correlation: Record<string, number> = {}

      // Calculate correlation with other tokens
      for (const otherToken of tokens) {
        if (token !== otherToken) {
          const otherPrices = prices[otherToken] || []
          correlation[otherToken] = this.calculateCorrelation(tokenPrices, otherPrices)
        }
      }

      metrics[token] = {
        token,
        volume24h: await this.get24hVolume(token),
        priceChange24h: this.calculatePriceChange(tokenPrices),
        volatility24h: this.calculateVolatility(this.calculateReturns(tokenPrices)),
        liquidity: await this.getLiquidity(token),
        marketCap: await this.getMarketCap(token),
        correlation
      }
    }

    return metrics
  }

  async getRiskMetrics(userId: string): Promise<RiskMetrics> {
    const portfolio = await portfolioManager.getPortfolio(userId)
    if (!portfolio) {
      throw new Error("Portfolio not found")
    }

    const positions = Array.from(portfolio.positions.values())
    const positionValues = positions.map(p => 
      parseFloat(p.amount) * parseFloat(p.currentPrice)
    )

    // Get historical data for VaR calculation
    const tokens = positions.map(p => p.token)
    const prices = await this.getPriceHistory(tokens, 30) // 30 days of data
    
    const returns = this.calculatePortfolioReturns(positions, prices)
    const ethReturns = await this.getEthReturns(30)

    const metrics: RiskMetrics = {
      valueatRisk: this.calculateVaR(returns, this.confidenceLevel),
      maxDrawdown: this.calculateMaxDrawdown(returns),
      betaToEth: this.calculateBeta(returns, ethReturns),
      concentration: this.calculateConcentration(positionValues),
      leverageExposure: await this.calculateLeverageExposure(positions),
      impermanentLoss: await this.calculateImpermanentLoss(positions)
    }

    return metrics
  }

  private getEmptyMetrics(): TradeMetrics {
    return {
      totalTrades: 0,
      profitableTrades: 0,
      totalPnL: 0,
      averageReturn: 0,
      winRate: 0,
      largestGain: 0,
      largestLoss: 0,
      averageHoldTime: 0,
      sharpeRatio: 0,
      volatility: 0
    }
  }

  private async getTradeHistory(userId: string, timeframe: "day" | "week" | "month" | "all") {
    const query = supabase
      .from("trades")
      .select<"*", { realized_pnl: string }>()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (timeframe !== "all") {
      const cutoff = new Date(Date.now() - this.timePeriods[timeframe])
      query.gte("created_at", cutoff.toISOString())
    }

    return query
  }

  private calculateTradeReturns(trades: any[]): number[] {
    return trades.map(trade => {
      const entryValue = parseFloat(trade.amount) * parseFloat(trade.entry_price)
      const exitValue = parseFloat(trade.amount) * parseFloat(trade.exit_price)
      return (exitValue - entryValue) / entryValue
    })
  }

  private calculateHoldTimes(trades: any[]): number[] {
    return trades.map(trade => {
      const entry = new Date(trade.created_at).getTime()
      const exit = new Date(trade.closed_at).getTime()
      return exit - entry
    })
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0

    const averageReturn = returns.reduce((a, b) => a + b) / returns.length
    const riskFreeDaily = this.annualRiskFreeRate / 365
    const excessReturns = returns.map(r => r - riskFreeDaily)
    const volatility = this.calculateVolatility(returns)

    return volatility === 0 ? 0 : (averageReturn - riskFreeDaily) / volatility
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0

    const mean = returns.reduce((a, b) => a + b) / returns.length
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
    const variance = squaredDiffs.reduce((a, b) => a + b) / (returns.length - 1)
    
    return Math.sqrt(variance)
  }

  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0

    const sortedReturns = [...returns].sort((a, b) => a - b)
    const index = Math.floor((1 - confidence) * returns.length)
    return -sortedReturns[index]
  }

  private calculateMaxDrawdown(returns: number[]): number {
    if (returns.length === 0) return 0

    let peak = -Infinity
    let maxDrawdown = 0
    let cumulativeReturn = 1

    for (const ret of returns) {
      cumulativeReturn *= (1 + ret)
      if (cumulativeReturn > peak) {
        peak = cumulativeReturn
      }
      const drawdown = (peak - cumulativeReturn) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    return maxDrawdown
  }

  private calculateBeta(portfolioReturns: number[], marketReturns: number[]): number {
    if (portfolioReturns.length !== marketReturns.length || portfolioReturns.length < 2) {
      return 0
    }

    const covariance = this.calculateCovariance(portfolioReturns, marketReturns)
    const marketVariance = this.calculateVariance(marketReturns)

    return marketVariance === 0 ? 0 : covariance / marketVariance
  }

  private calculateConcentration(positionValues: number[]): number {
    if (positionValues.length === 0) return 0

    const totalValue = positionValues.reduce((a, b) => a + b, 0)
    if (totalValue === 0) return 0

    // Herfindahl-Hirschman Index
    return positionValues.reduce((sum, value) => {
      const weight = value / totalValue
      return sum + weight * weight
    }, 0)
  }

  private async calculateLeverageExposure(positions: any[]): Promise<number> {
    // This would require integration with lending protocols to get actual leverage data
    // This is a simplified implementation
    return 1.0
  }

  private async calculateImpermanentLoss(positions: any[]): Promise<number> {
    // This would require historical price data and LP position details
    // This is a simplified implementation
    return 0
  }

  private calculateCovariance(returns1: number[], returns2: number[]): number {
    if (returns1.length !== returns2.length || returns1.length < 2) return 0

    const mean1 = returns1.reduce((a, b) => a + b) / returns1.length
    const mean2 = returns2.reduce((a, b) => a + b) / returns2.length

    const products = returns1.map((r, i) => (r - mean1) * (returns2[i] - mean2))
    return products.reduce((a, b) => a + b) / (returns1.length - 1)
  }

  private calculateVariance(returns: number[]): number {
    if (returns.length < 2) return 0

    const mean = returns.reduce((a, b) => a + b) / returns.length
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b) / (returns.length - 1)
  }

  private calculateCorrelation(prices1: number[], prices2: number[]): number {
    if (prices1.length !== prices2.length || prices1.length < 2) return 0

    const returns1 = this.calculateReturns(prices1)
    const returns2 = this.calculateReturns(prices2)

    const covariance = this.calculateCovariance(returns1, returns2)
    const vol1 = this.calculateVolatility(returns1)
    const vol2 = this.calculateVolatility(returns2)

    return vol1 === 0 || vol2 === 0 ? 0 : covariance / (vol1 * vol2)
  }

  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = []
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1])
    }
    return returns
  }
  
  private calculatePriceChange(prices: number[]): number {
    if (prices.length < 2) return 0
    return ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
  }

  private async getPriceHistory(
    tokens: string[],
    hours: number
  ): Promise<Record<string, number[]>> {
    // This should be implemented to fetch historical price data from your database
    // This is a placeholder implementation
    return {}
  }

  private async getEthReturns(days: number): Promise<number[]> {
    // This should be implemented to fetch ETH historical returns
    // This is a placeholder implementation
    return []
  }

  private async get24hVolume(token: string): Promise<number> {
    // Implementation would depend on your data sources
    return 0
  }

  private async getLiquidity(token: string): Promise<number> {
    // Implementation would depend on your data sources
    return 0
  }

  private async getMarketCap(token: string): Promise<number> {
    // Implementation would depend on your data sources
    return 0
  }

  private calculatePortfolioReturns(
    positions: any[],
    prices: Record<string, number[]>
  ): number[] {
    // Calculate historical returns for the entire portfolio
    // This is a simplified implementation
    return []
  }
}

export const tradeAnalytics = new TradeAnalytics()