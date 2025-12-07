import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { bridgeAggregator } from "@/lib/bridges/bridge-aggregator"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const { searchParams } = new URL(request.url)
    const fromChain = Number(searchParams.get("fromChain"))
    const toChain = Number(searchParams.get("toChain"))
    const token = searchParams.get("token")
    const amount = searchParams.get("amount")
    const prioritizeSpeed = searchParams.get("prioritizeSpeed") === "true"
    const prioritizeCost = searchParams.get("prioritizeCost") === "true"
    const minLiquidity = searchParams.get("minLiquidity") as "low" | "medium" | "high" | undefined

    if (!fromChain || !toChain || !token || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters: fromChain, toChain, token, amount" },
        { status: 400 }
      )
    }

    const routes = await bridgeAggregator.getBestRoute(
      fromChain,
      toChain,
      token,
      amount,
      {
        prioritizeSpeed,
        prioritizeCost,
        minLiquidity: minLiquidity || "medium",
      }
    )

    if (routes.length === 0) {
      return NextResponse.json(
        { error: "No routes found for the specified chain pair" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      routes,
      bestRoute: routes[0], // Top-ranked route
      totalRoutes: routes.length,
    })
  } catch (error) {
    console.error("[Cross-Chain Quote API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get cross-chain quote" },
      { status: 500 }
    )
  }
}

