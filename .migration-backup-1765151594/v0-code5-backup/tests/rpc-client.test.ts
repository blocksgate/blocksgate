import { describe, it, expect, vi, beforeEach } from "vitest"
import { SupabaseRpcClient } from "../lib/supabase/rpc-client"
import { RpcError, DailyPnLResult } from "../lib/types/supabase-functions"
import { supabase } from "../lib/supabase/client"
import type { PostgrestError, PostgrestSingleResponse } from "@supabase/postgrest-js"

vi.mock("../lib/supabase/client", () => ({
  supabase: {
    rpc: vi.fn().mockImplementation(() => ({
      data: null,
      error: null,
      count: null,
      status: 200,
      statusText: "OK"
    }))
  }
}))

describe("SupabaseRpcClient", () => {
  let client: SupabaseRpcClient

  beforeEach(() => {
    client = new SupabaseRpcClient()
    vi.clearAllMocks()
  })

  describe("getDailyPnL", () => {
    const mockArgs = {
      user_id: "test-user",
      start_date: "2025-01-01",
      end_date: "2025-01-02",
      token_filter: null
    }

    it("should return data on successful RPC call", async () => {
      const mockData: DailyPnLResult = [{ date: "2025-01-01", pnl: "100" }]
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ 
      data: mockData, 
      error: null,
      count: null,
      status: 200,
      statusText: "OK"
    } as unknown as PostgrestSingleResponse<never>)

      const result = await client.getDailyPnL(mockArgs)
      expect(result).toEqual(mockData)
      expect(supabase.rpc).toHaveBeenCalledWith("get_daily_pnl", mockArgs)
    })

    it("should throw error on error response", async () => {
      const mockError: PostgrestError = { 
        message: "Test error", 
        code: "TEST_ERROR",
        details: "Test details",
        hint: "Test hint",
        name: "PostgrestError"
      }
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ 
        data: null, 
        error: mockError,
        count: null,
        status: 400,
        statusText: "Bad Request"
      } as PostgrestSingleResponse<never>)

      await expect(client.getDailyPnL(mockArgs)).rejects.toHaveProperty("code", "TEST_ERROR")
      await expect(client.getDailyPnL(mockArgs)).rejects.toHaveProperty("name", "RpcError")
    })

    it("should throw error on null data", async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({ 
        data: null, 
        error: null as unknown as PostgrestError,
        count: null,
        status: 200,
        statusText: "OK"
      } as PostgrestSingleResponse<never>)

      await expect(client.getDailyPnL(mockArgs)).rejects.toHaveProperty("code", "NO_DATA")
      await expect(client.getDailyPnL(mockArgs)).rejects.toHaveProperty("name", "RpcError")
    })
  })

  // Similar tests for other RPC methods...
})