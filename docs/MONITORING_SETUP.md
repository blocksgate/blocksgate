# Monitoring & Error Tracking Setup

Complete guide for setting up production monitoring and error tracking.

## 1. Sentry Integration (Error Tracking)

Sentry helps you track and fix errors in real-time.

### Installation

\`\`\`bash
npm install @sentry/nextjs @sentry/tracing
\`\`\`

### Configuration

Create `lib/sentry.ts`:

\`\`\`typescript
import * as Sentry from "@sentry/nextjs";

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out certain errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes?.("ResizeObserver")) {
          return null;
        }
      }
      return event;
    },
  });
}
\`\`\`

### Usage in App

Update `app/layout.tsx`:

\`\`\`typescript
import { initSentry } from "@/lib/sentry";

if (typeof window !== "undefined") {
  initSentry();
}
\`\`\`

### Environment Setup

Add to `.env.example` and Vercel environment variables:

\`\`\`
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_KEY@sentry.io/YOUR_PROJECT_ID
\`\`\`

### Capture Errors

\`\`\`typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Your code
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: "trading",
      action: "swap",
    },
  });
}
\`\`\`

## 2. Vercel Analytics

Automatic performance monitoring on Vercel.

### Enable in Vercel Dashboard

1. Go to your Vercel project
2. Settings → Analytics
3. Enable "Web Analytics"
4. Data appears in dashboard automatically

### Track Custom Events

\`\`\`typescript
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
\`\`\`

## 3. Database Query Monitoring

Monitor Supabase performance.

### Enable in Supabase

1. Go to Supabase dashboard
2. Project → Logs → Query Performance
3. Monitor slow queries
4. Add indexes if needed

### Query Optimization

Common slow queries to watch:
- Trades query without user_id filter
- Portfolio aggregations without indexes
- Price history queries with wide date ranges

### Example: Add Missing Index

\`\`\`sql
CREATE INDEX IF NOT EXISTS idx_trades_user_chain 
ON public.trades(user_id, chain_id, created_at DESC);
\`\`\`

## 4. API Performance Monitoring

Track API response times and errors.

### Middleware-based Monitoring

Create `lib/monitoring.ts`:

\`\`\`typescript
import { NextResponse } from "next/server";

export async function monitorRequest(
  fn: () => Promise<NextResponse>,
  context: { endpoint: string; method: string }
) {
  const startTime = Date.now();

  try {
    const response = await fn();
    const duration = Date.now() - startTime;

    console.log(`[${context.method}] ${context.endpoint} - ${response.status} - ${duration}ms`);

    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[${context.method}] ${context.endpoint} - Error - ${duration}ms`,
      error
    );
    throw error;
  }
}
\`\`\`

### Usage in API Routes

\`\`\`typescript
import { monitorRequest } from "@/lib/monitoring";

export async function GET(request: Request) {
  return monitorRequest(
    async () => {
      // Your endpoint logic
    },
    { endpoint: "/api/trades", method: "GET" }
  );
}
\`\`\`

## 5. Real-Time Alerts

Set up alerts for critical issues.

### Sentry Alerts

1. Go to Sentry dashboard
2. Alerts → Create Alert Rule
3. Condition: Error rate > 5%
4. Action: Send to Slack or Email

### Vercel Deployment Alerts

1. Project Settings → Git
2. Deployment Protection
3. Set up Slack notifications

### Database Alerts (Supabase)

Monitor database performance:
- CPU usage > 80%
- Connection pool exhausted
- Backup failures

## 6. Logging Best Practices

### Structured Logging

\`\`\`typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: "info",
  service: "trading",
  action: "swap_executed",
  user_id: userId,
  duration_ms: duration,
  status: "success",
}));
\`\`\`

### Log Levels

- **ERROR**: Critical issues requiring immediate attention
- **WARN**: Potential issues to investigate
- **INFO**: Important business events (trades, signups)
- **DEBUG**: Development only, detailed execution flow

### Avoid Logging

- Sensitive data (private keys, passwords)
- Full request/response bodies (log only relevant parts)
- PII (Personally Identifiable Information)

## 7. Uptime Monitoring

### Vercel Deployment URL Monitoring

Use external monitoring service:

\`\`\`bash
# Using UptimeRobot
# 1. Go to uptimerobot.com
# 2. Create new monitor
# 3. URL: https://YOUR_DOMAIN.vercel.app/api/health
# 4. Frequency: Every 5 minutes
# 5. Get alerts via email/Slack
\`\`\`

### Health Check Endpoint

Create `app/api/health/route.ts`:

\`\`\`typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Check database connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    
    if (error) throw error;
    
    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: "ok",
        api: "ok",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 }
    );
  }
}
\`\`\`

## 8. Dashboard Setup

Create a monitoring dashboard in Vercel:

1. Go to project Analytics
2. Monitor key metrics:
   - Page load times
   - Error rates
   - API response times
   - User sessions
3. Set performance budgets
4. Track trends over time

## Monitoring Checklist

- [ ] Sentry integrated and DSN added to env vars
- [ ] Vercel Analytics enabled
- [ ] Database query logging enabled
- [ ] API monitoring middleware added
- [ ] Alert rules configured
- [ ] Health check endpoint created
- [ ] Uptime monitoring set up
- [ ] Team notified of alert channels
- [ ] Runbooks created for common issues

## Critical Metrics to Monitor

1. **Error Rate**: Should be < 1% in production
2. **API Response Time**: Target < 200ms p95
3. **Database Query Time**: Target < 100ms p95
4. **Page Load Time**: Target < 3s first paint
5. **Uptime**: Target > 99.9%
6. **Authentication Success Rate**: Should be > 99%
