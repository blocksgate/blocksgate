"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { AlertCircle, CheckCircle, AlertTriangle, Activity } from "lucide-react"

export function AdvancedSystemMonitor() {
  const [rpcMetrics, setRpcMetrics] = useState<any>(null)
  const [mevAnalysis, setMevAnalysis] = useState<any>(null)
  const [gasMetrics, setGasMetrics] = useState<any[]>([])
  const [latencyData, setLatencyData] = useState<any[]>([])
  const [failoverStatus, setFailoverStatus] = useState<any>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate data updates from backend services
      setGasMetrics((prev) => [
        ...prev.slice(-59),
        {
          time: new Date().toLocaleTimeString(),
          standard: 30 + Math.random() * 20,
          fast: 40 + Math.random() * 25,
          instant: 50 + Math.random() * 30,
        },
      ])

      setLatencyData((prev) => [
        ...prev.slice(-59),
        {
          time: new Date().toLocaleTimeString(),
          eventDetection: 80 + Math.random() * 40,
          txPrep: 150 + Math.random() * 100,
          txSubmission: 30 + Math.random() * 30,
          txConfirm: 800 + Math.random() * 400,
        },
      ])

      setMevAnalysis({
        highRiskCount: Math.floor(Math.random() * 10),
        mediumRiskCount: Math.floor(Math.random() * 20),
        protectionActive: true,
        estimatedSavings: (Math.random() * 50000).toFixed(2),
      })

      setFailoverStatus({
        activeRegion: "us-east-1",
        regions: [
          { name: "us-east-1", healthy: true, latency: 45 + Math.random() * 20 },
          { name: "eu-west-1", healthy: true, latency: 60 + Math.random() * 30 },
          { name: "ap-southeast-1", healthy: true, latency: 75 + Math.random() * 40 },
        ],
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* RPC Load Balancer Status */}
      <Card className="neon-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            RPC Load Balancer & Regional Failover
          </CardTitle>
          <CardDescription>Multi-endpoint routing with adaptive performance optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {failoverStatus?.regions.map((region: any) => (
              <div
                key={region.name}
                className={`p-4 rounded-lg border-2 transition-all ${region.healthy ? "neon-border-cyan" : "border-destructive"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{region.name}</span>
                  {region.healthy ? (
                    <CheckCircle className="w-4 h-4 text-primary" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Latency: {region.latency.toFixed(0)}ms</p>
                {failoverStatus?.activeRegion === region.name && (
                  <p className="text-xs text-primary mt-1">Active Region</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gas Optimization Monitor */}
      <Card className="neon-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-secondary" />
            Dynamic Gas Price Optimizer
          </CardTitle>
          <CardDescription>Real-time gas pricing with micro-batch optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gasMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #00f0ff",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="standard" stroke="#8000ff" strokeWidth={2} name="Standard" />
              <Line type="monotone" dataKey="fast" stroke="#00f0ff" strokeWidth={2} name="Fast" />
              <Line type="monotone" dataKey="instant" stroke="#ff006e" strokeWidth={2} name="Instant" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* End-to-End Latency Tracing */}
      <Card className="neon-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            APM: Latency Tracing & Performance Bottlenecks
          </CardTitle>
          <CardDescription>End-to-end transaction latency analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={latencyData}>
              <defs>
                <linearGradient id="colorDetection" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="time" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #00f0ff",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="eventDetection"
                stackId="1"
                stroke="#00f0ff"
                fill="url(#colorDetection)"
                name="Event Detection"
              />
              <Area
                type="monotone"
                dataKey="txPrep"
                stackId="1"
                stroke="#8000ff"
                fill="#8000ff"
                fillOpacity={0.2}
                name="TX Preparation"
              />
              <Area
                type="monotone"
                dataKey="txSubmission"
                stackId="1"
                stroke="#ff006e"
                fill="#ff006e"
                fillOpacity={0.2}
                name="TX Submission"
              />
              <Area
                type="monotone"
                dataKey="txConfirm"
                stackId="1"
                stroke="#00ff88"
                fill="#00ff88"
                fillOpacity={0.2}
                name="TX Confirmation"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* MEV Risk Analytics */}
      <Card className="neon-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-secondary" />
            Advanced MEV Risk Analytics & Protection
          </CardTitle>
          <CardDescription>Real-time MEV detection with automatic fallback strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg neon-border-pink">
              <p className="text-sm text-muted-foreground mb-1">High Risk Detected</p>
              <p className="text-2xl font-bold">{mevAnalysis?.highRiskCount || 0}</p>
              <p className="text-xs text-secondary mt-2">Transactions flagged</p>
            </div>
            <div className="p-4 rounded-lg neon-border-cyan">
              <p className="text-sm text-muted-foreground mb-1">Estimated Savings</p>
              <p className="text-2xl font-bold">${mevAnalysis?.estimatedSavings || "0.00"}</p>
              <p className="text-xs text-primary mt-2">Via protection strategies</p>
            </div>
            <div className="p-4 rounded-lg neon-border-purple">
              <p className="text-sm text-muted-foreground mb-1">Protection Status</p>
              <p className="text-lg font-bold text-accent">{mevAnalysis?.protectionActive ? "Active" : "Inactive"}</p>
              <p className="text-xs text-muted-foreground mt-2">Multi-strategy enabled</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flash Loan Aggregation */}
      <Card className="neon-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Flash Loan Aggregation & Atomic Execution</CardTitle>
          <CardDescription>Multi-provider liquidity aggregation with pre-warming optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "Aave Flash Loans", fee: "0.05%", status: "Optimal", savings: "+8%" },
              { name: "dYdX Flash Loans", fee: "0.02%", status: "Available", savings: "+12%" },
              { name: "Balancer Flash Loans", fee: "0.00%", status: "Available", savings: "+15%" },
            ].map((provider) => (
              <div
                key={provider.name}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
              >
                <div>
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-xs text-muted-foreground">Fee: {provider.fee}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">{provider.status}</p>
                  <p className="text-xs text-secondary">{provider.savings} vs standard</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WebSocket Monitoring */}
      <Card className="neon-border bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Real-Time Mempool & Pool Monitoring</CardTitle>
          <CardDescription>Sub-second event detection via WebSocket subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium mb-2">Mempool Transactions</p>
              <p className="text-3xl font-bold text-primary">{Math.floor(Math.random() * 500) + 100}</p>
              <p className="text-xs text-muted-foreground mt-2">Monitored in last 60s</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <p className="text-sm font-medium mb-2">Pool Updates</p>
              <p className="text-3xl font-bold text-secondary">{Math.floor(Math.random() * 1000) + 200}</p>
              <p className="text-xs text-muted-foreground mt-2">Detected events</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
