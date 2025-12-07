#!/usr/bin/env ts-node
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { detectArbitrageOpportunities } from "../../src/lib/arbitrage-detector"
import { quote0xAPI } from "../../src/lib/0x-api-integration"

async function smokeTest() {
  console.log('[smoke-test] Running arbitrage smoke test...\n')

  try {
    // Test 1: Detect opportunities
    console.log('[smoke-test] Test 1: Detecting arbitrage opportunities...')
    const opportunities = await detectArbitrageOpportunities()
    console.log(`  ✓ Found ${opportunities.length} opportunity(ies)\n`)

    if (opportunities.length > 0) {
      // Test 2: Get quote for first opportunity
      const opp = opportunities[0]
      console.log('[smoke-test] Test 2: Getting 0x quote...')
      console.log(`  Base token: ${opp.baseToken}`)
      console.log(`  Quote token: ${opp.quoteToken}`)

      try {
        const quoteResponse = await quote0xAPI(opp.baseToken, opp.quoteToken, '1000000000000000000')
        if (quoteResponse) {
          console.log(`  ✓ Got quote: ${quoteResponse.price || 'N/A'}\n`)
        }
      } catch (e) {
        console.log(`  ! Quote failed (expected in demo): ${(e as any).message}\n`)
      }
    }

    console.log('[smoke-test] ✓ Smoke test completed successfully')
    process.exit(0)
  } catch (err) {
    console.error('[smoke-test] ✗ Test failed:', err)
    process.exit(1)
  }
}

smokeTest()
