# Supabase Configuration Guide

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one if you don't have one)
3. Click **Settings** → **API** in the left sidebar
4. You'll find:
   - **Project URL** → Copy this as `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon (public) key** → Copy this as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → Copy this as `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Add Environment Variables

### Option A: Using Vercel Dashboard
1. Go to your Vercel project settings
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL=<your_project_url>`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>`
   - `SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>`
   - `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback` (for local dev)

### Option B: Using v0 Vars Sidebar
1. Click **Vars** in the v0 sidebar
2. Add each variable with the values from Step 1

### Option C: Local Development (.env.local)
\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=<your_project_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
\`\`\`

## Step 3: Run Database Migrations

Once environment variables are set:

\`\`\`bash
npm run migrate
# or
ts-node scripts/run-migrations.ts
\`\`\`

Follow the prompts to execute all 6 migration scripts in order.

## Step 4: Verify Setup

1. Check that all tables were created:
   - Open Supabase Dashboard → **SQL Editor**
   - Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';`
   - You should see: `profiles`, `trades`, `portfolios`, `orders`, `price_history`, `audit_logs`

2. Verify RLS policies:
   - Each table should have RLS enabled with appropriate policies

## Step 5: Enable Email Confirmation (Optional but Recommended)

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Click **Email**
3. Enable "Confirm email"
4. Set up email templates or use the default

## Troubleshooting

### Error: "Your project's URL and Key are required"
- ✅ Environment variables not set in Vercel or local .env file
- Solution: Add all three variables from Step 1 to your environment

### Error: "Relation "public.profiles" does not exist"
- ✅ Migrations haven't been run yet
- Solution: Execute migrations using `npm run migrate` (after env vars are set)

### Error: "Permission denied for schema public"
- ✅ RLS policies not created properly
- Solution: Check Supabase SQL Editor and verify policies exist on each table

### Error: "Email confirmation failed"
- ✅ NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL might be incorrect
- Solution: Make sure it matches your deployment URL or localhost:3000 for local dev

## Quick Checklist

- [ ] Supabase project created
- [ ] API credentials copied to environment
- [ ] Environment variables added to Vercel/v0 Vars
- [ ] Database migrations executed
- [ ] All 6 tables created (verify in SQL Editor)
- [ ] RLS policies enabled on tables
- [ ] Email confirmation settings configured
- [ ] Auth pages accessible at /auth/login and /auth/sign-up

## Next Steps

1. Start the development server: `npm run dev`
2. Visit http://localhost:3000/auth/sign-up
3. Create a test account
4. Confirm your email in Supabase Dashboard (Authentication → Users)
5. Login and access /dashboard

For more details, check TESTING_GUIDE.md and MIGRATION_GUIDE.md
