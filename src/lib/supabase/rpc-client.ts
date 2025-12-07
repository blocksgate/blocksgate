import { supabase } from "./client"
import { rpcMonitor } from "../rpc-monitor"
import type {
  DailyPnLArgs,
  DailyPnLResult,
  ActiveSessionsCountArgs,
  ActiveSessionsCountResult,
  RequestRateArgs,
  RequestRateResult,
  RpcError,
} from "../types/supabase-functions"

export class SupabaseRpcClient {
  private async executeRpc<T>(
    functionName: string,
    args: any,
    errorMessage: string
  ): Promise<T> {
    return await rpcMonitor.measure(functionName, async () => {
      const { data, error } = await supabase.rpc(functionName, args as any)
      
      if (error) {
        throw {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          name: "RpcError"
        }
      }
      
      if (data === null) {
        throw {
          message: "No data returned",
          code: "NO_DATA",
          name: "RpcError"
        }
      }

      return data as T
    })
  }

  async getDailyPnL(args: DailyPnLArgs): Promise<DailyPnLResult> {
    try {
      return await this.executeRpc<DailyPnLResult>(
        "get_daily_pnl",
        args,
        "Failed to get daily PnL"
      )
    } catch (error) {
      throw error
    }
  }

  async getActiveSessionsCount(args: ActiveSessionsCountArgs): Promise<ActiveSessionsCountResult> {
    try {
      return await this.executeRpc<ActiveSessionsCountResult>(
        "get_active_sessions_count",
        args,
        "Failed to get active sessions count"
      )
    } catch (error) {
      throw error
    }
  }

  async getRequestRate(args: RequestRateArgs): Promise<RequestRateResult> {
    try {
      return await this.executeRpc<RequestRateResult>(
        "get_request_rate",
        args,
        "Failed to get request rate"
      )
    } catch (error) {
      throw error
    }
  }
}

export const rpcClient = new SupabaseRpcClient()