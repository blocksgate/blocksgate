export interface TokenPrice {
  symbol: string
  name: string
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
}

export class PriceFeed {
  private baseUrl = "https://api.coingecko.com/api/v3"

  async getPrice(tokenId: string): Promise<number> {
    const params = new URLSearchParams({
      ids: tokenId,
      vs_currencies: "usd",
    })

    const url = `${this.baseUrl}/simple/price?${params}`

    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch price")

    const data = await response.json()
    return data[tokenId]?.usd || 0
  }

  async getTokenData(tokenId: string): Promise<TokenPrice> {
    const params = new URLSearchParams({
      ids: tokenId,
      vs_currencies: "usd",
      include_market_cap: "true",
      include_24hr_vol: "true",
      include_24hr_change: "true",
    })

    const url = `${this.baseUrl}/simple/price?${params}`

    const response = await fetch(url)
    if (!response.ok) throw new Error("Failed to fetch token data")

    const data = await response.json()
    const tokenData = data[tokenId]

    return {
      symbol: tokenId.toUpperCase(),
      name: tokenId,
      price: tokenData?.usd || 0,
      marketCap: tokenData?.usd_market_cap || 0,
      volume24h: tokenData?.usd_24h_vol || 0,
      priceChange24h: tokenData?.usd_24h_change || 0,
    }
  }
}

export const priceFeed = new PriceFeed()
