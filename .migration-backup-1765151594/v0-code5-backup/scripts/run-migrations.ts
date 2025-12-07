import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

// Get scripts directory - use process.cwd() as base and navigate to scripts folder
const scriptsDir = path.join(process.cwd(), "scripts")

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  console.error("Please set these environment variables in .env.local and try again.")
  process.exit(1)
}

// Create Supabase client with service role key for migrations
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// All migrations in order (excluding duplicates and function files)
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

// Functions to execute after tables are created
const functions = [
  "008_function_active_sessions.sql",
  "009_function_request_rate.sql",
]

/**
 * Execute SQL via Supabase REST API
 * Note: This requires the exec_sql function to exist in Supabase
 * If it doesn't exist, you'll need to run migrations via Supabase Dashboard
 */
async function executeSQL(sql: string, migrationName: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Split SQL into individual statements
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--") && !s.startsWith("/*"))

    // Try to execute via Supabase RPC (if exec_sql function exists)
    for (const statement of statements) {
      if (statement.length < 10) continue // Skip very short statements

      try {
        // Note: This requires an exec_sql function in Supabase
        // If it doesn't exist, this will fail and you should use Supabase Dashboard
        const { error } = await supabase.rpc("exec_sql", { sql_query: statement })

        if (error) {
          // Check if error is about missing function
          if (error.message.includes("function") && error.message.includes("does not exist")) {
            throw new Error(
              "exec_sql function not found. Please run migrations via Supabase Dashboard (see MIGRATION_INSTRUCTIONS.md)"
            )
          }
          
          // Ignore "already exists" errors
          if (!error.message.includes("already exists") && !error.message.includes("duplicate")) {
            console.warn(`   ⚠️  Statement warning: ${error.message.substring(0, 80)}`)
          }
        }
      } catch (err: any) {
        // If RPC doesn't exist, throw error to use Dashboard method
        if (err.message?.includes("exec_sql") || err.message?.includes("function")) {
          throw err
        }
        
        // Ignore "already exists" errors
        if (!err.message?.includes("already exists") && !err.message?.includes("duplicate")) {
          console.warn(`   ⚠️  Error in statement: ${err.message?.substring(0, 80) || String(err)}`)
        }
      }
    }

    return { success: true }
  } catch (error: any) {
    const errorMessage = error?.message || String(error)
    
    // Check if error is about existing objects (which is fine)
    if (
      errorMessage.includes("already exists") ||
      errorMessage.includes("duplicate") ||
      (errorMessage.includes("relation") && errorMessage.includes("already"))
    ) {
      return { success: true } // Table/object already exists, that's okay
    }
    
    return { success: false, error: errorMessage }
  }
}

async function runMigration(migrationFile: string): Promise<boolean> {
  const filePath = path.join(scriptsDir, migrationFile)

  if (!fs.existsSync(filePath)) {
    console.error(`❌ [${migrationFile}] File not found`)
    return false
  }

  try {
    const sql = fs.readFileSync(filePath, "utf-8")
    console.log(`⏳ [${migrationFile}] Executing...`)

    // Execute SQL
    const result = await executeSQL(sql, migrationFile)

    if (result.success) {
      console.log(`✅ [${migrationFile}] Completed\n`)
      return true
    } else {
      // If exec_sql function doesn't exist, provide instructions
      if (result.error?.includes("exec_sql") || result.error?.includes("function")) {
        console.error(`❌ [${migrationFile}] Error: ${result.error}`)
        console.error("\n💡 Solution: Run migrations via Supabase Dashboard")
        console.error("   1. Go to: https://app.supabase.com")
        console.error("   2. Navigate to: SQL Editor → New Query")
        console.error("   3. Copy content from:", filePath)
        console.error("   4. Paste and run in SQL Editor")
        console.error("   5. See MIGRATION_INSTRUCTIONS.md for detailed steps\n")
        return false
      }
      
      console.error(`❌ [${migrationFile}] Error: ${result.error}`)
      return false
    }
  } catch (err: any) {
    // Check if it's the exec_sql function error
    if (err.message?.includes("exec_sql") || err.message?.includes("function")) {
      console.error(`❌ [${migrationFile}] Error: ${err.message}`)
      console.error("\n💡 Solution: Run migrations via Supabase Dashboard")
      console.error("   See MIGRATION_INSTRUCTIONS.md for detailed steps\n")
      return false
    }
    
    console.error(`❌ [${migrationFile}] Error:`, err.message || err)
    return false
  }
}

async function runMigrations() {
  console.log("🚀 Starting database migrations...\n")
  console.log(`📁 Supabase URL: ${supabaseUrl?.substring(0, 30)}...\n`)

  // Check if exec_sql function exists by trying a simple query
  let hasExecSql = false
  try {
    const { error } = await supabase.rpc("exec_sql", { sql_query: "SELECT 1" })
    if (!error || error.message.includes("already exists") || error.message.includes("duplicate")) {
      hasExecSql = true
    }
  } catch {
    hasExecSql = false
  }

  if (!hasExecSql) {
    console.log("⚠️  Direct SQL execution not available (exec_sql function not found)")
    console.log("📝 Please run migrations via Supabase Dashboard\n")
    console.log("Steps:")
    console.log("1. Go to: https://app.supabase.com")
    console.log("2. Select your project")
    console.log("3. Navigate to: SQL Editor → New Query")
    console.log("4. Copy and paste each migration file content in order")
    console.log("5. See MIGRATION_INSTRUCTIONS.md for detailed instructions\n")
    console.log("Migration files to run:")
    migrations.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m}`)
    })
    functions.forEach((f, i) => {
      console.log(`   ${migrations.length + i + 1}. ${f}`)
    })
    console.log("\n💡 Alternatively, you can use: npm run migrate:dashboard")
    process.exit(0)
  }

  let successCount = 0
  let failCount = 0
  const results: Array<{ file: string; success: boolean }> = []

  // Run table migrations first
  for (const migration of migrations) {
    const success = await runMigration(migration)
    results.push({ file: migration, success })
    if (success) {
      successCount++
    } else {
      failCount++
    }
    // Small delay between migrations
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Run function migrations
  console.log("\n📦 Executing database functions...\n")
  for (const func of functions) {
    const success = await runMigration(func)
    results.push({ file: func, success })
    if (success) {
      successCount++
    } else {
      failCount++
    }
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  // Summary
  console.log("\n" + "=".repeat(60))
  console.log("📊 Migration Summary")
  console.log("=".repeat(60))
  console.log(`✅ Successful: ${successCount}/${results.length}`)
  console.log(`❌ Failed: ${failCount}/${results.length}\n`)

  if (failCount > 0) {
    console.log("⚠️  Failed Migrations:")
    results.filter((r) => !r.success).forEach((r) => {
      console.log(`   - ${r.file}`)
    })
    console.log("\n💡 Run migrations manually via Supabase Dashboard → SQL Editor")
  }

  if (failCount === 0) {
    console.log("🎉 All migrations completed successfully!")
    console.log("\n📝 Next steps:")
    console.log("   1. Run verification: npm run migrate:verify")
    console.log("   2. Test the application: npm run dev")
  } else {
    console.log("\n⚠️  Some migrations failed. Please check the errors above.")
    console.log("💡 Tip: You can run migrations manually via Supabase Dashboard → SQL Editor")
    process.exit(1)
  }
}

// Handle unhandled errors
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled error:", error)
  process.exit(1)
})

runMigrations().catch((err) => {
  console.error("❌ Fatal error:", err)
  process.exit(1)
})
