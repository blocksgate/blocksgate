import { EventEmitter } from "events"
import { ethers } from "ethers"
import { provider } from "./rpc-provider"
import { getWebSocketMonitor } from "./websocket-monitor"

interface MempoolTransaction {
  hash: string
  from: string
  to: string
  value: string
  gasPrice: string
  maxFeePerGas?: string
  maxPriorityFeePerGas?: string
  nonce: number
  data: string
  timestamp: number
}

interface MEVRisk {
  type: "frontrunning" | "sandwich" | "arbitrage"
  severity: "low" | "medium" | "high"
  potentialLoss: string
  recommendedAction: "proceed" | "delay" | "cancel"
}

interface TransactionMonitor {
  txHash: string
  status: "pending" | "confirmed" | "failed"
  blockNumber?: number
  gasUsed?: string
  effectiveGasPrice?: string
  mevRisk?: MEVRisk
}

class MEVProtector extends EventEmitter {
  private pendingTransactions: Map<string, TransactionMonitor> = new Map()
  private readonly wsMonitor = getWebSocketMonitor()
  private readonly confirmationBlocks = 2
  private readonly maxGasPriceIncrease = 1.5 // 50% max increase for frontrunning protection

  constructor() {
    super()
    this.initializeMonitoring()
  }

  private initializeMonitoring() {
    // Monitor mempool for potential MEV activity
    // Flashbots mempool monitor emits "mempool-tx" events
    this.wsMonitor.on("mempool-tx", (tx: any) => {
      // Convert MempoolEvent to MempoolTransaction format
      const mempoolTx: MempoolTransaction = {
        hash: tx.txHash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasPrice: tx.gasPrice,
        nonce: tx.nonce,
        data: "", // MempoolEvent doesn't include data, would need to fetch separately
        timestamp: tx.timestamp,
      }
      this.analyzeMempoolTransaction(mempoolTx)
    })

    // Monitor blocks for transaction confirmations
    // Note: provider.on("block") requires an ethers provider with event support
    // For now, we'll use polling instead if provider doesn't support events
    try {
      if (typeof provider.on === "function") {
        provider.on("block", this.handleNewBlock.bind(this))
      }
    } catch (error) {
      console.warn("[MEV Protector] Block monitoring not available, using polling instead")
    }
  }

  private async analyzeMempoolTransaction(tx: MempoolTransaction) {
    // Check if this transaction could affect any of our pending transactions
    for (const [hash, monitor] of this.pendingTransactions.entries()) {
      if (monitor.status !== "pending") continue

      const risk = await this.assessMEVRisk(tx, hash)
      if (risk) {
        monitor.mevRisk = risk
        this.emit("mev_risk_detected", { txHash: hash, risk })
      }
    }
  }

  private async assessMEVRisk(mempoolTx: MempoolTransaction, ourTxHash: string): Promise<MEVRisk | null> {
    const ourTx = await provider.getTransaction(ourTxHash)
    if (!ourTx) return null

    // Check for frontrunning attempts
    if (this.isFrontrunningAttempt(mempoolTx, ourTx)) {
      return {
        type: "frontrunning",
        severity: "high",
        potentialLoss: this.estimatePotentialLoss(mempoolTx, ourTx),
        recommendedAction: "delay"
      }
    }

    // Check for sandwich attacks
    if (this.isSandwichAttack(mempoolTx, ourTx)) {
      return {
        type: "sandwich",
        severity: "high",
        potentialLoss: this.estimatePotentialLoss(mempoolTx, ourTx),
        recommendedAction: "cancel"
      }
    }

    // Check for arbitrage opportunities that could affect us
    if (this.isArbitrageAttempt(mempoolTx, ourTx)) {
      return {
        type: "arbitrage",
        severity: "medium",
        potentialLoss: this.estimatePotentialLoss(mempoolTx, ourTx),
        recommendedAction: "delay"
      }
    }

    return null
  }

