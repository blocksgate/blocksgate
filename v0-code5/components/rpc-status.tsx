"use client"

import { useEffect, useState } from "react"
import { checkRpcHealth } from "@/app/actions/rpc"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function RpcStatus() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStatus() {
      try {
        setLoading(true)
        const result = await checkRpcHealth()
        setStatus(result)
      } catch (error) {
        console.error("Error fetching RPC status:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading RPC status...</div>
  }

  if (!status?.success) {
    return (
      <Card className="p-4 bg-red-950/20 border-red-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-red-400">RPC Provider Error</h3>
            <p className="text-sm text-red-300">{status?.error}</p>
          </div>
          <Badge variant="destructive">Offline</Badge>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-emerald-950/20 border-emerald-800">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-emerald-400">RPC Provider Health</h3>
          <Badge variant="outline" className="bg-emerald-950 text-emerald-300">
            Active
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Active Provider</p>
            <p className="font-mono text-lg">{status.health?.active?.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Healthy Providers</p>
            <p className="font-mono text-lg">
              {status.health?.healthy}/{status.health?.total}
            </p>
          </div>
        </div>
        {status.health?.failed?.length > 0 && (
          <div className="text-xs text-yellow-300">
            <p className="font-semibold">Failed providers: {status.health.failed.join(", ")}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
