import { findArbitrageOpportunities } from '../../lib/arbitrage-detector'

export async function getArbitrageOpportunities(pairs: Array<{ baseToken: string; quoteToken: string }>, amount = 1) {
  // simple passthrough to library function
  return findArbitrageOpportunities(pairs, amount)
}
