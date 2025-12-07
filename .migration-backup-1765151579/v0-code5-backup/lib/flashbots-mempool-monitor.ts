// Flashbots Mempool Monitor
// Monitors Ethereum mempool using RPC polling (Flashbots doesn't provide WebSocket API)
// Supports Flashbots Protect RPC for MEV-protected transaction submission

import { EventEmitter } from "events"
import { config } from "./config"
import { MempoolEvent } from "./websocket-monitor"

export interface FlashbotsMempoolConfig {
  rpcUrl: string
  pollingInterval?: number // Milliseconds between polls (default: 2000ms)
  maxTransactionsPerPoll?: number // Max transactions to fetch per poll (default: 100)
  enableMempool?: boolean // Enable mempool monitoring
}

export class FlashbotsMempoolMonitor extends EventEmitter {
  private rpcUrl: string
  private pollingInterval: number
  private maxTransactionsPerPoll: number
  private isRunning = false
  private pollTimer: NodeJS.Timeout | null = null
  private knownTransactions = new Set<string>()
  private mempoolBuffer: MempoolEvent[] = []
  private metrics = {
    transactionsDetected: 0,
    lastPollTime: 0,
    pollingErrors: 0,
    averagePollLatency: 0,
  }

  constructor(config: FlashbotsMempoolConfig) {
    super()
    this.rpcUrl = config.rpcUrl
    this.pollingInterval = config.pollingInterval || 2000 // Default 2 seconds
    this.maxTransactionsPerPoll = config.maxTransactionsPerPoll || 100
  }

  /**
   * Start monitoring the mempool
   */
  start() {
    if (this.isRunning) {
      console.log("[Flashbots Mempool] Already running")
      return
    }

    this.isRunning = true
    console.log(`[Flashbots Mempool] Starting monitoring with ${this.pollingInterval}ms polling interval`)
    
    // Start polling immediately
    this.pollMempool()
    
    // Set up periodic polling
    this.pollTimer = setInterval(() => {
      this.pollMempool()
    }, this.pollingInterval)
  }

