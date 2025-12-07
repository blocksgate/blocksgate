"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { TrendingUp, DollarSign, BarChart3 } from "lucide-react"

interface PerformanceData {
  date: string
  value: number
  pnl: number
  trades: number
}

interface AllocationData {
  token: string
  value: number
  percentage: number
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export function PerformanceCharts() {
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [allocationData, setAllocationData] = useState<AllocationData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")

  useEffect(() => {
    fetchPerformanceData()
  }, [timeRange])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/portfolio?period=${timeRange}`, {
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to fetch performance data")
      }

      const data = await response.json()

      // Transform performance data
      if (data.performance && Array.isArray(data.performance)) {
        setPerformanceData(
          data.performance.map((item: any) => ({
            date: new Date(item.date).toLocaleDateString(),
            value: item.value || 0,
            pnl: item.pnl || 0,
            trades: item.trades || 0,
          }))
        )
      }

      // Transform allocation data
      if (data.asset_allocation) {
        const allocation = Object.entries(data.asset_allocation).map(([token, value]: [string, any]) => ({
          token,
          value: Number(value) || 0,
          percentage: 0, // Will calculate
        }))

        const total = allocation.reduce((sum, item) => sum + item.value, 0)
        const allocationWithPercentage = allocation.map((item) => ({
          ...item,
          percentage: total > 0 ? (item.value / total) * 100 : 0,
        }))

        setAllocationData(allocationWithPercentage)
      }
    } catch (error) {
      console.error("[PerformanceCharts] Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle>Portfolio Value</CardTitle>
                </div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as "7d" | "30d" | "90d" | "1y")}
                  className="text-sm bg-background border border-border rounded px-2 py-1"
                  aria-label="Select time range for performance data"
                >
                  <option value="7d">7 Days</option>
                  <option value="30d">30 Days</option>
                  <option value="90d">90 Days</option>
                  <option value="1y">1 Year</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <CardTitle>Profit & Loss</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pnl" fill="#00C49F" name="P&L" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>No P&L data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                <CardTitle>Asset Allocation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {allocationData.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={allocationData.map((item) => ({
                          name: item.token,
                          value: item.value,
                          percentage: item.percentage,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${entry.percentage?.toFixed(1) || 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {allocationData.map((item, index) => {
                      const color = COLORS[index % COLORS.length]
                      return (
                        <div key={item.token} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: color }}
                              aria-label={`${item.token} allocation color`}
                            />
                            <span className="text-sm font-medium">{item.token}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">${item.value.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>No allocation data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trades" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trade Volume</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="trades" fill="#8884d8" name="Trades" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>No trade data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

