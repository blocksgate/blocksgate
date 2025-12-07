#!/usr/bin/env node
/**
 * Simple Migration Runner
 * 
 * This script provides instructions for running migrations via Supabase Dashboard
 * since direct SQL execution via API requires custom functions that may not exist.
 * 
 * Usage: node scripts/run-migrations-simple.js
 */

const fs = require("fs")
const path = require("path")

const migrations = [
  "001_create_profiles.sql",
  "002_create_trades.sql",
  "003_create_portfolios.sql",
  "004_create_orders.sql",
  "005_create_price_history.sql",
  "006_create_audit_logs.sql",
  "007_create_user_roles.sql",
  "008_create_bot_strategies.sql",
  "009_create_notifications_tables.sql",
  "010_create_risk_management_tables.sql",
  "011_create_liquidity_pool_tables.sql",
]

const functions = [
  "008_function_active_sessions.sql",
  "009_function_request_rate.sql",
]

console.log("=".repeat(80))
console.log("📋 DATABASE MIGRATION INSTRUCTIONS")
console.log("=".repeat(80))
console.log("\n")
console.log("Direct SQL execution via API requires custom functions that may not exist.")
console.log("Please run migrations manually via Supabase Dashboard:\n")
console.log("=".repeat(80))
console.log("STEP-BY-STEP INSTRUCTIONS")
console.log("=".repeat(80))
console.log("\n1. Go to: https://app.supabase.com")
console.log("2. Select your project")
console.log("3. Navigate to: SQL Editor → New Query")
console.log("4. Copy and paste each migration file content in order")
console.log("5. Click 'Run' (or press Ctrl+Enter)")
console.log("6. Verify success message")
console.log("7. Repeat for each migration file\n")
console.log("=".repeat(80))
console.log("MIGRATION FILES (Run in this order):")
console.log("=".repeat(80))

const scriptDir = __dirname

migrations.forEach((migration, index) => {
  const filePath = path.join(scriptDir, migration)
  console.log(`\n${index + 1}. ${migration}`)
  console.log("-".repeat(80))
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split("\n").length
    console.log(`   📁 File: ${filePath}`)
    console.log(`   📄 Lines: ${lines}`)
    console.log(`   ✅ File exists`)
  } else {
    console.log(`   ❌ FILE NOT FOUND: ${filePath}`)
  }
})

console.log("\n" + "=".repeat(80))
console.log("FUNCTIONS (Run after all tables):")
console.log("=".repeat(80))

functions.forEach((func, index) => {
  const filePath = path.join(scriptDir, func)
  console.log(`\n${migrations.length + index + 1}. ${func}`)
  console.log("-".repeat(80))
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8")
    const lines = content.split("\n").length
    console.log(`   📁 File: ${filePath}`)
    console.log(`   📄 Lines: ${lines}`)
    console.log(`   ✅ File exists`)
  } else {
    console.log(`   ❌ FILE NOT FOUND: ${filePath}`)
  }
})

console.log("\n" + "=".repeat(80))
console.log("VERIFICATION")
console.log("=".repeat(80))
console.log("\nAfter running all migrations, verify with:")
console.log("  npm run migrate:verify")
console.log("\nOr check in Supabase Dashboard → Table Editor")
console.log("You should see all tables: profiles, trades, portfolios, orders, etc.\n")

console.log("=".repeat(80))
console.log("TROUBLESHOOTING")
console.log("=".repeat(80))
console.log("\nIf you encounter errors:")
console.log("1. Check that you're using the correct Supabase project")
console.log("2. Verify environment variables are set correctly")
console.log("3. Ensure you have proper permissions (use service role key)")
console.log("4. Check Supabase logs in the dashboard")
console.log("5. See MIGRATION_INSTRUCTIONS.md for detailed troubleshooting\n")

