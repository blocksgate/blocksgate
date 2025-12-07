export interface RpcEndpoint {
  name: string
  url: string
  priority: number
  backup: boolean
}

export interface RpcProviderConfig {
  alchemyKey?: string
  chainstackKey?: string
  infuraKey?: string
  quicknodeKey?: string
  ankrKey?: string
}

const CHAIN_CONFIG: Record<number, { rpcPath: string; name: string }> = {
  1: { rpcPath: "eth-mainnet", name: "Ethereum" },
  10: { rpcPath: "opt-mainnet", name: "Optimism" },
  42161: { rpcPath: "arb-mainnet", name: "Arbitrum" },
  137: { rpcPath: "polygon-mainnet", name: "Polygon" },
  43114: { rpcPath: "avalanche-mainnet", name: "Avalanche" },
  8453: { rpcPath: "base-mainnet", name: "Base" },
}

export class RpcProvider {
  private endpoints: RpcEndpoint[] = []
  private currentIndex = 0
  private failedEndpoints = new Set<number>()
  private config: RpcProviderConfig

  constructor(config: RpcProviderConfig = {}) {
    this.config = config
    this.initializeEndpoints()
  }

  private initializeEndpoints() {
    const endpoints: RpcEndpoint[] = []

    if (this.config.alchemyKey && this.config.alchemyKey !== "demo") {
      endpoints.push(
        {
          name: "Alchemy Primary",
          url: `https://eth-mainnet.g.alchemy.com/v2/${this.config.alchemyKey}`,
          priority: 0,
          backup: false,
        },
        {
          name: "Alchemy Backup",
          url: `https://eth-mainnet.g.alchemy.com/v2/${this.config.alchemyKey}`,
          priority: 2,
          backup: true,
        },
      )
    }

    if (this.config.chainstackKey) {
      endpoints.push({
        name: "Chainstack",
        url: `https://mainnet.infura.io/v3/${this.config.chainstackKey}`,
        priority: 1,
        backup: false,
      })
    }

    if (this.config.infuraKey && this.config.infuraKey !== "demo") {
      endpoints.push({
        name: "Infura",
        url: `https://mainnet.infura.io/v3/${this.config.infuraKey}`,
        priority: 3,
        backup: false,
      })
    }

    if (this.config.quicknodeKey && this.config.quicknodeKey !== "demo") {
      endpoints.push({
        name: "QuickNode",
        url: `https://mainnet.quicknode.pro/${this.config.quicknodeKey}/`,
        priority: 4,
        backup: false,
      })
    }

    if (this.config.ankrKey && this.config.ankrKey !== "demo") {
      endpoints.push({
        name: "Ankr",
        url: `https://rpc.ankr.com/eth/${this.config.ankrKey}`,
        priority: 5,
        backup: true,
      })
    }

    endpoints.push({
      name: "Public Node (Fallback)",
      url: "https://eth.publicnode.com",
      priority: 10,
      backup: true,
    })

    this.endpoints = endpoints.sort((a, b) => a.priority - b.priority)
  }

  async call(method: string, params: any[] = []): Promise<any> {
    const errors: { provider: string; error: string }[] = []

    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.endpoints[i]

      if (this.failedEndpoints.has(i)) {
        continue
      }

      try {
        const response = await fetch(endpoint.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method,
            params,
            id: Date.now(),
          }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => "")
          const errorMsg = `HTTP ${response.status}${errorText ? ": " + errorText : ""}`

          if (response.status === 401 || response.status === 403) {
            console.error(`[v0] Authentication failed for ${endpoint.name}: ${errorMsg}`)
          }

          throw new Error(errorMsg)
        }

        const result = await response.json()

        if (result.error) {
          throw new Error(result.error.message)
        }

        this.failedEndpoints.delete(i)
        return result.result
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown error"
        errors.push({
          provider: endpoint.name,
          error: errorMsg,
        })

        this.failedEndpoints.add(i)
        continue
      }
    }

    console.error("[v0] All RPC endpoints failed:", errors)
    throw new Error(`All RPC providers failed. Errors: ${JSON.stringify(errors)}`)
  }

  async getBlockNumber(): Promise<number> {
    const result = await this.call("eth_blockNumber")
    return Number.parseInt(result, 16)
  }

  async getBalance(address: string): Promise<string> {
    const result = await this.call("eth_getBalance", [address, "latest"])
    return result
  }

  async estimateGas(txData: {
    from?: string
    to?: string
    value?: string
    data?: string
  }): Promise<string> {
    const result = await this.call("eth_estimateGas", [txData])
    return result
  }

  async getGasPrice(): Promise<string> {
    const result = await this.call("eth_gasPrice")
    return result
  }

  getProvider(): any {
    return {
      getGasPrice: this.getGasPrice.bind(this),
      estimateGas: this.estimateGas.bind(this),
      getBalance: this.getBalance.bind(this),
      getBlockNumber: this.getBlockNumber.bind(this)
    }
  }

  getActiveEndpoint(): RpcEndpoint | null {
    for (let i = 0; i < this.endpoints.length; i++) {
      if (!this.failedEndpoints.has(i)) {
        return this.endpoints[i]
      }
    }
    return null
  }

  getHealthStatus(): {
    healthy: number
    total: number
    active: RpcEndpoint | null
    failed: string[]
  } {
    const failed = Array.from(this.failedEndpoints).map((i) => this.endpoints[i].name)
    return {
      healthy: this.endpoints.length - this.failedEndpoints.size,
      total: this.endpoints.length,
      active: this.getActiveEndpoint(),
      failed,
    }
  }

  resetFailures() {
    this.failedEndpoints.clear()
  }
}

// Singleton instance (server-side only)
let rpcProvider: RpcProvider | null = null

export function initializeRpcProvider(config: RpcProviderConfig): RpcProvider {
  if (!rpcProvider) {
    rpcProvider = new RpcProvider(config)
  }
  return rpcProvider
}

export function getRpcProvider(): RpcProvider {
  if (!rpcProvider) {
    rpcProvider = new RpcProvider({
      alchemyKey: process.env.ALCHEMY_KEY,
      chainstackKey: process.env.CHAINSTACK_KEY,
      infuraKey: process.env.INFURA_KEY,
      quicknodeKey: process.env.QUICKNODE_KEY,
      ankrKey: process.env.ANKR_KEY,
    })
  }
  return rpcProvider
}

export const provider = getRpcProvider().getProvider();
