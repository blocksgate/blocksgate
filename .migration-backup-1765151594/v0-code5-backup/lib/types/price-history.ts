export interface PriceBar {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface HistoricalPriceOptions {
  timeframe: "1m" | "5m" | "15m" | "1h" | "4h" | "1d"
  limit?: number
  startTime?: number
  endTime?: number
}

export interface PriceHistory {
  token: string
  timeframe: string
  bars: PriceBar[]
}

export interface PriceHistoryProvider {
  getPriceHistory(token: string, options: HistoricalPriceOptions): Promise<PriceHistory>
}

export class PriceHistoryError extends Error {
  constructor(
    message: string,
    public readonly token: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = "PriceHistoryError"
  }
}