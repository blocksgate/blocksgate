import { WebSocket, WebSocketServer } from "ws"
import { Server } from "http"
import { EventEmitter } from "events"
import { verifyToken } from "./supabase/auth"

interface WebSocketClient {
  id: string
  ws: WebSocket
  userId?: string
  subscriptions: Set<string>
}

export class RealtimeServer extends EventEmitter {
  private wss: WebSocketServer
  private clients: Map<string, WebSocketClient> = new Map()

  constructor(server: Server) {
    super()
    this.wss = new WebSocketServer({ server })
    this.setupWebSocketServer()
  }

  private setupWebSocketServer() {
    this.wss.on("connection", async (ws: WebSocket, request) => {
      const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Extract token from query parameters
      const url = new URL(request.url!, `http://${request.headers.host}`)
      const token = url.searchParams.get("token")
      
      let userId: string | undefined

      if (token) {
        try {
          const user = await verifyToken(token)
          userId = user.id
        } catch (error) {
          ws.close(1008, "Invalid token")
          return
        }
      }

      const client: WebSocketClient = {
        id: clientId,
        ws,
        userId,
        subscriptions: new Set(),
      }

      this.clients.set(clientId, client)

      ws.addEventListener("message", (event) => {
        this.handleMessage(client, event.data.toString())
      })

      ws.addEventListener("close", () => {
        this.clients.delete(clientId)
      })

      // Send initial connection success message
      this.sendToClient(client, {
        type: "connection_established",
        clientId,
        userId,
      })
    })
  }

  private handleMessage(client: WebSocketClient, data: string) {
    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case "subscribe":
          this.handleSubscribe(client, message)
          break
        case "unsubscribe":
          this.handleUnsubscribe(client, message)
          break
        default:
          this.sendToClient(client, {
            type: "error",
            error: "Unknown message type",
          })
      }
    } catch (error) {
      this.sendToClient(client, {
        type: "error",
        error: "Invalid message format",
      })
    }
  }

  private handleSubscribe(client: WebSocketClient, message: any) {
    const { channels } = message

    if (!Array.isArray(channels)) {
      this.sendToClient(client, {
        type: "error",
        error: "Invalid channels format",
      })
      return
    }

    // Check permissions for each channel
    channels.forEach(channel => {
      if (this.canSubscribe(client, channel)) {
        client.subscriptions.add(channel)
        this.sendToClient(client, {
          type: "subscribed",
          channel,
        })
      } else {
        this.sendToClient(client, {
          type: "error",
          error: "Unauthorized subscription",
          channel,
        })
      }
    })
  }

  private handleUnsubscribe(client: WebSocketClient, message: any) {
    const { channels } = message

    if (!Array.isArray(channels)) {
      this.sendToClient(client, {
        type: "error",
        error: "Invalid channels format",
      })
      return
    }

    channels.forEach(channel => {
      client.subscriptions.delete(channel)
      this.sendToClient(client, {
        type: "unsubscribed",
        channel,
      })
    })
  }

  private canSubscribe(client: WebSocketClient, channel: string): boolean {
    // Check if user is authenticated for private channels
    if (channel.startsWith("private:") && !client.userId) {
      return false
    }

    // Check if user has access to user-specific channels
    if (channel.startsWith("user:")) {
      const userId = channel.split(":")[1]
      return client.userId === userId
    }

    // Public channels are always accessible
    if (channel.startsWith("public:")) {
      return true
    }

    return false
  }

  private sendToClient(client: WebSocketClient, message: any) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message))
    }
  }

  broadcast(channel: string, data: any) {
    const message = JSON.stringify({
      type: "message",
      channel,
      data,
    })

    this.clients.forEach(client => {
      if (client.subscriptions.has(channel) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
      }
    })
  }

  broadcastToUser(userId: string, data: any) {
    const message = JSON.stringify({
      type: "message",
      channel: `user:${userId}`,
      data,
    })

    this.clients.forEach(client => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
      }
    })
  }

  broadcastToAll(data: any) {
    const message = JSON.stringify({
      type: "broadcast",
      data,
    })

    this.clients.forEach(client => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message)
      }
    })
  }
}