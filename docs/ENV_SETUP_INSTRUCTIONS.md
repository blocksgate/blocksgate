# Environment Variables Setup Guide

## Overview
Your Supabase credentials have been added to `.env.local` for local development. This guide explains how to set them up in production and verify they work correctly.

## For Local Development

The `.env.local` file is already created with all necessary credentials. Simply:

1. **Restart your development server**
   \`\`\`bash
   npm run dev
   # or
   yarn dev
   \`\`\`

2. **Verify the connection**
   - Visit `http://localhost:3000`
   - You should see the app without any "Supabase credentials missing" errors
   - Try signing up for an account to test authentication

## For Production (Vercel)

You need to add the environment variables to your Vercel project. Choose one of these methods:

### Method 1: Vercel Dashboard (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project `code4`
3. Click **Settings** → **Environment Variables**
4. Add each variable:

**Public Variables (visible to frontend):**
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://kjunebppqyeabywmywgl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdW5lYnBwcXllYWJ5d215d2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTczMTcsImV4cCI6MjA3ODE5MzMxN30.wAWhe4Fv8qNywaVY1deDiSxd91hmhmrt1eviQhQiaPY
\`\`\`

**Private Variables (server-side only):**
\`\`\`
SUPABASE_POSTGRES_URL=postgres://postgres.kjunebppqyeabywmywgl:vtpo2wa6wScmwGpA@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supabase-pooler=true
SUPABASE_POSTGRES_PRISMA_URL=postgres://postgres.kjunebppqyeabywmywgl:vtpo2wa6wScmwGpA@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
SUPABASE_POSTGRES_URL_NON_POOLING=postgres://postgres.kjunebppqyeabywmywgl:vtpo2wa6wScmwGpA@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
SUPABASE_POSTGRES_HOST=db.kjunebppqyeabywmywgl.supabase.co
SUPABASE_POSTGRES_DATABASE=postgres
SUPABASE_POSTGRES_USER=postgres
SUPABASE_POSTGRES_PASSWORD=vtpo2wa6wScmwGpA
SUPABASE_JWT_SECRET=/HgM6Ztv/pvTohFq2Loun50+ANur4GQKr+60qykP/QfPKdSIbcqGfZ9F2GRrJ9TFtR7sO8bVKQs93h1qTRpzyg==
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdW5lYnBwcXllYWJ5d215d2dsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjYxNzMxNywiZXhwIjoyMDc4MTkzMzE3fQ.Q0S5MqSyRB7neSnyW82YMymXv1dWW0w9ek5v2aETfP4
\`\`\`

5. Click **Save** and **Redeploy** your project

### Method 2: v0 Sidebar (Vars Section)

1. Open the **Vars** section in the v0 sidebar
2. Add all the environment variables listed above
3. They will automatically sync to Vercel

### Method 3: GitHub & Vercel Auto-sync

1. Push `.env.local` changes to your GitHub repository
2. Vercel will automatically detect environment variables
3. Create a `.env.production` file in your repo with the same values
4. Commit and push to trigger deployment

## Verifying the Setup

### Step 1: Check Local Development
\`\`\`bash
npm run dev
\`\`\`
Visit `http://localhost:3000` - should load without errors

### Step 2: Test Authentication
1. Click **Sign Up** on the homepage
2. Enter email and password
3. Check your email for confirmation link
4. Click the confirmation link
5. Login with your credentials
6. You should be redirected to `/dashboard`

### Step 3: Test Database Connection
1. Login to your account
2. Visit `/dashboard/history` (Trade History page)
3. You should see an empty trades list (no errors)
4. Go to `/dashboard/analytics` (Analytics page)
5. You should see portfolio summary (may be empty initially)

### Step 4: Verify in Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Run: `SELECT * FROM profiles;`
5. You should see your user profile

## Running Database Migrations

Once environment variables are set up, run the migrations:

\`\`\`bash
npm run migrate
\`\`\`

This will create all necessary tables:
- `profiles` - User accounts
- `trades` - Trade history
- `portfolios` - User holdings
- `orders` - Limit orders
- `price_history` - Historical prices
- `audit_logs` - Security logs

## Troubleshooting

### Error: "Supabase credentials missing"
- Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- These must start with `https://` and `ey...` respectively
- Restart your development server after adding env vars

### Error: "Connection refused" on migrations
- Ensure `SUPABASE_POSTGRES_URL` is correct
- Check that your Supabase project is running
- Verify firewall allows connections from your IP

### Error: "JWT token expired"
- The service role key has an expiration date
- If expired, regenerate it in Supabase Dashboard → Settings → API

### Email Confirmation Not Working
- Check spam/junk folder
- Verify `NEXT_PUBLIC_SUPABASE_URL` is set to your actual domain in production
- In Supabase Dashboard, go to Settings → Auth to configure email templates

## Security Notes

⚠️ **IMPORTANT**: The credentials in `.env.local` are for development only.

- **Never commit `.env.local`** to git (already in .gitignore)
- **Service role key is sensitive** - only use server-side
- **Use Vercel's environment variables** for production
- **Rotate credentials** periodically in Supabase Dashboard
- **Enable RLS policies** on all tables (already configured)

## Next Steps

1. ✅ Set up environment variables (you are here)
2. Run database migrations: `npm run migrate`
3. Test authentication flow
4. Test API endpoints
5. Deploy to production
