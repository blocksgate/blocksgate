import { type NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/supabase/wallet-auth'
import { rateLimit } from '@/lib/middleware/rateLimiter'
import { cancelLimitOrder } from '@/app/actions/limit-orders'

/**
 * POST /api/orders/[id]/cancel
 * Cancel a pending order
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Rate limit
    const rl = rateLimit(request, { capacity: 20, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } })
    }

    // Authenticate
    const auth = await authenticateRequest(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For wallet-only users, return success (orders are not persisted)
    if (auth.isWalletOnly) {
      return NextResponse.json({
        success: true,
        message: 'Order cancelled locally. Connect with email to sync orders across devices.',
        order: { id: params.id, status: 'cancelled' },
      })
    }

    // Use server action to cancel order
    const result = await cancelLimitOrder(params.id, auth.userId!)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      order: result.order,
    })
  } catch (error) {
    console.error('[Order Cancel API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to cancel order' },
      { status: 500 }
    )
  }
}

