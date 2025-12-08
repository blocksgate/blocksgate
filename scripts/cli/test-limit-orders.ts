#!/usr/bin/env node

/**
 * Test script for limit order functionality
 * Tests: create, fetch, check executable, and execute orders
 */

import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

// Setup __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '../../.env.local')
dotenv.config({ path: envPath })

// Import server actions
const { createLimitOrder, getUserLimitOrders, checkOrderExecutable, executeLimitOrder, cancelLimitOrder } = await import(
  '../../src/app/actions/limit-orders.ts'
)

const testUserId = 'test-user-' + Date.now()

async function runTests() {
  console.log('🧪 Starting Limit Order Integration Tests\n')

  try {
    // Test 1: Create a limit order
    console.log('📝 Test 1: Creating limit order...')
    const createResult = await createLimitOrder({
      userId: testUserId,
      baseToken: 'ETH',
      quoteToken: 'USDC',
      side: 'buy',
      amount: 0.1,
      limitPrice: 2000,
      maxSlippage: 2,
    })

    if (!createResult.success) {
      console.error('❌ Create failed:', createResult.error)
      process.exit(1)
    }

    const orderId = createResult.order?.id
    console.log(`✅ Created order ${orderId}`)
    console.log(`   Message: ${createResult.message}\n`)

    // Test 2: Fetch user orders
    console.log('📋 Test 2: Fetching user orders...')
    const fetchResult = await getUserLimitOrders(testUserId)

    if (!fetchResult.success) {
      console.error('❌ Fetch failed:', fetchResult.error)
      process.exit(1)
    }

    console.log(`✅ Fetched ${fetchResult.orders?.length} order(s)`)
    if (fetchResult.orders && fetchResult.orders.length > 0) {
      const order = fetchResult.orders[0]
      console.log(`   Order: ${order.id}`)
      console.log(`   Status: ${order.status}`)
      console.log(`   Pair: ${order.base_token}/${order.quote_token}`)
      console.log(`   Limit Price: $${order.limit_price}\n`)
    }

    // Test 3: Check if order is executable
    console.log('🔍 Test 3: Checking if order is executable...')
    const checkResult = await checkOrderExecutable(orderId!)

    if (!checkResult.success) {
      console.error('❌ Check failed:', checkResult.error)
      process.exit(1)
    }

    console.log(`✅ Order executability checked`)
    console.log(`   Executable: ${checkResult.executable}`)
    console.log(`   Current Price: $${checkResult.currentPrice?.toFixed(2)}`)
    console.log(`   Limit Price: $${checkResult.limitPrice?.toFixed(2)}`)
    console.log(`   Reason: ${checkResult.reason}\n`)

    // Test 4: Try to execute order (will likely fail if price not met)
    console.log('⚡ Test 4: Attempting to execute order...')
    const execResult = await executeLimitOrder(orderId!)

    if (execResult.success) {
      console.log(`✅ Order executed!`)
      console.log(`   TxHash: ${execResult.txHash}`)
      console.log(`   Fill Price: $${execResult.fillPrice?.toFixed(2)}\n`)
    } else {
      console.log(`⚠️  Execution pending (order not executable at current price)`)
      console.log(`   Reason: ${execResult.error}\n`)
    }

    // Test 5: Cancel order
    console.log('🚫 Test 5: Cancelling order...')
    const cancelResult = await cancelLimitOrder(orderId!, testUserId)

    if (!cancelResult.success) {
      console.error('❌ Cancel failed:', cancelResult.error)
      process.exit(1)
    }

    console.log(`✅ Order cancelled`)
    console.log(`   Status: ${cancelResult.order?.status}\n`)

    // Test 6: Verify cancellation
    console.log('✔️  Test 6: Verifying cancellation...')
    const verifyResult = await getUserLimitOrders(testUserId, 'cancelled')

    if (!verifyResult.success) {
      console.error('❌ Verification failed:', verifyResult.error)
      process.exit(1)
    }

    console.log(`✅ Verified - ${verifyResult.orders?.length} cancelled order(s)\n`)

    console.log('✨ All tests passed!\n')
  } catch (error) {
    console.error('💥 Test error:', error)
    process.exit(1)
  }
}

runTests()
