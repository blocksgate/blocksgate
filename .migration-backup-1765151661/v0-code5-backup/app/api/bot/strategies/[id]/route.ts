import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { rateLimit } from "@/lib/middleware/rateLimiter"

/**
 * GET /api/bot/strategies/[id]
 * Get a specific bot strategy
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    const supabase = await createClient()

    if (auth.isWalletOnly) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { data, error } = await supabase
      .from("bot_strategies")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", auth.userId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[Bot Strategy API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch strategy" },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/bot/strategies/[id]
 * Update a bot strategy
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 0.5 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (auth.isWalletOnly) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const supabase = await createClient()

    // Verify ownership
    const { data: existing, error: checkError } = await supabase
      .from("bot_strategies")
      .select("user_id")
      .eq("id", params.id)
      .single()

    if (checkError || !existing || existing.user_id !== auth.userId) {
      return NextResponse.json({ error: "Strategy not found" }, { status: 404 })
    }

    // Update strategy
    const { data, error } = await supabase
      .from("bot_strategies")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[Bot Strategy API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update strategy" },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/bot/strategies/[id]
 * Delete a bot strategy
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const rl = rateLimit(request, { capacity: 10, refillRatePerSecond: 0.1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (auth.isWalletOnly) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = await createClient()

    // Verify ownership and delete
    const { error } = await supabase
      .from("bot_strategies")
      .delete()
      .eq("id", params.id)
      .eq("user_id", auth.userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Bot Strategy API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete strategy" },
      { status: 500 },
    )
  }
}

