import { useState, useEffect, useCallback } from "react"
import { ArbitrageUpdate } from "@/lib/websocket/arbitrage-websocket"

export function useArbitrageWebSocket(chainId: number = 1, minProfitPercent: number = 0.1) {
  const [opportunities, setOpportunities] = useState<ArbitrageUpdate[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let eventSource: EventSource | null = null

    const connect = () => {
      try {
        // Use Server-Sent Events (SSE) for real-time updates
        const url = `/api/websocket/arbitrage?chainId=${chainId}&minProfitPercent=${minProfitPercent}`
        eventSource = new EventSource(url)

        eventSource.onopen = () => {
          setIsConnected(true)
          setError(null)
          console.log("[useArbitrageWebSocket] Connected")
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            if (data.type === "connected") {
              console.log("[useArbitrageWebSocket] SSE connection established")
            } else if (data.type === "arbitrage_opportunity") {
              const update: ArbitrageUpdate = {
                id: data.id,
                profitUSD: data.profitUSD,
                profitPercent: data.profitPercent,
                sellToken: data.sellToken,
                buyToken: data.buyToken,
                expiresIn: data.expiresIn,
                timestamp: data.timestamp || Date.now(),
              }

              // Update opportunities list (replace or add new)
              setOpportunities((prev) => {
                const existing = prev.findIndex((opp) => opp.id === update.id)
                if (existing >= 0) {
                  // Update existing
                  const updated = [...prev]
                  updated[existing] = update
                  return updated
                } else {
                  // Add new (keep only last 50)
                  return [update, ...prev].slice(0, 50)
                }
              })
            } else if (data.type === "error") {
              setError(data.message || "Unknown error")
            }
          } catch (err) {
            console.error("[useArbitrageWebSocket] Error parsing message:", err)
          }
        }

        eventSource.onerror = (err) => {
          console.error("[useArbitrageWebSocket] SSE error:", err)
          setError("Connection error")
          setIsConnected(false)
          // EventSource will automatically attempt to reconnect
        }
      } catch (err) {
        console.error("[useArbitrageWebSocket] Connection error:", err)
        setError(err instanceof Error ? err.message : "Failed to connect")
        setIsConnected(false)
      }
    }

    connect()

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close()
        eventSource = null
      }
      setIsConnected(false)
    }
  }, [chainId, minProfitPercent])

  const refresh = useCallback(() => {
    // Trigger a manual refresh by reconnecting
    setOpportunities([])
    setError(null)
  }, [])

  return {
    opportunities,
    isConnected,
    error,
    refresh,
  }
}

