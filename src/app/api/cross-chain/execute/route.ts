import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest, getWalletUserId } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { stargateBridge } from "@/lib/bridges/stargate"
import { acrossBridge } from "@/lib/bridges/across"
import { axelarBridge } from "@/lib/bridges/axelar"
import { lifiBridge } from "@/lib/bridges/lifi"
import { BridgeQuote } from "@/lib/bridges/bridge-aggregator"
import { web3Provider } from "@/lib/web3-provider"
import { ethers } from "ethers"

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { capacity: 10, refillRatePerSecond: 0.1 })
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
      route,
      userAddress,
      signature,
    }: {
      route: BridgeQuote
      userAddress: string
      signature?: string
    } = body

    if (!route || !userAddress) {
      return NextResponse.json(
        { error: "Missing required parameters: route, userAddress" },
        { status: 400 }
      )
    }

    // Validate that the user's wallet address matches
    if (auth.isWalletOnly && auth.walletAddress?.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Wallet address mismatch" },
        { status: 403 }
      )
    }

    // Get bridge contract address
    let bridgeAddress: string
    switch (route.bridgeName) {
      case "stargate":
        bridgeAddress = stargateBridge.getBridgeAddress(route.fromChain)
        break
      case "across":
        bridgeAddress = acrossBridge.getBridgeAddress(route.fromChain)
        break
      case "axelar":
        bridgeAddress = axelarBridge.getBridgeAddress(route.fromChain)
        break
      case "lifi":
        bridgeAddress = lifiBridge.getBridgeAddress(route.fromChain)
        break
      default:
        return NextResponse.json(
          { error: "Unsupported bridge" },
          { status: 400 }
        )
    }

    if (!bridgeAddress) {
      return NextResponse.json(
        { error: `Bridge not supported on chain ${route.fromChain}` },
        { status: 400 }
      )
    }

    // For wallet-only users, return transaction data for client-side signing
    if (auth.isWalletOnly) {
      // In a real implementation, you would construct the bridge transaction
      // For now, we'll return the bridge details for the client to handle
      return NextResponse.json({
        success: true,
        bridgeAddress,
        route,
        message: "Please sign the transaction in your wallet to execute the cross-chain transfer",
        transactionData: {
          to: bridgeAddress,
          value: route.fromToken === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" 
            ? ethers.parseEther(route.amount).toString() 
            : "0",
          data: "0x", // Bridge-specific data would be constructed here
        },
      })
    }

    // For Supabase authenticated users, record the cross-chain transaction
    const supabase = await createClient()
    
    // Record the cross-chain transaction
    const { data: crossChainTx, error: txError } = await supabase
      .from("trades")
      .insert({
        user_id: auth.userId,
        chain_id: route.fromChain,
        token_in: route.fromToken,
        token_out: route.toToken,
        amount_in: route.amount,
        amount_out: route.estimatedReceived,
        status: "pending",
        trade_type: "cross-chain",
        tx_hash: null, // Will be updated when transaction is confirmed
      })
      .select()
      .single()

    if (txError) {
      console.error("[Cross-Chain Execute] Database error:", txError)
      return NextResponse.json(
        { error: "Failed to record transaction" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      transactionId: crossChainTx.id,
      bridgeAddress,
      route,
      message: "Cross-chain transaction initiated. Please sign the transaction in your wallet.",
      transactionData: {
        to: bridgeAddress,
        value: route.fromToken === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" 
          ? ethers.parseEther(route.amount).toString() 
          : "0",
        data: "0x", // Bridge-specific data
      },
    })
  } catch (error) {
    console.error("[Cross-Chain Execute API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to execute cross-chain swap" },
      { status: 500 }
    )
  }
}

