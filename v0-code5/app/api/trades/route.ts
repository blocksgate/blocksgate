import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest, getWalletUserId } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  // Authenticate using either Supabase or wallet
  const auth = await authenticateRequest(request)
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"
    const status = searchParams.get("status")

    // For wallet-only users, return mock data for now
    // In production, you'd store trades in a separate table or use wallet address as key
    if (auth.isWalletOnly) {
      // Return empty trades for wallet-only users (no database access)
      // You can enhance this to use a local storage or separate API
      return NextResponse.json({
        trades: [],
        total: 0,
        limit: Number.parseInt(limit),
        offset: Number.parseInt(offset),
        message: "Wallet-only mode: Connect with email to sync trades across devices"
      })
    }

    // Supabase authenticated user - fetch from database
    const supabase = await createClient()
    let query = supabase
      .from("trades")
      .select("*", { count: "exact" })
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false })
      .range(Number.parseInt(offset), Number.parseInt(offset) + Number.parseInt(limit) - 1)

    if (status) {
      query = query.eq("status", status)
    }

    const { data, count, error } = await query

    if (error) throw error

    return NextResponse.json({
      trades: data,
      total: count,
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch trades" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    // For wallet-only users, return success but don't persist to database
    if (auth.isWalletOnly) {
      return NextResponse.json({
        id: `temp_${Date.now()}`,
        ...body,
        user_id: getWalletUserId(auth.walletAddress!),
        created_at: new Date().toISOString(),
        message: "Trade created locally. Connect with email to sync across devices."
      }, { status: 201 })
    }

    // Supabase authenticated user - persist to database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("trades")
      .insert({
        user_id: auth.userId,
        ...body,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create trade" },
      { status: 500 },
    )
  }
}
