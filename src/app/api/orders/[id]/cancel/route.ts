import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/middleware/rateLimiter"

/**
 * POST /api/orders/[id]/cancel
 * Cancel a pending order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    // Authenticate
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // For wallet-only users, return success (orders are not persisted)
    if (auth.isWalletOnly) {
      return NextResponse.json({
        success: true,
        message: "Order cancelled locally. Connect with email to sync orders across devices.",
        order: { id: params.id, status: "cancelled" },
      })
    }

    const supabase = await createClient()

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", params.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Verify order belongs to user
    if (order.user_id !== auth.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check if order can be cancelled
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${order.status}` },
        { status: 400 }
      )
    }

    // Check if order has expired
    if (order.expires_at && new Date(order.expires_at) < new Date()) {
      // Update to expired instead of cancelled
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "expired",
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      return NextResponse.json({
        success: true,
        message: "Order already expired",
        order: { ...order, status: "expired" },
      })
    }

    // Cancel order
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      message: "Order cancelled successfully",
      order: updatedOrder,
    })
  } catch (error) {
    console.error("[Order Cancel API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel order" },
      { status: 500 }
    )
  }
}

