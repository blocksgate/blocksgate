import { performance } from "perf_hooks"
import { EventEmitter } from "events"

export interface RpcMetrics {
  functionName: string
  duration: number
  success: boolean
  errorCode?: string
  timestamp: number
}

class RpcMonitor extends EventEmitter {
  private metrics: RpcMetrics[] = []
  private readonly maxMetrics: number

  constructor(maxMetrics: number = 1000) {
    super()
    this.maxMetrics = maxMetrics
  }

  async measure<T>(
    functionName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    let success = true
    let errorCode: string | undefined

    try {
      return await operation()
    } catch (error) {
      success = false
      errorCode = error instanceof Error ? error.name : "UNKNOWN_ERROR"
      throw error
    } finally {
      const duration = performance.now() - startTime
      this.recordMetrics({
        functionName,
        duration,
        success,
        errorCode,
        timestamp: Date.now()
      })
    }
  }

  private recordMetrics(metrics: RpcMetrics): void {
    this.metrics.push(metrics)
    this.emit("metrics", metrics)

    // Maintain fixed size
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getMetrics(options: {
    functionName?: string
    since?: number
    onlyErrors?: boolean
  } = {}): RpcMetrics[] {
    let filtered = this.metrics

    if (options.functionName) {
      filtered = filtered.filter(m => m.functionName === options.functionName)
    }

    const since = options.since
    if (since !== undefined) {
      filtered = filtered.filter(m => m.timestamp >= since)
    }

    if (options.onlyErrors) {
      filtered = filtered.filter(m => !m.success)
    }

    return filtered
  }

  getAverageLatency(functionName?: string): number {
    const relevant = functionName
      ? this.metrics.filter(m => m.functionName === functionName)
      : this.metrics

    if (relevant.length === 0) return 0

    const totalDuration = relevant.reduce((sum, m) => sum + m.duration, 0)
    return totalDuration / relevant.length
  }

  getErrorRate(functionName?: string): number {
    const relevant = functionName
      ? this.metrics.filter(m => m.functionName === functionName)
      : this.metrics

    if (relevant.length === 0) return 0

    const errors = relevant.filter(m => !m.success).length
    return (errors / relevant.length) * 100
  }

  getP95Latency(functionName?: string): number {
    const relevant = functionName
      ? this.metrics.filter(m => m.functionName === functionName)
      : this.metrics

    if (relevant.length === 0) return 0

    const sorted = [...relevant].sort((a, b) => a.duration - b.duration)
    const index = Math.ceil(sorted.length * 0.95) - 1
    return sorted[index].duration
  }

  clear(): void {
    this.metrics = []
  }
}

export const rpcMonitor = new RpcMonitor()