// End-to-end latency tracing and APM (Application Performance Monitoring)

export interface LatencyTrace {
  traceId: string
  startTime: number
  stages: TraceStage[]
  totalDuration: number
  mevRisk: number
  gasPrice: number
}

export interface TraceStage {
  name: string
  startTime: number
  endTime: number
  duration: number
  tags: Record<string, string | number>
  status: "success" | "error"
  error?: string
}

export interface APMMetrics {
  traceId: string
  eventDetectionLatency: number
  txPrepLatency: number
  txSubmissionLatency: number
  txConfirmationLatency: number
  totalLatency: number
  bottleneck: string
  timestamp: number
}

export interface PerformanceThresholds {
  eventDetection: number // ms
  txPrep: number // ms
  txSubmission: number // ms
  txConfirmation: number // ms
  total: number // ms
}

class LatencyTracker {
  private traces: Map<string, LatencyTrace> = new Map()
  private apmMetrics: APMMetrics[] = []
  private readonly thresholds: PerformanceThresholds = {
    eventDetection: 100,
    txPrep: 200,
    txSubmission: 50,
    txConfirmation: 1000,
    total: 2000,
  }
  private sessionStartTime = Date.now()

  createTrace(traceId: string): LatencyTrace {
    const trace: LatencyTrace = {
      traceId,
      startTime: Date.now(),
      stages: [],
      totalDuration: 0,
      mevRisk: 0,
      gasPrice: 0,
    }
    this.traces.set(traceId, trace)
    return trace
  }

  recordStage(
    traceId: string,
    stageName: string,
    duration: number,
    tags: Record<string, string | number> = {},
    status: "success" | "error" = "success",
    error?: string,
  ) {
    const trace = this.traces.get(traceId)
    if (!trace) return

    const stage: TraceStage = {
      name: stageName,
      startTime: Date.now() - duration,
      endTime: Date.now(),
      duration,
      tags,
      status,
      error,
    }

    trace.stages.push(stage)

    // Update total duration
    const allDurations = trace.stages.reduce((sum, s) => sum + s.duration, 0)
    trace.totalDuration = allDurations

    // Check for performance violations
    if (stageName === "event-detection" && duration > this.thresholds.eventDetection) {
      console.log(`[v0] Event detection exceeded threshold: ${duration}ms > ${this.thresholds.eventDetection}ms`)
    }
    if (stageName === "tx-preparation" && duration > this.thresholds.txPrep) {
      console.log(`[v0] TX preparation exceeded threshold: ${duration}ms > ${this.thresholds.txPrep}ms`)
    }
    if (stageName === "tx-submission" && duration > this.thresholds.txSubmission) {
      console.log(`[v0] TX submission exceeded threshold: ${duration}ms > ${this.thresholds.txSubmission}ms`)
    }
  }

  generateAPMMetrics(traceId: string, gasPrice = 0, mevRisk = 0): APMMetrics | null {
    const trace = this.traces.get(traceId)
    if (!trace) return null

    trace.gasPrice = gasPrice
    trace.mevRisk = mevRisk

    const stageMap = new Map(trace.stages.map((s) => [s.name, s.duration]))

    const metrics: APMMetrics = {
      traceId,
      eventDetectionLatency: stageMap.get("event-detection") || 0,
      txPrepLatency: stageMap.get("tx-preparation") || 0,
      txSubmissionLatency: stageMap.get("tx-submission") || 0,
      txConfirmationLatency: stageMap.get("tx-confirmation") || 0,
      totalLatency: trace.totalDuration,
      bottleneck: this.identifyBottleneck(trace.stages),
      timestamp: Date.now(),
    }

    this.apmMetrics.push(metrics)
    return metrics
  }

  private identifyBottleneck(stages: TraceStage[]): string {
    if (stages.length === 0) return "unknown"
    const slowestStage = stages.reduce((max, stage) => (stage.duration > max.duration ? stage : max))
    return slowestStage.name
  }

  getTrace(traceId: string): LatencyTrace | null {
    return this.traces.get(traceId) || null
  }

  getPerformanceStats(timeWindow = 3600000): {
    averageLatency: number
    p50Latency: number
    p95Latency: number
    p99Latency: number
    errorRate: number
    bottlenecks: Record<string, number>
  } {
    const cutoff = Date.now() - timeWindow
    const relevantTraces = Array.from(this.traces.values()).filter((t) => t.startTime > cutoff)

    const latencies = relevantTraces.map((t) => t.totalDuration).sort((a, b) => a - b)
    const errors = relevantTraces.filter((t) => t.stages.some((s) => s.status === "error")).length

    const bottleneckCounts: Record<string, number> = {}
    relevantTraces.forEach((t) => {
      const bottleneck = this.identifyBottleneck(t.stages)
      bottleneckCounts[bottleneck] = (bottleneckCounts[bottleneck] || 0) + 1
    })

    return {
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] || 0,
      errorRate: latencies.length > 0 ? (errors / latencies.length) * 100 : 0,
      bottlenecks: bottleneckCounts,
    }
  }

  getRecentMetrics(limit = 50): APMMetrics[] {
    return this.apmMetrics.slice(-limit)
  }

  getUptime(): { uptime: number; tracedRequests: number; successRate: number } {
    const uptime = Date.now() - this.sessionStartTime
    const tracedRequests = this.traces.size
    const successfulTraces = Array.from(this.traces.values()).filter((t) =>
      t.stages.every((s) => s.status === "success"),
    ).length
    const successRate = tracedRequests > 0 ? (successfulTraces / tracedRequests) * 100 : 100

    return { uptime, tracedRequests, successRate }
  }

  getMetrics() {
    const perfStats = this.getPerformanceStats()
    return {
      averageLatency: perfStats.averageLatency,
      p95Latency: perfStats.p95Latency,
      p99Latency: perfStats.p99Latency,
      errorRate: perfStats.errorRate,
      tracedRequests: this.traces.size,
    }
  }

  getRecentTraces(limit = 10) {
    return Array.from(this.traces.values())
      .slice(-limit)
      .map((t) => ({
        traceId: t.traceId,
        totalDuration: t.totalDuration,
        stages: t.stages,
        mevRisk: t.mevRisk,
      }))
  }

  createSpan(operationName: string) {
    const traceId = `span-${Date.now()}-${Math.random().toString(36).substring(7)}`
    this.createTrace(traceId)
    return {
      spanId: traceId,
      startTime: Date.now(),
    }
  }

  endSpan(spanId: string, metadata?: Record<string, any>) {
    return this.getTrace(spanId)
  }

  setThresholds(thresholds: Partial<PerformanceThresholds>) {
    this.thresholds = { ...this.thresholds, ...thresholds }
  }

  clearOldTraces(maxAge = 86400000) {
    const cutoff = Date.now() - maxAge
    for (const [traceId, trace] of this.traces.entries()) {
      if (trace.startTime < cutoff) {
        this.traces.delete(traceId)
      }
    }
  }
}

let tracker: LatencyTracker | null = null

export function getLatencyTracker(): LatencyTracker {
  if (!tracker) {
    tracker = new LatencyTracker()
  }
  return tracker
}
