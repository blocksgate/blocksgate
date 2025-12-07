"use client"

import { useState, useEffect } from "react"
import { monitoring } from "@/lib/monitoring"
import type { SystemMetric, SystemAlert } from "@/lib/types/monitoring"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert as AlertComponent } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([])
  const [currentMetrics, setCurrentMetrics] = useState<SystemMetric>()
  const [alerts, setAlerts] = useState<SystemAlert[]>([])
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("1h")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [metricsData, alertsData] = await Promise.all([
          monitoring.getMetrics(timeRange),
          monitoring.getAlerts(timeRange),
        ])
        setMetrics(metricsData)
        setAlerts(alertsData)
        setCurrentMetrics(monitoring.getCurrentMetrics())
      } catch (error) {
        console.error("Failed to load monitoring data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [timeRange])

  if (loading) {
    return <div className="flex justify-center p-8">Loading dashboard data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">System Monitor</h1>
        <Select value={timeRange} onValueChange={(value: "1h" | "24h" | "7d") => setTimeRange(value)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {currentMetrics && (
          <>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">CPU Usage</h3>
              <p className="text-2xl font-bold">{currentMetrics.cpu_usage.toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Memory Usage</h3>
              <p className="text-2xl font-bold">{currentMetrics.memory_usage.toFixed(1)}%</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Active Users</h3>
              <p className="text-2xl font-bold">{currentMetrics.active_users}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Error Rate</h3>
              <p className="text-2xl font-bold">{currentMetrics.error_rate.toFixed(2)}%</p>
            </Card>
          </>
        )}
      </div>

      {/* Metrics Charts */}
      <Tabs defaultValue="system" className="w-full">
        <TabsList>
          <TabsTrigger value="system">System Metrics</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="system" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">CPU & Memory Usage</h3>
            <LineChart
              data={metrics}
              width={800}
              height={300}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              />
              <Line type="monotone" dataKey="cpu_usage" stroke="#8884d8" name="CPU" />
              <Line type="monotone" dataKey="memory_usage" stroke="#82ca9d" name="Memory" />
            </LineChart>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Response Time & Requests</h3>
            <LineChart
              data={metrics}
              width={800}
              height={300}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              />
              <Line
                type="monotone"
                dataKey="average_response_time"
                stroke="#8884d8"
                name="Response Time"
              />
              <Line
                type="monotone"
                dataKey="requests_per_minute"
                stroke="#82ca9d"
                name="Requests/min"
              />
            </LineChart>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertComponent
                key={`${alert.timestamp}-${alert.message}`}
                variant={alert.type === "error" ? "destructive" : "default"}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{alert.message}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {alert.details && (
                    <pre className="text-sm bg-muted p-2 rounded">
                      {JSON.stringify(alert.details, null, 2)}
                    </pre>
                  )}
                </div>
              </AlertComponent>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}