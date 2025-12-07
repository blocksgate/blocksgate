import { describe, it, expect, vi, beforeEach } from "vitest"
import { DatabasePriceHistoryProvider, CompositePriceHistoryProvider } from "../lib/price-history"
import { supabase } from "../lib/supabase/client"

vi.mock("../lib/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(),
      eq: vi.fn(),
      gte: vi.fn(),
      lte: vi.fn(),
      limit: vi.fn(),
      order: vi.fn()
    }))
  }
}))

describe("PriceHistoryProvider", () => {
  describe("DatabasePriceHistoryProvider", () => {
    let provider: DatabasePriceHistoryProvider

    beforeEach(() => {
      provider = new DatabasePriceHistoryProvider()
      vi.clearAllMocks()
    })

    it("should fetch price history data correctly", async () => {
      const mockData = [
        {
          timestamp: "2025-01-01T00:00:00Z",
          open: "100",
          high: "110",
          low: "90",
          close: "105",
          volume: "1000"
        }
      ]

      const mockQuery = {
        data: mockData,
        error: null
      }

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockQuery)
      } as any)

      const result = await provider.getPriceHistory("ETH", {
        timeframe: "1h",
        startTime: 1640995200000,
        endTime: 1641081600000
      })

      expect(result.token).toBe("ETH")
      expect(result.timeframe).toBe("1h")
      expect(result.bars).toHaveLength(1)
      expect(result.bars[0]).toEqual({
        timestamp: new Date(mockData[0].timestamp).getTime(),
        open: 100,
        high: 110,
        low: 90,
        close: 105,
        volume: 1000
      })
    })

    it("should handle database errors", async () => {
      const mockError = new Error("Database error")
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: mockError })
      } as any)

      await expect(provider.getPriceHistory("ETH", { timeframe: "1h" }))
        .rejects.toThrow("Database error")
    })
  })

  describe("CompositePriceHistoryProvider", () => {
    let provider: CompositePriceHistoryProvider
    let mockProvider1: any
    let mockProvider2: any

    beforeEach(() => {
      provider = new CompositePriceHistoryProvider()
      mockProvider1 = { getPriceHistory: vi.fn() }
      mockProvider2 = { getPriceHistory: vi.fn() }
    })

    it("should try providers in sequence until success", async () => {
      const mockData = { token: "ETH", timeframe: "1h", bars: [] }
      mockProvider1.getPriceHistory.mockRejectedValue(new Error("Provider 1 failed"))
      mockProvider2.getPriceHistory.mockResolvedValue(mockData)

      provider.addProvider(mockProvider1)
      provider.addProvider(mockProvider2)

      const result = await provider.getPriceHistory("ETH", { timeframe: "1h" })
      expect(result).toBe(mockData)
      expect(mockProvider1.getPriceHistory).toHaveBeenCalled()
      expect(mockProvider2.getPriceHistory).toHaveBeenCalled()
    })

    it("should throw last error if all providers fail", async () => {
      mockProvider1.getPriceHistory.mockRejectedValue(new Error("Provider 1 failed"))
      mockProvider2.getPriceHistory.mockRejectedValue(new Error("Provider 2 failed"))

      provider.addProvider(mockProvider1)
      provider.addProvider(mockProvider2)

      await expect(provider.getPriceHistory("ETH", { timeframe: "1h" }))
        .rejects.toThrow("Provider 2 failed")
    })
  })
})