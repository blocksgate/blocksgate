import { supabase } from "./supabase/client"
import { wsPrice } from "./websocket-price-feed"
import { EventEmitter } from "events"
import { Database } from "./types/supabase"

type DbPortfolio = Database['public']['Tables']['portfolios']['Row']
type DbPortfolioSummary = Database['public']['Tables']['portfolio_summaries']['Row']

export interface Position {
  token: string
  amount: string
  averageEntryPrice: string
  currentPrice: string
  unrealizedPnL: string
  realizedPnL: string
  lastUpdated: number
}

export interface Portfolio {
  userId: string
  positions: Map<string, Position>
  totalValue: string
  totalPnL: string
  lastUpdated: number
}

export class PortfolioManager extends EventEmitter {
  private portfolios: Map<string, Portfolio> = new Map()
  private readonly updateInterval = 60000 // 1 minute

  constructor() {
    super()
    this.startPriceSubscription()
    this.startPeriodicUpdate()
  }

  private startPriceSubscription() {
    wsPrice.on("price", async ({ token, price }) => {
      await this.updatePositionsForToken(token, price)
    })
  }

  private startPeriodicUpdate() {
    setInterval(() => this.updateAllPortfolios(), this.updateInterval)
  }

  private async updatePositionsForToken(token: string, price: number) {
    for (const [userId, portfolio] of this.portfolios.entries()) {
      const position = portfolio.positions.get(token)
      if (position) {
        await this.updatePositionPrice(userId, token, price)
      }
    }
  }

  private async updatePositionPrice(userId: string, token: string, currentPrice: number) {
    const portfolio = this.portfolios.get(userId)
    if (!portfolio) return

    const position = portfolio.positions.get(token)
    if (!position) return

    const amount = parseFloat(position.amount)
    const entryPrice = parseFloat(position.averageEntryPrice)
    const unrealizedPnL = (currentPrice - entryPrice) * amount

    position.currentPrice = currentPrice.toString()
    position.unrealizedPnL = unrealizedPnL.toString()
    position.lastUpdated = Date.now()

    await this.updatePortfolioTotals(userId)
    await this.persistPortfolioUpdate(userId, token, position)

    this.emit("position_updated", { userId, token, position })
  }

  private async updatePortfolioTotals(userId: string) {
    const portfolio = this.portfolios.get(userId)
    if (!portfolio) return

    let totalValue = 0
    let totalPnL = 0

    for (const position of portfolio.positions.values()) {
      const amount = parseFloat(position.amount)
      const currentPrice = parseFloat(position.currentPrice)
      const unrealizedPnL = parseFloat(position.unrealizedPnL)
      const realizedPnL = parseFloat(position.realizedPnL)

      totalValue += amount * currentPrice
      totalPnL += unrealizedPnL + realizedPnL
    }

    portfolio.totalValue = totalValue.toString()
    portfolio.totalPnL = totalPnL.toString()
    portfolio.lastUpdated = Date.now()

    await this.persistPortfolioTotals(userId, portfolio)
    this.emit("portfolio_updated", { userId, portfolio })
  }

  private async persistPortfolioUpdate(userId: string, token: string, position: Position) {
    const portfolioPosition: DbPortfolio = {
      user_id: userId,
      token,
      amount: position.amount,
      average_entry_price: position.averageEntryPrice,
      current_price: position.currentPrice,
      unrealized_pnl: position.unrealizedPnL,
      realized_pnl: position.realizedPnL,
      last_updated: new Date(position.lastUpdated).toISOString()
    }

    const { error } = await supabase
      .from("portfolios")
      .upsert(portfolioPosition)

    if (error) {
      console.error("Failed to persist position update:", error)
    }
  }

  private async persistPortfolioTotals(userId: string, portfolio: Portfolio) {
    const portfolioSummary: DbPortfolioSummary = {
      user_id: userId,
      total_value: portfolio.totalValue,
      total_pnl: portfolio.totalPnL,
      last_updated: new Date(portfolio.lastUpdated).toISOString()
    }

    const { error } = await supabase
      .from("portfolio_summaries")
      .upsert(portfolioSummary)

    if (error) {
      console.error("Failed to persist portfolio totals:", error)
    }
  }

  async updateAllPortfolios() {
    const userIds = Array.from(this.portfolios.keys())
    for (const userId of userIds) {
      await this.refreshPortfolio(userId)
    }
  }

  async refreshPortfolio(userId: string) {
    try {
      const { data: positions, error: positionsError } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", userId)

      if (positionsError) throw positionsError

      const portfolio: Portfolio = {
        userId,
        positions: new Map(),
        totalValue: "0",
        totalPnL: "0",
        lastUpdated: Date.now()
      }

      if (positions) {
        for (const pos of positions) {
          portfolio.positions.set(pos.token, {
            token: pos.token,
            amount: pos.amount,
            averageEntryPrice: pos.average_entry_price,
            currentPrice: pos.current_price,
            unrealizedPnL: pos.unrealized_pnl,
            realizedPnL: pos.realized_pnl,
            lastUpdated: new Date(pos.last_updated).getTime()
          })
        }
      }

      this.portfolios.set(userId, portfolio)
      await this.updatePortfolioTotals(userId)
    } catch (error) {
      console.error("Failed to refresh portfolio:", error)
      throw error
    }
  }

  async getPortfolio(userId: string): Promise<Portfolio | null> {
    if (!this.portfolios.has(userId)) {
      await this.refreshPortfolio(userId)
    }
    return this.portfolios.get(userId) || null
  }

  async updateUserPosition(
    userId: string,
    token: string,
    amount: string,
    price: string
  ): Promise<Position> {
    let portfolio = await this.getPortfolio(userId)
    if (!portfolio) {
      portfolio = {
        userId,
        positions: new Map(),
        totalValue: "0",
        totalPnL: "0",
        lastUpdated: Date.now()
      }
      this.portfolios.set(userId, portfolio)
    }

    const existingPosition = portfolio.positions.get(token)
    const newAmount = parseFloat(amount)
    const newPrice = parseFloat(price)

    if (existingPosition) {
      const oldAmount = parseFloat(existingPosition.amount)
      const oldPrice = parseFloat(existingPosition.averageEntryPrice)
      const totalAmount = oldAmount + newAmount

      if (totalAmount === 0) {
        // Position closed
        const realizedPnL = (newPrice - oldPrice) * Math.abs(newAmount)
        existingPosition.amount = "0"
        existingPosition.realizedPnL = (parseFloat(existingPosition.realizedPnL) + realizedPnL).toString()
      } else {
        // Position updated
        existingPosition.amount = totalAmount.toString()
        existingPosition.averageEntryPrice = ((oldAmount * oldPrice + newAmount * newPrice) / totalAmount).toString()
      }

      existingPosition.currentPrice = price
      existingPosition.lastUpdated = Date.now()
      await this.updatePositionPrice(userId, token, newPrice)
      return existingPosition
    } else {
      // New position
      const position: Position = {
        token,
        amount,
        averageEntryPrice: price,
        currentPrice: price,
        unrealizedPnL: "0",
        realizedPnL: "0",
        lastUpdated: Date.now()
      }
      portfolio.positions.set(token, position)
      await this.updatePositionPrice(userId, token, newPrice)
      return position
    }
  }
}

export const portfolioManager = new PortfolioManager()