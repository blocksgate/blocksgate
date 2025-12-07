"use server"

import type { SwapQuote } from "@/lib/0x-protocol"

const ZX_API_BASE = "https://api.0x.org"
const ZX_API_KEY = process.env.ZX_API_KEY || ""

export async function getPermit2PriceAction(
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

    const response = await fetch(`${ZX_API_BASE}/swap/permit2/price?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch Permit2 price")
    return await response.json()
  } catch (error) {
    console.error("Error fetching Permit2 price:", error)
    return null
  }
}

export async function getPermit2QuoteAction(
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

    const response = await fetch(`${ZX_API_BASE}/swap/permit2/quote?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch Permit2 quote")
    return await response.json()
  } catch (error) {
    console.error("Error fetching Permit2 quote:", error)
    return null
  }
}

export async function getAllowanceHolderPriceAction(
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

    const response = await fetch(`${ZX_API_BASE}/swap/allowance-holder/price?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch AllowanceHolder price")
    return await response.json()
  } catch (error) {
    console.error("Error fetching AllowanceHolder price:", error)
    return null
  }
}

export async function getAllowanceHolderQuoteAction(
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

    if (!response.ok) throw new Error("Failed to fetch AllowanceHolder quote")
    return await response.json()
  } catch (error) {
    console.error("Error fetching AllowanceHolder quote:", error)
    return null
  }
}

export async function determineBestSwapMethod(
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
  chainId = 1,
): Promise<{ method: "permit2" | "allowance-holder"; quote: SwapQuote | null }> {
  try {
    const [permit2Quote, allowanceHolderQuote] = await Promise.all([
      getPermit2PriceAction(sellToken, buyToken, sellAmount, takerAddress, 100, chainId),
      getAllowanceHolderPriceAction(sellToken, buyToken, sellAmount, takerAddress, 100, chainId),
    ])

    if (!permit2Quote || !allowanceHolderQuote) {
      return {
        method: "permit2",
        quote: permit2Quote || allowanceHolderQuote,
      }
    }

    const permit2Buy = BigInt(permit2Quote.buyAmount || "0")
    const allowanceHolderBuy = BigInt(allowanceHolderQuote.buyAmount || "0")

    return {
      method: permit2Buy > allowanceHolderBuy ? "permit2" : "allowance-holder",
      quote: permit2Buy > allowanceHolderBuy ? permit2Quote : allowanceHolderQuote,
    }
  } catch (error) {
    console.error("Error determining best swap method:", error)
    return {
      method: "permit2",
      quote: null,
    }
  }
}
