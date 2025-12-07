"use server"

import { config } from "@/lib/config"
import { z } from "zod"

const ZX_API_BASE = config.zxProtocol.baseUrl || "https://api.0x.org"
const ZX_API_KEY = config.zxProtocol.apiKey || ""

export interface GaslessQuote {
  chainId: number
  price: string
  guaranteedPrice: string
  buyAmount: string
  sellAmount: string
  allowanceTarget: string
  approval?: {
    type: "executeMetaTransaction::approve" | "permit" | "daiPermit"
    eip712: any
  }
  trade: {
    eip712: any
    type: string
  }
  totalNetworkFee: string
}

const SwapParamsSchema = z.object({
  chainId: z.number().int().positive().default(1),
  sellToken: z.string().min(1),
  buyToken: z.string().min(1),
  sellAmount: z.union([z.string().min(1), z.number().positive()]).transform((v) => String(v)),
  takerAddress: z.string().min(1),
})

export async function getGaslessSwapPriceAction(
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
): Promise<GaslessQuote | null> {
  const parsed = SwapParamsSchema.safeParse({ chainId, sellToken, buyToken, sellAmount, takerAddress })
  if (!parsed.success) {
    console.error("Invalid gasless price params", parsed.error.flatten())
    return null
  }

  try {
    const params = new URLSearchParams({
      chainId: parsed.data.chainId.toString(),
      sellToken: parsed.data.sellToken,
      buyToken: parsed.data.buyToken,
      sellAmount: parsed.data.sellAmount,
      taker: parsed.data.takerAddress,
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/price?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless price")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless price:", error)
    return null
  }
}

export async function getGaslessSwapQuoteAction(
  chainId: number,
  sellToken: string,
  buyToken: string,
  sellAmount: string,
  takerAddress: string,
): Promise<GaslessQuote | null> {
  const parsed = SwapParamsSchema.safeParse({ chainId, sellToken, buyToken, sellAmount, takerAddress })
  if (!parsed.success) {
    console.error("Invalid gasless quote params", parsed.error.flatten())
    return null
  }

  try {
    const params = new URLSearchParams({
      chainId: parsed.data.chainId.toString(),
      sellToken: parsed.data.sellToken,
      buyToken: parsed.data.buyToken,
      sellAmount: parsed.data.sellAmount,
      taker: parsed.data.takerAddress,
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/quote?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless quote")
    return await response.json()
  } catch (error) {
    console.error("Error fetching gasless quote:", error)
    return null
  }
}

const SubmitSchema = z.object({
  chainId: z.number().int().positive(),
  tradeHash: z.string().min(1),
  approvalSignature: z.string().min(1),
  tradeSignature: z.string().min(1),
})

export async function submitGaslessSwapAction(
  chainId: number,
  tradeHash: string,
  approvalSignature: string,
  tradeSignature: string,
): Promise<any> {
  const parsed = SubmitSchema.safeParse({ chainId, tradeHash, approvalSignature, tradeSignature })
  if (!parsed.success) {
    console.error("Invalid gasless submit params", parsed.error.flatten())
    return null
  }

  try {
    const response = await fetch(`${ZX_API_BASE}/gasless/submit`, {
      method: "POST",
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainId: parsed.data.chainId,
        approval: {
          eip712Signature: parsed.data.approvalSignature,
        },
        trade: {
          eip712Signature: parsed.data.tradeSignature,
        },
      }),
    })

    if (!response.ok) throw new Error("Failed to submit gasless swap")
    return await response.json()
  } catch (error) {
    console.error("Error submitting gasless swap:", error)
    return null
  }
}

export async function getGaslessSwapStatusAction(chainId: number, tradeHash: string): Promise<any> {
  const parsed = z
    .object({ chainId: z.number().int().positive(), tradeHash: z.string().min(1) })
    .safeParse({ chainId, tradeHash })

  if (!parsed.success) {
    console.error("Invalid gasless status params", parsed.error.flatten())
    return null
  }

  try {
    const params = new URLSearchParams({
      chainId: parsed.data.chainId.toString(),
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/status/${parsed.data.tradeHash}?${params}`, {
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

export async function getGaslessApprovalTokensAction(chainId: number): Promise<string[]> {
  const parsed = z.object({ chainId: z.number().int().positive().default(1) }).safeParse({ chainId })
  if (!parsed.success) {
    console.error("Invalid gasless approval tokens params", parsed.error.flatten())
    return []
  }

  try {
    const params = new URLSearchParams({
      chainId: parsed.data.chainId.toString(),
    })

    const response = await fetch(`${ZX_API_BASE}/gasless/gasless-approval-tokens?${params}`, {
      headers: {
        "0x-api-key": ZX_API_KEY,
        "0x-version": "v2",
      },
    })

    if (!response.ok) throw new Error("Failed to fetch gasless approval tokens")
    const data = await response.json()
    return data.tokens || []
  } catch (error) {
    console.error("Error fetching gasless approval tokens:", error)
    return []
  }
}
