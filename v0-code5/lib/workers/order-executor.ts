import { Order, isOrderExecutable, executeOrder } from '../order-matching-engine'

/**
 * OrderExecutor supports two modes:
 * - in-memory queue (default) for local development
 * - pluggable async loader function: `() => Promise<Order[]>` which should
 *   return pending orders from a DB (Supabase/Postgres). Pass the loader into
 *   the constructor to enable DB-backed operation.
 */
export class OrderExecutor {
  private intervalMs: number
  private running = false
  private orders: Order[] = []
  private loader: (() => Promise<Order[]>) | null

  constructor(intervalMs = 5000, loader: (() => Promise<Order[]>) | null = null) {
    this.intervalMs = intervalMs
    this.loader = loader
  }

  public enqueue(order: Order) {
    // only use enqueue for in-memory mode
    if (this.loader) {
      console.warn('enqueue called while loader is configured — prefer DB inserts for workers')
    }
    this.orders.push(order)
  }

  private async loadFromDbIfConfigured() {
    if (!this.loader) return
    try {
      const remote = await this.loader()
      // replace local queue with remote pending orders
      this.orders = remote
    } catch (err) {
      console.error('OrderExecutor loader error', err)
    }
  }

  public async runOnce() {
    // if a loader is configured, refresh orders from DB
    await this.loadFromDbIfConfigured()

    // process a shallow copy to allow enqueue during processing
    const snapshot = [...this.orders]
    for (const order of snapshot) {
      if (order.status && order.status !== 'pending') continue

      const { executable, currentPrice } = await isOrderExecutable(order)
      if (!executable) continue

      // attempt execution
      const result = await executeOrder(order)
      if (result.success) {
        // mark filled and remove from queue
        order.status = 'filled'
        this.orders = this.orders.filter((o) => o.id !== order.id)
        // TODO: persist execution result to DB and emit events
        console.log(`Order ${order.id} executed, tx=${result.txHash}, price=${currentPrice}`)
      } else {
        order.status = 'failed'
        console.warn(`Order ${order.id} failed: ${result.error}`)
      }
    }
  }

  public start() {
    if (this.running) return
    this.running = true
    const tick = async () => {
      try {
        await this.runOnce()
      } catch (err) {
        console.error('OrderExecutor tick error', err)
      }
      if (this.running) setTimeout(tick, this.intervalMs)
    }
    setTimeout(tick, this.intervalMs)
  }

  public stop() {
    this.running = false
  }
}

// exported singleton for simple usage from API routes during development
export const globalOrderExecutor = new OrderExecutor(5000)
#!/usr/bin/env node
/*
  Background worker for executing pending limit orders.
  Monitors prices and executes orders when price targets are met.
  Run locally with: `npm run worker` or `ts-node lib/workers/order-executor.ts`
*/

import { createClient } from "@/lib/supabase/server"
import { sleep } from "@/lib/utils"
import { zxClient } from "@/lib/0x-client"
import { priceFeed } from "@/lib/price-feed"
import { config } from "@/lib/config"
import { recordTrade, updateTradeStatus } from "@/lib/trade-service"
import { ethers } from "ethers"

// Token address to CoinGecko ID mapping
const TOKEN_ID_MAP: Record<string, string> = {
  "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": "ethereum", // ETH
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "usd-coin", // USDC
  "0x6B175474E89094C44Da98b954EedeAC495271d0F": "dai", // DAI
  "0xdAC17F958D2ee523a2206206994597c13d831ec7": "tether", // USDT
  "0x2260FAC5E5542a773Aa44fBCfF9D83333Ad63169": "wrapped-bitcoin", // WBTC
}

interface Order {
  id: string
  user_id: string
  token_in: string
  token_out: string
  amount_in: string | number
  min_amount_out: string | number
  price_target: string | number
  status: "pending" | "filled" | "cancelled" | "expired" | "ready_to_execute"
  order_type: "limit" | "dca" | "stop-loss"
  chain_id: number
  created_at: string
  expires_at?: string
  filled_at?: string
  filled_amount_in?: string | number
  filled_amount_out?: string | number
}

/**
 * Get current price for a token (in USD)
 */
async function getTokenPrice(tokenAddress: string): Promise<number> {
  try {
    // Try CoinGecko ID mapping first
    const tokenId = TOKEN_ID_MAP[tokenAddress.toLowerCase()]
    if (tokenId) {
      return await priceFeed.getPrice(tokenId)
    }

    // Fallback: Try to get price from 0x Protocol
    try {
      const prices = await zxClient.getPrices(1, [tokenAddress])
      const priceStr = prices[tokenAddress]
      if (priceStr) {
        return Number.parseFloat(priceStr)
      }
    } catch (error) {
      console.warn(`[OrderExecutor] Failed to get price from 0x for ${tokenAddress}:`, error)
    }

    // If all else fails, return 0 (will skip order)
    console.warn(`[OrderExecutor] No price found for token ${tokenAddress}`)
    return 0
  } catch (error) {
    console.error(`[OrderExecutor] Error fetching price for ${tokenAddress}:`, error)
    return 0
  }
}

/**
 * Calculate exchange rate between two tokens
 */
