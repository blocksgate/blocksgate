import { Order, isOrderExecutable, executeOrder } from '../order-matching-engine'

/**
 * OrderExecutor supports two modes:
 * - in-memory queue (default) for local development
 * - pluggable async loader function: `() => Promise<Order[]>` which should
 *   return pending orders from a DB (Supabase/Postgres). Pass the loader into
 *   the constructor to enable DB-backed operation.
 */
export class OrderExecutor {
  private intervalMs: number
  private running = false
  private orders: Order[] = []
  private loader: (() => Promise<Order[]>) | null

  constructor(intervalMs = 5000, loader: (() => Promise<Order[]>) | null = null) {
    this.intervalMs = intervalMs
    this.loader = loader
  }

  public enqueue(order: Order) {
    // only use enqueue for in-memory mode
    if (this.loader) {
      console.warn('enqueue called while loader is configured — prefer DB inserts for workers')
    }
    this.orders.push(order)
  }

  private async loadFromDbIfConfigured() {
    if (!this.loader) return
    try {
      const remote = await this.loader()
      // replace local queue with remote pending orders
      this.orders = remote
    } catch (err) {
      console.error('OrderExecutor loader error', err)
    }
  }

  public async runOnce() {
    // if a loader is configured, refresh orders from DB
    await this.loadFromDbIfConfigured()

    // process a shallow copy to allow enqueue during processing
    const snapshot = [...this.orders]
    for (const order of snapshot) {
      if (order.status && order.status !== 'pending') continue

      const { executable, currentPrice } = await isOrderExecutable(order)
      if (!executable) continue

      // attempt execution
      const result = await executeOrder(order)
      if (result.success) {
        // mark filled and remove from queue
        order.status = 'filled'
        this.orders = this.orders.filter((o) => o.id !== order.id)
        // TODO: persist execution result to DB and emit events
        console.log(`Order ${order.id} executed, tx=${result.txHash}, price=${currentPrice}`)
      } else {
        order.status = 'failed'
        console.warn(`Order ${order.id} failed: ${result.error}`)
      }
    }
  }

  public start() {
    if (this.running) return
    this.running = true
    const tick = async () => {
      try {
        await this.runOnce()
      } catch (err) {
        console.error('OrderExecutor tick error', err)
      }
      if (this.running) setTimeout(tick, this.intervalMs)
    }
    setTimeout(tick, this.intervalMs)
  }

  public stop() {
    this.running = false
  }
}

// exported singleton for simple usage from API routes during development
export const globalOrderExecutor = new OrderExecutor(5000)
