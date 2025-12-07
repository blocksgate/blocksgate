import { NextResponse } from 'next/server'
import { globalOrderExecutor } from '../../../../../lib/workers/order-executor'
import type { Order } from '../../../../../lib/order-matching-engine'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Parse optional body for order details override (development convenience)
    let body: Partial<Order> | null = null
    try {
      body = await request.json()
    } catch (_) {
      body = null
    }

    // In production, fetch the order from DB by id. For now create a minimal stub order
    const order: Order = {
      id,
      side: (body?.side as any) ?? 'buy',
      baseToken: body?.baseToken ?? 'WETH',
      quoteToken: body?.quoteToken ?? 'USDC',
      amount: body?.amount ?? 0.1,
      limitPrice: body?.limitPrice ?? 1600,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    // Enqueue into the global executor for immediate processing
    globalOrderExecutor.enqueue(order)
    // Ensure executor is running
    globalOrderExecutor.start()

    return NextResponse.json({ ok: true, message: 'Order enqueued for execution', orderId: id })
  } catch (err: any) {
    console.error('order execute route error', err)
    return NextResponse.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}
