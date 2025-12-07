// RPC Manager with failover support

import { config } from "./config"

interface RpcProvider {
  name: string
  url: string
}

export class RpcManager {
  private providers: RpcProvider[] = []
  private currentProviderIndex = 0
  private chainId: number

  constructor(chainId: number) {
    this.chainId = chainId
    this.initializeProviders()
  }

  private initializeProviders() {
    const chain = Object.values(config.chains).find((c) => c.id === this.chainId)
    if (!chain) {
      throw new Error(`Unsupported chain: ${this.chainId}`)
    }

    this.providers = [
      { name: "Alchemy", url: chain.rpcUrl },
      // Add fallback providers here
    ]
  }

  async call<T>(method: string, params: unknown[]): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[(this.currentProviderIndex + i) % this.providers.length]

      try {
        const response = await fetch(provider.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method,
            params,
            id: 1,
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error.message)
        }

        // Update current provider on success
        this.currentProviderIndex = (this.currentProviderIndex + i) % this.providers.length
        return data.result as T
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        console.warn(`[RPC] ${provider.name} failed for chain ${this.chainId}:`, lastError.message)
      }
    }

    throw new Error(`All RPC providers failed for chain ${this.chainId}: ${lastError?.message}`)
  }

  async getBalance(address: string): Promise<string> {
    return this.call("eth_getBalance", [address, "latest"])
  }

  async getBlockNumber(): Promise<string> {
    return this.call("eth_blockNumber", [])
  }

  async sendRawTransaction(signedTx: string): Promise<string> {
    return this.call("eth_sendRawTransaction", [signedTx])
  }
}
