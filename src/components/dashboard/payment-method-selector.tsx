"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Banknote, CreditCard, Wallet, Check } from "lucide-react"

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  processingTime: string
  isRecommended?: boolean
  fees?: string
  limits?: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: "bank",
    name: "Bank Transfer",
    description: "Direct transfer from your bank account",
    icon: <Banknote className="w-6 h-6" />,
    processingTime: "1-3 business days",
    isRecommended: true,
    fees: "0.5%",
    limits: "$50,000 per day",
  },
  {
    id: "card",
    name: "Bank Card (Visa)",
    description: "Pay with your credit or debit card",
    icon: <CreditCard className="w-6 h-6" />,
    processingTime: "Instant",
    fees: "2.9%",
    limits: "$5,000 per day",
  },
  {
    id: "crypto",
    name: "Advcash Account Balance",
    description: "Transfer from your Advcash wallet",
    icon: <Wallet className="w-6 h-6" />,
    processingTime: "Instant",
    fees: "0%",
    limits: "Unlimited",
  },
]

interface PaymentMethodSelectorProps {
  onSelect?: (method: string) => void
}

export function PaymentMethodSelector({ onSelect }: PaymentMethodSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState("bank")

  const handleSelect = (id: string) => {
    setSelectedMethod(id)
    onSelect?.(id)
  }

  return (
    <Card className="col-span-full bg-gradient-to-br from-white/5 to-white/0 border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Select currency and payment method</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Currency</label>
              <select className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white outline-none cursor-pointer hover:border-white/20 transition-colors">
                <option className="bg-black text-white">BTC</option>
                <option className="bg-black text-white">ETH</option>
                <option className="bg-black text-white">USDC</option>
                <option className="bg-black text-white">DAI</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Amount</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 text-white outline-none placeholder-gray-500 hover:border-white/20 transition-colors focus:border-cyan-500/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-3 block">Recommended</label>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handleSelect(method.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedMethod === method.id
                      ? "bg-cyan-500/20 border-cyan-500/50"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedMethod === method.id
                          ? "bg-cyan-500/30 text-cyan-300"
                          : "bg-white/10 text-gray-400"
                      }`}>
                        {method.icon}
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-semibold">{method.name}</p>
                          {method.isRecommended && (
                            <Badge className="bg-cyan-500/20 text-cyan-300 text-xs">
                              RECOMMENDED
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{method.description}</p>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-gray-500">
                            ⏱️ {method.processingTime}
                          </span>
                          {method.fees && (
                            <span className="text-gray-500">
                              💰 {method.fees}
                            </span>
                          )}
                          {method.limits && (
                            <span className="text-gray-500">
                              📊 {method.limits}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedMethod === method.id
                        ? "bg-cyan-500 border-cyan-500"
                        : "border-gray-400"
                    }`}>
                      {selectedMethod === method.id && (
                        <Check className="w-3 h-3 text-black" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs mb-1">Min Amount</p>
              <p className="text-white font-semibold">$50</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs mb-1">Max Amount</p>
              <p className="text-white font-semibold">$50,000</p>
            </div>
          </div>

          <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold border-0 h-12 mt-4">
            SWAP
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
