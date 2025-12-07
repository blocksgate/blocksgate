import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest, getWalletUserId } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"
import { submitGaslessSwapAction, getGaslessSwapStatusAction } from "@/app/actions/gasless"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 0.2 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      chainId,
      tradeHash,
      approvalSignature,
      tradeSignature,
      sellToken,
      buyToken,
      sellAmount,
      buyAmount,
    } = body

    if (!chainId || !tradeHash || !approvalSignature || !tradeSignature) {
      return NextResponse.json(
        { error: "Missing required parameters: chainId, tradeHash, approvalSignature, tradeSignature" },
        { status: 400 }
      )
    }

    // Submit to 0x relayer
    const result = await submitGaslessSwapAction(tradeSignature, {
      chainId,
      approval: {
        eip712Signature: approvalSignature,
      },
      trade: {
        eip712Signature: tradeSignature,
      },
    })

    if (!result) {
      return NextResponse.json(
        { error: "Failed to submit gasless swap to relayer" },
        { status: 500 }
      )
    }

    // For wallet-only users, return success without database persistence
    if (auth.isWalletOnly) {
      return NextResponse.json({
        success: true,
        tradeHash: result.tradeHash || tradeHash,
        message: "Gasless swap submitted. Connect with email to track history.",
        status: "pending",
      })
    }

    // For Supabase authenticated users, record the trade
    const supabase = await createClient()
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .insert({
        user_id: auth.userId,
        chain_id: chainId,
        token_in: sellToken,
        token_out: buyToken,
        amount_in: sellAmount,
        amount_out: buyAmount,
        status: "pending",
        trade_type: "gasless",
        tx_hash: result.tradeHash || tradeHash,
      })
      .select()
      .single()

    if (tradeError) {
      console.error("[Gasless Submit] Database error:", tradeError)
      // Don't fail the request if database insert fails - the swap was still submitted
    }

    return NextResponse.json({
      success: true,
      tradeHash: result.tradeHash || tradeHash,
      tradeId: trade?.id,
      status: "pending",
      message: "Gasless swap submitted successfully. Relayer will execute the transaction.",
    })
  } catch (error) {
    console.error("[Gasless Submit API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit gasless swap" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const tradeHash = searchParams.get("tradeHash")

    if (!tradeHash) {
      return NextResponse.json(
        { error: "Missing required parameter: tradeHash" },
        { status: 400 }
      )
    }

    const status = await getGaslessSwapStatusAction(tradeHash)

    if (!status) {
      return NextResponse.json(
        { error: "Failed to get gasless swap status" },
        { status: 404 }
      )
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error("[Gasless Status API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get gasless swap status" },
      { status: 500 }
    )
  }
}

