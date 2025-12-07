import { ZxClient } from "./0x-client"
import { wsPrice } from "./websocket-price-feed"
import { supabase } from "./supabase/client"
import type { Tables } from "./types/supabase"

type Order = Tables["orders"]["Row"]
type Trade = Tables["trades"]["Row"]
type OrderInsert = Tables["orders"]["Insert"]
type TradeInsert = Tables["trades"]["Insert"]
type OrderUpdate = Tables["orders"]["Update"]
type TradeUpdate = Tables["trades"]["Update"]

export class OrderManager {
  private orders: Map<string, Order> = new Map()
  private readonly zeroEx: ZxClient

  constructor() {
    this.zeroEx = new ZxClient()
    this.startPriceSubscription()
  }

  private startPriceSubscription() {
    wsPrice.on("price", async ({ token, price }) => {
      await this.checkLimitOrders(token, price)
    })
  }

  private async checkLimitOrders(token: string, currentPrice: number) {
    const pendingOrders = Array.from(this.orders.values()).filter(
      order => order.status === "pending" && order.token === token && order.price
    )

    for (const order of pendingOrders) {
      const orderPrice = parseFloat(order.price)
      const shouldExecute = (
        (order.side === "buy" && currentPrice <= orderPrice) ||
        (order.side === "sell" && currentPrice >= orderPrice)
      )

      if (shouldExecute) {
        await this.executeOrder(order, currentPrice)
      }
    }
  }

  async createOrder(orderData: Omit<OrderInsert, "status" | "created_at" | "updated_at">): Promise<Order> {
    const order: OrderInsert = {
      ...orderData,
      status: "pending",
    }

    // Store in database
    const { data, error } = await supabase
      .from("orders")
      .insert([order])
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error("Failed to create order")

    // Store order in memory
    this.orders.set(data.id, data)

    // Execute immediately if market order
    if (data.type === "market") {
      const currentPrice = await wsPrice.getPrice(data.token)
      await this.executeOrder(data, currentPrice)
    }

    return data
  }

  private async executeOrder(order: Order, executionPrice: number) {
    try {
      const chainId = 1 // Replace with actual chain ID from config
      
      // Get quote from 0x API
      const quote = await this.zeroEx.getQuote(
        chainId,
        order.token, // sellToken
        "WETH", // buyToken, replace with actual token
        order.amount
      )

      // Execute trade using 0x Protocol
      const tx = await this.zeroEx.executeTrade(
        chainId,
        order.user_id,
        order.token,
        "WETH", // replace with actual token
        order.amount
      )

      // Create trade record
      const tradeInsert: TradeInsert = {
        user_id: order.user_id,
        token: order.token,
        amount: order.amount,
        price: executionPrice.toString(),
        fee: quote.fees,
        side: order.side,
        status: "pending",
        tx_hash: tx.hash,
        executed_at: new Date().toISOString()
      }

      // Update order and database
      const updates = await Promise.all([
        supabase
          .from("orders")
          .update({
            status: "filled" as const,
            filled_amount: order.amount,
            remaining_amount: "0",
            tx_hash: tx.hash,
            updated_at: new Date().toISOString()
          })
          .eq("id", order.id)
          .select()
          .single(),
        
        supabase
          .from("trades")
          .insert(tradeInsert)
          .select()
          .single()
      ])

      const [orderUpdate, tradeInsertResult] = updates
      
      if (orderUpdate.error) throw orderUpdate.error
      if (tradeInsertResult.error) throw tradeInsertResult.error

      // Update memory cache
      if (orderUpdate.data) {
        this.orders.set(orderUpdate.data.id, orderUpdate.data)
      }

      // Monitor transaction confirmation
      if (tradeInsertResult.data) {
        this.monitorTradeConfirmation(tradeInsertResult.data)
      }
    } catch (error) {
      console.error(`Failed to execute order ${order.id}:`, error)
      
      // Update order status in database
      const { error: updateError } = await supabase
        .from("orders")
        .update({ 
          status: "failed" as const,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id)

      if (updateError) throw updateError
    }
  }

  private async monitorTradeConfirmation(trade: Trade) {
    try {
      // Use provider to wait for receipt instead of ZxClient
      const provider = await this.zeroEx.getProvider()
      const receipt = await provider.getTransactionReceipt(trade.tx_hash)
      
      const status = receipt && receipt.status ? "completed" as const : "failed" as const
      
      const { error } = await supabase
        .from("trades")
        .update({ status })
        .eq("id", trade.id)

      if (error) throw error

    } catch (error) {
      console.error(`Failed to confirm trade ${trade.id}:`, error)
      
      const { error: updateError } = await supabase
        .from("trades")
        .update({ status: "failed" as const })
        .eq("id", trade.id)

      if (updateError) throw updateError
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<void> {
    const order = this.orders.get(orderId)
    
    if (!order) {
      throw new Error("Order not found")
    }

    if (order.user_id !== userId) {
      throw new Error("Unauthorized")
    }

    if (order.status !== "pending") {
      throw new Error(`Cannot cancel order in ${order.status} status`)
    }

    const { error } = await supabase
      .from("orders")
      .update({ 
        status: "cancelled" as const,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)

    if (error) throw error

    this.orders.delete(orderId)
  }

  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null
  }

  async getUserOrders(userId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select()
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch user orders: ${error.message}`)
    }

    return data || []
  }
}

export const orderManager = new OrderManager()