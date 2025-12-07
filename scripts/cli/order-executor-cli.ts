#!/usr/bin/env ts-node
import dotenv from 'dotenv'
import path from 'path'

// Load .env from the root directory explicitly
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { createSupabaseLoader } from "../../src/lib/order-loader-supabase"
import { isOrderExecutable, executeOrder } from "../../src/lib/order-matching-engine"

async function runDemo() {
  console.log('[executor-cli] Starting lightweight demo executor (in-memory)')
  const demoOrders: any[] = [
    {
      id: 'demo-1',
      baseToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      quoteToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      side: 'sell',
      amount: 0.01,
      limitPrice: 0,
      status: 'pending',
    },
  ]

  // run every 5s for demo (stop after 20s)
  const stopAfterMs = 20000
  const start = Date.now()
  while (Date.now() - start < stopAfterMs) {
    for (const order of demoOrders) {
      try {
        if (order.status && order.status !== 'pending') continue
        const { executable } = await isOrderExecutable(order as any)
        if (!executable) {
          console.log('[executor-cli] Order not executable yet:', order.id)
          continue
        }
        const res = await executeOrder(order as any)
        if (res.success) {
          order.status = 'filled'
          console.log('[executor-cli] Order executed:', order.id, 'tx', res.txHash)
        } else {
          order.status = 'failed'
          console.warn('[executor-cli] Order failed:', order.id, res.error)
        }
      } catch (err) {
        console.error('[executor-cli] Error processing order:', err)
      }
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
  console.log('[executor-cli] Demo finished')
}

async function runSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_KEY
  if (!url || !key) {
    console.error('[executor-cli] SUPABASE_URL or SUPABASE_KEY not set')
    process.exit(2)
  }
  console.log('[executor-cli] Starting Supabase-backed lightweight executor')
  const loader = await createSupabaseLoader(url, key, 'orders')

  // Poll DB every 5s and process orders
  while (true) {
    try {
      const orders = await loader()
      for (const order of orders as any[]) {
        try {
          if (order.status && order.status !== 'pending') continue
          const { executable } = await isOrderExecutable(order as any)
          if (!executable) continue
          const res = await executeOrder(order as any)
          if (res.success) console.log('[executor-cli] Executed order', order.id)
          else console.warn('[executor-cli] Failed order', order.id, res.error)
        } catch (e) {
          console.error('[executor-cli] Order processing error', e)
        }
      }
    } catch (err) {
      console.error('[executor-cli] Loader error', err)
    }
    await new Promise((r) => setTimeout(r, 5000))
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--demo')) {
    await runDemo()
    return
  }
  if (args.includes('--supabase')) {
    await runSupabase()
    return
  }
  console.log('Usage: order-executor-cli.ts [--demo | --supabase]')
}

main().catch((err) => {
  console.error('[executor-cli] Fatal error:', err)
  process.exit(1)
})
