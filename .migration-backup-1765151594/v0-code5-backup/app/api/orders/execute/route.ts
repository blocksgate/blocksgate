import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { zxClient } from "@/lib/0x-client"
import { recordTrade, updateTradeStatus } from "@/lib/trade-service"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { ethers } from "ethers"

/**
 * Execute a ready-to-execute order
 * User must provide signed transaction or approve execution
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rl = rateLimit(request, { capacity: 10, refillRatePerSecond: 0.1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Authenticate
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, txHash } = body

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const supabase = await createClient()

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify order belongs to user
    if (auth.isWalletOnly) {
      // For wallet-only users, we can't verify user_id match
      // In production, you'd want to store wallet address with order
      console.warn("[ExecuteOrder] Wallet-only user executing order - verification limited")
    } else if (order.user_id !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Verify order is ready to execute
    if (order.status !== "ready_to_execute" && order.status !== "pending") {
      return NextResponse.json(
        { error: `Order is not ready to execute (status: ${order.status})` },
        { status: 400 },
      )
    }

    // If txHash provided, update order with transaction
    if (txHash) {
      // Get quote to calculate actual amounts
      const amountInWei = ethers.parseUnits(String(order.amount_in), 18).toString()
      let quote
      try {
      // Get user address for better quote accuracy
      const takerAddress = auth.walletAddress || undefined
      
      quote = await zxClient.getQuote(
        order.chain_id,
        order.token_in,
        order.token_out,
        amountInWei,
        0.5,
        undefined, // method
        takerAddress // taker address (optional)
      )
      } catch (error) {
        console.error("[ExecuteOrder] Failed to get quote:", error)
      }

      // Update order status
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "filled",
          filled_at: new Date().toISOString(),
          filled_amount_in: order.amount_in,
          filled_amount_out: quote ? ethers.formatEther(quote.buyAmount) : order.min_amount_out,
        })
        .eq("id", orderId)

      if (updateError) {
        console.error("[ExecuteOrder] Failed to update order:", updateError)
      }

      // Record trade
      if (!auth.isWalletOnly && auth.userId) {
        try {
          await recordTrade(auth.userId, {
            txHash,
            tokenIn: order.token_in,
            tokenOut: order.token_out,
            amountIn: String(order.amount_in),
            amountOut: quote ? ethers.formatEther(quote.buyAmount) : String(order.min_amount_out),
            priceAtTime: Number.parseFloat(quote?.price || String(order.price_target)),
            slippage: 0.5,
            gasUsed: quote?.gas,
            gasPrice: quote?.gasPrice,
            chainId: order.chain_id,
            tradeType: "limit",
          })
        } catch (error) {
          console.error("[ExecuteOrder] Failed to record trade:", error)
        }
      }

      return NextResponse.json({
        success: true,
        orderId,
        txHash,
        message: "Order executed successfully",
      })
    }

    // If no txHash, return execution quote for user to sign
    const amountInWei = ethers.parseUnits(String(order.amount_in), 18).toString()
    
    // Get user address for better quote accuracy
    const takerAddress = auth.walletAddress || undefined
    
    const quote = await zxClient.getQuote(
      order.chain_id,
      order.token_in,
      order.token_out,
      amountInWei,
      0.5, // 0.5% slippage
      undefined, // method
      takerAddress // taker address (optional)
    )

    return NextResponse.json({
      orderId,
      quote: {
        to: quote.to,
        data: quote.data,
        value: quote.value,
        gas: quote.gas,
        gasPrice: quote.gasPrice,
        buyAmount: quote.buyAmount,
        sellAmount: quote.sellAmount,
        price: quote.price,
      },
      message: "Sign and submit this transaction to execute the order",
    })
  } catch (error) {
    console.error("[ExecuteOrder] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute order" },
      { status: 500 },
    )
  }
}

