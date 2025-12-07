"use client"
import { DashboardLayout } from "@/components/dashboard/layout"
import { GaslessSwap } from "@/components/swap/gasless-swap"
import { LimitOrder } from "@/components/swap/limit-order"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function AdvancedSwapsPage() {
  const userAddress = "0x70a9f34f9b34c64957b9c401a97bfed35b95049e" // Demo address
  const chainId = 1

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Advanced Swaps</h1>
          <p className="text-muted-foreground mt-2">
            Execute sophisticated trading strategies with gasless swaps and limit orders
          </p>
        </div>

        <Tabs defaultValue="gasless" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="gasless">Gasless Swaps</TabsTrigger>
            <TabsTrigger value="limit">Limit Orders</TabsTrigger>
            <TabsTrigger value="twap">TWAP Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="gasless" className="space-y-4 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <GaslessSwap userAddress={userAddress} chainId={chainId} />
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Gasless Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Zero Gas Fees</p>
                      <p className="text-xs text-muted-foreground">No ETH needed for transaction costs</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Meta-Transactions</p>
                      <p className="text-xs text-muted-foreground">Sign with your wallet, we pay gas</p>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Instant Settlement</p>
                      <p className="text-xs text-muted-foreground">Fast execution on-chain</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="limit" className="space-y-4 mt-6">
            <LimitOrder userAddress={userAddress} chainId={chainId} />
          </TabsContent>

          <TabsContent value="twap" className="space-y-4 mt-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>TWAP Orders</CardTitle>
                <CardDescription>Time-Weighted Average Price strategy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Badge variant="secondary" className="mb-4">
                    Coming Soon
                  </Badge>
                  <p>TWAP orders will allow splitting large trades over time to minimize slippage</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
