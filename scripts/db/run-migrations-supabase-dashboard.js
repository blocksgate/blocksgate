#!/usr/bin/env node
/**
 * Migration Runner for Supabase Dashboard
 * 
 * This script generates instructions for running migrations via Supabase Dashboard
 * since direct SQL execution via API may not be available.
 * 
 * Usage: node scripts/run-migrations-supabase-dashboard.js
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
console.log("📋 SUPABASE DASHBOARD MIGRATION INSTRUCTIONS")
console.log("=".repeat(80))
console.log("\n")
console.log("Since direct SQL execution via API may not be available,")
console.log("please run these migrations manually via Supabase Dashboard:\n")
console.log("1. Go to: https://app.supabase.com")
console.log("2. Select your project")
console.log("3. Navigate to: SQL Editor → New Query")
console.log("4. Copy and paste each migration file content in order\n")
console.log("=".repeat(80))
console.log("MIGRATION ORDER:")
console.log("=".repeat(80))

migrations.forEach((migration, index) => {
  const filePath = path.join(__dirname, migration)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8")
    console.log(`\n${index + 1}. ${migration}`)
    console.log("-".repeat(80))
    console.log(content.substring(0, 200) + "...")
    console.log(`\n   📁 Full file: ${filePath}`)
  } else {
    console.log(`\n${index + 1}. ${migration} ❌ FILE NOT FOUND`)
  }
})

console.log("\n" + "=".repeat(80))
console.log("FUNCTIONS (Run after tables):")
console.log("=".repeat(80))

functions.forEach((func, index) => {
  const filePath = path.join(__dirname, func)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8")
    console.log(`\n${index + 1}. ${func}`)
    console.log("-".repeat(80))
    console.log(content.substring(0, 200) + "...")
    console.log(`\n   📁 Full file: ${filePath}`)
  } else {
    console.log(`\n${index + 1}. ${func} ❌ FILE NOT FOUND`)
  }
})

console.log("\n" + "=".repeat(80))
console.log("✅ VERIFICATION")
console.log("=".repeat(80))
console.log("\nAfter running all migrations, verify with:")
console.log("  npm run migrate:verify\n")

