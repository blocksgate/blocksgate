'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/layout'
import { LimitOrder } from '@/components/swap/limit-order'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getUserLimitOrders, cancelLimitOrder, executeLimitOrder } from '@/app/actions/limit-orders'

export default function LimitOrdersPage() {
  const userAddress = '0x70a9f34f9b34c64957b9c401a97bfed35b95049e'
  const chainId = 1
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState<string | null>(null)

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        // For now, using mock userId. In production, get from auth context
        const mockUserId = userAddress || 'mock-user'
        const result = await getUserLimitOrders(mockUserId)
        if (result.success) {
          setOrders(result.orders || [])
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const handleExecute = async (orderId: string) => {
    setExecuting(orderId)
    try {
      const result = await executeLimitOrder(orderId)
      if (result.success) {
        // Refresh orders
        const refreshResult = await getUserLimitOrders(userAddress)
        if (refreshResult.success) {
          setOrders(refreshResult.orders || [])
        }
      } else {
        alert(`Execution failed: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setExecuting(null)
    }
  }

  const handleCancel = async (orderId: string) => {
    setCancelling(orderId)
    try {
      const result = await cancelLimitOrder(orderId, userAddress)
      if (result.success) {
        // Refresh orders
        const refreshResult = await getUserLimitOrders(userAddress)
        if (refreshResult.success) {
          setOrders(refreshResult.orders || [])
        }
      } else {
        alert(`Cancellation failed: ${result.error}`)
      }
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCancelling(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Limit Orders</h1>
          <p className="text-muted-foreground mt-2">
            Set buy and sell orders at specific price points and let them execute automatically
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <LimitOrder userAddress={userAddress} chainId={chainId} />

          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
              <CardHeader>
                <CardTitle>How Limit Orders Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400 font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Set Your Price</p>
                    <p className="text-xs text-gray-400">Specify the price at which you want to trade</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0 text-pink-400 font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Automatic Execution</p>
                    <p className="text-xs text-gray-400">Order executes when market price reaches your limit</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 text-cyan-400 font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Portfolio Update</p>
                    <p className="text-xs text-gray-400">Tokens instantly appear in your wallet</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
          <CardHeader>
            <CardTitle>Active Orders</CardTitle>
            <CardDescription>Your pending and active limit orders</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No active orders</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Pair</TableHead>
                    <TableHead>Limit Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-white/10">
                      <TableCell className="font-medium">
                        {order.base_token}/{order.quote_token}
                      </TableCell>
                      <TableCell>${order.limit_price?.toFixed(2)}</TableCell>
                      <TableCell>{order.amount} {order.base_token}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === 'filled'
                              ? 'default'
                              : order.status === 'cancelled'
                                ? 'secondary'
                                : order.status === 'failed'
                                  ? 'destructive'
                                  : 'outline'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400">{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExecute(order.id)}
                              disabled={executing === order.id}
                            >
                              {executing === order.id ? 'Executing...' : 'Execute'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancel(order.id)}
                              disabled={cancelling === order.id}
                            >
                              {cancelling === order.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
