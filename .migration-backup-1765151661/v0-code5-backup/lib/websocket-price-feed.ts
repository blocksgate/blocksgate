import WebSocket from "ws"
import { EventEmitter } from "events"
import { priceFeed } from "./price-feed"
import { setCachedPrice, getCachedPrice } from "./price-cache"

export class WebSocketPriceFeed extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private subscribedTokens: Set<string> = new Set()
  private isConnected = false
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(private readonly wsUrl: string = "wss://stream.binance.com:9443/ws") {
    super()
  }

  connect() {
    if (this.ws) return

    this.ws = new WebSocket(this.wsUrl)

    this.ws.on("open", () => {
      this.isConnected = true
      this.reconnectAttempts = 0
      this.setupHeartbeat()
      this.subscribeToTokens()
      this.emit("connected")
    })

    this.ws.on("message", (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString())
        if (message.e === "trade") {
          const price = parseFloat(message.p)
          const token = message.s.toLowerCase()
          
          setCachedPrice(token, price)
          this.emit("price", { token, price })
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error)
      }
    })

    this.ws.on("close", () => {
      this.handleDisconnect()
    })

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error)
      this.handleDisconnect()
    })
  }

  private handleDisconnect() {
    this.isConnected = false
    this.ws = null
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
    } else {
      this.emit("max_reconnect_attempts")
    }
  }

  private setupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.ping()
      }
    }, 30000)
  }

  subscribe(token: string) {
    this.subscribedTokens.add(token.toLowerCase())
    if (this.isConnected) {
      this.subscribeToTokens()
    }
  }

  unsubscribe(token: string) {
    this.subscribedTokens.delete(token.toLowerCase())
    if (this.isConnected) {
      this.subscribeToTokens()
    }
  }

  private subscribeToTokens() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return

    const subscribeMessage = {
      method: "SUBSCRIBE",
      params: Array.from(this.subscribedTokens).map(token => `${token}@trade`),
      id: Date.now()
    }

    this.ws.send(JSON.stringify(subscribeMessage))
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    this.isConnected = false
    this.subscribedTokens.clear()
  }

  getSubscribedTokens(): string[] {
    return Array.from(this.subscribedTokens)
  }

  // Fallback to REST API if WebSocket is not available
  async getPrice(token: string): Promise<number> {
    const cachedPrice = getCachedPrice(token)
    if (cachedPrice !== null) {
      return cachedPrice
    }

    try {
      const price = await priceFeed.getPrice(token)
      setCachedPrice(token, price)
      return price
    } catch (error) {
      console.error(`Failed to fetch price for ${token}:`, error)
      throw error
    }
  }
}

export const wsPrice = new WebSocketPriceFeed()