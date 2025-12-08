import { NextResponse } from 'next/server'
import { executeLimitOrder } from '@/app/actions/limit-orders'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    // Extract userId from request headers or body (optional, for authorization)
    let userId: string | undefined
    try {
      const body = await request.json()
      userId = body?.userId
    } catch (_) {
      // No body or invalid JSON
    }

    // Execute the order using server action
    const result = await executeLimitOrder(orderId, userId)

    if (!result.success) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          currentPrice: result.currentPrice,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      orderId,
      txHash: result.txHash,
      fillPrice: result.fillPrice,
      order: result.order,
    })
  } catch (err: any) {
    console.error('order execute route error', err)
    return NextResponse.json(
      { ok: false, error: String(err?.message ?? err) },
      { status: 500 }
    )
  }
}
