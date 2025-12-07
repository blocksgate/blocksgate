import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { ethers } from "ethers"
import { config } from "@/lib/config"

/**
 * GET /api/transactions/[txHash]
 * Get transaction status and details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { txHash: string } },
) {
  try {
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chainId = Number.parseInt(searchParams.get("chainId") || "1")

    // Get RPC provider for the chain
    const chain = Object.values(config.chains).find((c) => c.id === chainId)
    if (!chain) {
      return NextResponse.json({ error: "Unsupported chain" }, { status: 400 })
    }

    const provider = new ethers.JsonRpcProvider(chain.rpcUrl)

    try {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(params.txHash)

      if (!receipt) {
        // Transaction not found or still pending
        return NextResponse.json({
          txHash: params.txHash,
          status: "pending",
          message: "Transaction not yet mined",
        })
      }

      // Get transaction details
      const tx = await provider.getTransaction(params.txHash)

      // Calculate confirmations
      const currentBlock = await provider.getBlockNumber()
      const confirmations = currentBlock - receipt.blockNumber

      // Determine status
      let status: "pending" | "confirmed" | "failed" = "confirmed"
      if (receipt.status === 0) {
        status = "failed"
      } else if (confirmations < 1) {
        status = "pending"
      }

      // Calculate gas used and cost
      const gasUsed = receipt.gasUsed.toString()
      const gasPrice = receipt.gasPrice?.toString() || "0"
      const gasCost = receipt.gasUsed * (receipt.gasPrice || 0n)

      return NextResponse.json({
        txHash: params.txHash,
        status,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        confirmations,
        from: receipt.from,
        to: receipt.to,
        value: tx?.value?.toString() || "0",
        gasUsed,
        gasPrice,
        gasCost: gasCost.toString(),
        gasCostFormatted: ethers.formatEther(gasCost),
        effectiveGasPrice: receipt.gasPrice?.toString() || "0",
        logs: receipt.logs.length,
        contractAddress: receipt.contractAddress,
        timestamp: tx?.timestamp || Date.now(),
        chainId,
      })
    } catch (error: any) {
      // Transaction might not exist
      if (error.code === "NOT_FOUND" || error.message?.includes("not found")) {
        return NextResponse.json({
          txHash: params.txHash,
          status: "not_found",
          message: "Transaction not found",
        })
      }

      throw error
    }
  } catch (error) {
    console.error("[Transaction Monitor] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch transaction" },
      { status: 500 },
    )
  }
}

