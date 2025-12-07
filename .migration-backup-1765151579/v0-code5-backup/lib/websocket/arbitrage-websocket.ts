// WebSocket service for real-time arbitrage opportunity updates

export interface ArbitrageUpdate {
  id: string
  profitUSD: string
  profitPercent: number
  sellToken: string
  buyToken: string
  expiresIn: number
  timestamp: number
}

export class ArbitrageWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: ArbitrageUpdate) => void>> = new Map()
  private isConnected = false
  private url: string

  constructor(url?: string) {
    // Use WebSocket URL from environment or default
    this.url = url || process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://api.0x.org/ws"
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log("[ArbitrageWebSocket] Connected")
          this.isConnected = true
          this.reconnectAttempts = 0
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error("[ArbitrageWebSocket] Error parsing message:", error)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[ArbitrageWebSocket] WebSocket error:", error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("[ArbitrageWebSocket] Disconnected")
          this.isConnected = false
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Subscribe to arbitrage opportunities
   */
  subscribe(chainId: number, minProfitPercent: number = 0.1): void {
    if (!this.isConnected || !this.ws) {
      console.warn("[ArbitrageWebSocket] Not connected, cannot subscribe")
      return
    }

    this.ws.send(
      JSON.stringify({
        type: "subscribe",
        channel: "arbitrage",
        chainId,
        minProfitPercent,
      })
    )
  }

  /**
   * Unsubscribe from arbitrage opportunities
   */
  unsubscribe(): void {
    if (!this.isConnected || !this.ws) {
      return
    }

    this.ws.send(
      JSON.stringify({
        type: "unsubscribe",
        channel: "arbitrage",
      })
    )
  }

  /**
   * Add listener for arbitrage updates
   */
  onUpdate(callback: (update: ArbitrageUpdate) => void): () => void {
    const id = `listener_${Date.now()}_${Math.random()}`
    if (!this.listeners.has("arbitrage")) {
      this.listeners.set("arbitrage", new Set())
    }
    this.listeners.get("arbitrage")!.add(callback)

    // Return unsubscribe function
    return () => {
      this.listeners.get("arbitrage")?.delete(callback)
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(data: any): void {
    if (data.type === "arbitrage_opportunity") {
      const update: ArbitrageUpdate = {
        id: data.id,
        profitUSD: data.profitUSD,
        profitPercent: data.profitPercent,
        sellToken: data.sellToken,
        buyToken: data.buyToken,
        expiresIn: data.expiresIn,
        timestamp: data.timestamp || Date.now(),
      }

      // Notify all listeners
      this.listeners.get("arbitrage")?.forEach((callback) => {
        try {
          callback(update)
        } catch (error) {
          console.error("[ArbitrageWebSocket] Listener error:", error)
        }
      })
    }
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[ArbitrageWebSocket] Max reconnect attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff

    console.log(`[ArbitrageWebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[ArbitrageWebSocket] Reconnection failed:", error)
      })
    }, delay)
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      this.isConnected = false
      this.listeners.clear()
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// Singleton instance
let arbitrageWebSocketInstance: ArbitrageWebSocket | null = null

export function getArbitrageWebSocket(): ArbitrageWebSocket {
  if (!arbitrageWebSocketInstance) {
    arbitrageWebSocketInstance = new ArbitrageWebSocket()
  }
  return arbitrageWebSocketInstance
}

