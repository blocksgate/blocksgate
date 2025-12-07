import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { config } from "@/lib/config"
import { RpcManager } from "@/lib/rpc-manager"

export async function GET() {
  try {
  const supabase = await createClient()

    // Check database connection
    const { error } = await supabase.from("profiles").select("count").limit(1)
    if (error) throw error

    // Check 0x API reachability (best-effort)
    let zxOk = false
    try {
      const zxResponse = await fetch(config.zxProtocol.baseUrl, { method: "GET" })
      zxOk = zxResponse.ok
    } catch (err) {
      zxOk = false
    }

    // Check RPC provider by asking for block number on a configured chain
    let rpcOk = false
    try {
      const firstChain = Object.values(config.chains)[0]
      const rpc = new RpcManager(firstChain.id)
      await rpc.getBlockNumber()
      rpcOk = true
    } catch (err) {
      rpcOk = false
    }

    return NextResponse.json(
      {
        status: "healthy",
        timestamp: new Date().toISOString(),
        checks: {
          database: "ok",
          zx_api: zxOk ? "ok" : "unreachable",
          rpc: rpcOk ? "ok" : "unreachable",
        },
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
