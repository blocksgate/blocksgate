import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { notificationService } from "@/lib/notifications"
import { rateLimit } from "@/lib/middleware/rateLimiter"

/**
 * Connect Discord webhook
 */
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
    const { webhookUrl } = body

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Missing webhookUrl parameter" },
        { status: 400 }
      )
    }

    // Validate webhook URL format
    if (!webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
      return NextResponse.json(
        { error: "Invalid Discord webhook URL" },
        { status: 400 }
      )
    }

    // Test the webhook
    try {
      const testResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "✅ Discord notifications connected!",
        }),
      })

      if (!testResponse.ok) {
        return NextResponse.json(
          { error: "Failed to validate webhook URL" },
          { status: 400 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Failed to validate webhook URL" },
        { status: 400 }
      )
    }

    // Update notification settings
    const settings = await notificationService.updateNotificationSettings(auth.userId, {
      discord_enabled: true,
      discord_webhook_url: webhookUrl,
    })

    if (!settings) {
      return NextResponse.json(
        { error: "Failed to connect Discord webhook" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("[Discord Connect] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect Discord" },
      { status: 500 }
    )
  }
}

/**
 * Disconnect Discord webhook
 */
export async function DELETE(request: NextRequest) {
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

    const settings = await notificationService.updateNotificationSettings(auth.userId, {
      discord_enabled: false,
      discord_webhook_url: null,
    })

    if (!settings) {
      return NextResponse.json(
        { error: "Failed to disconnect Discord webhook" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Discord Disconnect] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to disconnect Discord" },
      { status: 500 }
    )
  }
}

