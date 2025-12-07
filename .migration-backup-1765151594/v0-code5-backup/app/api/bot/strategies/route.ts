import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { z } from "zod"

/**
 * GET /api/bot/strategies
 * Get all bot strategies for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // For wallet-only users, return empty array (no database access)
    if (auth.isWalletOnly) {
      return NextResponse.json({ strategies: [], count: 0 })
    }

    const { data, error } = await supabase
      .from("bot_strategies")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ strategies: data || [], count: data?.length || 0 })
  } catch (error) {
    console.error("[Bot Strategies API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch strategies" },
      { status: 500 },
    )
  }
}

/**
 * POST /api/bot/strategies
 * Create a new bot strategy
 */
export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(request, { capacity: 10, refillRatePerSecond: 0.2 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (auth.isWalletOnly) {
      return NextResponse.json(
        { error: "Wallet-only users cannot create bot strategies. Please connect with email." },
        { status: 403 },
      )
    }

    const body = await request.json()

    // Validate input
    const StrategySchema = z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      strategy_type: z.enum(["dca", "grid", "momentum", "mean_reversion", "arbitrage"]),
      config: z.record(z.any()), // JSONB config
      token_pair: z.string().min(1),
      chain_id: z.number().default(1),
    })

    const parsed = StrategySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("bot_strategies")
      .insert({
        user_id: auth.userId,
        ...parsed.data,
        status: "paused", // Start paused, user must activate
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[Bot Strategies API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create strategy" },
      { status: 500 },
    )
  }
}

