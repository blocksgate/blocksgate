import { priceAggregator } from "../price-aggregator"
import { TradingStrategy, Indicator, Rule, RiskParams } from "./types"
import { EventEmitter } from "events"
import type { PriceBar } from "../types/ethereum"

export interface BacktestConfig {
  startDate: Date
  endDate: Date
  strategy: TradingStrategy
  initialCapital: number
  token: string
  slippageTolerance?: number
  fees?: {
    trading: number
    gas: number
  }
}

export interface TradeResult {
  timestamp: Date
  type: "entry" | "exit"
  price: number
  amount: number
  fee: number
  pnl?: number
}

export interface BacktestResults {
  trades: TradeResult[]
  metrics: {
    totalPnL: number
    winRate: number
    maxDrawdown: number
    sharpeRatio: number
    totalTrades: number
    profitableTrades: number
    averageReturn: number
    volatility: number
  }
  equity: Array<{
    timestamp: Date
    value: number
  }>
}

export class Backtester extends EventEmitter {
  private historicalData: Array<{
    timestamp: Date
    price: number
    volume: number
  }> = []

  constructor() {
    super()
  }

  async runBacktest(config: BacktestConfig): Promise<BacktestResults> {
    // Load historical data
    await this.loadHistoricalData(config.token, config.startDate, config.endDate)

    let equity = config.initialCapital
    const trades: TradeResult[] = []
    const equityCurve: Array<{ timestamp: Date; value: number }> = []
    let position = 0
    let entryPrice = 0

    // Initialize indicators
    const indicators = this.initializeIndicators(config.strategy.indicators)

    // Process each historical data point
    for (let i = 0; i < this.historicalData.length; i++) {
      const currentBar = this.historicalData[i]
      const currentPrice = currentBar.price

      // Update indicators
      this.updateIndicators(indicators, currentBar, i)

      // Check entry rules if not in position
      if (position === 0) {
        const shouldEnter = this.evaluateRules(config.strategy.entryRules, indicators, currentBar, i)
        if (shouldEnter) {
          // Calculate position size based on risk parameters
          const positionSize = this.calculatePositionSize(
            equity,
            currentPrice,
            config.strategy.riskManagement
          )

          // Enter position
          position = positionSize
          entryPrice = currentPrice
          const fee = (currentPrice * positionSize * (config.fees?.trading || 0.001))

          trades.push({
            timestamp: currentBar.timestamp,
            type: "entry",
            price: currentPrice,
            amount: positionSize,
            fee
          })

          equity -= fee
        }
      }
      // Check exit rules if in position
      else {
        const shouldExit = this.evaluateRules(config.strategy.exitRules, indicators, currentBar, i)
        if (shouldExit) {
          // Exit position
          const exitFee = (currentPrice * Math.abs(position) * (config.fees?.trading || 0.001))
          const pnl = position * (currentPrice - entryPrice) - exitFee

          trades.push({
            timestamp: currentBar.timestamp,
            type: "exit",
            price: currentPrice,
            amount: position,
            fee: exitFee,
            pnl
          })

          equity += pnl
          position = 0
        }
      }

      // Record equity curve
      equityCurve.push({
        timestamp: currentBar.timestamp,
        value: equity + (position * (currentPrice - entryPrice))
      })

      // Emit progress
      this.emit("progress", {
        current: i + 1,
        total: this.historicalData.length,
        equity: equity
      })
    }

    // Calculate final metrics
    const metrics = this.calculateMetrics(trades, equityCurve, config.initialCapital)

    return {
      trades,
      metrics,
      equity: equityCurve
    }
  }

  private async loadHistoricalData(token: string, startDate: Date, endDate: Date) {
    try {
      // Load price history from your database or API
      const priceHistory = await priceAggregator.getPriceHistory(
        token,
        "1h" // 1-hour timeframe
      )

      this.historicalData = priceHistory.map((bar: PriceBar) => ({
        timestamp: new Date(bar.timestamp),
        price: bar.close, // Using close price from PriceBar
        volume: bar.volume
      }))
    } catch (error) {
      throw new Error(`Failed to load historical data: ${error}`)
    }
  }

  private initializeIndicators(indicators: Indicator[]): Map<string, any> {
    const initialized = new Map()
    
    for (const indicator of indicators) {
      switch (indicator.type) {
        case "SMA":
          initialized.set(indicator.id, {
            type: "SMA",
            period: indicator.parameters.period,
            values: []
          })
          break
        case "RSI":
          initialized.set(indicator.id, {
            type: "RSI",
            period: indicator.parameters.period,
            values: [],
            gains: [],
            losses: []
          })
          break
        // Add more indicators as needed
      }
    }

    return initialized
  }

