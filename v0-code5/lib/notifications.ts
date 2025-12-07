// Notification service for email, in-app, and webhook notifications

import { createClient } from "@/lib/supabase/server"
import { EventEmitter } from "events"

export interface Notification {
  id?: string
  user_id: string
  type: "trade" | "order" | "price_alert" | "system" | "transaction"
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  created_at?: string
}

export interface NotificationSettings {
  user_id: string
  email_enabled: boolean
  in_app_enabled: boolean
  telegram_enabled: boolean
  discord_enabled: boolean
  price_alerts_enabled: boolean
  trade_notifications_enabled: boolean
  order_notifications_enabled: boolean
  telegram_chat_id?: string
  discord_webhook_url?: string
  email?: string
}

export class NotificationService extends EventEmitter {
  /**
   * Send a notification to a user
   */
  async sendNotification(
    userId: string,
    type: Notification["type"],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      const supabase = await createClient()

      // Get user notification settings
      const settings = await this.getNotificationSettings(userId)

      // Create in-app notification
      if (settings.in_app_enabled) {
        const { data: notification, error } = await supabase
          .from("notifications")
          .insert({
            user_id: userId,
            type,
            title,
            message,
            data: data || {},
            read: false,
          })
          .select()
          .single()

        if (error) {
          console.error("[NotificationService] Error creating notification:", error)
        } else {
          this.emit("notification:created", notification)
        }
      }

      // Send email notification
      if (settings.email_enabled && settings.email) {
        await this.sendEmailNotification(settings.email, title, message, data)
      }

      // Send Telegram notification
      if (settings.telegram_enabled && settings.telegram_chat_id) {
        await this.sendTelegramNotification(settings.telegram_chat_id, title, message, data)
      }

      // Send Discord notification
      if (settings.discord_enabled && settings.discord_webhook_url) {
        await this.sendDiscordNotification(settings.discord_webhook_url, title, message, data)
      }

      return null
    } catch (error) {
      console.error("[NotificationService] Error sending notification:", error)
      return null
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      // In production, you would use an email service like Resend, SendGrid, or AWS SES
      // For now, we'll just log it
      console.log(`[Email] To: ${email}, Subject: ${title}, Body: ${message}`)

      // Example with Resend (uncomment when Resend is configured):
      /*
      const RESEND_API_KEY = process.env.RESEND_API_KEY
      if (!RESEND_API_KEY) {
        console.warn("[NotificationService] RESEND_API_KEY not configured")
        return
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "notifications@yourdomain.com",
          to: email,
          subject: title,
          html: `<p>${message}</p>`,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send email: ${response.statusText}`)
      }
      */
    } catch (error) {
      console.error("[NotificationService] Error sending email:", error)
    }
  }

  /**
   * Send Telegram notification
   */
  private async sendTelegramNotification(
    chatId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
      if (!TELEGRAM_BOT_TOKEN) {
        console.warn("[NotificationService] TELEGRAM_BOT_TOKEN not configured")
        return
      }

      const text = `*${title}*\n\n${message}`
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Failed to send Telegram message: ${error.description}`)
      }
    } catch (error) {
      console.error("[NotificationService] Error sending Telegram notification:", error)
    }
  }

  /**
   * Send Discord notification
   */
  private async sendDiscordNotification(
    webhookUrl: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              title,
              description: message,
              color: 0x5865f2, // Discord blue
              timestamp: new Date().toISOString(),
              fields: data
                ? Object.entries(data).map(([key, value]) => ({
                    name: key,
                    value: String(value),
                    inline: true,
                  }))
                : [],
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to send Discord notification: ${response.statusText}`)
      }
    } catch (error) {
      console.error("[NotificationService] Error sending Discord notification:", error)
    }
  }

  /**
   * Get notification settings for a user
   */
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (error || !data) {
        // Return default settings
        return {
          user_id: userId,
          email_enabled: true,
          in_app_enabled: true,
          telegram_enabled: false,
          discord_enabled: false,
          price_alerts_enabled: true,
          trade_notifications_enabled: true,
          order_notifications_enabled: true,
        }
      }

      return data as NotificationSettings
    } catch (error) {
      console.error("[NotificationService] Error getting settings:", error)
      // Return default settings on error
      return {
        user_id: userId,
        email_enabled: true,
        in_app_enabled: true,
        telegram_enabled: false,
        discord_enabled: false,
        price_alerts_enabled: true,
        trade_notifications_enabled: true,
        order_notifications_enabled: true,
      }
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings | null> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("notification_settings")
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("[NotificationService] Error updating settings:", error)
        return null
      }

      return data as NotificationSettings
    } catch (error) {
      console.error("[NotificationService] Error updating settings:", error)
      return null
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error("[NotificationService] Error getting notifications:", error)
        return []
      }

      return (data || []) as Notification[]
    } catch (error) {
      console.error("[NotificationService] Error getting notifications:", error)
      return []
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", userId)

      if (error) {
        console.error("[NotificationService] Error marking as read:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("[NotificationService] Error marking as read:", error)
      return false
    }
  }

  /**
   * Create price alert
   */
  async createPriceAlert(
    userId: string,
    token: string,
    targetPrice: number,
    condition: "above" | "below"
  ): Promise<boolean> {
    try {
      const supabase = await createClient()
      const { error } = await supabase
        .from("price_alerts")
        .insert({
          user_id: userId,
          token,
          target_price: targetPrice,
          condition,
          active: true,
        })

      if (error) {
        console.error("[NotificationService] Error creating price alert:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("[NotificationService] Error creating price alert:", error)
      return false
    }
  }
}

export const notificationService = new NotificationService()

