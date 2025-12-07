// 0x Protocol Integration - Client-side types and constants only
// All API calls with authentication must use server actions in app/actions/0x.ts

const PERMIT2_CONTRACT = "0x000000000022d473030f116ddee9f6b43ac78ba3"
const ALLOWANCE_HOLDER = "0x1111111254eeb414e16212cdc72602c3a3868e88"

export interface Token {
  address: string
  symbol: string
  decimals: number
  chainId: number
}

export interface SwapQuote {
  price: string
  guaranteedPrice: string
  to: string
  data: string
  value: string
  gas: string
  gasPrice: string
  protocolFees: Array<{
    token: string
    amount: string
    type: string
  }>
  minimumProtocolFee: string
  buyTokenAddress: string
  sellTokenAddress: string
  buyAmount: string
  sellAmount: string
  sources: Array<{
    name: string
    proportion: string
  }>
  allowanceTarget: string
  sellTokenToEthRate: string
  buyTokenToEthRate: string
}

export interface LiquidityPool {
  id: string
  token0: Token
  token1: Token
  liquidity: string
  feeTier: number
  volume24h: string
  apy: string
}

export const ZX_API_CONSTANTS = {
  PERMIT2_CONTRACT,
  ALLOWANCE_HOLDER,
}

// Estimate gas for swap transaction (placeholder)
export async function estimateSwapGas(swapData: string, takerAddress: string, chainId = 1): Promise<string | null> {
  try {
    // Gas estimation logic - placeholder
    return "150000"
  } catch (error) {
    console.error("Error estimating gas:", error)
    return null
  }
}
