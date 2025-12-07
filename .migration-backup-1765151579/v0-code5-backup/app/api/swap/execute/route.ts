import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest, getWalletUserId } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 0.2 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    // Authenticate
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      chainId,
      sellToken,
      buyToken,
      sellAmount,
      buyAmount,
      txHash,
      quote,
    } = body

    if (!chainId || !sellToken || !buyToken || !sellAmount || !txHash) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // For wallet-only users, return success without database persistence
    if (auth.isWalletOnly) {
      return NextResponse.json({
        id: `temp_${Date.now()}`,
        user_id: getWalletUserId(auth.walletAddress!),
        chain_id: chainId,
        token_in: sellToken,
        token_out: buyToken,
        amount_in: sellAmount,
        amount_out: buyAmount,
        tx_hash: txHash,
        status: "pending",
        created_at: new Date().toISOString(),
        message: "Swap executed. Connect with email to track history across devices."
      }, { status: 201 })
    }

    // Supabase authenticated user - persist to database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("trades")
      .insert({
        user_id: auth.userId,
        chain_id: chainId,
        token_in: sellToken,
        token_out: buyToken,
        amount_in: sellAmount,
        amount_out: buyAmount,
        tx_hash: txHash,
        status: "pending",
        side: "buy",
        price: quote?.price || "0",
        fee: quote?.protocolFees || null,
        metadata: {
          quote,
          executed_at: new Date().toISOString(),
        },
      })
      .select()
      .single()

    if (error) {
      console.error("[Swap Execute Error]:", error)
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[Swap Execute Error]:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to execute swap",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    )
  }
}

