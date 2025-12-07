import type { Database } from "./supabase"

export type RpcResponse<T> = {
  data: T | null
  error: {
    message: string
    details: string
    hint?: string
    code: string
  } | null
}

export type DailyPnLArgs = Database["public"]["Functions"]["get_daily_pnl"]["Args"]
export type DailyPnLResult = Database["public"]["Functions"]["get_daily_pnl"]["Returns"]

export type ActiveSessionsCountArgs = {
  window_minutes: number
}
export type ActiveSessionsCountResult = number

export type RequestRateArgs = {
  window_minutes: number
}
export type RequestRateResult = number

export class RpcError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: string,
    public readonly hint?: string
  ) {
    super(message)
    this.name = "RpcError"
  }
}

export const isRpcError = (error: any): error is RpcError => {
  return error && typeof error === "object" && "code" in error && "message" in error
}

export async function handleRpcResponse<T>(
  promise: Promise<RpcResponse<T>>,
  errorContext?: string
): Promise<T> {
  const { data, error } = await promise
  
  if (error) {
    throw new RpcError(
      `${errorContext ? `${errorContext}: ` : ""}${error.message}`,
      error.code,
      error.details,
      error.hint
    )
  }
  
  if (data === null) {
    throw new RpcError(
      `${errorContext ? `${errorContext}: ` : ""}No data returned`,
      "NO_DATA"
    )
  }

  return data
}