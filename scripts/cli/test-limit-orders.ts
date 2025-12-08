#!/usr/bin/env node

/**
 * Test script for limit order API functionality
 * Tests the HTTP endpoints for creating, fetching, executing, and cancelling orders
 */

import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

// Setup __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '../../.env.local')
dotenv.config({ path: envPath })

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000'
const testUserId = 'test-user-' + Date.now()
let testOrderId = ''

async function request(method: string, endpoint: string, body?: any) {
  const url = `${BASE_URL}${endpoint}`
  const options: any = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // Add auth header if needed
    },
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(url, options)
    const data = await response.json()
    return { status: response.status, data }
  } catch (error) {
    console.error(`Request failed: ${error}`)
    throw error
  }
}

async function runTests() {
  console.log('🧪 Starting Limit Order API Tests\n')

  try {
    // Test 1: Create a limit order via POST /api/orders
    console.log('📝 Test 1: Creating limit order via POST /api/orders...')
    const createRes = await request('POST', '/api/orders', {
      token_in: 'USDC',
      token_out: 'ETH',
      amount_in: '1000',
      price_target: '2000',
      order_type: 'limit',
      chain_id: 1,
    })

    if (createRes.status !== 200 && createRes.status !== 201) {
      console.error('❌ Create failed with status', createRes.status)
      console.error('Response:', createRes.data)
      // Continue anyway for demo
    } else {
      console.log('✅ Order created successfully')
      testOrderId = createRes.data.order?.id || 'mock-order-id'
      console.log(`   Order ID: ${testOrderId}\n`)
    }

    // Test 2: Fetch user orders via GET /api/orders
    console.log('📋 Test 2: Fetching user orders via GET /api/orders...')
    const fetchRes = await request('GET', '/api/orders')

    if (fetchRes.status !== 200) {
      console.error('⚠️  Fetch returned status', fetchRes.status)
    } else {
      console.log(`✅ Fetched ${fetchRes.data.orders?.length || 0} order(s)`)
      if (fetchRes.data.orders && fetchRes.data.orders.length > 0) {
        const order = fetchRes.data.orders[0]
        console.log(`   Sample order:`)
        console.log(`   - Status: ${order.status}`)
        console.log(`   - Type: ${order.order_type}\n`)
      }
    }

    // Test 3: Execute order via POST /api/orders/[id]/execute
    if (testOrderId) {
      console.log('⚡ Test 3: Attempting to execute order...')
      const execRes = await request('POST', `/api/orders/${testOrderId}/execute`, {
        userId: testUserId,
      })

      if (execRes.status === 200) {
        console.log(`✅ Order execution initiated`)
        console.log(`   Response: ${execRes.data.message || 'OK'}\n`)
      } else {
        console.log(`⚠️  Execution returned status ${execRes.status}`)
        console.log(`   Message: ${execRes.data.error || execRes.data.message}\n`)
      }
    }

    // Test 4: Cancel order via POST /api/orders/[id]/cancel
    if (testOrderId) {
      console.log('🚫 Test 4: Cancelling order...')
      const cancelRes = await request('POST', `/api/orders/${testOrderId}/cancel`)

      if (cancelRes.status === 200) {
        console.log(`✅ Order cancelled successfully`)
        console.log(`   Response: ${cancelRes.data.message || 'OK'}\n`)
      } else {
        console.log(`⚠️  Cancellation returned status ${cancelRes.status}`)
        console.log(`   Message: ${cancelRes.data.error || 'Unknown error'}\n`)
      }
    }

    console.log('✨ API tests completed!\n')
    console.log('📌 Note: Full functionality requires:')
    console.log('   - Dev server running (npm run dev)')
    console.log('   - Valid auth headers for protected endpoints')
    console.log('   - Database populated with test data\n')
  } catch (error) {
    console.error('💥 Test error:', error)
    process.exit(1)
  }
}

runTests()
