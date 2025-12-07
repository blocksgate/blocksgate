# Migration Script Fix - TypeScript to JavaScript

## Problem

The migration script was failing with TypeScript compilation errors:
```
TypeError: Unknown file extension ".ts"
```

This was caused by ts-node configuration issues with ES modules.

## Solution

Created JavaScript versions of the migration scripts that work directly with Node.js without requiring TypeScript compilation.

## Files Created

1. **scripts/run-migrations.js** - JavaScript version of migration script
2. **scripts/verify-migrations.js** - JavaScript version of verification script
3. **tsconfig.scripts.json** - TypeScript config for scripts (for future use)

## Updated Package.json Scripts

- `npm run migrate` - Now uses JavaScript version (works immediately)
- `npm run migrate:ts` - TypeScript version (if you want to use TypeScript)
- `npm run migrate:verify` - Now uses JavaScript version
- `npm run migrate:verify:ts` - TypeScript version

## Environment Variables

The JavaScript scripts automatically load environment variables from:
1. `.env.local` (preferred)
2. `.env` (fallback)

They handle:
- Comments (lines starting with `#`)
- Empty lines
- Quoted values (single or double quotes)
- Existing environment variables (won't override)

## Usage

### Run Migrations
```bash
npm run migrate
```

This will:
1. Check if `exec_sql` function exists in Supabase
2. If not, provide instructions to use Supabase Dashboard
3. If yes, attempt to run migrations automatically

### View Instructions
```bash
npm run migrate:simple
```

This displays step-by-step instructions for manual migration via Supabase Dashboard.

### Verify Migrations
```bash
npm run migrate:verify
```

This checks if all required tables exist in your Supabase database.

## Environment Variables Required

Make sure your `.env.local` file contains:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Troubleshooting

### Error: "Missing environment variables"
- Check that `.env.local` exists in the project root
- Verify the variable names are correct
- Make sure there are no syntax errors in `.env.local`

### Error: "exec_sql function not found"
- This is expected - Supabase doesn't provide this by default
- Use `npm run migrate:simple` to get instructions for manual migration
- Or run migrations via Supabase Dashboard → SQL Editor

### Scripts work but migrations fail
- Check your Supabase credentials
- Verify you have proper permissions (use service role key)
- Check Supabase logs in the dashboard

## Next Steps

1. Ensure `.env.local` is properly configured
2. Run `npm run migrate` (it will guide you if automated execution isn't available)
3. Or use `npm run migrate:simple` for manual migration instructions
4. After migrations, run `npm run migrate:verify` to confirm

## Benefits of JavaScript Version

- ✅ No TypeScript compilation needed
- ✅ Works immediately with Node.js
- ✅ No ts-node configuration issues
- ✅ Faster execution
- ✅ Easier debugging

The TypeScript versions are still available if you prefer type safety, but the JavaScript versions are recommended for simplicity and reliability.

