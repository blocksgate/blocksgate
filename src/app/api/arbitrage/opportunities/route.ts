import { NextResponse } from 'next/server'
import { getArbitrageOpportunities } from '../../../../actions/arbitrage'

// SSE streaming endpoint for arbitrage opportunities
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pairsParam = searchParams.get('pairs')
  const intervalMs = Number(searchParams.get('interval') ?? '3000')

  const pairs = pairsParam
    ? pairsParam.split('|').map((p) => {
        const [base, quote] = p.split('/')
        return { baseToken: base, quoteToken: quote }
      })
    : [
        { baseToken: 'WETH', quoteToken: 'USDC' },
        { baseToken: 'WBTC', quoteToken: 'USDC' },
      ]

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encodeSSE({ event: 'connected', data: { ok: true } }))

      let closed = false
      const loop = async () => {
        try {
          const opps = await getArbitrageOpportunities(pairs, 1)
          controller.enqueue(encodeSSE({ event: 'opportunities', data: opps }))
        } catch (err) {
          controller.enqueue(encodeSSE({ event: 'error', data: String(err) }))
        }
        if (!closed) setTimeout(loop, intervalMs)
      }

      loop()

      // close handling when consumer disconnects is automatic in Next.js
      // but expose control in case we need to cancel
      (request as any).signal?.addEventListener?.('abort', () => {
        closed = true
        controller.close()
      })
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

function encodeSSE({ event, data }: { event?: string; data: any }) {
  const payload = typeof data === 'string' ? data : JSON.stringify(data)
  const ev = event ? `event: ${event}\n` : ''
  return `${ev}data: ${payload}\n\n`
}
import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { detectArbitrageOpportunities, detectCrossChainArbitrage } from "@/lib/arbitrage-detector"
import { rateLimit } from "@/lib/middleware/rateLimiter"

/**
 * GET /api/arbitrage/opportunities
 * Fetch current arbitrage opportunities
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit
    const rl = rateLimit(request, { capacity: 30, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Authenticate
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const chainId = Number.parseInt(searchParams.get("chainId") || "1")
    const minProfit = Number.parseFloat(searchParams.get("minProfit") || "0.1")
    const crossChain = searchParams.get("crossChain") === "true"

    // Detect opportunities
    const opportunities = await detectArbitrageOpportunities(chainId, undefined, minProfit)

    // Optionally detect cross-chain opportunities
    let crossChainOpportunities: any[] = []
    if (crossChain) {
      // Check common cross-chain pairs
      const chains = [
        { from: 1, to: 137 }, // Ethereum -> Polygon
        { from: 1, to: 42161 }, // Ethereum -> Arbitrum
        { from: 1, to: 10 }, // Ethereum -> Optimism
      ]

      for (const chainPair of chains) {
        try {
          const opp = await detectCrossChainArbitrage(
            chainPair.from,
            chainPair.to,
            "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // ETH
          )
          if (opp) {
            crossChainOpportunities.push(opp)
          }
        } catch (error) {
          console.error(`[Arbitrage API] Cross-chain detection error:`, error)
        }
      }
    }

    return NextResponse.json({
      opportunities: [...opportunities, ...crossChainOpportunities],
      count: opportunities.length + crossChainOpportunities.length,
      chainId,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("[Arbitrage API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch opportunities" },
      { status: 500 },
    )
  }
}

