# Quick Start Guide

## Prerequisites
- Node.js 18+
- Supabase account with project created
- Environment variables set up

## Step 1: Set Environment Variables

Add these to your Vercel project or `.env.local`:

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

**How to find these:**
1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy the URLs and keys

## Step 2: Run Database Migrations

### Option A: Using Node.js (Recommended)

\`\`\`bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your_url"
export SUPABASE_SERVICE_ROLE_KEY="your_key"

# Run migrations
node scripts/run-migrations.ts
\`\`\`

### Option B: Using Supabase Dashboard

1. Go to your Supabase project
2. Click "SQL Editor"
3. Click "+ New Query"
4. Copy each SQL file content (001 through 006) in order
5. Click "Run"
6. Repeat for each migration file

### Option C: Using Supabase CLI

\`\`\`bash
supabase db push
\`\`\`

## Step 3: Verify Migrations

\`\`\`bash
# Check if tables were created
curl -X GET "https://YOUR_SUPABASE_URL/rest/v1/profiles?limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
\`\`\`

Expected response: Empty array `[]` (tables exist but no data yet)

## Step 4: Test Authentication

1. Go to http://localhost:3000/auth/sign-up
2. Create an account with your email
3. Check your email for confirmation link
4. Confirm your email
5. Login with your credentials
6. You should see the dashboard

## Step 5: Test Trade Execution

1. From dashboard, navigate to "Basic Swap"
2. Select two tokens (e.g., ETH → USDC)
3. Enter an amount
4. Click "Get Quote"
5. Click "Execute Swap"
6. Check "Trade History" to see the recorded trade

## Troubleshooting

### "Missing environment variables" error
- Check you've set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Restart your development server after setting env vars

### "RLS policy error" when saving profile
- Ensure migrations ran successfully
- Check RLS policies are enabled on tables
- Verify user is logged in

### Trades not appearing in history
- Check database migration 002_create_trades.sql ran
- Verify user_id is being sent with trade data
- Check browser console for API errors

### Price feeds not updating
- Verify internet connection
- Check CoinGecko API is accessible
- Look for rate limiting errors in console

## Next Steps

1. Add API keys (0x Protocol, RPC providers)
2. Deploy to Vercel
3. Set up monitoring (Sentry, Vercel Analytics)
4. Test in production environment