  /**
   * Stop monitoring the mempool
   */
  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
    console.log("[Flashbots Mempool] Stopped monitoring")
  }

  /**
   * Poll the mempool for pending transactions
   */
  private async pollMempool() {
    if (!this.isRunning) return

    const startTime = Date.now()
    
    try {
      // Try txpool_content first (most efficient, but not all RPCs support it)
      // Fall back to eth_getBlockByNumber with "pending" if not supported
      let response: Response
      let useTxPoolContent = true

      try {
        response = await fetch(this.rpcUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "txpool_content",
            params: [],
            id: Date.now(),
          }),
        })
      } catch (error) {
        // If fetch fails, fall back to pending block method
        useTxPoolContent = false
        await this.fallbackPollMethod()
        return
      }

      if (!response.ok) {
        // If txpool_content is not supported, fall back
        if (response.status === 400 || response.status === 404) {
          await this.fallbackPollMethod()
          return
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        // Check if method is not supported
        const errorMsg = result.error.message || ""
        if (errorMsg.includes("method") || errorMsg.includes("not supported") || errorMsg.includes("unknown")) {
          // Fall back to pending block method
          await this.fallbackPollMethod()
          return
        }
        throw new Error(`RPC Error: ${result.error.message}`)
      }

      // Parse pending transactions from txpool_content response
      // Response format: { pending: { [address]: { [nonce]: Transaction } }, queued: {...} }
      const pendingTxs = result.result ? this.parseTxPoolContent(result.result) : []
      
      // Process new transactions
      const newTxs = pendingTxs.filter(tx => !this.knownTransactions.has(tx.txHash))
      
      for (const tx of newTxs) {
        this.knownTransactions.add(tx.txHash)
        this.mempoolBuffer.push(tx)
        
        // Keep buffer size manageable
        if (this.mempoolBuffer.length > 1000) {
          const oldestTx = this.mempoolBuffer.shift()
          if (oldestTx) {
            this.knownTransactions.delete(oldestTx.txHash)
          }
        }

        // Emit event for new transaction
        this.emit("mempool-tx", tx)
      }

      // Update metrics
      const latency = Date.now() - startTime
      this.metrics.transactionsDetected += newTxs.length
      this.metrics.lastPollTime = Date.now()
      this.metrics.averagePollLatency = 
        (this.metrics.averagePollLatency * (this.metrics.transactionsDetected - newTxs.length) + latency) / 
        this.metrics.transactionsDetected

      // Clean up old known transactions (keep last 10,000)
      if (this.knownTransactions.size > 10000) {
        const txsToRemove = Array.from(this.knownTransactions).slice(0, this.knownTransactions.size - 10000)
        txsToRemove.forEach(hash => this.knownTransactions.delete(hash))
      }

    } catch (error) {
      this.metrics.pollingErrors++
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Don't spam console for expected errors (e.g., RPC method not supported)
      if (!errorMessage.includes("method") || this.metrics.pollingErrors % 10 === 0) {
        console.error(`[Flashbots Mempool] Polling error:`, errorMessage)
      }
      
      this.emit("error", { error, timestamp: Date.now() })
      
      // If txpool_content is not supported, fall back to eth_getBlockByNumber with pending
      if (errorMessage.includes("method") || errorMessage.includes("not supported")) {
        await this.fallbackPollMethod()
      }
    }
  }

  /**
   * Fallback polling method using eth_getBlockByNumber with "pending"
   * This is less efficient but works with most RPC providers
   */
  private async fallbackPollMethod() {
    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_getBlockByNumber",
          params: ["pending", true], // Get pending block with full transactions
          id: Date.now(),
        }),
      })

      if (!response.ok) {
        return
      }

      const result = await response.json()
      
      if (result.error || !result.result || !result.result.transactions) {
        return
      }

      // Process transactions from pending block
      const pendingTxs = result.result.transactions.map((tx: any) => this.parseTransaction(tx))
      const newTxs = pendingTxs.filter((tx: MempoolEvent) => 
        tx && !this.knownTransactions.has(tx.txHash)
      )

      for (const tx of newTxs) {
        if (!tx) continue
        this.knownTransactions.add(tx.txHash)
        this.mempoolBuffer.push(tx)
        this.emit("mempool-tx", tx)
      }

    } catch (error) {
      // Silently fail for fallback method
      console.debug("[Flashbots Mempool] Fallback polling failed:", error)
    }
  }

  /**
   * Parse txpool_content response into MempoolEvent array
   */
  private parseTxPoolContent(txPool: any): MempoolEvent[] {
    const transactions: MempoolEvent[] = []

    try {
      // Parse pending transactions
      if (txPool.pending) {
        for (const address in txPool.pending) {
          for (const nonce in txPool.pending[address]) {
            const tx = txPool.pending[address][nonce]
            const mempoolEvent = this.parseTransaction(tx)
            if (mempoolEvent) {
              transactions.push(mempoolEvent)
            }
          }
        }
      }

      // Parse queued transactions (lower priority)
      if (txPool.queued) {
        for (const address in txPool.queued) {
          for (const nonce in txPool.queued[address]) {
            const tx = txPool.queued[address][nonce]
            const mempoolEvent = this.parseTransaction(tx)
            if (mempoolEvent) {
              transactions.push(mempoolEvent)
            }
          }
        }
      }
    } catch (error) {
      console.error("[Flashbots Mempool] Error parsing txpool content:", error)
    }

    return transactions.slice(0, this.maxTransactionsPerPoll)
  }

  /**
   * Parse a transaction object into MempoolEvent
   */
  private parseTransaction(tx: any): MempoolEvent | null {
    try {
      if (!tx || !tx.hash) return null

      return {
        txHash: tx.hash,
        from: tx.from || "",
        to: tx.to || "",
        value: tx.value || "0x0",
        gasPrice: tx.gasPrice || tx.maxFeePerGas || "0x0",
        nonce: typeof tx.nonce === "string" ? parseInt(tx.nonce, 16) : tx.nonce || 0,
        timestamp: Date.now(),
        detectedAt: Date.now(),
      }
    } catch (error) {
      console.error("[Flashbots Mempool] Error parsing transaction:", error)
      return null
    }
  }

  /**
   * Get recent mempool transactions
   */
  getRecentMempoolTxs(limit = 100): MempoolEvent[] {
    return this.mempoolBuffer.slice(-limit)
  }

  /**
   * Get monitoring metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      bufferSize: this.mempoolBuffer.length,
      knownTransactions: this.knownTransactions.size,
      isRunning: this.isRunning,
    }
  }

  /**
   * Submit a transaction through Flashbots Protect
   * This provides MEV protection for your transactions
   */
  async submitProtectedTransaction(txData: {
    to?: string
    from: string
    value?: string
    data?: string
    gas?: string
    gasPrice?: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    nonce?: number
  }): Promise<string> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_sendTransaction",
          params: [txData],
          id: Date.now(),
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.error) {
        throw new Error(`RPC Error: ${result.error.message}`)
      }

      return result.result // Transaction hash
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to submit protected transaction: ${errorMessage}`)
    }
  }
}

// Singleton instance
let flashbotsMonitor: FlashbotsMempoolMonitor | null = null

/**
 * Get or create Flashbots mempool monitor instance
 */
export function getFlashbotsMempoolMonitor(): FlashbotsMempoolMonitor | null {
  if (!config.flashbots.enableMempoolMonitoring) {
    return null
  }

  if (!flashbotsMonitor && config.flashbots.protectRpcUrl) {
    flashbotsMonitor = new FlashbotsMempoolMonitor({
      rpcUrl: config.flashbots.protectRpcUrl,
      pollingInterval: 2000, // 2 seconds
      maxTransactionsPerPoll: 100,
      enableMempool: config.flashbots.enableMempoolMonitoring,
    })
    
    // Start monitoring automatically
    flashbotsMonitor.start()
  }

  return flashbotsMonitor
}

