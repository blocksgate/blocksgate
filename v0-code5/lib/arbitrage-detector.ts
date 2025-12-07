/**
 * Simple arbitrage detector using 0x price API.
 * This module fetches indicative prices for a token pair and computes
 * a basic round-trip profit estimate. It's intentionally lightweight —
 * replace or extend with multi-DEX comparison and gas modeling in the future.
 */

type Opportunity = {
  pair: string
  baseToken: string
  quoteToken: string
  buyPrice: number // quoteToken per baseToken
  sellPrice: number // quoteToken per baseToken
  estimatedProfitPct: number
  estimatedProfitAfterGasPct: number
  timestamp: string
}

async function fetch0xQuote(buyToken: string, sellToken: string, buyAmountHuman: number) {
  try {
    const decimals = Number(process.env.ZEROX_TOKEN_DECIMALS || 18)
    const buyAmount = Math.floor(buyAmountHuman * Math.pow(10, decimals))
    const baseUrl = process.env.ZEROX_API_URL ?? 'https://api.0x.org'
    const url = `${baseUrl}/swap/v1/quote?buyToken=${encodeURIComponent(buyToken)}&sellToken=${encodeURIComponent(sellToken)}&buyAmount=${buyAmount}`
    const res = await fetch(url)
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`0x quote error: ${res.status} ${text}`)
    }
    const j = await res.json()
    return j
  } catch (err) {
    console.warn('fetch0xQuote error', err)
    return null
  }
}

/**
 * Estimate gas cost in quote token units.
 * Strategy:
 *  - use `estimatedGas` and `gasPrice` from 0x quote response when available
 *  - otherwise use conservative defaults
 *  - convert native gas cost to quote token using a quick 0x price (ETH/quote)
 */
async function estimateGasCostInQuote(quoteResponse: any, quoteToken: string) {
  try {
    const estimatedGas = Number(quoteResponse?.estimatedGas) || 200000
    const gasPrice = Number(quoteResponse?.gasPrice) || Number(process.env.DEFAULT_GAS_GWEI || 30) * 1e9

    // gas cost in native token (e.g., ETH)
    const gasCostNative = estimatedGas * gasPrice // in wei units
    const gasCostNativeEth = gasCostNative / 1e18

    // fetch native (ETH) price in quoteToken via 0x simple price
    const baseUrl = process.env.ZEROX_API_URL ?? 'https://api.0x.org'
    // attempt to get ETH price in quoteToken
    const eth = 'ETH'
    const quote = quoteToken
    const priceResp = await fetch(`${baseUrl}/swap/v1/price?buyToken=${encodeURIComponent(eth)}&sellToken=${encodeURIComponent(quote)}&buyAmount=${Math.floor(1 * Math.pow(10, Number(process.env.ZEROX_TOKEN_DECIMALS || 18)))}`)
    let ethPriceInQuote = 0
    if (priceResp.ok) {
      const j = await priceResp.json()
      ethPriceInQuote = Number(j?.price) || 0
    }

    // fallback: assume ETH price 2000 quote units if unavailable
    if (!ethPriceInQuote) ethPriceInQuote = Number(process.env.FALLBACK_ETH_PRICE_IN_QUOTE || 2000)

    const gasCostInQuote = gasCostNativeEth * ethPriceInQuote
    return gasCostInQuote
  } catch (err) {
    console.warn('estimateGasCostInQuote error', err)
    return 0
  }
}