async function getExchangeRate(
  sellToken: string,
  buyToken: string,
  chainId: number,
): Promise<number> {
  try {
    // Get prices in USD
    const sellPrice = await getTokenPrice(sellToken)
    const buyPrice = await getTokenPrice(buyToken)

    if (sellPrice === 0 || buyPrice === 0) {
      // Fallback: Try 0x Protocol for direct quote
      try {
        // Use a small amount for quote (1 unit)
        const sellAmount = "1000000000000000000" // 1 ETH in wei (or equivalent)
        const quote = await zxClient.getQuote(chainId, sellToken, buyToken, sellAmount)
        // Calculate rate from quote
        const sellAmountNum = Number.parseFloat(ethers.formatEther(quote.sellAmount))
        const buyAmountNum = Number.parseFloat(ethers.formatEther(quote.buyAmount))
        return buyAmountNum / sellAmountNum
      } catch (error) {
        console.warn(`[OrderExecutor] Failed to get exchange rate from 0x:`, error)
        return 0
      }
    }

    // Calculate rate: how much buyToken per sellToken
    return buyPrice / sellPrice
  } catch (error) {
    console.error(`[OrderExecutor] Error calculating exchange rate:`, error)
    return 0
  }
}

/**
 * Check if a limit order should be executed based on current price
 */
async function shouldExecuteOrder(order: Order): Promise<boolean> {
  // Check if order expired
  if (order.expires_at) {
    const expiresAt = new Date(order.expires_at)
    if (expiresAt < new Date()) {
      console.log(`[OrderExecutor] Order ${order.id} expired`)
      return false
    }
  }

  // Get current exchange rate
  const currentRate = await getExchangeRate(order.token_in, order.token_out, order.chain_id)

  if (currentRate === 0) {
    console.warn(`[OrderExecutor] Could not determine exchange rate for order ${order.id}`)
    return false
  }

  // Calculate expected output at current rate
  const amountIn = Number.parseFloat(String(order.amount_in))
  const expectedOutput = amountIn * currentRate
  const minAmountOut = Number.parseFloat(String(order.min_amount_out))
  const priceTarget = Number.parseFloat(String(order.price_target))

  // For limit orders: execute if current rate meets or exceeds target
  // price_target is the minimum exchange rate (buyToken per sellToken)
  if (currentRate >= priceTarget && expectedOutput >= minAmountOut) {
    console.log(
      `[OrderExecutor] Order ${order.id} ready: rate ${currentRate.toFixed(6)} >= target ${priceTarget.toFixed(6)}`,
    )
    return true
  }

  return false
}

/**
 * Mark order as ready to execute (user will need to sign transaction)
 */
async function markOrderReady(order: Order, supabase: ReturnType<typeof createClient>) {
  try {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "ready_to_execute",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    if (error) {
      console.error(`[OrderExecutor] Failed to mark order ${order.id} as ready:`, error)
      return false
    }

    console.log(`[OrderExecutor] Order ${order.id} marked as ready_to_execute`)
    return true
  } catch (error) {
    console.error(`[OrderExecutor] Error marking order ready:`, error)
    return false
  }
}

/**
 * Get quote for order execution
 */
async function getExecutionQuote(order: Order) {
  try {
    // Convert amount to wei (assuming 18 decimals for most tokens)
    // In production, you'd fetch actual decimals from token contract
    const amountInWei = ethers.parseUnits(String(order.amount_in), 18).toString()

    const quote = await zxClient.getQuote(
      order.chain_id,
      order.token_in,
      order.token_out,
      amountInWei,
      0.5, // 0.5% slippage
    )

    return quote
  } catch (error) {
    console.error(`[OrderExecutor] Failed to get execution quote for order ${order.id}:`, error)
    return null
  }
}

/**
 * Process a single pending order
 */
async function processOrder(order: Order, supabase: ReturnType<typeof createClient>) {
  try {
    console.log(`[OrderExecutor] Processing order ${order.id} (${order.order_type})`)

    // Check if order should be executed
    const shouldExecute = await shouldExecuteOrder(order)

    if (shouldExecute) {
      // Get execution quote
      const quote = await getExecutionQuote(order)

      if (quote) {
        // Mark order as ready to execute
        // User will need to sign and execute the transaction
        await markOrderReady(order, supabase)

        // Store quote data in order metadata (you might want to add a metadata column)
        console.log(`[OrderExecutor] Order ${order.id} ready with quote:`, {
          buyAmount: quote.buyAmount,
          price: quote.price,
          gas: quote.gas,
        })
      } else {
        console.warn(`[OrderExecutor] Could not get quote for order ${order.id}, will retry`)
      }
    } else {
      // Order not ready yet, continue monitoring
      console.log(`[OrderExecutor] Order ${order.id} not ready yet`)
    }
  } catch (error) {
    console.error(`[OrderExecutor] Error processing order ${order.id}:`, error)
  }
}

/**
 * Main order processing loop
 */
async function processPendingOrders() {
  const supabase = await createClient()

  console.log("[OrderExecutor] Starting order executor worker...")

  while (true) {
    try {
      // Fetch pending limit orders
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .eq("order_type", "limit")
        .limit(20) // Process up to 20 orders per iteration

      if (error) {
        console.error("[OrderExecutor] Error fetching orders:", error.message || error)
        await sleep(5000) // Wait longer on error
        continue
      }

      if (orders && orders.length > 0) {
        console.log(`[OrderExecutor] Found ${orders.length} pending orders`)

        // Process orders in parallel (with concurrency limit)
        const concurrency = 5
        for (let i = 0; i < orders.length; i += concurrency) {
          const batch = orders.slice(i, i + concurrency)
          await Promise.all(batch.map((order) => processOrder(order as Order, supabase)))
        }
      } else {
        console.log("[OrderExecutor] No pending orders found")
      }
    } catch (err) {
      console.error("[OrderExecutor] Unexpected error:", err)
    }

    // Sleep between iterations (check every 10 seconds)
    await sleep(10000)
  }
}

// Allow running directly
if (require.main === module) {
  processPendingOrders().catch((err) => {
    console.error("[OrderExecutor] Worker failed:", err)
    process.exit(1)
  })
}

export { processPendingOrders, processOrder, shouldExecuteOrder }
