// Sentry client-side configuration

import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
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
})

