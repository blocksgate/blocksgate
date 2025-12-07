// Service for handling trade persistence and tracking

import { createClient } from "@/lib/supabase/server"

export interface TradeData {
  txHash: string
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  priceAtTime: number
  slippage?: number
  gasUsed?: string
  gasPrice?: string
  chainId: number
  tradeType: "swap" | "limit" | "arbitrage" | "flash" | "bridge"
  mevProtected?: boolean
}

export async function recordTrade(userId: string, tradeData: TradeData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trades")
    .insert({
      user_id: userId,
      tx_hash: tradeData.txHash,
      token_in: tradeData.tokenIn,
      token_out: tradeData.tokenOut,
      amount_in: Number.parseFloat(tradeData.amountIn),
      amount_out: Number.parseFloat(tradeData.amountOut),
      price_at_time: tradeData.priceAtTime,
      slippage: tradeData.slippage || 0,
      gas_used: tradeData.gasUsed,
      gas_price: tradeData.gasPrice,
      chain_id: tradeData.chainId,
      trade_type: tradeData.tradeType,
      mev_protected: tradeData.mevProtected || false,
      status: "pending",
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTradeStatus(
  tradeId: string,
  status: "pending" | "completed" | "failed",
  profitLoss?: number,
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  if (status === "completed") {
    updateData.executed_at = new Date().toISOString()
  }

  if (profitLoss !== undefined) {
    updateData.profit_loss = profitLoss
  }

  const { data, error } = await supabase.from("trades").update(updateData).eq("id", tradeId).select().single()

  if (error) throw error
  return data
}

export async function updatePortfolioHolding(
  userId: string,
  tokenAddress: string,
  tokenSymbol: string,
  tokenName: string,
  chainId: number,
  balance: number,
  usdValue: number,
  costBasis?: number,
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("portfolios")
    .upsert({
      user_id: userId,
      token_address: tokenAddress,
      token_symbol: tokenSymbol,
      token_name: tokenName,
      chain_id: chainId,
      balance,
      usd_value: usdValue,
      cost_basis: costBasis || usdValue,
      last_updated: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}
