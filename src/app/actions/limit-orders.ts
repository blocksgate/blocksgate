'use server'

import { createClient } from '@/lib/supabase/server'
import { isOrderExecutable, executeOrder, type Order } from '@/lib/order-matching-engine'
import { zxClient } from '@/lib/0x-client'

/**
 * Create a new limit order and save to database
 */
export async function createLimitOrder(orderData: {
  userId: string
  baseToken: string
  quoteToken: string
  side: 'buy' | 'sell'
  amount: number
  limitPrice: number
  expiresAt?: string
  maxSlippage?: number
}) {
  try {
    const supabase = await createClient()

    // Validate inputs
    if (!orderData.baseToken || !orderData.quoteToken || !orderData.amount || !orderData.limitPrice) {
      throw new Error('Missing required order fields')
    }

    if (orderData.amount <= 0 || orderData.limitPrice <= 0) {
      throw new Error('Amount and limit price must be positive')
    }

    // Create order in database
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: orderData.userId,
        base_token: orderData.baseToken,
        quote_token: orderData.quoteToken,
        side: orderData.side,
        amount: orderData.amount,
        limit_price: orderData.limitPrice,
        status: 'pending',
        expires_at: orderData.expiresAt || null,
        max_slippage: orderData.maxSlippage || 1,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      order: data,
      message: `Limit order created. Will execute when ${orderData.side === 'buy' ? `price ≤ $${orderData.limitPrice}` : `price ≥ $${orderData.limitPrice}`}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    }
  }
}

/**
 * Get user's limit orders
 */
export async function getUserLimitOrders(userId: string, status?: string) {
  try {
    const supabase = await createClient()

    let query = supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      orders: data || [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch orders',
      orders: [],
    }
  }
}

/**
 * Cancel a limit order
 */
export async function cancelLimitOrder(orderId: string, userId: string) {
  try {
    const supabase = await createClient()

    // Verify ownership
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      throw new Error('Order not found')
    }

    if (order.user_id !== userId) {
      throw new Error('Unauthorized: Order does not belong to user')
    }

    if (order.status !== 'pending') {
      throw new Error(`Cannot cancel order with status: ${order.status}`)
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      order: data,
      message: 'Order cancelled successfully',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    }
  }
}

/**
 * Check if order is executable and get current price
 */
export async function checkOrderExecutable(orderId: string) {
  try {
    const supabase = await createClient()

    // Fetch order
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', orderId).single()

    if (error || !order) {
      throw new Error('Order not found')
    }

    if (order.status !== 'pending') {
      return {
        success: true,
        executable: false,
        reason: `Order status is ${order.status}`,
      }
    }

    // Check price
    const orderObj: Order = {
      id: order.id,
      baseToken: order.base_token,
      quoteToken: order.quote_token,
      side: order.side,
      amount: order.amount,
      limitPrice: order.limit_price,
      status: order.status,
    }

    const { executable, currentPrice } = await isOrderExecutable(orderObj)

    return {
      success: true,
      executable,
      currentPrice,
      limitPrice: order.limit_price,
      side: order.side,
      reason: executable
        ? 'Ready to execute'
        : `Price ${order.side === 'buy' ? 'above' : 'below'} limit (current: $${currentPrice.toFixed(2)}, limit: $${order.limit_price})`,
    }
  } catch (error) {
    return {
      success: false,
      executable: false,
      error: error instanceof Error ? error.message : 'Failed to check order',
    }
  }
}

/**
 * Manually execute a limit order (also called by background worker)
 */
export async function executeLimitOrder(orderId: string, userId?: string) {
  try {
    const supabase = await createClient()

    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      throw new Error('Order not found')
    }

    // Check ownership if userId provided
    if (userId && order.user_id !== userId) {
      throw new Error('Unauthorized: Order does not belong to user')
    }

    if (order.status !== 'pending') {
      return {
        success: false,
        error: `Cannot execute order with status: ${order.status}`,
      }
    }

    // Check if executable
    const orderObj: Order = {
      id: order.id,
      baseToken: order.base_token,
      quoteToken: order.quote_token,
      side: order.side,
      amount: order.amount,
      limitPrice: order.limit_price,
      status: order.status,
    }

    const { executable, currentPrice } = await isOrderExecutable(orderObj)

    if (!executable) {
      return {
        success: false,
        error: `Order not executable at current price ($${currentPrice.toFixed(2)})`,
        currentPrice,
      }
    }

    // Execute order
    const result = await executeOrder(orderObj)

    if (!result.success) {
      // Update status to failed
      await supabase
        .from('orders')
        .update({ status: 'failed', updated_at: new Date().toISOString() })
        .eq('id', orderId)

      return {
        success: false,
        error: result.error || 'Execution failed',
      }
    }

    // Update order to filled
    const { data, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'filled',
        fill_price: currentPrice,
        tx_hash: result.txHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single()

    if (updateError) throw updateError

    // Create trade record
    await createTradeRecord(order.user_id, orderObj, currentPrice, result.txHash || '')

    return {
      success: true,
      order: data,
      txHash: result.txHash,
      fillPrice: currentPrice,
      message: `Order executed at $${currentPrice.toFixed(2)}`,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute order',
    }
  }
}

/**
 * Create a trade record when order is executed
 */
async function createTradeRecord(userId: string, order: Order, fillPrice: number, txHash: string) {
  try {
    const supabase = await createClient()

    await supabase.from('trades').insert({
      user_id: userId,
      base_token: order.baseToken,
      quote_token: order.quoteToken,
      side: order.side,
      amount: order.amount,
      price: fillPrice,
      total_value: order.amount * fillPrice,
      tx_hash: txHash,
      order_id: order.id,
      status: 'completed',
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to create trade record:', error)
    // Don't fail the order execution if trade record creation fails
  }
}

/**
 * Get order execution statistics
 */
export async function getOrderStats(userId: string) {
  try {
    const supabase = await createClient()

    const { data: orders, error } = await supabase
      .from('orders')
      .select('status')
      .eq('user_id', userId)

    if (error) throw error

    const stats = {
      total: orders?.length || 0,
      pending: orders?.filter((o) => o.status === 'pending').length || 0,
      filled: orders?.filter((o) => o.status === 'filled').length || 0,
      cancelled: orders?.filter((o) => o.status === 'cancelled').length || 0,
      failed: orders?.filter((o) => o.status === 'failed').length || 0,
      successRate: orders && orders.length > 0 ? ((orders.filter((o) => o.status === 'filled').length / orders.length) * 100).toFixed(2) : '0',
    }

    return {
      success: true,
      stats,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats',
    }
  }
}
