"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getSystemMetrics, getMempool } from "@/app/actions/integrated-systems"
import { Activity, AlertTriangle, Zap } from "lucide-react"

interface SystemMetrics {
  success: boolean
  systems?: {
    rpc: any
    websocket: any
    latency: any
    mev: any
    flashLoans: any
    gas: any
    security: any
  }
  error?: string
}

export function SystemIntegrationMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [mempoolData, setMempoolData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [systemMetrics, mempoolResponse] = await Promise.all([getSystemMetrics(), getMempool()])

        setMetrics(systemMetrics as SystemMetrics)
        if (mempoolResponse.success) {
          setMempoolData(mempoolResponse.data || [])
        }
      } catch (error) {
        console.error("[v0] Failed to fetch integrated metrics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading system integration...</div>
  }

  if (!metrics?.success) {
    return (
      <Card className="border-red-500/50 bg-red-950/20">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <AlertTriangle size={20} />
            System Integration Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-300">{metrics?.error}</p>
        </CardContent>
      </Card>
    )
  }

  const systems = metrics.systems

  return (
    <div className="space-y-6">
      {/* RPC Load Balancer Status */}
      <Card className="neon-border border-cyan-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Zap size={20} />
            RPC Load Balancer
          </CardTitle>
          <CardDescription>Adaptive multi-node routing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Healthy Nodes</p>
              <p className="text-2xl font-bold text-cyan-400">
                {systems?.rpc?.metrics?.nodeHealthStatus
                  ? Object.values(systems.rpc.metrics.nodeHealthStatus).filter(Boolean).length
                  : 0}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Avg Latency</p>
              <p className="text-2xl font-bold text-cyan-400">{systems?.rpc?.metrics?.averageLatency?.toFixed(0)}ms</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <p>Recommended: {systems?.rpc?.metrics?.recommendedNode}</p>
            <p>Total Requests: {systems?.rpc?.metrics?.totalRequests}</p>
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Monitoring */}
      <Card className="neon-border border-pink-500/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-pink-400">
            <Activity size={20} />
            WebSocket Monitor
          </CardTitle>
          <CardDescription>Real-time mempool & pool updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-muted-foreground text-sm">Mempool Txs</p>
              <p className="text-2xl font-bold text-pink-400">{systems?.websocket?.metrics?.mempoolTxCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Pool Updates</p>
              <p className="text-2xl font-bold text-pink-400">{systems?.websocket?.metrics?.poolUpdatesCount}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Msg Latency</p>
              <p className="text-2xl font-bold text-pink-400">
                {systems?.websocket?.metrics?.averageMessageLatency?.toFixed(1)}ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Latency Tracker */}
        <Card className="neon-border border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-purple-400 text-base">Latency Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Spans:</span>
                <span className="font-mono text-purple-400">{systems?.latency?.metrics?.activeSpans || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">p99 Latency:</span>
                <span className="font-mono text-purple-400">{systems?.latency?.metrics?.p99?.toFixed(0)}ms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MEV Analytics */}
        <Card className="neon-border border-orange-500/30">
          <CardHeader>
            <CardTitle className="text-orange-400 text-base">MEV Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Protected Txs:</span>
                <span className="font-mono text-orange-400">{systems?.mev?.metrics?.protectedTransactions || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Savings:</span>
                <span className="font-mono text-orange-400">
                  ${systems?.mev?.metrics?.averageSavings?.toFixed(2) || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Flash Loan Aggregator */}
        <Card className="neon-border border-green-500/30">
          <CardHeader>
            <CardTitle className="text-green-400 text-base">Flash Loan Aggregation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Available Providers:</span>
                <span className="font-mono text-green-400">{systems?.flashLoans?.metrics?.providersCount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Executed Loans:</span>
                <span className="font-mono text-green-400">{systems?.flashLoans?.metrics?.executedLoans || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gas Optimization */}
        <Card className="neon-border border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400 text-base">Gas Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Gas Saved:</span>
                <span className="font-mono text-blue-400">{systems?.gas?.metrics?.totalGasSaved || 0} Gwei</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Optimizations:</span>
                <span className="font-mono text-blue-400">{systems?.gas?.metrics?.optimizationCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Failover */}
        <Card className="neon-border border-red-500/30">
          <CardHeader>
            <CardTitle className="text-red-400 text-base">Security & Failover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Regions:</span>
                <span className="font-mono text-red-400">{systems?.security?.metrics?.activeRegions || 0}/3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failovers:</span>
                <span className="font-mono text-red-400">{systems?.security?.metrics?.failoverCount || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Mempool Activity */}
      {mempoolData.length > 0 && (
        <Card className="neon-border border-pink-500/30">
          <CardHeader>
            <CardTitle className="text-pink-400">Recent Mempool Activity</CardTitle>
            <CardDescription>{mempoolData.length} pending transactions detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mempoolData.slice(0, 5).map((tx, idx) => (
                <div key={idx} className="text-xs p-2 bg-card rounded border border-border/50">
                  <p className="font-mono text-cyan-400 truncate">{tx.txHash?.slice(0, 16)}...</p>
                  <p className="text-muted-foreground">
                    Gas: {tx.gasPrice} | Value: {tx.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
