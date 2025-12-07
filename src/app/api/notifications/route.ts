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

    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 50
    const offset = Number(searchParams.get("offset")) || 0

    const notifications = await notificationService.getNotifications(auth.userId, limit, offset)

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get notifications" },
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
    const { notificationId } = body

    if (notificationId) {
      // Mark as read
      const success = await notificationService.markAsRead(notificationId, auth.userId)
      return NextResponse.json({ success })
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("[Notifications API] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process notification" },
      { status: 500 }
    )
  }
}

