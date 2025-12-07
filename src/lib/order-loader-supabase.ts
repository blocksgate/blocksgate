import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Order } from './order-matching-engine'

/**
 * Create a loader function that fetches pending orders from Supabase.
 * Usage:
 *   const loader = await createSupabaseLoader(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
 *   const executor = new OrderExecutor(5000, loader)
 */
export async function createSupabaseLoader(supabaseUrl: string | undefined, supabaseKey: string | undefined, tableName = 'orders') {
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials not provided')

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

  return async function loadPendingOrders(): Promise<Order[]> {
    // Query pending orders
    const { data, error } = await supabase.from(tableName).select('*').eq('status', 'pending')
    if (error) {
      console.error('Supabase loader error', error)
      return []
    }

    // Attempt to coerce rows into Order[] shape
    return (data ?? []).map((row: any) => ({
      id: String(row.id),
      side: row.side as any,
      baseToken: row.baseToken,
      quoteToken: row.quoteToken,
      amount: Number(row.amount),
      limitPrice: Number(row.limitPrice),
      status: (row.status as any) ?? 'pending',
      createdAt: row.createdAt ?? new Date().toISOString(),
    }))
  }
}
