export type IndicatorType = "SMA" | "EMA" | "RSI" | "MACD" | "Bollinger" | "ATR"

export interface Indicator {
  id: string
  type: IndicatorType
  parameters: {
    period?: number
    source?: "close" | "high" | "low" | "open"
    multiplier?: number
    slowPeriod?: number
    fastPeriod?: number
    signalPeriod?: number
    standardDeviations?: number
  }
}

export type RuleCondition = 
  | "GREATER_THAN"
  | "LESS_THAN"
  | "CROSSES_ABOVE"
  | "CROSSES_BELOW"
  | "EQUALS"
  | "IN_RANGE"

export interface Rule {
  id: string
  indicatorId: string
  condition: RuleCondition
  value: number
  secondaryValue?: number // For range conditions
}

export interface RiskParams {
  riskPerTrade: number // Percentage of equity to risk per trade
  maxPositionSize: number // Maximum position size as percentage of equity
  stopLoss: number // Stop loss percentage
  takeProfit?: number // Take profit percentage
  trailingStop?: number // Trailing stop percentage
  maxOpenPositions?: number // Maximum number of concurrent positions
  maxDailyLoss?: number // Maximum daily loss percentage
  maxDrawdown?: number // Maximum drawdown percentage
}

export interface TradingStrategy {
  id: string
  name: string
  description: string
  indicators: Indicator[]
  entryRules: Rule[]
  exitRules: Rule[]
  riskManagement: RiskParams
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
  tradingHours?: {
    start: string // "HH:mm"
    end: string // "HH:mm"
    timezone: string // "UTC"
  }
  markets: string[] // Array of token addresses or symbols
}

export interface StrategyPerformance {
  strategyId: string
  timestamp: Date
  metrics: {
    totalPnL: number
    winRate: number
    sharpeRatio: number
    maxDrawdown: number
    totalTrades: number
    profitableTrades: number
    averageReturn: number
    volatility: number
  }
  lastUpdated: Date
}