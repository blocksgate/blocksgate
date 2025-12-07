export type OrderSide = 'buy' | 'sell'

export interface Order {
  id: string
  side: OrderSide
  baseToken: string
  quoteToken: string
  amount: number
  limitPrice: number // price in quoteToken per baseToken
  status?: 'pending' | 'filled' | 'cancelled' | 'failed'
  createdAt?: string
}

/**
 * Check whether an order is executable against current market price.
 * This is a lightweight placeholder implementation. Replace with real
 * price feed (0x / DEX quotes) integration in the next iteration.
 */
export async function isOrderExecutable(order: Order): Promise<{ executable: boolean; currentPrice: number }>{
  // Integrate with 0x API to retrieve a live price
  try {
    const baseToken = encodeURIComponent(order.baseToken)
    const quoteToken = encodeURIComponent(order.quoteToken)

    // Assumptions: order.amount is in human units. 0x expects integer amounts (wei-like).
    // We conservatively assume 18 decimals for tokens unless overridden.
    const decimals = Number(process.env.ZEROX_TOKEN_DECIMALS || 18)
    const buyAmount = Math.floor(order.amount * Math.pow(10, decimals))

    const baseUrl = process.env.ZEROX_API_URL ?? 'https://api.0x.org'
    const url = `${baseUrl}/swap/v1/price?buyToken=${baseToken}&sellToken=${quoteToken}&buyAmount=${buyAmount}`

    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      // fallback to simulated price when 0x is unreachable
      console.warn('0x price fetch failed', res.status, await res.text())
      const simulatedPrice = order.limitPrice * (1 + (Math.random() - 0.3) * 0.02)
      return { executable: order.side === 'buy' ? simulatedPrice <= order.limitPrice : simulatedPrice >= order.limitPrice, currentPrice: simulatedPrice }
    }

    const data = await res.json()
    // 0x price endpoint returns `price` as a string if available
    const priceStr = data?.price ?? null
    let currentPrice = Number(priceStr)
    if (!priceStr || Number.isNaN(currentPrice)) {
      // as a fallback, compute price from sellAmount/buyAmount when available
      const sellAmount = Number(data?.sellAmount)
      const buyAmountResp = Number(data?.buyAmount)
      if (sellAmount && buyAmountResp) {
        // price in quoteToken per baseToken
        currentPrice = sellAmount / buyAmountResp
      } else {
        // final fallback: simulated
        currentPrice = order.limitPrice * (1 + (Math.random() - 0.3) * 0.02)
      }
    }

    if (order.side === 'buy') {
      return { executable: currentPrice <= order.limitPrice, currentPrice }
    }
    return { executable: currentPrice >= order.limitPrice, currentPrice }
  } catch (err) {
    console.error('isOrderExecutable error', err)
    const simulatedPrice = order.limitPrice * (1 + (Math.random() - 0.3) * 0.02)
    return { executable: order.side === 'buy' ? simulatedPrice <= order.limitPrice : simulatedPrice >= order.limitPrice, currentPrice: simulatedPrice }
  }
}

/**
 * Execute the order.
 * This function should perform the actual trade via 0x or another executor.
 * Current implementation is a stub that simulates execution and returns a fake tx hash.
 */
export async function executeOrder(order: Order): Promise<{ success: boolean; txHash?: string; error?: string }>{
  try {
    // TODO: call 0x quote/submit endpoints, handle approvals, gas, retries
    // Simulate network latency
    await new Promise((res) => setTimeout(res, 300))

    // Simulate success 90% of the time
    if (Math.random() < 0.9) {
      return { success: true, txHash: `0xsimulatedtx_${order.id}_${Date.now()}` }
    }

    return { success: false, error: 'Simulated execution failure' }
  } catch (err: any) {
    return { success: false, error: String(err?.message ?? err) }
  }
}
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