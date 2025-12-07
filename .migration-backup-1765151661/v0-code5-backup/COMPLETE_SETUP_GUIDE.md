# Complete Setup Guide for DeFi Trading Platform

## 🎯 Overview

This guide will take you from zero to a fully functional DeFi trading platform with:
- User authentication via Supabase
- Database for storing trades and portfolios
- Real-time price feeds
- API endpoints for trading operations
- Production-ready monitoring

**Estimated time: 15-20 minutes**

---

## ✅ Step 1: Verify Environment Variables (5 minutes)

Your Supabase credentials have been added to `.env.local`. Verify they're correct:

\`\`\`bash
# Check the file exists
cat .env.local
\`\`\`

You should see:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://kjunebppqyeabywmywgl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
\`\`\`

**✅ Action Item:**
- [ ] Verified `.env.local` contains all Supabase credentials

---

## ✅ Step 2: Start Development Server (2 minutes)

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev
\`\`\`

Visit `http://localhost:3000` and verify:
- ✅ Homepage loads without "Supabase credentials missing" error
- ✅ Header and navigation are visible
- ✅ No console errors about missing env vars

**✅ Action Items:**
- [ ] Server running on localhost:3000
- [ ] No Supabase credential errors
- [ ] Homepage renders correctly

---

## ✅ Step 3: Run Database Migrations (3 minutes)

This creates all required tables in your Supabase database.

\`\`\`bash
npm run migrate
\`\`\`

This will:
1. Read 6 SQL migration files from `/scripts`
2. Execute them in order against your Supabase database
3. Create tables: profiles, trades, portfolios, orders, price_history, audit_logs
4. Enable Row Level Security on all user tables
5. Create indexes for performance

**Expected output:**
\`\`\`
🔄 Running migrations...
✅ Migration 001_create_profiles.sql completed
✅ Migration 002_create_trades.sql completed
✅ Migration 003_create_portfolios.sql completed
✅ Migration 004_create_orders.sql completed
✅ Migration 005_create_price_history.sql completed
✅ Migration 006_create_audit_logs.sql completed
✅ All migrations completed successfully!
\`\`\`

**✅ Action Items:**
- [ ] All 6 migrations completed successfully
- [ ] No error messages in output

---

## ✅ Step 4: Verify Database Setup (2 minutes)

\`\`\`bash
npm run migrate:verify
\`\`\`

This will:
1. Check all environment variables are set
2. Test Supabase connection
3. Verify all 6 tables exist
4. Check RLS policies are enabled

**Expected output:**
\`\`\`
🔍 Verifying Supabase Setup...

1️⃣  Checking Environment Variables:
   ✅ NEXT_PUBLIC_SUPABASE_URL is set (https://...)
   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set (ey...)
   ✅ SUPABASE_SERVICE_ROLE_KEY is set (ey...)

2️⃣  Testing Supabase Connection:
   ✅ Successfully connected to Supabase

3️⃣  Checking Database Tables:
   ✅ profiles: exists and accessible
   ✅ trades: exists and accessible
   ✅ portfolios: exists and accessible
   ✅ orders: exists and accessible
   ✅ price_history: exists and accessible
   ✅ audit_logs: exists and accessible

✅ Supabase setup verification complete!
\`\`\`

**✅ Action Items:**
- [ ] All environment variables verified
- [ ] Supabase connection successful
- [ ] All 6 tables exist and accessible

---

## ✅ Step 5: Test Authentication Flow (4 minutes)

### 5a. Sign Up

1. Visit `http://localhost:3000/auth/sign-up`
2. Fill in:
   - **Email**: your-email@example.com
   - **Password**: TestPassword123!
3. Click **Sign Up**

**Expected:**
- ✅ Redirected to `/auth/sign-up-success` page
- ✅ Message: "Check your email for confirmation link"
- ✅ No error messages

### 5b. Confirm Email

1. Check your email inbox (check spam too!)
2. Click the confirmation link from Supabase
3. You'll be redirected to a callback page

**Expected:**
- ✅ Email confirmation completed
- ✅ Redirected to login page

### 5c. Login

1. Visit `http://localhost:3000/auth/login`
2. Enter your email and password
3. Click **Login**

**Expected:**
- ✅ Redirected to `/dashboard` page
- ✅ Wallet connection prompt appears
- ✅ Navigation sidebar visible

### 5d. Verify Profile Created

Open browser console and run:

