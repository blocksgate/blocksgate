import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const chainId = searchParams.get("chain_id")

    let query = supabase.from("portfolios").select("*").eq("user_id", user.id)

    if (chainId) {
      query = query.eq("chain_id", Number.parseInt(chainId))
    }

    const { data, error } = await query

    if (error) throw error

    // Calculate totals
    const totalUsdValue = data?.reduce((sum: any, token: { usd_value: any }) => sum + (token.usd_value || 0), 0) || 0
    const totalCostBasis = data?.reduce((sum: any, token: { cost_basis: any }) => sum + (token.cost_basis || 0), 0) || 0
    const totalUnrealizedPL = totalUsdValue - totalCostBasis

    return NextResponse.json({
      holdings: data,
      summary: {
        total_usd_value: totalUsdValue,
        total_cost_basis: totalCostBasis,
        total_unrealized_pl: totalUnrealizedPL,
        pl_percentage: totalCostBasis > 0 ? (totalUnrealizedPL / totalCostBasis) * 100 : 0,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch portfolio" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    const { data, error } = await supabase
      .from("portfolios")
      .upsert({
        user_id: user.id,
        ...body,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update portfolio" },
      { status: 500 },
    )
  }
}
