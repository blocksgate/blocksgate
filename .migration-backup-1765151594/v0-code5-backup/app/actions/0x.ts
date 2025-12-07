"use server"

import type { SwapQuote, Token } from "@/lib/0x-protocol"

const ZX_API_BASE = "https://api.0x.org"
const ZX_API_KEY = process.env.ZX_API_KEY || ""

export async function getSwapPriceAction(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  chainId = 1,
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount,
      taker: takerAddress,
    })

    const response = await fetch(`${ZX_API_BASE}/swap/allowance-holder/price?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch swap price")
    return await response.json()
  } catch (error) {
    console.error("Error fetching swap price:", error)
    return null
  }
}

export async function getSwapQuoteAction(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  slippageBps = 100,
  chainId = 1,
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount,
      taker: takerAddress,
      slippageBps: slippageBps.toString(),
    })

    const response = await fetch(`${ZX_API_BASE}/swap/allowance-holder/quote?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch swap quote")
    return await response.json()
  } catch (error) {
    console.error("Error fetching swap quote:", error)
    return null
  }
}

export async function getTokenInfoAction(tokenAddress: string, chainId = 1): Promise<Token | null> {
  try {
    const response = await fetch(`${ZX_API_BASE}/tokens/v1/chains/${chainId}?tokens=${tokenAddress}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
      },
    })

    if (!response.ok) return null
    const data = await response.json()
    return data.tokens?.[tokenAddress] || null
  } catch (error) {
    console.error("Error fetching token info:", error)
    return null
  }
}

export async function getGaslessSwapPriceAction(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  chainId = 1,
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount,
      taker: takerAddress,
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/price?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless swap price")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless swap price:", error)
    return null
  }
}

export async function getGaslessSwapQuoteAction(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  chainId = 1,
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      sellToken,
      buyToken,
      sellAmount,
      taker: takerAddress,
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/quote?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless swap quote")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless swap quote:", error)
    return null
  }
}

export async function submitGaslessSwapAction(signature: string, tradeData: object): Promise<any> {
  try {
    const response = await fetch(`${ZX_API_BASE}/gasless/submit`, {
      method: "POST",
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tradeData),
    })

    if (!response.ok) throw new Error("Failed to submit gasless swap")
    return await response.json()
  } catch (error) {
    console.error("Error submitting gasless swap:", error)
    return null
  }
}

export async function getGaslessSwapStatusAction(tradeHash: string): Promise<any> {
  try {
    const response = await fetch(`${ZX_API_BASE}/gasless/status/${tradeHash}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch swap status")
    return await response.json()
  } catch (error) {
    console.error("Error fetching swap status:", error)
    return null
  }
}

export async function getSwapTradesAnalyticsAction(chainId = 1, limit = 100, cursor?: string): Promise<any> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      limit: limit.toString(),
    })

    if (cursor) params.append("cursor", cursor)

    const response = await fetch(`${ZX_API_BASE}/trade-analytics/swap?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch swap trades")
    return await response.json()
  } catch (error) {
    console.error("Error fetching swap trades:", error)
    return null
  }
}

export async function getGaslessTradesAnalyticsAction(chainId = 1, limit = 100, cursor?: string): Promise<any> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
      limit: limit.toString(),
    })

    if (cursor) params.append("cursor", cursor)

    const response = await fetch(`${ZX_API_BASE}/trade-analytics/gasless?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless trades")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless trades:", error)
    return null
  }
}

export async function getSourcesToSupport(chainId = 1): Promise<any> {
  try {
    const params = new URLSearchParams({
      chainId: chainId.toString(),
    })

    const response = await fetch(`${ZX_API_BASE}/sources?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch sources")
    return await response.json()
  } catch (error) {
    console.error("Error fetching sources:", error)
    return null
  }
}

export async function getSupportedSwapChains(): Promise<any> {
  try {
    const response = await fetch(`${ZX_API_BASE}/swap/chains`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch supported chains")
    return await response.json()
  } catch (error) {
    console.error("Error fetching supported chains:", error)
    return null
  }
}

export async function getSupportedGaslessChains(): Promise<any> {
  try {
    const response = await fetch(`${ZX_API_BASE}/gasless/chains`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless chains")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless chains:", error)
    return null
  }
}
