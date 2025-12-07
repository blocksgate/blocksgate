"use server"

import { getRPCLoadBalancer } from "@/lib/rpc-load-balancer"
import { getWebSocketMonitor } from "@/lib/websocket-monitor"
import { getLatencyTracker } from "@/lib/latency-tracker"
import { getMEVAnalyzerAdvanced } from "@/lib/mev-analyzer-advanced"
import { getFlashLoanAggregator } from "@/lib/flash-loan-aggregator"
import { getGasOptimizer } from "@/lib/gas-optimizer"
import { getSecurityFailover } from "@/lib/security-failover"

export async function getSystemMetrics() {
  try {
    const rpcLoadBalancer = getRPCLoadBalancer()
    const wsMonitor = getWebSocketMonitor()
    const latencyTracker = getLatencyTracker()
    const mevAnalyzer = getMEVAnalyzerAdvanced()
    const flashLoanAgg = getFlashLoanAggregator()
    const gasOptimizer = getGasOptimizer()
    const securityFailover = getSecurityFailover()

    return {
      success: true,
      timestamp: new Date().toISOString(),
      systems: {
        rpc: {
          metrics: rpcLoadBalancer.getMetrics(),
          nodeStatus: rpcLoadBalancer.getNodeStatus(),
        },
        websocket: {
          metrics: wsMonitor.getMetrics(),
          connectedProviders: Array.from(wsMonitor["wsConnections"].keys()).filter((name) =>
            wsMonitor.isConnected(name),
          ),
        },
        latency: {
          metrics: latencyTracker.getMetrics(),
          traces: latencyTracker.getRecentTraces(10),
        },
        mev: {
          metrics: mevAnalyzer.getMetrics(),
          protectionStats: mevAnalyzer.getProtectionStats(),
        },
        flashLoans: {
          metrics: flashLoanAgg.getMetrics(),
          providerStatus: flashLoanAgg.getProviderStatus(),
        },
        gas: {
          metrics: gasOptimizer.getMetrics(),
          recommendations: gasOptimizer.getOptimizationRecommendations(),
        },
        security: {
          metrics: securityFailover.getMetrics(),
          regionStatus: securityFailover.getRegionStatus(),
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }
  }
}

export async function getMempool() {
  try {
    const wsMonitor = getWebSocketMonitor()
    const recentTxs = wsMonitor.getRecentMempoolTxs(50)
    return {
      success: true,
      data: recentTxs,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function executeOptimizedSwap(tokenIn: string, tokenOut: string, amountIn: string, userAddress: string) {
  try {
    const gasOptimizer = getGasOptimizer()
    const mevAnalyzer = getMEVAnalyzerAdvanced()
    const flashLoanAgg = getFlashLoanAggregator()

    // Get gas optimization recommendation
    const gasRec = gasOptimizer.recommendOptimalGasPrice({
      profitabilityLevel: "high",
      txType: "swap",
    })

    // Check for MEV protection opportunity
    const mevAnalysis = await mevAnalyzer.analyzeSwapForMEV({
      tokenIn,
      tokenOut,
      amountIn,
      userAddress,
    })

    // Check for flash loan opportunities
    const flashLoanOpp = await flashLoanAgg.findFlashLoanOpportunity({
      tokenIn,
      tokenOut,
      amount: amountIn,
    })

    return {
      success: true,
      optimization: {
        gasPrice: gasRec.suggestedGasPrice,
        gasSavings: gasRec.estimatedSavings,
        mevProtection: mevAnalysis.mevRiskLevel,
        mevSavings: mevAnalysis.estimatedMevValue,
        flashLoanAvailable: !!flashLoanOpp,
        flashLoanDetails: flashLoanOpp,
      },
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function monitorLatency(operationName: string) {
  try {
    const latencyTracker = getLatencyTracker()
    const span = latencyTracker.createSpan(operationName)

    return {
      success: true,
      spanId: span.spanId,
      startTime: span.startTime,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function endLatencyMonitoring(spanId: string, metadata?: Record<string, any>) {
  try {
    const latencyTracker = getLatencyTracker()
    const trace = latencyTracker.endSpan(spanId, metadata)

    return {
      success: true,
      trace,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
