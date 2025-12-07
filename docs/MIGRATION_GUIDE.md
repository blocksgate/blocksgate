# Database Migration Guide

This guide will help you execute the database migrations to set up your DeFi trading platform.

## Prerequisites

1. Supabase project created and connected
2. Environment variables configured:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Migration Scripts

The following 6 migration scripts must be executed **in order**:

### Step 1: Create Profiles Table
**File**: `scripts/001_create_profiles.sql`
- Stores user profile information
- Linked to Supabase auth.users
- RLS policies for user isolation

### Step 2: Create Trades Table
**File**: `scripts/002_create_trades.sql`
- Complete transaction history
- Tracks swaps, limit orders, arbitrage, flash loans, and bridges
- Includes MEV protection flags
- Indexes for performance

### Step 3: Create Portfolios Table
**File**: `scripts/003_create_portfolios.sql`
- Current holdings per user and chain
- Tracks balance, USD value, cost basis, and P&L
- Updates automatically after trades

### Step 4: Create Orders Table
**File**: `scripts/004_create_orders.sql`
- Limit orders, DCA orders, and stop-loss orders
- Tracks pending, filled, cancelled, and expired states
- Price target and expiration tracking

### Step 5: Create Price History Table
**File**: `scripts/005_create_price_history.sql`
- Historical price data for analytics
- Public data (no RLS)
- Indexes for efficient queries

### Step 6: Create Audit Logs Table
**File**: `scripts/006_create_audit_logs.sql`
- Security and compliance tracking
- Logs all user actions
- Accessed via service role

## How to Execute

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the content from `scripts/001_create_profiles.sql`
5. Click **Run**
6. Repeat for scripts 002-006 **in order**

### Option 2: Using Supabase CLI

\`\`\`bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Execute migrations
supabase db push scripts/001_create_profiles.sql
supabase db push scripts/002_create_trades.sql
supabase db push scripts/003_create_portfolios.sql
supabase db push scripts/004_create_orders.sql
supabase db push scripts/005_create_price_history.sql
supabase db push scripts/006_create_audit_logs.sql
\`\`\`

### Option 3: Using Node.js Script

Run the provided migration script:

\`\`\`bash
node scripts/run-migrations.js
\`\`\`

## Verification

After executing all migrations, verify they were successful:

\`\`\`sql
-- Check profiles table
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'trades', 'portfolios', 'orders', 'price_history', 'audit_logs');

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
\`\`\`

Expected output: 6 tables with Row Level Security enabled.

## Rollback

If you need to rollback a migration:

\`\`\`sql
-- Drop all tables (CAUTION: This deletes all data)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.trades CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
\`\`\`

Then re-execute the migration scripts.

## Troubleshooting

### Issue: "relation already exists"
- The table was already created
- Solution: Drop the table and re-run, or modify the script

### Issue: "permission denied"
- Your Supabase user doesn't have proper permissions
- Solution: Use the service role key or ask your Supabase admin

### Issue: "RLS policy error"
- RLS policies couldn't be created
- Solution: Ensure the script ran fully, check for syntax errors

## Next Steps

1. Test the authentication flow (see TESTING_GUIDE.md)
2. Verify API endpoints (see API_DOCUMENTATION.md)
3. Set up monitoring and error tracking
4. Deploy to production
