// RPC Load Balancer with adaptive routing and latency tracking
import { EventEmitter } from "events"

export interface RPCNode {
  name: string
  endpoint: string
  priority: number
  latency: number
  errorCount: number
  isHealthy: boolean
  responseTime: number[]
  failoverCount: number
}

export interface RoutingMetrics {
  totalRequests: number
  failedRequests: number
  averageLatency: number
  nodeHealthStatus: Record<string, boolean>
  recommendedNode: string
}

class RPCLoadBalancer extends EventEmitter {
  private nodes: Map<string, RPCNode> = new Map()
  private requestCounter = 0
  private metrics: RoutingMetrics = {
    totalRequests: 0,
    failedRequests: 0,
    averageLatency: 0,
    nodeHealthStatus: {},
    recommendedNode: "",
  }
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.initializeDefaultNodes()
    this.startHealthChecks()
  }

  private initializeDefaultNodes() {
    const alchemyEndpoint = process.env.ALCHEMY_PRIMARY_RPC
      ? process.env.ALCHEMY_PRIMARY_RPC
      : "https://eth-mainnet.alchemyapi.io/v2/demo"

    const infuraEndpoint = process.env.INFURA_RPC
      ? process.env.INFURA_RPC
      : process.env.INFURA_KEY
        ? `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
        : "https://eth.publicnode.com" // Public fallback

    const quicknodeEndpoint = process.env.QUICKNODE_RPC
      ? process.env.QUICKNODE_RPC
      : process.env.QUICKNODE_KEY
        ? `https://mainnet.quicknode.pro/${process.env.QUICKNODE_KEY}/`
        : "https://eth.publicnode.com" // Public fallback

    const defaultNodes: RPCNode[] = [
      {
        name: "Alchemy Primary",
        endpoint: alchemyEndpoint,
        priority: 1,
        latency: 0,
        errorCount: 0,
        isHealthy: true,
        responseTime: [],
        failoverCount: 0,
      },
      {
        name: "Infura Backup",
        endpoint: infuraEndpoint,
        priority: 2,
        latency: 0,
        errorCount: 0,
        isHealthy: true,
        responseTime: [],
        failoverCount: 0,
      },
      {
        name: "Quicknode Secondary",
        endpoint: quicknodeEndpoint,
        priority: 3,
        latency: 0,
        errorCount: 0,
        isHealthy: true,
        responseTime: [],
        failoverCount: 0,
      },
      {
        name: "Public Fallback",
        endpoint: "https://eth.publicnode.com",
        priority: 4,
        latency: 0,
        errorCount: 0,
        isHealthy: true,
        responseTime: [],
        failoverCount: 0,
      },
    ]

    defaultNodes.forEach((node) => {
      this.nodes.set(node.name, node)
    })
  }

  async routeRequest<T>(method: string, params: any[] = []): Promise<T> {
    const bestNode = this.selectBestNode()
    this.requestCounter++
    this.metrics.totalRequests++

    if (!bestNode) {
      throw new Error("No healthy RPC nodes available")
    }

    const startTime = performance.now()

    try {
      const response = await fetch(bestNode.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: this.requestCounter,
          method,
          params,
        }),
      })

      const endTime = performance.now()
      const responseTime = endTime - startTime

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`HTTP error! status: ${response.status}`)
        if (response.status === 401 || response.status === 403) {
          console.error(`[v0] Authentication failed for ${bestNode.name}: ${errorText}`)
          bestNode.errorCount += 5 // Mark as more severe
        }
        throw error
      }

      const data = await response.json()

      if (data.error) {
        bestNode.errorCount++
        throw new Error(data.error.message)
      }

      bestNode.responseTime.push(responseTime)
      if (bestNode.responseTime.length > 100) bestNode.responseTime.shift()
      bestNode.latency = responseTime
      bestNode.errorCount = Math.max(0, bestNode.errorCount - 1)

      this.updateMetrics()
      this.emit("request-success", { node: bestNode.name, latency: responseTime })
      return data.result as T
    } catch (error) {
      bestNode.errorCount++
      this.metrics.failedRequests++

      if (bestNode.errorCount > 5) {
        bestNode.isHealthy = false
        this.emit("node-unhealthy", bestNode.name)
      }

      // Fallback to next best node
      const fallbackNode = this.selectBestNode(bestNode.name)
      if (fallbackNode) {
        fallbackNode.failoverCount++
        return this.routeRequest(method, params)
      }

      throw error
    }
  }

  private selectBestNode(excludeNode?: string): RPCNode | null {
    const healthyNodes = Array.from(this.nodes.values()).filter(
      (node) => node.isHealthy && (!excludeNode || node.name !== excludeNode),
    )

    if (healthyNodes.length === 0) return null

    return healthyNodes.sort((a, b) => {
      const scoreA = this.calculateNodeScore(a)
      const scoreB = this.calculateNodeScore(b)
      return scoreA - scoreB // Lower score is better
    })[0]
  }

  private calculateNodeScore(node: RPCNode): number {
    // Score formula: latency + (errorCount * 100) + (priority * 10)
    const avgLatency =
      node.responseTime.length > 0 ? node.responseTime.reduce((a, b) => a + b, 0) / node.responseTime.length : 0
    return avgLatency + node.errorCount * 100 + node.priority * 10
  }

  private startHealthChecks() {
    this.healthCheckInterval = setInterval(() => {
      this.nodes.forEach((node) => {
        this.performHealthCheck(node)
      })
    }, 30000)
  }

  private async performHealthCheck(node: RPCNode) {
    try {
      const response = await fetch(node.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_blockNumber",
          params: [],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        if (!data.error) {
          node.isHealthy = true
          if (node.errorCount > 0) {
            this.emit("node-recovered", node.name)
          }
          node.errorCount = 0
        }
      }
    } catch {
      node.isHealthy = false
      node.errorCount++
    }

    this.updateMetrics()
  }

  private updateMetrics() {
    const allLatencies = Array.from(this.nodes.values()).flatMap((n) => n.responseTime)
    this.metrics.averageLatency =
      allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0

    this.nodes.forEach((node) => {
      this.metrics.nodeHealthStatus[node.name] = node.isHealthy
    })

    const bestNode = this.selectBestNode()
    this.metrics.recommendedNode = bestNode?.name || "None"
  }

  getMetrics(): RoutingMetrics {
    return this.metrics
  }

  getNodeStatus(): Record<string, Omit<RPCNode, "responseTime">> {
    const status: Record<string, Omit<RPCNode, "responseTime">> = {}
    this.nodes.forEach((node, name) => {
      const { responseTime, ...rest } = node
      status[name] = rest
    })
    return status
  }

  destroy() {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval)
  }
}

// Singleton instance
let loadBalancer: RPCLoadBalancer | null = null

export function getRPCLoadBalancer(): RPCLoadBalancer {
  if (!loadBalancer) {
    loadBalancer = new RPCLoadBalancer()
  }
  return loadBalancer
}
