"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getTrades } from "@/lib/api-client"

interface Trade {
  id: string
  token_in: string
  token_out: string
  status: string
  profit_loss: string | null
  created_at: string
}

export function RecentTrades() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrades()
  }, [])

  async function loadTrades() {
    try {
      const data = await getTrades(5)
      setTrades(data.trades || [])
    } catch (error) {
      console.error("Failed to load trades:", error)
      // Set empty array on error to prevent UI crash
      setTrades([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : trades.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trades yet</p>
        ) : (
          <div className="space-y-3">
            {trades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {trade.token_in} → {trade.token_out}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(trade.created_at)}</p>
                </div>
                <div className="text-right">
                  {trade.profit_loss && (
                    <p
                      className={`text-sm font-semibold ${Number.parseFloat(trade.profit_loss) > 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      ${Math.abs(Number.parseFloat(trade.profit_loss)).toFixed(2)}
                    </p>
                  )}
                  <Badge
                    variant={
                      trade.status === "completed"
                        ? "default"
                        : trade.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="text-xs"
                  >
                    {trade.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