  private isFrontrunningAttempt(mempoolTx: MempoolTransaction, ourTx: ethers.Transaction): boolean {
    // Check if transaction is targeting the same contract
    if (mempoolTx.to.toLowerCase() !== ourTx.to?.toLowerCase()) return false

    // Check if gas price is significantly higher
    const mempoolGasPrice = ethers.getBigInt(mempoolTx.gasPrice)
    const ourGasPrice = ourTx.gasPrice || ethers.getBigInt(0)
    
    if (mempoolGasPrice > (ourGasPrice * ethers.getBigInt(15) / ethers.getBigInt(10))) {
      // Analyze input data for similar patterns
      const similarity = this.calculateMethodSimilarity(mempoolTx.data, ourTx.data || "")
      return similarity > 0.8 // 80% similar
    }

    return false
  }

  private isSandwichAttack(mempoolTx: MempoolTransaction, ourTx: ethers.Transaction): boolean {
    // Look for pairs of transactions with high gas price
    if (mempoolTx.to.toLowerCase() !== ourTx.to?.toLowerCase()) return false

    // Check if it's a DEX interaction
    if (!this.isSwapTransaction(mempoolTx.data)) return false

    // Check for typical sandwich patterns
    return this.detectSandwichPattern(mempoolTx, ourTx)
  }

  private isArbitrageAttempt(mempoolTx: MempoolTransaction, ourTx: ethers.Transaction): boolean {
    // Check for multi-contract interactions
    const targets = this.extractContractInteractions(mempoolTx.data)
    if (targets.length < 2) return false

    // Check if our transaction's target is involved
    return targets.includes(ourTx.to?.toLowerCase() || "")
  }

  private calculateMethodSimilarity(data1: string, data2: string): number {
    if (!data1 || !data2) return 0
    
    // Compare method signatures (first 4 bytes)
    const sig1 = data1.slice(0, 10)
    const sig2 = data2.slice(0, 10)
    if (sig1 !== sig2) return 0

    // Compare parameters
    const params1 = data1.slice(10)
    const params2 = data2.slice(10)
    
    let matchingChars = 0
    const minLength = Math.min(params1.length, params2.length)
    
    for (let i = 0; i < minLength; i += 2) {
      if (params1[i] === params2[i] && params1[i + 1] === params2[i + 1]) {
        matchingChars += 2
      }
    }

    return matchingChars / minLength
  }

  private isSwapTransaction(data: string): boolean {
    // Common DEX method signatures
    const swapSignatures = [
      "0x38ed1739", // swapExactTokensForTokens
      "0x7c025200", // swap
      "0x791ac947", // swapExactTokensForETH
      "0x18cbafe5"  // swapExactTokensForTokensSupportingFeeOnTransferTokens
    ]

    const methodSig = data.slice(0, 10)
    return swapSignatures.includes(methodSig)
  }

  private detectSandwichPattern(mempoolTx: MempoolTransaction, ourTx: ethers.Transaction): boolean {
    // Check for typical sandwich attack patterns:
    // 1. High gas price transaction before ours
    // 2. Similar interaction with the same liquidity pool
    // 3. Potential back-running transaction
    
    const poolAddress = this.extractPoolAddress(mempoolTx.data)
    if (!poolAddress) return false

    const ourPoolAddress = this.extractPoolAddress(ourTx.data || "")
    if (poolAddress !== ourPoolAddress) return false

    // High gas price is a strong indicator
    const mempoolGasPrice = ethers.getBigInt(mempoolTx.gasPrice)
    const ourGasPrice = ourTx.gasPrice || ethers.getBigInt(0)
    
    return mempoolGasPrice > (ourGasPrice * ethers.getBigInt(12) / ethers.getBigInt(10))
  }

