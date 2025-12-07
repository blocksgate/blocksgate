import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { notificationService } from "@/lib/notifications"
import { rateLimit } from "@/lib/middleware/rateLimiter"

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth || auth.isWalletOnly) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rl = rateLimit(request, { capacity: 60, refillRatePerSecond: 1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const settings = await notificationService.getNotificationSettings(auth.userId)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[Notification Settings API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get notification settings" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request)
  if (!auth || auth.isWalletOnly) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const rl = rateLimit(request, { capacity: 10, refillRatePerSecond: 0.1 })
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      )
    }

    const body = await request.json()
    const settings = await notificationService.updateNotificationSettings(auth.userId, body)

    if (!settings) {
      return NextResponse.json(
        { error: "Failed to update notification settings" },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[Notification Settings API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notification settings" },
      { status: 500 }
    )
  }
}

