#!/usr/bin/env node
/*
  Background worker for executing trading bot strategies.
  Monitors active strategies and executes trades based on strategy logic.
  Run locally with: `npm run worker:bot` or `ts-node lib/workers/bot-executor.ts`
*/

import { createClient } from "@/lib/supabase/server"
import { sleep } from "@/lib/utils"
import { zxClient } from "@/lib/0x-client"
import { priceFeed } from "@/lib/price-feed"
import { logger } from "@/lib/monitoring/logger"
import { ethers } from "ethers"

interface BotStrategy {
  id: string
  user_id: string
  name: string
  strategy_type: "dca" | "grid" | "momentum" | "mean_reversion" | "arbitrage"
  status: "active" | "paused" | "stopped"
  config: any
  token_pair: string
  chain_id: number
  total_trades: number
  total_profit: number
  win_rate: number
  last_executed_at?: string
}

/**
 * Execute DCA (Dollar Cost Averaging) strategy
 */
async function executeDCAStrategy(strategy: BotStrategy, supabase: ReturnType<typeof createClient>) {
  const config = strategy.config
  const [tokenIn, tokenOut] = strategy.token_pair.split("/")

  // Check if enough time has passed since last execution
  if (strategy.last_executed_at) {
    const lastExec = new Date(strategy.last_executed_at)
    const intervalMs = (config.interval || 3600) * 1000 // Default 1 hour
    if (Date.now() - lastExec.getTime() < intervalMs) {
      return // Too soon to execute
    }
  }

  // Get current price
  const tokenInId = getTokenId(tokenIn)
  if (!tokenInId) {
    console.warn(`[BotExecutor] Unknown token: ${tokenIn}`)
    return
  }

  const price = await priceFeed.getPrice(tokenInId).catch(() => 0)
  if (price === 0) {
    console.warn(`[BotExecutor] Could not get price for ${tokenIn}`)
    return
  }

  // Calculate amount to buy
  const amountUSD = config.amount_per_interval || 100 // Default $100
  const amountIn = amountUSD / price

  // Get quote from 0x
  const sellToken = tokenIn === "ETH" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : tokenIn
  const buyToken = tokenOut === "ETH" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : tokenOut

  try {
    const sellAmountWei = ethers.parseEther(amountIn.toString()).toString()
    const quote = await zxClient.getQuote(strategy.chain_id, sellToken, buyToken, sellAmountWei, 0.5)

    // Record execution (user will need to sign transaction)
    await supabase.from("bot_executions").insert({
      strategy_id: strategy.id,
      user_id: strategy.user_id,
      action: "buy",
      token_in: sellToken,
      token_out: buyToken,
      amount_in: amountIn,
      amount_out: ethers.formatEther(quote.buyAmount),
      price: Number.parseFloat(quote.price),
      status: "pending",
    })

    // Update strategy
    await supabase
      .from("bot_strategies")
      .update({
        last_executed_at: new Date().toISOString(),
        total_trades: (strategy.total_trades || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", strategy.id)

    logger.botStrategy(strategy.id, "dca_execute", "success")
    logger.info(`[BotExecutor] DCA strategy ${strategy.id} executed: ${amountIn} ${tokenIn}`)
  } catch (error) {
    logger.error(`[BotExecutor] Error executing DCA strategy ${strategy.id}`, { strategyId: strategy.id, strategyType: "dca" }, error instanceof Error ? error : new Error(String(error)))
  }
}

/**
 * Execute Grid Trading strategy
 */
async function executeGridStrategy(strategy: BotStrategy, supabase: ReturnType<typeof createClient>) {
  const config = strategy.config
  const [tokenIn, tokenOut] = strategy.token_pair.split("/")

  // Get current price
  const tokenInId = getTokenId(tokenIn)
  if (!tokenInId) return

  const price = await priceFeed.getPrice(tokenInId).catch(() => 0)
  if (price === 0) return

  // Grid strategy: place buy orders below price, sell orders above
  const gridSpacing = config.grid_spacing || 0.01 // 1% spacing
  const numGrids = config.num_grids || 10
  const gridSize = config.grid_size || 100 // $100 per grid

  // This is a simplified version - in production, you'd manage multiple limit orders
  // For now, we'll just log the grid setup
  logger.botStrategy(strategy.id, "grid_setup", "configured")
  logger.info(`[BotExecutor] Grid strategy ${strategy.id}: ${numGrids} grids at ${gridSpacing * 100}% spacing`)

  // Update last executed
  await supabase
    .from("bot_strategies")
    .update({
      last_executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", strategy.id)
}

/**
 * Execute Momentum strategy
 */
async function executeMomentumStrategy(strategy: BotStrategy, supabase: ReturnType<typeof createClient>) {
  const config = strategy.config
  const [tokenIn, tokenOut] = strategy.token_pair.split("/")

  // Get price history (simplified - in production, use real price history)
  const tokenInId = getTokenId(tokenIn)
  if (!tokenInId) return

  const currentPrice = await priceFeed.getPrice(tokenInId).catch(() => 0)
  if (currentPrice === 0) return

  // Calculate momentum (simplified - would need price history)
  // For now, we'll use a mock momentum calculation
  const momentumThreshold = config.momentum_threshold || 0.02 // 2% change
  const lookbackPeriod = config.lookback_period || 24 // 24 hours

  // In production, fetch historical prices and calculate actual momentum
  // For now, skip execution
  console.log(`[BotExecutor] Momentum strategy ${strategy.id}: monitoring price momentum`)

  await supabase
    .from("bot_strategies")
    .update({
      last_executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", strategy.id)
}

/**
 * Execute Mean Reversion strategy
 */
async function executeMeanReversionStrategy(strategy: BotStrategy, supabase: ReturnType<typeof createClient>) {
  const config = strategy.config
  const [tokenIn, tokenOut] = strategy.token_pair.split("/")

  // Mean reversion: buy when price is below mean, sell when above
  const deviationThreshold = config.deviation_threshold || 0.05 // 5% deviation
  const meanPeriod = config.mean_period || 7 // 7 days

  // In production, calculate actual mean and deviation
  // For now, skip execution
  console.log(`[BotExecutor] Mean reversion strategy ${strategy.id}: monitoring for mean reversion`)

  await supabase
    .from("bot_strategies")
    .update({
      last_executed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", strategy.id)
}

/**
 * Get CoinGecko token ID from symbol or address
 */
function getTokenId(token: string): string | null {
  // Map common tokens
  const map: Record<string, string> = {
    ETH: "ethereum",
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": "ethereum",
    USDC: "usd-coin",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "usd-coin",
    DAI: "dai",
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": "dai",
    USDT: "tether",
    "0xdAC17F958D2ee523a2206206994597c13d831ec7": "tether",
    WBTC: "wrapped-bitcoin",
    "0x2260FAC5E5542a773Aa44fBCfF9D83333Ad63169": "wrapped-bitcoin",
  }
  return map[token] || null
}

/**
 * Process a single bot strategy
 */
async function processStrategy(strategy: BotStrategy, supabase: ReturnType<typeof createClient>) {
  try {
    if (strategy.status !== "active") {
      return // Skip inactive strategies
    }

    console.log(`[BotExecutor] Processing strategy ${strategy.id} (${strategy.strategy_type})`)

    switch (strategy.strategy_type) {
      case "dca":
        await executeDCAStrategy(strategy, supabase)
        break
      case "grid":
        await executeGridStrategy(strategy, supabase)
        break
      case "momentum":
        await executeMomentumStrategy(strategy, supabase)
        break
      case "mean_reversion":
        await executeMeanReversionStrategy(strategy, supabase)
        break
      case "arbitrage":
        // Arbitrage is handled by arbitrage-detector, skip here
        break
      default:
        console.warn(`[BotExecutor] Unknown strategy type: ${strategy.strategy_type}`)
    }
  } catch (error) {
    console.error(`[BotExecutor] Error processing strategy ${strategy.id}:`, error)
  }
}

/**
 * Main bot executor loop
 */
async function executeBotStrategies() {
  const supabase = await createClient()

  logger.info("[BotExecutor] Starting bot executor worker...")

  while (true) {
    try {
      // Fetch active strategies
      const { data: strategies, error } = await supabase
        .from("bot_strategies")
        .select("*")
        .eq("status", "active")
        .limit(50)

      if (error) {
        logger.error("[BotExecutor] Error fetching strategies", { error: error.message || String(error) }, error instanceof Error ? error : new Error(String(error)))
        await sleep(10000)
        continue
      }

      if (strategies && strategies.length > 0) {
        logger.info(`[BotExecutor] Found ${strategies.length} active strategies`, { count: strategies.length })

        // Process strategies in parallel (with concurrency limit)
        const concurrency = 5
        for (let i = 0; i < strategies.length; i += concurrency) {
          const batch = strategies.slice(i, i + concurrency)
          await Promise.all(batch.map((strategy) => processStrategy(strategy as BotStrategy, supabase)))
        }
      } else {
        logger.debug("[BotExecutor] No active strategies found")
      }
    } catch (err) {
      logger.error("[BotExecutor] Unexpected error", {}, err instanceof Error ? err : new Error(String(err)))
    }

    // Sleep between iterations (check every 30 seconds)
    await sleep(30000)
  }
}

// Allow running directly
if (require.main === module) {
  executeBotStrategies().catch((err) => {
    logger.error("[BotExecutor] Worker failed", {}, err instanceof Error ? err : new Error(String(err)))
    process.exit(1)
  })
}

export { executeBotStrategies, processStrategy }

