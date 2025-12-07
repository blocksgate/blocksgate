import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { rateLimit } from "@/lib/middleware/rateLimiter"
import { authenticateRequest, getWalletUserId } from "@/lib/supabase/wallet-auth"

export async function GET(request: NextRequest) {
  // Authenticate using either Supabase or wallet
  const auth = await authenticateRequest(request)
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    // For wallet-only users, return mock data for now
    // In production, you'd store orders in a separate table or use wallet address as key
    if (auth.isWalletOnly) {
      // Return empty orders for wallet-only users (no database access)
      // You can enhance this to use a local storage or separate API
      return NextResponse.json({
        orders: [],
        message: "Wallet-only mode: Connect with email to sync orders across devices"
      })
    }

    // Supabase authenticated user - fetch from database
    const supabase = await createClient()
    let query = supabase.from("orders").select("*").eq("user_id", auth.userId!).order("created_at", { ascending: false })

    if (status) {
      query = query.eq("status", status)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ orders: data || [] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  // Authenticate using either Supabase or wallet
  const auth = await authenticateRequest(request)
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Rate limit per IP/key to protect public POST endpoints
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 0.2 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } })
    }
    const body = await request.json()

    // Validate incoming order payload - match database schema from 004_create_orders.sql
    const OrderSchema = z.object({
      // Database schema fields (from 004_create_orders.sql)
      token_in: z.string().min(1),
      token_out: z.string().min(1),
      amount_in: z.union([z.string().min(1), z.number()]).optional(),
      min_amount_out: z.union([z.string(), z.number()]).optional(),
      price_target: z.union([z.string(), z.number()]).optional(),
      order_type: z.enum(["limit", "dca", "stop-loss"]).optional(),
      chain_id: z.number().optional(),
      status: z.enum(["pending", "filled", "cancelled", "expired"]).optional(),
      expires_at: z.string().optional().nullable(),
      // Legacy field support (for backward compatibility)
      type: z.enum(["limit", "market"]).optional(),
      amount: z.union([z.string(), z.number()]).optional(),
      price: z.union([z.string(), z.number()]).optional(),
      side: z.enum(["buy", "sell"]).optional(),
      metadata: z.any().optional(),
    }).transform((data) => {
      // Normalize to database schema format with required fields
      const amountIn = data.amount_in || data.amount
      const priceTarget = data.price_target !== undefined ? Number(data.price_target) : (data.price !== undefined ? Number(data.price) : 0)
      const minAmountOut = data.min_amount_out || (amountIn && priceTarget ? String(Number(amountIn) * priceTarget) : "0")
      
      return {
        token_in: data.token_in,
        token_out: data.token_out,
        amount_in: amountIn ? String(amountIn) : "0",
        min_amount_out: minAmountOut,
        price_target: priceTarget,
        order_type: data.order_type || data.type || "limit",
        chain_id: data.chain_id || 1, // Default to Ethereum mainnet
        status: data.status || "pending",
        expires_at: data.expires_at || null,
      }
    })

    const parsed = OrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const orderPayload = parsed.data

    // For wallet-only users, return success but don't persist to database
    if (auth.isWalletOnly) {
      return NextResponse.json({
        id: `temp_${Date.now()}`,
        ...orderPayload,
        user_id: getWalletUserId(auth.walletAddress!),
        created_at: new Date().toISOString(),
        message: "Order created locally. Connect with email to sync across devices."
      }, { status: 201 })
    }

    // Supabase authenticated user - persist to database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("orders")
      .insert({
        user_id: auth.userId!,
        ...orderPayload,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 },
    )
  }
}
