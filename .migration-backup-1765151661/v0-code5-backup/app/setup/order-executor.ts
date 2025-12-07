// Example: DB-backed order executor setup
import { OrderExecutor } from '../../lib/workers/order-executor'
import { createSupabaseLoader } from '../../lib/order-loader-supabase'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const POLL_INTERVAL_MS = Number(process.env.ORDER_EXECUTOR_INTERVAL_MS || 5000)

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing Supabase credentials')
  }
  const loader = await createSupabaseLoader(SUPABASE_URL, SUPABASE_KEY)
  const executor = new OrderExecutor(POLL_INTERVAL_MS, loader)
  executor.start()
  console.log('DB-backed OrderExecutor started')
}

main().catch((err) => {
  console.error('OrderExecutor setup error:', err)
  process.exit(1)
})
