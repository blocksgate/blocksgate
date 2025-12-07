"use client"

import { useEffect, useState } from "react"

export interface TokenPrice {
  symbol: string
  name: string
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
}

export function useTokenPrice(tokenId: string | undefined) {
  const [data, setData] = useState<TokenPrice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenId) return

    async function fetchPrice() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/prices/${tokenId}`)
        if (!response.ok) throw new Error("Failed to fetch price")
        const tokenData = await response.json()
        setData(tokenData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching price")
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchPrice, 10000)
    return () => clearInterval(interval)
  }, [tokenId])

  return { data, loading, error }
}
