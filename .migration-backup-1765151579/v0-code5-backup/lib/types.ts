// Global type definitions

export interface Chain {
  id: number
  name: string
  rpc: string
  blockExplorer: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  gas: string
  status: "pending" | "success" | "failed"
  timestamp: number
}

export interface SwapTransaction extends Transaction {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOut: string
  route: string[]
}
