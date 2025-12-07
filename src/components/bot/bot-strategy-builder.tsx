"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, Pause, TrendingUp } from "lucide-react"

interface Strategy {
  id: string
  name: string
  type: "dca" | "grid" | "momentum" | "mean-reversion"
  status: "running" | "paused" | "stopped"
  profit: number
  tradesExecuted: number
}

export function BotStrategyBuilder() {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: "1",
      name: "ETH DCA Strategy",
      type: "dca",
      status: "running",
      profit: 1250.5,
      tradesExecuted: 45,
    },
    {
      id: "2",
      name: "BTC Grid Trading",
      type: "grid",
      status: "running",
      profit: 2840.75,
      tradesExecuted: 128,
    },
    {
      id: "3",
      name: "Momentum Trader",
      type: "momentum",
      status: "paused",
      profit: 845.25,
      tradesExecuted: 32,
    },
  ])

  const toggleStrategy = (id: string, newStatus: "running" | "paused") => {
    setStrategies(strategies.map((s) => (s.id === id ? { ...s, status: newStatus } : s)))
  }

  const getStrategyColor = (type: Strategy["type"]) => {
    switch (type) {
      case "dca":
        return "bg-primary/10 text-primary border-primary/20"
      case "grid":
        return "bg-accent/10 text-accent border-accent/20"
      case "momentum":
        return "bg-secondary/10 text-secondary border-secondary/20"
      case "mean-reversion":
        return "bg-green-500/10 text-green-400 border-green-500/20"
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Active Strategies</CardTitle>
          <CardDescription>Manage and monitor your automated trading strategies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {strategies.map((strategy) => (
            <div
              key={strategy.id}
              className="flex items-center justify-between p-4 bg-card/50 border border-border rounded-lg hover:border-primary/50 transition"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{strategy.name}</h3>
                  <Badge className={`text-xs ${getStrategyColor(strategy.type)}`}>{strategy.type.toUpperCase()}</Badge>
                  <Badge
                    className={`text-xs ${
                      strategy.status === "running"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }`}
                  >
                    {strategy.status}
                  </Badge>
                </div>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Profit: </span>
                    <span className="font-medium text-green-400">${strategy.profit.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trades: </span>
                    <span className="font-medium">{strategy.tradesExecuted}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {strategy.status === "running" ? (
                  <Button size="sm" variant="outline" onClick={() => toggleStrategy(strategy.id, "paused")}>
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggleStrategy(strategy.id, "running")}>
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Create New Strategy</CardTitle>
          <CardDescription>Build and deploy a custom trading bot</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="template" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="template">Templates</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4 mt-4">
              <Alert className="bg-primary/10 border-primary/30">
                <AlertDescription>Choose a template to quickly set up a trading strategy</AlertDescription>
              </Alert>

              {["DCA Strategy", "Grid Trading", "Momentum Trading", "Mean Reversion"].map((template) => (
                <Button
                  key={template}
                  variant="outline"
                  className="w-full h-auto justify-between p-4 hover:border-primary bg-transparent"
                >
                  <div className="text-left">
                    <div className="font-medium">{template}</div>
                    <div className="text-xs text-muted-foreground mt-1">Click to configure and deploy</div>
                  </div>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </Button>
              ))}
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Strategy Name</label>
                <Input placeholder="My Custom Strategy" className="bg-input border-border" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Trading Pair</label>
                <select className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm">
                  <option>ETH/USDC</option>
                  <option>BTC/USDC</option>
                  <option>SOL/USDC</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Investment Amount ($)</label>
                <Input type="number" placeholder="1000" className="bg-input border-border" />
              </div>

              <Button className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                Create Strategy
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
