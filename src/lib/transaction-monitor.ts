// Real-time transaction monitoring and status tracking

import { ethers } from "ethers"
import { config } from "./config"
import { EventEmitter } from "events"

export interface TransactionStatus {
  txHash: string
  status: "pending" | "confirmed" | "failed" | "not_found"
  blockNumber?: number
  confirmations: number
  gasUsed?: string
  gasCost?: string
  error?: string
  timestamp: number
}

export class TransactionMonitor extends EventEmitter {
  private monitoredTransactions: Map<string, TransactionStatus> = new Map()
  private providers: Map<number, ethers.JsonRpcProvider> = new Map()
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.initializeProviders()
    this.startMonitoring()
  }

  private initializeProviders() {
    // Initialize providers for all supported chains
    for (const chain of Object.values(config.chains)) {
      this.providers.set(chain.id, new ethers.JsonRpcProvider(chain.rpcUrl))
    }
  }

  private startMonitoring() {
    // Check transaction status every 5 seconds
    this.checkInterval = setInterval(() => {
      this.checkAllTransactions()
    }, 5000)
  }

  /**
   * Monitor a transaction and emit status updates
   */
  async monitorTransaction(txHash: string, chainId: number = 1): Promise<TransactionStatus> {
    const provider = this.providers.get(chainId)
    if (!provider) {
      throw new Error(`Provider not found for chain ${chainId}`)
    }

    // Initial status
    const status: TransactionStatus = {
      txHash,
      status: "pending",
      confirmations: 0,
      timestamp: Date.now(),
    }

    this.monitoredTransactions.set(txHash, status)
    this.emit("transaction:monitoring", { txHash, chainId })

    // Check immediately
    await this.checkTransaction(txHash, chainId)

    return status
  }

  /**
   * Check status of a single transaction
   */
  private async checkTransaction(txHash: string, chainId: number): Promise<void> {
    const provider = this.providers.get(chainId)
    if (!provider) return

    try {
      const receipt = await provider.getTransactionReceipt(txHash)

      if (!receipt) {
        // Still pending
        const status = this.monitoredTransactions.get(txHash)
        if (status && status.status === "pending") {
          // Still pending, no update needed
          return
        }
        return
      }

      // Get current block number
      const currentBlock = await provider.getBlockNumber()
      const confirmations = currentBlock - receipt.blockNumber

      // Determine status
      let txStatus: "pending" | "confirmed" | "failed" = "confirmed"
      if (receipt.status === 0) {
        txStatus = "failed"
      } else if (confirmations < 1) {
        txStatus = "pending"
      }

      // Calculate gas cost
      const gasCost = receipt.gasUsed * (receipt.gasPrice || BigInt(0))

      const status: TransactionStatus = {
        txHash,
        status: txStatus,
        blockNumber: receipt.blockNumber,
        confirmations,
        gasUsed: receipt.gasUsed.toString(),
        gasCost: gasCost.toString(),
        timestamp: Date.now(),
      }

      const previousStatus = this.monitoredTransactions.get(txHash)
      this.monitoredTransactions.set(txHash, status)

      // Emit update if status changed
      if (!previousStatus || previousStatus.status !== status.status) {
        this.emit("transaction:status", status)
      }

      // Emit confirmation updates
      if (confirmations > 0 && (!previousStatus || previousStatus.confirmations !== confirmations)) {
        this.emit("transaction:confirmation", { txHash, confirmations, status })
      }

      // If confirmed or failed, stop monitoring after some time
      if (txStatus === "confirmed" && confirmations >= 12) {
        // 12 confirmations = considered final
        setTimeout(() => {
          this.monitoredTransactions.delete(txHash)
          this.emit("transaction:finalized", { txHash, status })
        }, 60000) // Remove after 1 minute
      }
    } catch (error: any) {
      if (error.code === "NOT_FOUND" || error.message?.includes("not found")) {
        const status: TransactionStatus = {
          txHash,
          status: "not_found",
          confirmations: 0,
          timestamp: Date.now(),
          error: "Transaction not found",
        }
        this.monitoredTransactions.set(txHash, status)
        this.emit("transaction:error", { txHash, error: "Transaction not found" })
      } else {
        console.error(`[TransactionMonitor] Error checking ${txHash}:`, error)
        this.emit("transaction:error", { txHash, error: error.message })
      }
    }
  }

  /**
   * Check all monitored transactions
   */
  private async checkAllTransactions(): Promise<void> {
    const transactions = Array.from(this.monitoredTransactions.keys())

    // Check transactions in batches
    const batchSize = 10
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (txHash) => {
          // Get chainId from stored data or default to 1
          // In production, you'd store chainId with the transaction
          await this.checkTransaction(txHash, 1)
        }),
      )
    }
  }

  /**
   * Get current status of a transaction
   */
  getStatus(txHash: string): TransactionStatus | undefined {
    return this.monitoredTransactions.get(txHash)
  }

  /**
   * Stop monitoring a transaction
   */
  stopMonitoring(txHash: string): void {
    this.monitoredTransactions.delete(txHash)
    this.emit("transaction:stopped", { txHash })
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.monitoredTransactions.clear()
  }
}

// Singleton instance
let transactionMonitorInstance: TransactionMonitor | null = null

export function getTransactionMonitor(): TransactionMonitor {
  if (!transactionMonitorInstance) {
    transactionMonitorInstance = new TransactionMonitor()
  }
  return transactionMonitorInstance
}

