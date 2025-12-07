#!/usr/bin/env ts-node
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

import { detectArbitrageOpportunities } from "../../src/lib/arbitrage-detector"

async function pollArbitrage() {
  console.log('[arbitrage-poller] Starting continuous arbitrage polling...')
  console.log('[arbitrage-poller] Polling every 10 seconds\n')

  let opportunityCount = 0

  while (true) {
    try {
      const now = new Date().toISOString()
      const opportunities = await detectArbitrageOpportunities()

      if (opportunities.length > 0) {
        opportunityCount += opportunities.length
        console.log(`[${now}] Found ${opportunities.length} opportunity(s) - Total: ${opportunityCount}`)
        opportunities.forEach((opp: any, i: number) => {
          console.log(`  ${i + 1}. ${opp.baseToken} -> ${opp.quoteToken}: ${opp.expectedProfit}% profit`)
        })
      } else {
        console.log(`[${now}] No opportunities found`)
      }
    } catch (err) {
      console.error('[arbitrage-poller] Error:', err)
    }

    await new Promise((r) => setTimeout(r, 10000))
  }
}

pollArbitrage().catch((err) => {
  console.error('[arbitrage-poller] Fatal error:', err)
  process.exit(1)
})