\`\`\`javascript
const response = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${await supabase.auth.session().then(s => s.access_token)}`
  }
});
console.log(await response.json());
\`\`\`

**Expected:**
\`\`\`json
{
  "id": "user-id",
  "email": "your-email@example.com",
  "created_at": "2024-11-09T...",
  "metadata": {}
}
\`\`\`

**✅ Action Items:**
- [ ] Account created successfully
- [ ] Email confirmation received and completed
- [ ] Logged in to dashboard
- [ ] User profile created in database

---

## ✅ Step 6: Test API Endpoints (3 minutes)

### 6a. Get Portfolio

\`\`\`bash
curl -X GET http://localhost:3000/api/portfolio \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

**Expected Response:**
\`\`\`json
{
  "totalValue": 0,
  "holdings": [],
  "summary": {
    "totalTokens": 0,
    "totalChange24h": 0
  }
}
\`\`\`

### 6b. Get Trade History

\`\`\`bash
curl -X GET http://localhost:3000/api/trades \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

**Expected Response:**
\`\`\`json
{
  "trades": [],
  "total": 0,
  "limit": 10,
  "offset": 0
}
\`\`\`

### 6c. Get Analytics

\`\`\`bash
curl -X GET http://localhost:3000/api/analytics/portfolio \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

**Expected Response:**
\`\`\`json
{
  "metrics": {
    "totalTrades": 0,
    "winRate": 0,
    "totalProfit": 0,
    "winRatePercentage": 0
  },
  "holdings": []
}
\`\`\`

**✅ Action Items:**
- [ ] Portfolio API returns empty portfolio (expected for new user)
- [ ] Trade history API returns empty trades (expected for new user)
- [ ] Analytics API returns all zeros (expected for new user)

---

## ✅ Step 7: Test Dashboard Features (2 minutes)

1. **Visit Dashboard**: `http://localhost:3000/dashboard`
   - ✅ Portfolio summary appears
   - ✅ No errors in console

2. **Navigate to Trade History**: `/dashboard/history`
   - ✅ Empty trades table loads
   - ✅ CSV export button available

3. **Navigate to Analytics**: `/dashboard/analytics`
   - ✅ Charts load (empty but functional)
   - ✅ Portfolio summary visible

4. **Navigate to Basic Swap**: `/dashboard/swap`
   - ✅ Swap interface loads
   - ✅ Token selector works
   - ✅ Price quotes fetch successfully

**✅ Action Items:**
- [ ] Dashboard pages load without errors
- [ ] Navigation between pages works
- [ ] API data displays correctly

---

## ✅ Step 8: Deploy to Production (Optional but Recommended)

### 8a. Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `code4` project
3. Click **Settings** → **Environment Variables**
4. Add these variables:

**Public Variables:**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://kjunebppqyeabywmywgl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
\`\`\`

**Private Variables:**
\`\`\`
SUPABASE_POSTGRES_URL=postgres://postgres...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
\`\`\`

5. Click **Save**
6. Click **Deployments** → **Redeploy**

### 8b. Verify Production Deployment

1. Visit your production URL (e.g., `https://code4.vercel.app`)
2. Test signup and login flow
3. Verify API endpoints work
4. Check browser console for errors

**✅ Action Items:**
- [ ] Environment variables added to Vercel
- [ ] Production deployment successful
- [ ] Authentication works in production
- [ ] API endpoints accessible in production

---

## 🎉 Congratulations!

Your DeFi trading platform is now fully set up with:

✅ **Authentication**
- Email/password signup and login
- Secure session management
- Email confirmation required

✅ **Database**
- User profiles and authentication
- Trade history tracking
- Portfolio management
- Order management
- Price history

✅ **APIs**
- Get user portfolio
- Get trade history
- Get analytics and performance metrics
- Get user profile

✅ **Frontend**
- Dashboard with portfolio summary
- Trade history page with export
- Analytics page with charts
- Swap interface
- Real-time price feeds

---

## 🚀 Next Steps

### 1. Add Trading Functionality
- Get 0x Protocol API key: https://0x.org/api-key
- Update `.env.local` with `ZX_API_KEY`
- Test actual token swaps

### 2. Set Up Monitoring
- Create Sentry account: https://sentry.io
- Add Sentry DSN to environment variables
- Enable error tracking

### 3. Deploy to Production
- Push code to GitHub
- Connect Vercel to GitHub
- Set environment variables
- Deploy

### 4. Add RPC Providers (Optional)
- Get Alchemy key: https://www.alchemy.com
- Get Infura key: https://www.infura.io
- Add to environment variables for better reliability

---

## 📞 Troubleshooting

### Error: "Supabase credentials missing"
**Solution:** Restart your dev server after adding `.env.local`

### Error: "Email not confirmed"
**Solution:** Check spam folder, confirm email link, wait a few seconds

### Error: "RLS policy violation"
**Solution:** Ensure migrations ran fully, check database tables exist

### Error: "Connection refused"
**Solution:** Check Supabase project is running, verify database URL

### Migrations failed
**Solution:** 
1. Go to Supabase Dashboard → SQL Editor
2. Run migrations manually one by one
3. Check for syntax errors

---

## ✨ Pro Tips

1. **Use Supabase Dashboard** for debugging database issues
2. **Check browser DevTools Network tab** for API errors
3. **Use Supabase Realtime** for live updates (advanced feature)
4. **Enable RLS policies** on all new tables for security
5. **Use service role key** only on server-side code

---

## 📚 Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [0x Protocol Docs](https://0x.org/docs)
- [Vercel Deployment](https://vercel.com/docs)

Need help? Check the other guides:
- `MIGRATION_GUIDE.md` - Detailed migration steps
- `ENV_SETUP_INSTRUCTIONS.md` - Environment variable setup
- `TESTING_GUIDE.md` - Testing checklist
- `MONITORING_SETUP.md` - Production monitoring