  private updateIndicators(
    indicators: Map<string, any>,
    currentBar: { price: number; timestamp: Date; volume: number },
    index: number
  ) {
    for (const [id, indicator] of indicators.entries()) {
      switch (indicator.type) {
        case "SMA":
          this.updateSMA(indicator, currentBar.price)
          break
        case "RSI":
          this.updateRSI(indicator, currentBar.price)
          break
        // Add more indicator updates as needed
      }
    }
  }

  private updateSMA(indicator: any, price: number) {
    indicator.values.push(price)
    if (indicator.values.length > indicator.period) {
      indicator.values.shift()
    }
    indicator.current = indicator.values.reduce((a: number, b: number) => a + b, 0) / indicator.values.length
  }

  private updateRSI(indicator: any, price: number) {
    if (indicator.values.length > 0) {
      const change = price - indicator.values[indicator.values.length - 1]
      indicator.gains.push(Math.max(0, change))
      indicator.losses.push(Math.max(0, -change))
    }

    indicator.values.push(price)

    if (indicator.values.length > indicator.period) {
      indicator.values.shift()
      indicator.gains.shift()
      indicator.losses.shift()
    }

    if (indicator.values.length === indicator.period) {
      const avgGain = indicator.gains.reduce((a: number, b: number) => a + b, 0) / indicator.period
      const avgLoss = indicator.losses.reduce((a: number, b: number) => a + b, 0) / indicator.period
      const rs = avgGain / (avgLoss || 1) // Avoid division by zero
      indicator.current = 100 - (100 / (1 + rs))
    }
  }

  private evaluateRules(
    rules: Rule[],
    indicators: Map<string, any>,
    currentBar: { price: number; timestamp: Date; volume: number },
    index: number
  ): boolean {
    return rules.every(rule => {
      const indicator = indicators.get(rule.indicatorId)
      if (!indicator) return false

      switch (rule.condition) {
        case "GREATER_THAN":
          return indicator.current > rule.value
        case "LESS_THAN":
          return indicator.current < rule.value
        case "CROSSES_ABOVE":
          return indicator.current > rule.value && 
                 (indicator.values[indicator.values.length - 2] || 0) <= rule.value
        case "CROSSES_BELOW":
          return indicator.current < rule.value && 
                 (indicator.values[indicator.values.length - 2] || 0) >= rule.value
        default:
          return false
      }
    })
  }

  private calculatePositionSize(equity: number, price: number, riskParams: RiskParams): number {
    const riskAmount = equity * (riskParams.riskPerTrade || 0.01) // Default 1% risk per trade
    const positionSize = riskAmount / (price * (riskParams.stopLoss || 0.02)) // Using stop loss to calculate position size
    return Math.min(positionSize, equity * (riskParams.maxPositionSize || 0.2)) // Cap at max position size
  }

  private calculateMetrics(
    trades: TradeResult[],
    equityCurve: Array<{ timestamp: Date; value: number }>,
    initialCapital: number
  ): BacktestResults["metrics"] {
    const profitableTrades = trades.filter(t => (t.pnl || 0) > 0)
    const returns = equityCurve.map((e, i) => 
      i === 0 ? 0 : (e.value - equityCurve[i-1].value) / equityCurve[i-1].value
    )

    const finalEquity = equityCurve[equityCurve.length - 1].value
    const totalPnL = finalEquity - initialCapital
    const maxDrawdown = this.calculateMaxDrawdown(equityCurve)
    const volatility = this.calculateVolatility(returns)
    const sharpeRatio = this.calculateSharpeRatio(returns, volatility)

    return {
      totalPnL,
      winRate: profitableTrades.length / trades.length,
      maxDrawdown,
      sharpeRatio,
      totalTrades: trades.length,
      profitableTrades: profitableTrades.length,
      averageReturn: totalPnL / trades.length,
      volatility
    }
  }

  private calculateMaxDrawdown(equityCurve: Array<{ timestamp: Date; value: number }>): number {
    let maxDrawdown = 0
    let peak = equityCurve[0].value

    for (const point of equityCurve) {
      if (point.value > peak) {
        peak = point.value
      } else {
        const drawdown = (peak - point.value) / peak
        maxDrawdown = Math.max(maxDrawdown, drawdown)
      }
    }

    return maxDrawdown
  }

  private calculateVolatility(returns: number[]): number {
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2))
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / returns.length)
  }

  private calculateSharpeRatio(returns: number[], volatility: number): number {
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length
    const riskFreeRate = 0.02 / 252 // Assuming 2% annual risk-free rate
    return (meanReturn - riskFreeRate) / volatility
  }
}

export const backtester = new Backtester()