// Risk management service for slippage protection, loss limits, and stop-loss orders

import { createClient } from "@/lib/supabase/server"
import { priceFeed } from "@/lib/price-feed"

export interface RiskLimits {
  user_id: string
  max_loss_per_trade: number // Maximum loss per trade in USD
  max_loss_per_day: number // Maximum loss per day in USD
  max_position_size: number // Maximum position size as percentage of portfolio (0-100)
  max_slippage: number // Maximum slippage tolerance in percentage (0-100)
  stop_loss_enabled: boolean
  take_profit_enabled: boolean
  risk_per_trade: number // Risk per trade as percentage of portfolio (0-100)
}

export interface StopLossOrder {
  id?: string
  user_id: string
  token: string
  position_size: number
  entry_price: number
  stop_loss_price: number
  take_profit_price?: number
  active: boolean
  triggered: boolean
  triggered_at?: string
  created_at?: string
}

export interface RiskAssessment {
  allowed: boolean
  reasons: string[]
  riskScore: number // 0-100, higher is riskier
  recommendations: string[]
}

export class RiskManager {
  /**
   * Get risk limits for a user
   */
  async getRiskLimits(userId: string): Promise<RiskLimits | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("risk_limits")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error || !data) {
        // Return default risk limits
        return {
          user_id: userId,
          max_loss_per_trade: 100, // $100 max loss per trade
          max_loss_per_day: 500, // $500 max loss per day
          max_position_size: 10, // 10% of portfolio max position
          max_slippage: 1, // 1% max slippage
          stop_loss_enabled: true,
          take_profit_enabled: true,
          risk_per_trade: 2, // 2% risk per trade
        }
      }

      return data as RiskLimits
    } catch (error) {
      console.error("[RiskManager] Error getting risk limits:", error)
      return null
    }
  }

  /**
   * Update risk limits for a user
   */
  async updateRiskLimits(userId: string, limits: Partial<RiskLimits>): Promise<RiskLimits | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("risk_limits")
        .upsert({
          user_id: userId,
          ...limits,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("[RiskManager] Error updating risk limits:", error)
        return null
      }

      return data as RiskLimits
    } catch (error) {
      console.error("[RiskManager] Error updating risk limits:", error)
      return null
    }
  }

  /**
   * Assess risk for a trade
   */
  async assessTradeRisk(
    userId: string,
    token: string,
    amount: number,
    slippage: number,
    price: number
  ): Promise<RiskAssessment> {
    const reasons: string[] = []
    const recommendations: string[] = []
    let riskScore = 0

    // Get user risk limits
    const limits = await this.getRiskLimits(userId)
    if (!limits) {
      return {
        allowed: false,
        reasons: ["Failed to load risk limits"],
        riskScore: 100,
        recommendations: ["Please configure your risk limits"],
      }
    }

    // Check slippage
    if (slippage > limits.max_slippage) {
      reasons.push(`Slippage ${slippage}% exceeds maximum ${limits.max_slippage}%`)
      riskScore += 30
      recommendations.push(`Reduce slippage tolerance to ${limits.max_slippage}% or less`)
    }

    // Check position size
    // Get user portfolio value (simplified - in production, fetch from database)
    const portfolioValue = 10000 // Placeholder
    const positionSizePercent = (amount * price / portfolioValue) * 100
    if (positionSizePercent > limits.max_position_size) {
      reasons.push(`Position size ${positionSizePercent.toFixed(2)}% exceeds maximum ${limits.max_position_size}%`)
      riskScore += 40
      recommendations.push(`Reduce position size to ${limits.max_position_size}% of portfolio`)
    }

    // Check max loss per trade
    const potentialLoss = amount * price * (slippage / 100)
    if (potentialLoss > limits.max_loss_per_trade) {
      reasons.push(`Potential loss $${potentialLoss.toFixed(2)} exceeds maximum $${limits.max_loss_per_trade}`)
      riskScore += 50
      recommendations.push(`Reduce trade size or slippage to stay within loss limits`)
    }

    // Check daily loss limit
    const dailyLoss = await this.getDailyLoss(userId)
    if (dailyLoss + potentialLoss > limits.max_loss_per_day) {
      reasons.push(`Daily loss would exceed maximum $${limits.max_loss_per_day}`)
      riskScore += 60
      recommendations.push("Wait until tomorrow or reduce trade size")
    }

    // Check token liquidity (simplified)
    const liquidityRisk = await this.assessLiquidityRisk(token, amount)
    if (liquidityRisk > 50) {
      reasons.push("Low liquidity for this token")
      riskScore += 20
      recommendations.push("Consider splitting the trade into smaller orders")
    }

    const allowed = riskScore < 70 && reasons.length === 0

    return {
      allowed,
      reasons,
      riskScore: Math.min(riskScore, 100),
      recommendations,
    }
  }

  /**
   * Get daily loss for a user
   */
  private async getDailyLoss(userId: string): Promise<number> {
    try {
      const supabase = await createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: trades, error } = await supabase
        .from("trades")
        .select("profit_loss")
        .eq("user_id", userId)
        .gte("created_at", today.toISOString())
        .lt("profit_loss", 0) // Only losses

      if (error) {
        console.error("[RiskManager] Error getting daily loss:", error)
        return 0
      }

      const totalLoss = trades?.reduce((sum, trade) => sum + Math.abs(trade.profit_loss || 0), 0) || 0
      return totalLoss
    } catch (error) {
      console.error("[RiskManager] Error getting daily loss:", error)
      return 0
    }
  }

  /**
   * Assess liquidity risk for a token
   */
  private async assessLiquidityRisk(token: string, amount: number): Promise<number> {
    // Simplified liquidity risk assessment
    // In production, you would check DEX liquidity, order book depth, etc.
    try {
      // Large amounts have higher liquidity risk
      if (amount > 100000) {
        return 80
      } else if (amount > 50000) {
        return 60
      } else if (amount > 10000) {
        return 40
      }
      return 20
    } catch (error) {
      return 50 // Default to medium risk
    }
  }

  /**
   * Create a stop-loss order
   */
  async createStopLossOrder(
    userId: string,
    token: string,
    positionSize: number,
    entryPrice: number,
    stopLossPrice: number,
    takeProfitPrice?: number
  ): Promise<StopLossOrder | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("stop_loss_orders")
        .insert({
          user_id: userId,
          token,
          position_size: positionSize,
          entry_price: entryPrice,
          stop_loss_price: stopLossPrice,
          take_profit_price: takeProfitPrice,
          active: true,
          triggered: false,
        })
        .select()
        .single()

      if (error) {
        console.error("[RiskManager] Error creating stop-loss order:", error)
        return null
      }

      return data as StopLossOrder
    } catch (error) {
      console.error("[RiskManager] Error creating stop-loss order:", error)
      return null
    }
  }

  /**
   * Get active stop-loss orders for a user
   */
  async getStopLossOrders(userId: string): Promise<StopLossOrder[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("stop_loss_orders")
        .select("*")
        .eq("user_id", userId)
        .eq("active", true)
        .eq("triggered", false)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[RiskManager] Error getting stop-loss orders:", error)
        return []
      }

      return (data || []) as StopLossOrder[]
    } catch (error) {
      console.error("[RiskManager] Error getting stop-loss orders:", error)
      return []
    }
  }

  /**
   * Cancel a stop-loss order
   */
  async cancelStopLossOrder(orderId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from("stop_loss_orders")
        .update({ active: false })
        .eq("id", orderId)
        .eq("user_id", userId)

      if (error) {
        console.error("[RiskManager] Error canceling stop-loss order:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("[RiskManager] Error canceling stop-loss order:", error)
      return false
    }
  }

  /**
   * Check and trigger stop-loss orders (called by background worker)
   */
  async checkStopLossOrders(userId: string): Promise<void> {
    try {
      const orders = await this.getStopLossOrders(userId)
      const supabase = await createClient()

      for (const order of orders) {
        // Get current price
        const currentPrice = await priceFeed.getPrice(order.token).catch(() => null)
        if (!currentPrice) continue

        // Check if stop-loss should trigger
        if (currentPrice <= order.stop_loss_price) {
          // Trigger stop-loss
          await supabase
            .from("stop_loss_orders")
            .update({
              triggered: true,
              triggered_at: new Date().toISOString(),
              active: false,
            })
            .eq("id", order.id)

          // In production, you would execute the stop-loss trade here
          console.log(`[RiskManager] Stop-loss triggered for order ${order.id} at price ${currentPrice}`)
        }

        // Check if take-profit should trigger
        if (order.take_profit_price && currentPrice >= order.take_profit_price) {
          // Trigger take-profit
          await supabase
            .from("stop_loss_orders")
            .update({
              triggered: true,
              triggered_at: new Date().toISOString(),
              active: false,
            })
            .eq("id", order.id)

          console.log(`[RiskManager] Take-profit triggered for order ${order.id} at price ${currentPrice}`)
        }
      }
    } catch (error) {
      console.error("[RiskManager] Error checking stop-loss orders:", error)
    }
  }
}

export const riskManager = new RiskManager()

