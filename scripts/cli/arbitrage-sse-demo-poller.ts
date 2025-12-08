#!/usr/bin/env ts-node
import dotenv from 'dotenv'

// Load .env from the repo root (works in ESM)
const envPath = new URL('../../.env', import.meta.url).pathname
dotenv.config({ path: envPath })

import { detectArbitrageOpportunities } from "../../src/lib/arbitrage-detector.ts"

async function pollArbitrage() {
  console.log('[arbitrage-poller] Starting continuous arbitrage polling...')
  console.log('[arbitrage-poller] Polling every 10 seconds\n')

  let opportunityCount = 0

  while (true) {
    try {
      const opportunities = await detectArbitrageOpportunities()
      if (opportunities.length > 0) {
        opportunityCount += opportunities.length
        console.log(`[${new Date().toISOString()}] Found ${opportunities.length} arbitrage opportunities (total: ${opportunityCount})`)
        opportunities.slice(0, 3).forEach((opp: any) => {
          console.log(`  - ${opp.baseToken} -> ${opp.quoteToken}: ${opp.profit}%`)
        })
      } else {
        console.log(`[${new Date().toISOString()}] No arbitrage opportunities found`)
      }
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] Error:`, err.message)
    }

    await new Promise(resolve => setTimeout(resolve, 10000))
  }
}

pollArbitrage().catch(console.error)
