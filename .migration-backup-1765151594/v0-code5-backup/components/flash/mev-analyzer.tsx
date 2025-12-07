"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { AlertTriangle, TrendingUp, Eye } from "lucide-react"
import { analyzeMEVRisks, generateBlockMEVData } from "@/lib/mev-analyzer"

const initialMevData = [
  { block: 19450001, sandwich: 2.5, frontrun: 1.2, backrun: 0.8 },
  { block: 19450002, sandwich: 1.8, frontrun: 2.1, backrun: 1.5 },
  { block: 19450003, sandwich: 3.2, frontrun: 0.9, backrun: 0.6 },
  { block: 19450004, sandwich: 2.1, frontrun: 1.8, backrun: 1.3 },
  { block: 19450005, sandwich: 2.9, frontrun: 1.5, backrun: 0.9 },
]

const mevRisksStatic = [
  { type: "Sandwich Attack", risk: "High", description: "Front/back running your transaction", impact: "-5-10%" },
  { type: "Liquidation Vulnerability", risk: "Medium", description: "Position can be liquidated", impact: "-15%" },
  { type: "Price Slippage", risk: "High", description: "Adverse price movement", impact: "-2-5%" },
  { type: "Failed Transaction", risk: "Low", description: "Revert due to slippage", impact: "Gas loss" },
]

export function MevAnalyzer() {
  const [mevData, setMevData] = useState(initialMevData)
  const [gasPrice, setGasPrice] = useState(50)
  const [slippage, setSlippage] = useState(0.5)
  const [tradeSize, setTradeSize] = useState("100000")
  const [detectedRisks, setDetectedRisks] = useState(analyzeMEVRisks(50, 0.5, "100000", "high"))

  const handleAnalyze = () => {
    const updatedRisks = analyzeMEVRisks(gasPrice, slippage, tradeSize, "high")
    setDetectedRisks(updatedRisks)
  }

  const handleRefreshData = () => {
    const newData = mevData.slice(1).concat(generateBlockMEVData(19450006))
    setMevData(newData)
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>MEV Analysis</CardTitle>
          <CardDescription>Analyze MEV (Maximal Extractable Value) risks and opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-500/10 border-red-500/30 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription>
              High MEV detected on the network. Consider using private pools or order flow auctions.
            </AlertDescription>
          </Alert>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mevData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="block" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="sandwich" stackId="a" fill="#8b5cf6" name="Sandwich" />
              <Bar dataKey="frontrun" stackId="a" fill="#ec4899" name="Front-run" />
              <Bar dataKey="backrun" stackId="a" fill="#f59e0b" name="Back-run" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
        <CardHeader>
          <CardTitle>Real-time Risk Assessment</CardTitle>
          <CardDescription>Analyze MEV risks for your specific transaction parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Gas Price (Gwei)</label>
              <input
                type="number"
                value={gasPrice}
                onChange={(e) => setGasPrice(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slippage Tolerance (%)</label>
              <input
                type="number"
                step="0.1"
                value={slippage}
                onChange={(e) => setSlippage(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Trade Size ($)</label>
              <input
                type="number"
                value={tradeSize}
                onChange={(e) => setTradeSize(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
              />
            </div>
          </div>
          <Button onClick={handleAnalyze} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Eye className="w-4 h-4 mr-2" />
            Analyze MEV Risks
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>MEV Detection</CardTitle>
              <CardDescription>Real-time MEV extraction tracking</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              className="border-white/10 text-white bg-transparent"
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mevData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="block" stroke="#666" tick={{ fontSize: 11 }} />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }} />
              <Legend />
              <Bar dataKey="sandwich" stackId="a" fill="#8b5cf6" name="Sandwich" />
              <Bar dataKey="frontrun" stackId="a" fill="#ec4899" name="Front-run" />
              <Bar dataKey="backrun" stackId="a" fill="#f59e0b" name="Back-run" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Detected Risks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {detectedRisks.length > 0 ? (
              detectedRisks.map((risk, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{risk.type}</span>
                      <Badge
                        className={`text-xs ${
                          risk.riskLevel === "high"
                            ? "bg-red-500/20 text-red-300 border-red-500/30"
                            : risk.riskLevel === "medium"
                              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                              : "bg-green-500/20 text-green-300 border-green-500/30"
                        }`}
                      >
                        {risk.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{risk.description}</p>
                    <p className="text-xs font-medium text-cyan-300">Impact: {risk.potentialImpact}</p>
                    <div className="mt-2 space-y-1">
                      {risk.mitigation.map((m, midx) => (
                        <div key={midx} className="text-xs text-gray-500">
                          • {m}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Alert className="bg-green-500/10 border-green-500/30">
                <AlertDescription>No critical MEV risks detected for current parameters.</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">MEV Risk Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mevRisksStatic.map((risk, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-card/50 border border-border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{risk.type}</span>
                    <Badge
                      className={`text-xs ${
                        risk.risk === "High"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : risk.risk === "Medium"
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                            : "bg-green-500/10 text-green-400 border-green-500/20"
                      }`}
                    >
                      {risk.risk}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{risk.description}</p>
                  <p className="text-xs text-accent font-medium">Potential Impact: {risk.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base">MEV Mitigation Strategies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="font-medium text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Use Private Pool Relayers
            </div>
            <p className="text-xs text-muted-foreground">Route through MEV-resistant pools</p>
          </div>
          <div className="space-y-2 p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <div className="font-medium text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Order Flow Auctions
            </div>
            <p className="text-xs text-muted-foreground">Sell order flow to sophisticated traders</p>
          </div>
          <div className="space-y-2 p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
            <div className="font-medium text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              Increase Slippage Tolerance
            </div>
            <p className="text-xs text-muted-foreground">Allow more price movement for certainty</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
