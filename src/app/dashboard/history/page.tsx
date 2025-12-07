"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download } from "lucide-react"
import { getTrades } from "@/lib/api-client"

interface Trade {
  id: string
  token_in: string
  token_out: string
  amount_in: string
  amount_out: string
  price_at_time: string
  status: "pending" | "completed" | "failed"
  trade_type: string
  profit_loss: string | null
  created_at: string
  executed_at: string | null
  mev_protected: boolean
}

export default function HistoryPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | undefined>("all")
  const [typeFilter, setTypeFilter] = useState<string | undefined>("all")

  useEffect(() => {
    loadTrades()
  }, [statusFilter, typeFilter])

  async function loadTrades() {
    setLoading(true)
    try {
      const data = await getTrades(100, 0, statusFilter)
      let filtered = data.trades || []
      if (typeFilter !== "all") {
        filtered = filtered.filter((t: Trade) => t.trade_type === typeFilter)
      }
      setTrades(filtered)
    } catch (error) {
      console.error("Failed to load trades:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const exportTrades = () => {
    const csv = [
      ["Date", "Token In", "Amount In", "Token Out", "Amount Out", "Price", "Status", "P&L"],
      ...trades.map((t) => [
        formatDate(t.created_at),
        t.token_in,
        t.amount_in,
        t.token_out,
        t.amount_out,
        t.price_at_time,
        t.status,
        t.profit_loss || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `trades-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Trade History</h1>
        <p className="text-muted-foreground">View and manage your complete trading history</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Trades</CardTitle>
            <Button onClick={exportTrades} variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex gap-4 mb-6">
            <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v || "all")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v || "all")}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="swap">Swap</SelectItem>
                <SelectItem value="limit">Limit Order</SelectItem>
                <SelectItem value="arbitrage">Arbitrage</SelectItem>
                <SelectItem value="flash">Flash Swap</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">P&L</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading trades...
                    </TableCell>
                  </TableRow>
                ) : trades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No trades found
                    </TableCell>
                  </TableRow>
                ) : (
                  trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell className="text-sm">{formatDate(trade.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {trade.trade_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{trade.token_in}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{trade.token_out}</span>
                          {trade.mev_protected && (
                            <Badge variant="secondary" className="text-xs">
                              MEV Protected
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {Number.parseFloat(trade.amount_in).toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${Number.parseFloat(trade.price_at_time).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {trade.profit_loss ? (
                          <span
                            className={Number.parseFloat(trade.profit_loss) > 0 ? "text-green-600" : "text-red-600"}
                          >
                            ${Number.parseFloat(trade.profit_loss).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(trade.status)}>{trade.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
