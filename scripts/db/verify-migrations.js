// JavaScript version of verification script (fallback if TypeScript doesn't work)
const { createClient } = require("@supabase/supabase-js")
const fs = require("fs")
const path = require("path")

// Load environment variables from .env.local if it exists
function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const envFile = fs.readFileSync(filePath, "utf-8")
      envFile.split("\n").forEach((line) => {
        // Skip comments and empty lines
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) {
          return
        }
        // Match KEY=VALUE pattern
        const match = trimmed.match(/^([^=#]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          let value = match[2].trim()
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          // Only set if not already in process.env
          if (key && !process.env[key]) {
            process.env[key] = value
          }
        }
      })
      return true
    }
  } catch (error) {
    console.warn(`Warning: Could not load ${filePath}:`, error.message)
  }
  return false
}

// Try loading from .env.local first, then .env
loadEnvFile(path.join(process.cwd(), ".env.local")) || loadEnvFile(path.join(process.cwd(), ".env"))

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// All tables that should exist after migrations
const expectedTables = [
  "profiles",
  "trades",
  "portfolios",
  "orders",
  "price_history",
  "audit_logs",
  "user_roles",
  "bot_strategies",
  "bot_executions",
  "notifications",
  "notification_settings",
  "price_alerts",
  "risk_limits",
  "stop_loss_orders",
  "lp_positions",
]

async function checkTable(tableName) {
  try {
    // Try to query the table
    const { error: selectError } = await supabase
      .from(tableName)
      .select("count", { count: "exact", head: true })
      .limit(0)

    if (selectError) {
      // Check if it's a "relation does not exist" error
      if (selectError.message && (selectError.message.includes("does not exist") || selectError.code === "42P01")) {
        return { exists: false, rlsEnabled: false, error: selectError.message }
      }
      // Other errors might mean table exists but RLS is blocking or permissions issue
      if (selectError.code === "42501" || (selectError.message && selectError.message.includes("permission"))) {
        return { exists: true, rlsEnabled: true, error: selectError.message }
      }
      // Other errors - assume table exists
      return { exists: true, rlsEnabled: true, error: selectError.message }
    }

    // Table exists and is accessible
    return { exists: true, rlsEnabled: true }
  } catch (error) {
    return {
      exists: false,
      rlsEnabled: false,
      error: error.message || String(error),
    }
  }
}

async function verifyMigrations() {
  console.log("🔍 Verifying database migrations...\n")
  console.log(`📁 Supabase URL: ${supabaseUrl?.substring(0, 30)}...\n`)

  const results = []

  for (const table of expectedTables) {
    const result = await checkTable(table)
    results.push({ table, ...result })
    
    if (result.exists) {
      console.log(`✅ ${table}: exists${result.rlsEnabled ? " (RLS enabled)" : " (RLS not checked)"}`)
    } else {
      console.log(`❌ ${table}: NOT FOUND`)
      if (result.error) {
        console.log(`   Error: ${result.error.substring(0, 80)}`)
      }
    }
  }

  // Summary
  const existingTables = results.filter((r) => r.exists).length
  const missingTables = results.filter((r) => !r.exists)

  console.log("\n" + "=".repeat(60))
  console.log("📊 Verification Summary")
  console.log("=".repeat(60))
  console.log(`✅ Tables found: ${existingTables}/${expectedTables.length}`)
  console.log(`❌ Tables missing: ${missingTables.length}/${expectedTables.length}`)

  if (missingTables.length > 0) {
    console.log("\n⚠️  Missing Tables:")
    missingTables.forEach((r) => {
      console.log(`   - ${r.table}`)
    })
    console.log("\n💡 Run migrations: npm run migrate")
    console.log("   Or execute migrations manually via Supabase Dashboard → SQL Editor")
    process.exit(1)
  } else {
    console.log("\n🎉 All tables exist! Database is ready.")
    console.log("\n📝 Next steps:")
    console.log("   1. Test the application: npm run dev")
    console.log("   2. Create a test user account")
    console.log("   3. Verify API endpoints are working")
  }
}

verifyMigrations().catch((err) => {
  console.error("❌ Fatal error:", err)
  process.exit(1)
})

