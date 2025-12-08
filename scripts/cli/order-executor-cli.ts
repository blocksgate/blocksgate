#!/usr/bin/env ts-node
import dotenv from 'dotenv'

// Load .env from the repo root (works in ESM)
const envPath = new URL('../../.env', import.meta.url).pathname
dotenv.config({ path: envPath })

import { createSupabaseLoader } from "../../src/lib/order-loader-supabase.ts"
import { isOrderExecutable, executeOrder } from "../../src/lib/order-matching-engine.ts"

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
      createdAt: new Date(),
    },
    {
      id: 'demo-2',
      baseToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      quoteToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      side: 'buy',
      amount: 100,
      limitPrice: 0,
      createdAt: new Date(),
    },
  ]

  console.log('Demo orders:', JSON.stringify(demoOrders, null, 2))

  for (const order of demoOrders) {
    const isExec = isOrderExecutable(order, { USDC: 1.0, ETH: 2000 })
    console.log(`Order ${order.id} executable: ${isExec}`)

    if (isExec) {
      try {
        const tx = await executeOrder(order)
        console.log(`Order ${order.id} executed:`, tx)
      } catch (err: any) {
        console.error(`Error executing order ${order.id}:`, err.message)
      }
    }
  }

  console.log('[executor-cli] Demo complete')
  process.exit(0)
}

async function runSupabase() {
  console.log('[executor-cli] Starting Supabase-backed order executor')

  try {
    const loader = await createSupabaseLoader(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
    const orders = await loader()
    console.log(`Loaded ${orders.length} orders from Supabase`)

    for (const order of orders) {
      const isExec = isOrderExecutable(order, {})
      console.log(`Order ${order.id} executable: ${isExec}`)

      if (isExec) {
        try {
          const tx = await executeOrder(order)
          console.log(`Order ${order.id} executed:`, tx)
        } catch (err: any) {
          console.error(`Error executing order ${order.id}:`, err.message)
        }
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message)
  }

  process.exit(0)
}

const args = process.argv.slice(2)
if (args.includes('--supabase')) {
  runSupabase().catch(console.error)
} else {
  runDemo().catch(console.error)
}