export async function findArbitrageOpportunities(pairs: Array<{ baseToken: string; quoteToken: string; amount?: number }>, humanAmount = 1, minProfitPct = 0.2): Promise<Opportunity[]> {
  const opportunities: Opportunity[] = []

  for (const p of pairs) {
    const base = p.baseToken
    const quote = p.quoteToken
    const amount = p.amount ?? humanAmount

    try {
      // Get quotes for both legs
      const buyQuote = await fetch0xQuote(base, quote, amount) // cost to acquire base using quote
      const sellQuote = await fetch0xQuote(quote, base, amount) // cost to acquire quote using base

      if (!buyQuote || !sellQuote) continue

      const buyPrice = Number(buyQuote?.price) || (Number(buyQuote?.sellAmount) / Number(buyQuote?.buyAmount))
      const sellPrice = Number(sellQuote?.price) || (Number(sellQuote?.sellAmount) / Number(sellQuote?.buyAmount))
      if (!Number.isFinite(buyPrice) || !Number.isFinite(sellPrice)) continue

      const grossProfitPct = ((sellPrice - buyPrice) / buyPrice) * 100

      // estimate gas for both legs and subtract from profit (in quote token units)
      const buyGasCost = await estimateGasCostInQuote(buyQuote, quote)
      const sellGasCost = await estimateGasCostInQuote(sellQuote, quote)
      const totalGasCostInQuote = buyGasCost + sellGasCost

      // approximate profit in quote token: (sellPrice - buyPrice) * amount
      const approxProfitInQuote = (sellPrice - buyPrice) * amount
      const profitAfterGasInQuote = approxProfitInQuote - totalGasCostInQuote
      const profitAfterGasPct = (profitAfterGasInQuote / (buyPrice * amount)) * 100

      // filter by minProfitPct (after gas)
      if (profitAfterGasPct < minProfitPct) continue

      opportunities.push({
        pair: `${base}/${quote}`,
        baseToken: base,
        quoteToken: quote,
        buyPrice,
        sellPrice,
        estimatedProfitPct: grossProfitPct,
        estimatedProfitAfterGasPct: profitAfterGasPct,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('findArbitrageOpportunities pair error', p, err)
      continue
    }
  }

  opportunities.sort((a, b) => b.estimatedProfitAfterGasPct - a.estimatedProfitAfterGasPct)
  return opportunities
}
// Real-time arbitrage opportunity detection using 0x Protocol

import { zxClient } from "@/lib/0x-client"
import { ethers } from "ethers"
import { priceFeed } from "@/lib/price-feed"

export interface ArbitrageOpportunity {
  id: string
  sellToken: string
  buyToken: string
  profitUSD: string
  profitPercent: number
  sources: string[]
  paths: {
    sourceRoute: string[]
    destinationRoute: string[]
  }
  expiresIn: number
  estimatedGas: string
  riskScore: number
  timestamp: number
  chainId: number
  sellAmount: string
  buyAmount: string
  gasCostUSD?: string
  netProfitUSD?: string
}

export interface TokenPrice {
  address: string
  symbol: string
  price: number
  liquidity: string
  volume24h: string
}

// Popular token pairs for arbitrage detection
// Note: Using WETH addresses for native ETH swaps (0x API requirement)
const WETH_MAINNET = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const USDC_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAI_MAINNET = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

const POPULAR_PAIRS = [
  { sell: WETH_MAINNET, buy: USDC_MAINNET }, // WETH -> USDC
  { sell: USDC_MAINNET, buy: WETH_MAINNET }, // USDC -> WETH
  { sell: WETH_MAINNET, buy: DAI_MAINNET }, // WETH -> DAI
  { sell: DAI_MAINNET, buy: WETH_MAINNET }, // DAI -> WETH
  { sell: USDC_MAINNET, buy: DAI_MAINNET }, // USDC -> DAI
  { sell: DAI_MAINNET, buy: USDC_MAINNET }, // DAI -> USDC
]

/**
 * Get quote from 0x Protocol with specific DEX sources
 */
async function getQuoteFromDex(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  chainId: number,
  excludedSources?: string[],
): Promise<{ buyAmount: string; sources: string[]; gas: string; estimatedGas: string; gasPrice: string; price: string } | null> {
  try {
    // Validate inputs before making API call
    if (!sellToken || !buyToken || !sellAmount) {
      return null
    }

    // Validate sell amount
    try {
      const amount = BigInt(sellAmount)
      if (amount <= 0) {
        return null
      }
    } catch {
      return null
    }

    const quote = await zxClient.getQuote(chainId, sellToken, buyToken, sellAmount, 0.5)

    // Extract sources from quote
    const sources = quote.sources?.map((s: any) => s.name) || ["0x Protocol"]

    return {
      buyAmount: quote.buyAmount,
      sources,
      gas: quote.gas || quote.estimatedGas || "210000",
      estimatedGas: quote.estimatedGas || quote.gas || "210000",
      gasPrice: quote.gasPrice || "20000000000", // Default 20 gwei
      price: quote.price,
    }
  } catch (error) {
    // Silently skip pairs that don't have routes - this is expected for some token pairs
    // Only log if it's an unexpected error (not a "no route" error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes("no Route matched") && !errorMessage.includes("No swap route")) {
      // Only log non-route errors to avoid spam
      console.debug(`[Arbitrage] Failed to get quote for ${sellToken} -> ${buyToken}:`, errorMessage)
    }
    return null
  }
}

/**
 * Calculate profit in USD
 */
async function calculateProfitUSD(
  profitPercent: number,
  sellAmount: string,
  sellToken: string,
  buyToken: string,
): Promise<string> {
  try {
    // Get token prices in USD
    const sellTokenId = getTokenId(sellToken)
    const buyTokenId = getTokenId(buyToken)

    let sellPrice = 0
    let buyPrice = 0

    if (sellTokenId) {
      sellPrice = await priceFeed.getPrice(sellTokenId)
    }
    if (buyTokenId) {
      buyPrice = await priceFeed.getPrice(buyTokenId)
    }

    // If we have prices, calculate actual USD value
    if (sellPrice > 0) {
      const sellAmountNum = Number.parseFloat(ethers.formatEther(sellAmount))
      const baseValue = sellAmountNum * sellPrice
      const profit = (baseValue * profitPercent) / 100
      return profit.toFixed(2)
    }

    // Fallback: estimate based on ETH price
    const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
    const sellAmountNum = Number.parseFloat(ethers.formatEther(sellAmount))
    const baseValue = sellAmountNum * ethPrice
    const profit = (baseValue * profitPercent) / 100
    return profit.toFixed(2)
  } catch (error) {
    console.error("[Arbitrage] Error calculating profit USD:", error)
    return "0.00"
  }
}

/**
 * Get CoinGecko token ID from address
 */
function getTokenId(tokenAddress: string): string | null {
  const map: Record<string, string> = {
    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE": "ethereum",
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "usd-coin",
    "0x6B175474E89094C44Da98b954EedeAC495271d0F": "dai",
    "0xdAC17F958D2ee523a2206206994597c13d831ec7": "tether",
    "0x2260FAC5E5542a773Aa44fBCfF9D83333Ad63169": "wrapped-bitcoin",
  }
  return map[tokenAddress.toLowerCase()] || null
}

/**
 * Calculate risk score (0-100, lower is better)
 */
function calculateRiskScore(profitPercent: number, gasCostUSD: number): number {
  // Higher profit with lower gas = lower risk
  // Very high profit (>1%) might indicate low liquidity = higher risk
  if (profitPercent < 0.3) return 20 // Low risk, low profit
  if (profitPercent < 0.6) return 45 // Medium risk
  if (profitPercent < 1.0) return 60 // Higher risk
  return 80 // Very high risk (might be low liquidity)
}

/**
 * Detect arbitrage opportunities by comparing quotes from different sources
 */
export async function detectArbitrageOpportunities(
  chainId: number = 1,
  tokenPairs?: Array<{ sell: string; buy: string }>,
  minProfitPercent: number = 0.1,
): Promise<ArbitrageOpportunity[]> {
  try {
    const opportunities: ArbitrageOpportunity[] = []
    const pairs = tokenPairs || POPULAR_PAIRS

    // Use a standard test amount (0.1 ETH worth) - convert to wei string
    const testAmountWei = ethers.parseEther("0.1")
    const testAmount = testAmountWei.toString()

    // For each token pair, get multiple quotes and compare
    for (const pair of pairs) {
      try {
        // Skip if pair is invalid
        if (!pair.sell || !pair.buy) {
          continue
        }

        // Get quotes with different parameters to potentially hit different DEXs
        const quote1 = await getQuoteFromDex(pair.sell, pair.buy, testAmount, chainId)
        
        // If first quote fails, skip this pair
        if (!quote1) {
          continue
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 200))
        
        // Try reverse quote - but don't fail if it doesn't work
        const quote2 = await getQuoteFromDex(pair.buy, pair.sell, testAmount, chainId)

        // Check for triangular arbitrage: A -> B -> A
        // Note: This is simplified - in reality, we'd need to account for different token decimals
        if (quote1 && quote2) {
          try {
            // Use the price from the quote instead of calculating from amounts
            // The price field from 0x API gives us the exchange rate
            const price1 = Number.parseFloat(quote1.price || "0")
            const price2 = Number.parseFloat(quote2.price || "0")

            if (price1 === 0 || price2 === 0 || isNaN(price1) || isNaN(price2)) {
              continue
            }

            // Calculate round-trip: sell 1 unit of token A, get price1 of token B
            // Then sell price1 of token B, get price1 * price2 of token A
            // Profit = (price1 * price2) - 1
            const roundTripPrice = price1 * price2
            const profitPercent = (roundTripPrice - 1) * 100

            // Only consider if profit is significant (accounting for gas and slippage)
            // Need at least 2x min profit to account for gas costs
            if (profitPercent < minProfitPercent * 2) {
              continue
            }

            // Calculate gas cost (gas units * gas price)
            // 0x API returns gas in units, we need to multiply by gas price to get ETH cost
            const gasUnits1 = BigInt(quote1.gas || "210000")
            const gasUnits2 = BigInt(quote2.gas || "210000")
            const gasPriceWei = BigInt(quote1.gasPrice || quote2.gasPrice || "20000000000") // Default 20 gwei
            const totalGasCostWei = (gasUnits1 + gasUnits2) * gasPriceWei
            const gasCostETH = Number.parseFloat(ethers.formatEther(totalGasCostWei.toString()))
            
            const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
            const gasCostUSD = gasCostETH * ethPrice

            // Estimate profit in USD (simplified - using test amount)
            const testAmountNum = Number.parseFloat(ethers.formatEther(testAmount))
            const estimatedProfitUSD = (testAmountNum * ethPrice * profitPercent) / 100
            const netProfitUSD = Math.max(0, estimatedProfitUSD - gasCostUSD)

            // Only add if net profit is positive and significant
            if (netProfitUSD > 1) { // At least $1 profit
              opportunities.push({
                id: `arb-${pair.sell}-${pair.buy}-${Date.now()}`,
                sellToken: pair.sell,
                buyToken: pair.buy,
                profitUSD: estimatedProfitUSD.toFixed(2),
                profitPercent: Number.parseFloat(profitPercent.toFixed(2)),
                sources: [...new Set([...quote1.sources, ...quote2.sources])],
                paths: {
                  sourceRoute: quote1.sources || [],
                  destinationRoute: quote2.sources || [],
                },
                expiresIn: 60, // 60 seconds
                estimatedGas: `${gasCostETH.toFixed(6)} ETH`,
                gasCostUSD: gasCostUSD.toFixed(2),
                netProfitUSD: netProfitUSD.toFixed(2),
                riskScore: calculateRiskScore(profitPercent, gasCostUSD),
                timestamp: Date.now(),
                chainId,
                sellAmount: testAmount,
                buyAmount: quote1.buyAmount,
              })
            }
          } catch (calcError) {
            // Skip this opportunity if calculation fails - this is expected for many pairs
            // Only log if it's an unexpected error
            if (calcError instanceof Error && !calcError.message.includes("no Route")) {
              console.debug(`[Arbitrage] Calculation error for ${pair.sell} -> ${pair.buy}:`, calcError.message)
            }
            continue
          }
        }

        // Skip direct arbitrage detection for now to reduce API calls and errors
        // This can be re-enabled later if needed
        // The triangular arbitrage detection above should be sufficient
      } catch (error) {
        console.error(`[Arbitrage] Error processing pair ${pair.sell} -> ${pair.buy}:`, error)
        continue
      }
    }

    // Sort by profit percentage (highest first)
    return opportunities.sort((a, b) => b.profitPercent - a.profitPercent)
  } catch (error) {
    console.error("[Arbitrage] Error detecting arbitrage opportunities:", error)
    return []
  }
}

