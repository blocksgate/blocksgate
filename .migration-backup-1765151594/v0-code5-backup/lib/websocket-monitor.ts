// Real-time WebSocket monitoring for mempool and pool updates
// Now supports Flashbots RPC-based mempool monitoring

import { getFlashbotsMempoolMonitor } from "./flashbots-mempool-monitor"
import { config } from "./config"

export interface MempoolEvent {
  txHash: string
  from: string
  to: string
  value: string
  gasPrice: string
  nonce: number
  timestamp: number
  detectedAt: number
}

export interface PoolUpdate {
  address: string
  token0: string
  token1: string
  reserve0: string
  reserve1: string
  blockNumber: number
  timestamp: number
  price: number
}

export interface WebSocketMetrics {
  connectedAt: number
  messagesReceived: number
  eventsProcessed: number
  mempoolTxCount: number
  poolUpdatesCount: number
  averageMessageLatency: number
  lastUpdate: number
}

class WebSocketMonitor {
  private wsConnections: Map<string, WebSocket | null> = new Map()
  private mempoolBuffer: MempoolEvent[] = []
  private poolBuffer: PoolUpdate[] = []
  private metrics: WebSocketMetrics = {
    connectedAt: 0,
    messagesReceived: 0,
    eventsProcessed: 0,
    mempoolTxCount: 0,
    poolUpdatesCount: 0,
    averageMessageLatency: 0,
    lastUpdate: 0,
  }
  private eventHandlers: Map<string, Function[]> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5

  constructor() {
    this.initializeConnections()
  }

  private initializeConnections() {
    // Initialize Flashbots mempool monitoring if enabled
    if (config.flashbots.enableMempoolMonitoring) {
      try {
        const flashbotsMonitor = getFlashbotsMempoolMonitor()
        if (flashbotsMonitor) {
          // Listen to Flashbots mempool events
          flashbotsMonitor.on("mempool-tx", (tx: MempoolEvent) => {
            // Forward to our internal event system
            this.handleMempoolTransaction(tx)
          })

          flashbotsMonitor.on("error", (error: any) => {
            console.error("[WebSocket Monitor] Flashbots mempool error:", error)
            this.emit("error", { provider: "flashbots-mempool", error })
          })

          console.log("[WebSocket Monitor] Flashbots mempool monitoring enabled")
          return
        }
      } catch (error) {
        console.error("[WebSocket Monitor] Failed to initialize Flashbots mempool monitoring:", error)
      }
    }

    // Fallback: Alchemy doesn't provide public WebSocket endpoints for mempool/pools
    console.log("[WebSocket Monitor] Mempool monitoring disabled - configure Flashbots for mempool monitoring")
  }

  /**
   * Handle mempool transaction from Flashbots monitor
   */
  private handleMempoolTransaction(tx: MempoolEvent) {
    // Add to buffer
    this.mempoolBuffer.push(tx)
    this.metrics.mempoolTxCount++
    this.metrics.lastUpdate = Date.now()

    // Keep buffer size manageable
    if (this.mempoolBuffer.length > 1000) {
      this.mempoolBuffer.shift()
    }

    // Emit event
    this.emit("mempool-tx", tx)
  }

  private connectToProvider(name: string, url: string) {
    try {
      const ws = new WebSocket(url)

      ws.onopen = () => {
        this.metrics.connectedAt = Date.now()
        this.reconnectAttempts.set(name, 0)
        this.emit("connected", name)
        console.log(`[v0] WebSocket connected: ${name}`)
      }

      ws.onmessage = (event) => {
        this.handleMessage(name, event.data)
      }

      ws.onerror = (error) => {
        console.error(`[v0] WebSocket error (${name}):`, error)
        this.emit("error", { provider: name, error })
      }

      ws.onclose = () => {
        this.emit("disconnected", name)
        this.attemptReconnect(name, url)
      }

      this.wsConnections.set(name, ws)
    } catch (error) {
      console.error(`[v0] Failed to create WebSocket for ${name}:`, error)
    }
  }

  private attemptReconnect(name: string, url: string) {
    const attempts = (this.reconnectAttempts.get(name) || 0) + 1

    if (attempts > this.maxReconnectAttempts) {
      this.emit("reconnect-failed", name)
      return
    }

    const delay = Math.min(1000 * Math.pow(2, attempts), 30000) // Exponential backoff
    console.log(`[v0] Reconnecting ${name} in ${delay}ms (attempt ${attempts})`)

    setTimeout(() => {
      this.reconnectAttempts.set(name, attempts)
      this.connectToProvider(name, url)
    }, delay)
  }

  private handleMessage(provider: string, data: string) {
    const startTime = performance.now()
    this.metrics.messagesReceived++

    try {
      const message = JSON.parse(data)

      if (provider === "mempool" && message.type === "tx") {
        const mempoolEvent: MempoolEvent = {
          txHash: message.hash,
          from: message.from,
          to: message.to || "",
          value: message.value,
          gasPrice: message.gasPrice,
          nonce: message.nonce,
          timestamp: message.timestamp,
          detectedAt: Date.now(),
        }

        this.mempoolBuffer.push(mempoolEvent)
        this.metrics.mempoolTxCount++
        this.emit("mempool-tx", mempoolEvent)
      } else if (provider === "pools" && message.type === "pool_update") {
        const poolUpdate: PoolUpdate = {
          address: message.address,
          token0: message.token0,
          token1: message.token1,
          reserve0: message.reserve0,
          reserve1: message.reserve1,
          blockNumber: message.blockNumber,
          timestamp: message.timestamp,
          price: Number(message.reserve0) / Number(message.reserve1),
        }

        this.poolBuffer.push(poolUpdate)
        this.metrics.poolUpdatesCount++
        this.emit("pool-update", poolUpdate)
      }

      const latency = performance.now() - startTime
      this.updateLatencyMetrics(latency)
      this.metrics.eventsProcessed++
      this.metrics.lastUpdate = Date.now()
    } catch (error) {
      console.error(`[v0] Failed to parse WebSocket message from ${provider}:`, error)
    }
  }

  private updateLatencyMetrics(latency: number) {
    const currentAvg = this.metrics.averageMessageLatency
    const totalProcessed = this.metrics.eventsProcessed
    this.metrics.averageMessageLatency = (currentAvg * totalProcessed + latency) / (totalProcessed + 1)
  }

  // Sub/unsub pattern for event listeners
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) handlers.splice(index, 1)
    }
  }

  private emit(event: string, data?: any) {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach((handler) => handler(data))
  }

  getRecentMempoolTxs(limit = 100): MempoolEvent[] {
    return this.mempoolBuffer.slice(-limit)
  }

  getRecentPoolUpdates(limit = 100): PoolUpdate[] {
    return this.poolBuffer.slice(-limit)
  }

  getMetrics(): WebSocketMetrics {
    return this.metrics
  }

  isConnected(provider: string): boolean {
    const ws = this.wsConnections.get(provider)
    return ws?.readyState === WebSocket.OPEN
  }

  disconnect() {
    this.wsConnections.forEach((ws) => {
      if (ws) ws.close()
    })
    this.wsConnections.clear()
  }
}

let monitor: WebSocketMonitor | null = null

export function getWebSocketMonitor(): WebSocketMonitor {
  if (!monitor) {
    monitor = new WebSocketMonitor()
  }
  return monitor
}
