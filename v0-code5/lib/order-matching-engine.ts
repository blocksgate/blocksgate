import { EventEmitter } from "events"
import { priceAggregator } from "./price-aggregator"
import { ZxClient } from "./0x-client"
import { getGasPrice } from "./gas-optimizer"
import { config } from "./config"

export interface Order {
  id: string
  userId: string
  token: string
  side: "buy" | "sell"
  amount: string
  price?: string
  type: "market" | "limit"
  status: "pending" | "filled" | "cancelled" | "expired"
  createdAt: number
  expiresAt?: number
  fillPrice?: string
  gasPriceGwei?: string
  maxSlippage?: number
}

export class OrderMatchingEngine extends EventEmitter {
  private orders: Map<string, Order> = new Map()
  private readonly zeroEx: ZxClient
  private readonly updateInterval = 15000 // 15 seconds
  private readonly maxSlippage = 0.01 // 1% default slippage
  private readonly minOrderSize = "0.01" // Minimum order size in base token
  private readonly chainId = config.chainId

  constructor() {
    super()
    this.zeroEx = new ZxClient()
    this.startPriceSubscription()
    this.startPeriodicUpdate()
  }

  private startPriceSubscription() {
    priceAggregator.on("price", async ({ token, price }) => {
      await this.checkLimitOrders(token, price)
    })
  }

  private startPeriodicUpdate() {
    setInterval(() => this.updatePendingOrders(), this.updateInterval)
  }

  private async updatePendingOrders() {
    const now = Date.now()
    for (const order of this.orders.values()) {
      if (order.status !== "pending") continue

      // Check for expired orders
      if (order.expiresAt && order.expiresAt < now) {
        await this.cancelOrder(order.id, "expired")
        continue
      }

      // Update gas prices for pending orders
      if (order.type === "market") {
        const newGasPrice = await getGasPrice()
        order.gasPriceGwei = newGasPrice.toString()
      }
    }
  }

  private async checkLimitOrders(token: string, currentPrice: number) {
    const pendingOrders = Array.from(this.orders.values()).filter(
      order => order.status === "pending" && 
              order.token === token && 
              order.type === "limit" &&
              order.price
    )

    for (const order of pendingOrders) {
      const orderPrice = parseFloat(order.price!)
      const shouldExecute = (
        (order.side === "buy" && currentPrice <= orderPrice) ||
        (order.side === "sell" && currentPrice >= orderPrice)
      )

      if (shouldExecute) {
        await this.executeLimitOrder(order, currentPrice)
      }
    }
  }

  private async executeLimitOrder(order: Order, currentPrice: number) {
    try {
      // Check if price slippage is within acceptable range
      const priceDeviation = Math.abs(currentPrice - parseFloat(order.price!)) / parseFloat(order.price!)
      if (priceDeviation > (order.maxSlippage || this.maxSlippage)) {
        return // Skip execution if slippage is too high
      }

      // Get optimal gas price
      const gasPrice = await getGasPrice()
      order.gasPriceGwei = gasPrice.toString()

      // Convert order parameters for 0x protocol
      const [sellToken, buyToken, sellAmount] = this.getTradeParameters(order)

      // Get quote from 0x API
      const quote = await this.zeroEx.getQuote(
        this.chainId,
        sellToken,
        buyToken,
        sellAmount,
        order.maxSlippage || this.maxSlippage
      )

      if (!quote) {
        throw new Error("Failed to get quote")
      }

      // Verify quote price is still favorable
      const quotePrice = parseFloat(quote.price)
      const isPriceFavorable = order.side === "buy" 
        ? quotePrice <= parseFloat(order.price!)
        : quotePrice >= parseFloat(order.price!)

      if (!isPriceFavorable) {
        return // Skip if price is no longer favorable
      }

      // Execute the trade
      await this.zeroEx.executeTrade(
        this.chainId,
        order.userId,
        sellToken,
        buyToken,
        sellAmount,
        order.maxSlippage || this.maxSlippage
      )

      // Update order status
      order.status = "filled"
      order.fillPrice = currentPrice.toString()
      this.emit("order_filled", { order, fillPrice: currentPrice })

    } catch (error) {
      console.error(`Failed to execute limit order ${order.id}:`, error)
      this.emit("order_error", { order, error })
    }
  }

  private getTradeParameters(order: Order): [string, string, string] {
    // Implement the logic to convert order parameters to 0x protocol format
    // This is a placeholder - you'll need to implement the actual conversion
    const baseToken = "ETH" // Example - replace with actual base token
    return order.side === "buy"
      ? [baseToken, order.token, order.amount]
      : [order.token, baseToken, order.amount]
  }

  async placeOrder(orderData: Omit<Order, "id" | "status" | "createdAt">): Promise<Order> {
    // Validate order
    if (parseFloat(orderData.amount) < parseFloat(this.minOrderSize)) {
      throw new Error(`Order size must be at least ${this.minOrderSize}`)
    }

    const order: Order = {
      ...orderData,
      id: `order_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      status: "pending",
      createdAt: Date.now()
    }

    // For market orders, execute immediately
    if (order.type === "market") {
      return this.executeMarketOrder(order)
    }

    // For limit orders, store and monitor
    this.orders.set(order.id, order)
    this.emit("order_placed", order)
    
    // Check immediately in case price is already favorable
    const currentPrice = await priceAggregator.getPrice(order.token)
    await this.checkLimitOrders(order.token, currentPrice)

    return order
  }

  private async executeMarketOrder(order: Order): Promise<Order> {
    try {
      const gasPrice = await getGasPrice()
      order.gasPriceGwei = gasPrice.toString()

      const [sellToken, buyToken, sellAmount] = this.getTradeParameters(order)

      const quote = await this.zeroEx.getQuote(
        this.chainId,
        sellToken,
        buyToken,
        sellAmount,
        order.maxSlippage || this.maxSlippage
      )

      if (!quote) {
        throw new Error("Failed to get quote")
      }

      await this.zeroEx.executeTrade(
        this.chainId,
        order.userId,
        sellToken,
        buyToken,
        sellAmount,
        order.maxSlippage || this.maxSlippage
      )

      order.status = "filled"
      order.fillPrice = quote.price
      this.emit("order_filled", { order, fillPrice: quote.price })

      return order
    } catch (error) {
      console.error(`Failed to execute market order ${order.id}:`, error)
      order.status = "cancelled"
      this.emit("order_error", { order, error })
      throw error
    }
  }

  async cancelOrder(orderId: string, reason: "user_cancelled" | "expired" = "user_cancelled"): Promise<boolean> {
    const order = this.orders.get(orderId)
    if (!order || order.status !== "pending") {
      return false
    }

    order.status = "cancelled"
    this.emit("order_cancelled", { order, reason })
    return true
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId)
  }

  getUserOrders(userId: string): Order[] {
    return Array.from(this.orders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  getPendingOrders(token?: string): Order[] {
    return Array.from(this.orders.values())
      .filter(order => 
        order.status === "pending" &&
        (!token || order.token === token)
      )
      .sort((a, b) => a.createdAt - b.createdAt)
  }
}

export const orderMatchingEngine = new OrderMatchingEngine()