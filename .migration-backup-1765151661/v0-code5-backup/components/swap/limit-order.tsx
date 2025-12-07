"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, X, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useWallet } from "@/lib/wallet-context"

interface LimitOrder {
  id: string
  token_in: string
  token_out: string
  amount_in: string
  min_amount_out: string
  price_target: number
  status: "pending" | "filled" | "cancelled" | "expired"
  order_type: string
  expires_at: string | null
  created_at: string
  filled_at: string | null
}

interface LimitOrderProps {
  userAddress?: string
  chainId?: number
}

export function LimitOrder({ userAddress, chainId = 1 }: LimitOrderProps) {
  const { connected, address } = useWallet()
  const [sellToken, setSellToken] = useState("ETH")
  const [buyToken, setBuyToken] = useState("USDC")
  const [sellAmount, setSellAmount] = useState("")
  const [limitPrice, setLimitPrice] = useState("")
  const [expiry, setExpiry] = useState("1d")
  const [orders, setOrders] = useState<LimitOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Fetch active orders
  const fetchOrders = async () => {
    if (!connected) {
      setOrdersLoading(false)
      setOrders([])
      return
    }

    try {
      setOrdersLoading(true)
      // Use the API client for consistency
      const response = await fetch("/api/orders?status=pending", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        // For 401, user might be wallet-only - that's okay, just return empty
        if (response.status === 401) {
          console.log("[LimitOrder] Not authenticated - wallet-only mode")
          setOrders([])
          return
        }
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error("[LimitOrder] Error fetching orders:", error)
      // Don't show error toast for wallet-only users - empty state is expected
      if (error instanceof Error && !error.message.includes("401")) {
        toast.error("Failed to load orders")
      }
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    
    // Refresh orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [connected])

  const handleCreateOrder = async () => {
    if (!connected || !address) {
      toast.error("Please connect your wallet")
      return
    }

    if (!sellAmount || !limitPrice) {
      toast.error("Please fill in all fields")
      return
    }

    setLoading(true)

    try {
      // Calculate expiry time
      const expiryHours: Record<string, number> = {
        "1h": 1,
        "1d": 24,
        "7d": 168,
        "30d": 720,
      }

      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + (expiryHours[expiry] || 24))

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token_in: sellToken === "ETH" ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" : sellToken,
          token_out: buyToken === "USDC" ? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" : buyToken,
          amount_in: sellAmount,
          min_amount_out: (Number.parseFloat(sellAmount) * Number.parseFloat(limitPrice)).toString(),
          price_target: Number.parseFloat(limitPrice),
          order_type: "limit",
          chain_id: chainId,
          expires_at: expiresAt.toISOString(),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create order")
      }

      const order = await response.json()
      toast.success("Limit order created!", {
        description: `Order will execute when price reaches ${limitPrice}`,
      })

      // Reset form
      setSellAmount("")
      setLimitPrice("")

      // Refresh orders
      await fetchOrders()
    } catch (error: any) {
      console.error("[LimitOrder] Error creating order:", error)
      toast.error("Failed to create order", {
        description: error?.message || "An error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to cancel order")
      }

      toast.success("Order cancelled")
      await fetchOrders()
    } catch (error: any) {
      console.error("[LimitOrder] Error cancelling order:", error)
      toast.error("Failed to cancel order", {
        description: error?.message || "An error occurred",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>
      case "filled":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Filled</Badge>
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>
      case "expired":
        return <Badge variant="outline">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleString()
  }

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-accent" />
            <div>
              <CardTitle>Limit Orders</CardTitle>
              <CardDescription>Set price targets for automatic execution</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOrders}
            disabled={ordersLoading}
          >
            <RefreshCw className={`h-4 w-4 ${ordersLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="create">Create Order</TabsTrigger>
            <TabsTrigger value="active">Active Orders ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4 mt-4">
            {!connected ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Please connect your wallet to create limit orders</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sell Amount ({sellToken})</label>
                  <Input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Limit Price ({buyToken} per {sellToken})</label>
                  <Input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="Enter limit price"
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="expiry-select" className="text-sm font-medium">Expiry</label>
                  <select
                    id="expiry-select"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm"
                    aria-label="Order expiry time"
                  >
                    <option value="1h">1 Hour</option>
                    <option value="1d">1 Day</option>
                    <option value="7d">7 Days</option>
                    <option value="30d">30 Days</option>
                  </select>
                </div>

                <div className="bg-card/50 border border-border rounded-lg p-3">
                  <div className="text-sm text-muted-foreground">You will receive</div>
                  <div className="text-lg font-semibold">
                    {sellAmount && limitPrice
                      ? (Number.parseFloat(sellAmount) * Number.parseFloat(limitPrice)).toFixed(2)
                      : "0.00"}{" "}
                    {buyToken}
                  </div>
                </div>

                <Button
                  onClick={handleCreateOrder}
                  disabled={loading || !sellAmount || !limitPrice}
                  className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  {loading ? "Creating..." : "Create Limit Order"}
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3 mt-4">
            {ordersLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active orders</p>
                <p className="text-sm mt-2">Create a limit order to get started</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-card/50 border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm text-muted-foreground">
                        Sell {order.amount_in} {order.token_in}
                      </div>
                      <div className="font-medium">
                        Buy {order.min_amount_out} {order.token_out}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                      {order.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span>Limit Price: </span>
                      <span className="text-foreground font-medium">{order.price_target}</span>
                    </div>
                    <div>
                      <span>Expires: </span>
                      <span className="text-foreground">{formatDate(order.expires_at)}</span>
                    </div>
                  </div>
                  {order.filled_at && (
                    <div className="text-xs text-muted-foreground">
                      Filled at: {formatDate(order.filled_at)}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
