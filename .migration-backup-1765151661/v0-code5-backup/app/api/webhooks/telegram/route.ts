import { type NextRequest, NextResponse } from "next/server"
import { authenticateRequest } from "@/lib/supabase/wallet-auth"
import { notificationService } from "@/lib/notifications"
import { rateLimit } from "@/lib/middleware/rateLimiter"

/**
 * Telegram webhook endpoint for receiving updates from Telegram bot
 * This endpoint should be configured in your Telegram bot settings
 */
export async function POST(request: NextRequest) {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
    const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: "Telegram bot not configured" }, { status: 500 })
    }

    const body = await request.json()

    // Verify webhook secret if configured
    if (TELEGRAM_WEBHOOK_SECRET) {
      const secret = request.headers.get("x-telegram-secret")
      if (secret !== TELEGRAM_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // Handle Telegram webhook updates
    // See: https://core.telegram.org/bots/api#update
    if (body.message) {
      const message = body.message
      const chatId = message.chat.id
      const text = message.text

      // Handle commands
      if (text === "/start") {
        // User wants to connect their Telegram account
        // In production, you would generate a unique link and store the chat_id
        return NextResponse.json({ ok: true })
      } else if (text === "/stop") {
        // User wants to disconnect
        return NextResponse.json({ ok: true })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process webhook" },
      { status: 500 }
    )
  }
}

/**
 * Connect Telegram account
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    if (!chatId) {
      return NextResponse.json(
        { error: "Missing chatId parameter" },
        { status: 400 }
      )
    }

    // Update notification settings with Telegram chat ID
    const settings = await notificationService.updateNotificationSettings(auth.userId, {
      telegram_enabled: true,
      telegram_chat_id: chatId,
    })

    if (!settings) {
      return NextResponse.json(
        { error: "Failed to connect Telegram account" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error("[Telegram Connect] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect Telegram" },
      { status: 500 }
    )
  }
}

