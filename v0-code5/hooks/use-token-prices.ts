"use client"

import { useEffect, useState } from "react"

export interface TokenPrices {
  [key: string]: number
}

export function useTokenPrices(tokenIds: string[] | undefined) {
  const [prices, setPrices] = useState<TokenPrices>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenIds || tokenIds.length === 0) return

    async function fetchPrices() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        tokenIds.forEach((id) => params.append("tokens", id))
        const response = await fetch(`/api/prices?${params}`)
        if (!response.ok) throw new Error("Failed to fetch prices")
        const { prices: fetchedPrices } = await response.json()
        setPrices(fetchedPrices)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error fetching prices")
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()

    // Poll for updates every 15 seconds
    const interval = setInterval(fetchPrices, 15000)
    return () => clearInterval(interval)
  }, [tokenIds])

  return { prices, loading, error }
}
