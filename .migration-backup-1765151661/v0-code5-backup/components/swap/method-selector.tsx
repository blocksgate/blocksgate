"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface MethodSelectorProps {
  selectedMethod: "permit2" | "allowance-holder" | "gasless"
  onMethodChange: (method: "permit2" | "allowance-holder" | "gasless") => void
  permit2Advantage?: string
  allowanceHolderAdvantage?: string
}

export function MethodSelector({
  selectedMethod,
  onMethodChange,
  permit2Advantage,
  allowanceHolderAdvantage,
}: MethodSelectorProps) {
  return (
    <Card className="bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle className="text-lg">Swap Method</CardTitle>
        <CardDescription>Choose your preferred swap execution method</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMethod} onValueChange={(v) => onMethodChange(v as any)}>
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger
              value="permit2"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500"
            >
              Permit2
            </TabsTrigger>
            <TabsTrigger
              value="allowance-holder"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500"
            >
              AllowanceHolder
            </TabsTrigger>
            <TabsTrigger
              value="gasless"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-500"
            >
              Gasless
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permit2" className="mt-4 space-y-3">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Permit2 Standard</h4>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">Recommended</Badge>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Gas-efficient signature-based approval. No need for separate approval transactions.
              </p>
              {permit2Advantage && (
                <div className="text-xs bg-green-500/10 border border-green-500/30 rounded px-2 py-1 text-green-300">
                  {permit2Advantage}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="allowance-holder" className="mt-4 space-y-3">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">AllowanceHolder</h4>
                <Badge className="bg-gradient-to-r from-orange-500 to-pink-500">Alternative</Badge>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Traditional allowance-based swap method. Compatible with all tokens.
              </p>
              {allowanceHolderAdvantage && (
                <div className="text-xs bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1 text-blue-300">
                  {allowanceHolderAdvantage}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="gasless" className="mt-4 space-y-3">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">Gasless Swap</h4>
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500">Zero Gas</Badge>
              </div>
              <p className="text-sm text-gray-400">
                Pay zero gas fees using meta-transactions. Requires special token support.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
