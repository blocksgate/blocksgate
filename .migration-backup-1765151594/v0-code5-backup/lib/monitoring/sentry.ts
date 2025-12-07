// Sentry error tracking and monitoring integration

import * as Sentry from "@sentry/nextjs"

let isInitialized = false

/**
 * Initialize Sentry for error tracking
 */
export function initSentry() {
  if (isInitialized) {
    return
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  const environment = process.env.NODE_ENV || "development"

  if (!dsn) {
    console.warn("[Sentry] DSN not configured. Error tracking is disabled.")
    return
  }

  try {
    Sentry.init({
      dsn,
      environment,
      tracesSampleRate: environment === "production" ? 0.1 : 1.0,
      profilesSampleRate: environment === "production" ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        if (event.exception) {
          const error = hint.originalException
          if (error instanceof Error) {
            // Don't send user cancellation errors
            if (error.message.includes("User rejected") || error.message.includes("user rejected")) {
              return null
            }
            // Don't send rate limit errors
            if (error.message.includes("Rate limit")) {
              return null
            }
          }
        }
        return event
      },
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    })

    isInitialized = true
    console.log("[Sentry] Initialized successfully")
  } catch (error) {
    console.error("[Sentry] Failed to initialize:", error)
  }
}

/**
 * Capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
  if (!isInitialized) {
    console.error("[Error]", error, context)
    return
  }

  Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Capture a message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = "info", context?: Record<string, any>) {
  if (!isInitialized) {
    console.log(`[${level.toUpperCase()}]`, message, context)
    return
  }

  Sentry.captureMessage(message, {
    level,
    extra: context,
  })
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>) {
  if (!isInitialized) {
    return
  }

  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  })
}

/**
 * Set user context
 */
export function setUser(user: { id: string; email?: string; walletAddress?: string }) {
  if (!isInitialized) {
    return
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.walletAddress,
  })
}

/**
 * Clear user context
 */
export function clearUser() {
  if (!isInitialized) {
    return
  }

  Sentry.setUser(null)
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string = "http.server") {
  if (!isInitialized) {
    return null
  }

  return Sentry.startSpan(
    {
      name,
      op,
    },
    () => {
      // Transaction context
    },
  )
}

/**
 * Set transaction context
 */
export function setTransactionContext(context: Record<string, any>) {
  if (!isInitialized) {
    return
  }

  Sentry.configureScope((scope) => {
    Object.entries(context).forEach(([key, value]) => {
      scope.setContext(key, value)
    })
  })
}

// Auto-initialize in browser
if (typeof window !== "undefined") {
  initSentry()
}