/**
 * Detect cross-chain arbitrage opportunities
 */
export async function detectCrossChainArbitrage(
  fromChainId: number,
  toChainId: number,
  tokenAddress: string,
): Promise<ArbitrageOpportunity | null> {
  try {
    const testAmount = ethers.parseEther("0.1").toString()

    const quoteSource = await getQuoteFromDex(tokenAddress, tokenAddress, testAmount, fromChainId)
    const quoteDestination = await getQuoteFromDex(tokenAddress, tokenAddress, testAmount, toChainId)

    if (!quoteSource || !quoteDestination) return null

    const priceSource = Number.parseFloat(ethers.formatEther(quoteSource.buyAmount))
    const priceDestination = Number.parseFloat(ethers.formatEther(quoteDestination.buyAmount))
    const arbitragePercent = Math.abs(((priceDestination - priceSource) / priceSource) * 100)

    if (arbitragePercent > 0.5) {
      const gasCost = Number.parseFloat(ethers.formatEther(quoteSource.gas)) + Number.parseFloat(ethers.formatEther(quoteDestination.gas))
      const ethPrice = await priceFeed.getPrice("ethereum").catch(() => 2500)
      const gasCostUSD = gasCost * ethPrice

      const profitUSD = await calculateProfitUSD(arbitragePercent, testAmount, tokenAddress, tokenAddress)
      const netProfitUSD = (Number.parseFloat(profitUSD) - gasCostUSD).toFixed(2)

      return {
        id: `cross-chain-${fromChainId}-${toChainId}-${Date.now()}`,
        sellToken: tokenAddress,
        buyToken: tokenAddress,
        profitUSD,
        profitPercent: Number.parseFloat(arbitragePercent.toFixed(2)),
        sources: ["Cross-Chain Bridge"],
        paths: {
          sourceRoute: [`Chain ${fromChainId}`],
          destinationRoute: [`Chain ${toChainId}`],
        },
        expiresIn: 120,
        estimatedGas: `${gasCost.toFixed(6)} ETH`,
        gasCostUSD: gasCostUSD.toFixed(2),
        netProfitUSD,
        riskScore: calculateRiskScore(arbitragePercent, gasCostUSD),
        timestamp: Date.now(),
        chainId: fromChainId,
        sellAmount: testAmount,
        buyAmount: quoteSource.buyAmount,
      }
    }

    return null
  } catch (error) {
    console.error("[Arbitrage] Error detecting cross-chain arbitrage:", error)
    return null
  }
}