  private extractPoolAddress(data: string): string | null {
    // Implementation depends on the DEX protocol being used
    // This is a simplified example
    try {
      // Assuming the pool address is the first address parameter
      const poolAddress = "0x" + data.slice(34, 74)
      return ethers.isAddress(poolAddress) ? poolAddress.toLowerCase() : null
    } catch {
      return null
    }
  }

  private extractContractInteractions(data: string): string[] {
    // Extract contract addresses from transaction data
    // This is a simplified implementation
    const addresses: string[] = []
    for (let i = 0; i < data.length - 40; i++) {
      const potentialAddress = "0x" + data.slice(i, i + 40)
      if (ethers.isAddress(potentialAddress)) {
        addresses.push(potentialAddress.toLowerCase())
      }
    }
    return [...new Set(addresses)] // Remove duplicates
  }

  private estimatePotentialLoss(mempoolTx: MempoolTransaction, ourTx: ethers.Transaction): string {
    // This is a simplified estimation
    // In reality, would need to simulate the transaction impact
    
    // For now, estimate based on gas price difference
    const mempoolGasPrice = ethers.getBigInt(mempoolTx.gasPrice)
    const ourGasPrice = ourTx.gasPrice || ethers.getBigInt(0)
    
    if (mempoolGasPrice > ourGasPrice) {
      const gasDiff = mempoolGasPrice - ourGasPrice
      const estimatedLoss = gasDiff * (ourTx.gasLimit || ethers.getBigInt(0))
      return estimatedLoss.toString()
    }

    return "0"
  }

  private async handleNewBlock(blockNumber: number) {
    const block = await provider.getBlock(blockNumber, true)
    if (!block) return

    // Check our pending transactions
    for (const [hash, monitor] of this.pendingTransactions.entries()) {
      if (monitor.status !== "pending") continue

      const receipt = await provider.getTransactionReceipt(hash)
      if (!receipt) continue

      if (receipt.status === 0) {
        monitor.status = "failed"
        this.emit("transaction_failed", { txHash: hash, receipt })
        continue
      }

      const confirmations = blockNumber - receipt.blockNumber
      if (confirmations >= this.confirmationBlocks) {
        monitor.status = "confirmed"
        monitor.blockNumber = receipt.blockNumber
        monitor.gasUsed = receipt.gasUsed.toString()
        monitor.effectiveGasPrice = receipt.effectiveGasPrice.toString()
        
        this.emit("transaction_confirmed", { txHash: hash, monitor })
        this.pendingTransactions.delete(hash)
      }
    }
  }

  async monitorTransaction(txHash: string): Promise<TransactionMonitor> {
    if (this.pendingTransactions.has(txHash)) {
      return this.pendingTransactions.get(txHash)!
    }

    const monitor: TransactionMonitor = {
      txHash,
      status: "pending"
    }

    this.pendingTransactions.set(txHash, monitor)
    return monitor
  }

  async protectTransaction(tx: ethers.Transaction): Promise<ethers.Transaction> {
    // Implement protective measures:
    // 1. Adjust gas price if needed
    // 2. Add protective parameters
    // 3. Route through protective infrastructure

    const gasPrice = await provider.getFeeData()
    const maxFeePerGas = gasPrice.maxFeePerGas || gasPrice.gasPrice
    const maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas

    if (!maxFeePerGas) throw new Error("Unable to estimate gas price")

    // Increase gas price slightly to avoid being frontrun
    return {
      ...tx,
      maxFeePerGas: (maxFeePerGas * ethers.getBigInt(12) / ethers.getBigInt(10)), // +20%
      maxPriorityFeePerGas: maxPriorityFeePerGas ? 
        (maxPriorityFeePerGas * ethers.getBigInt(12) / ethers.getBigInt(10)) : 
        undefined
    } as ethers.Transaction
  }

  getMonitor(txHash: string): TransactionMonitor | undefined {
    return this.pendingTransactions.get(txHash)
  }
}

export const mevProtector = new MEVProtector()