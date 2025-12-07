# Database Migration Instructions

This guide provides step-by-step instructions for executing database migrations on Supabase.

## Prerequisites

1. Supabase project created and connected
2. Environment variables configured in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Migration Scripts

All migration scripts are located in the `scripts/` directory. They must be executed **in order**:

### Core Tables (Required)
1. `001_create_profiles.sql` - User profiles
2. `002_create_trades.sql` - Trade history
3. `003_create_portfolios.sql` - Portfolio tracking
4. `004_create_orders.sql` - Limit orders
5. `005_create_price_history.sql` - Price data
6. `006_create_audit_logs.sql` - Audit logging

### Extended Features
7. `007_create_user_roles.sql` - User roles and permissions
8. `008_create_bot_strategies.sql` - Trading bot strategies
9. `009_create_notifications_tables.sql` - Notifications system
10. `010_create_risk_management_tables.sql` - Risk management
11. `011_create_liquidity_pool_tables.sql` - LP positions

### Functions
- `008_function_active_sessions.sql` - Active sessions function
- `009_function_request_rate.sql` - Request rate function

## Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** → **New Query**
4. Copy the content from each migration file (in order)
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)
7. Verify the migration completed successfully
8. Repeat for all migration files

### Verification

After running all migrations, verify in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'profiles', 'trades', 'portfolios', 'orders', 
  'price_history', 'audit_logs', 'user_roles',
  'bot_strategies', 'bot_executions', 'notifications',
  'notification_settings', 'price_alerts', 'risk_limits',
  'stop_loss_orders', 'lp_positions'
)
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN (
  'profiles', 'trades', 'portfolios', 'orders', 
  'price_history', 'user_roles', 'bot_strategies',
  'notifications', 'risk_limits', 'lp_positions'
);
```

Expected: All tables should exist with RLS enabled (except `price_history` and `audit_logs` which are public/admin-only).

## Method 2: Using Migration Script (Alternative)

The project includes a migration runner script, but it requires direct database access:

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate

# Verify migrations
npm run migrate:verify
```

**Note:** This method may not work if your Supabase project doesn't allow direct SQL execution via API. Use Method 1 if this fails.

## Method 3: Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Troubleshooting

### Error: "relation already exists"
- The table was already created
- Solution: Check if the table exists, and either skip or drop it first

### Error: "permission denied"
- Your user doesn't have proper permissions
- Solution: Use the service role key or ensure you're using the correct Supabase project

### Error: "RLS policy error"
- RLS policies couldn't be created
- Solution: Ensure you're running the full script, check for syntax errors

### Error: "function does not exist"
- A function referenced in a migration doesn't exist
- Solution: Ensure all function migrations are run before table migrations that use them

## Rollback

If you need to rollback migrations:

```sql
-- Drop all tables (CAUTION: This deletes all data)
DROP TABLE IF EXISTS public.lp_positions CASCADE;
DROP TABLE IF EXISTS public.stop_loss_orders CASCADE;
DROP TABLE IF EXISTS public.risk_limits CASCADE;
DROP TABLE IF EXISTS public.price_alerts CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.bot_executions CASCADE;
DROP TABLE IF EXISTS public.bot_strategies CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.price_history CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;
DROP TABLE IF EXISTS public.trades CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
```

Then re-execute the migration scripts.

## Next Steps

After migrations are complete:

1. Verify with `npm run migrate:verify`
2. Test authentication: Sign up a new user
3. Test API endpoints: Create a trade, order, etc.
4. Check RLS policies: Verify users can only access their own data

## Support

If you encounter issues:
1. Check Supabase logs in the dashboard
2. Verify environment variables are set correctly
3. Ensure you're using the correct project
4. Check the migration scripts for syntax errors

