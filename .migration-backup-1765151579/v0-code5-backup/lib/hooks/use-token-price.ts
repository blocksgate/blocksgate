/**
 * Hook for fetching real-time token prices
 */

import { useState, useEffect } from "react"

interface TokenPrice {
  usd: number
  usd_24h_change: number
  last_updated: number
}

const PRICE_CACHE = new Map<string, { price: TokenPrice; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

export function useTokenPrice(tokenId: string) {
  const [price, setPrice] = useState<number | null>(null)
  const [change24h, setChange24h] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check cache first
        const cached = PRICE_CACHE.get(tokenId)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          setPrice(cached.price.usd)
          setChange24h(cached.price.usd_24h_change)
          setLoading(false)
          return
        }

        // Fetch from API
        const response = await fetch(`/api/prices?token_id=${tokenId}`)
        
        let priceData: TokenPrice
        if (!response.ok) {
          console.warn(`Failed to fetch price for ${tokenId}, using fallback`)
          // Use fallback data instead of throwing
          priceData = {
            usd: 0,
            usd_24h_change: 0,
            last_updated: Date.now(),
          }
        } else {
          const data = await response.json()
          priceData = {
            usd: data.price || 0,
            usd_24h_change: data.change_24h || 0,
            last_updated: Date.now(),
          }
        }

        // Update cache
        PRICE_CACHE.set(tokenId, { price: priceData, timestamp: Date.now() })

        setPrice(priceData.usd)
        setChange24h(priceData.usd_24h_change)
      } catch (err) {
        console.error(`[useTokenPrice] Error fetching ${tokenId}:`, err)
        setError(err instanceof Error ? err.message : "Failed to fetch price")
      } finally {
        setLoading(false)
      }
    }

    fetchPrice()

    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, 30000)
    return () => clearInterval(interval)
  }, [tokenId])

  return { price, change24h, loading, error }
}

export function useMultipleTokenPrices(tokenIds: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true)

        const pricePromises = tokenIds.map(async (tokenId) => {
          // Check cache
          const cached = PRICE_CACHE.get(tokenId)
          if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return { tokenId, price: cached.price.usd }
          }

          // Fetch from API
          try {
            const response = await fetch(`/api/prices?token_id=${tokenId}`)
            const data = await response.json()
            const price = data.price || 0

            // Update cache
            PRICE_CACHE.set(tokenId, {
              price: { usd: price, usd_24h_change: 0, last_updated: Date.now() },
              timestamp: Date.now(),
            })

            return { tokenId, price }
          } catch (error) {
            console.error(`Error fetching ${tokenId}:`, error)
            return { tokenId, price: 0 }
          }
        })

        const results = await Promise.all(pricePromises)
        const priceMap = results.reduce(
          (acc, { tokenId, price }) => {
            acc[tokenId] = price
            return acc
          },
          {} as Record<string, number>
        )

        setPrices(priceMap)
      } catch (error) {
        console.error("[useMultipleTokenPrices] Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()

    // Refresh every 30 seconds
    const interval = setInterval(fetchPrices, 30000)
    return () => clearInterval(interval)
  }, [tokenIds.join(",")])

  return { prices, loading }
}

