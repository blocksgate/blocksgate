import { createClient } from "@supabase/supabase-js"

async function verifySuabaseSetup() {
  console.log("🔍 Verifying Supabase Setup...\n")

  // Check environment variables
  console.log("1️⃣  Checking Environment Variables:")
  const requiredEnvs = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

  let allEnvSet = true
  for (const env of requiredEnvs) {
    const value = process.env[env]
    if (!value) {
      console.log(`   ❌ ${env} is NOT set`)
      allEnvSet = false
    } else {
      const masked = value.substring(0, 10) + "..."
      console.log(`   ✅ ${env} is set (${masked})`)
    }
  }

  if (!allEnvSet) {
    console.log("\n❌ Missing required environment variables!")
    console.log("   Please add them to .env.local or Vercel environment settings")
    process.exit(1)
  }

  console.log("\n2️⃣  Testing Supabase Connection:")

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log(`   ❌ Connection failed: ${error.message}`)
      process.exit(1)
    }

    console.log("   ✅ Successfully connected to Supabase")
  } catch (error) {
    console.log(`   ❌ Error connecting to Supabase: ${error}`)
    process.exit(1)
  }

  console.log("\n3️⃣  Checking Database Tables:")

  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const tables = ["profiles", "trades", "portfolios", "orders", "price_history", "audit_logs"]

    for (const table of tables) {
      const { error } = await supabase.from(table).select("count", { count: "exact", head: true })

      if (error) {
        console.log(`   ⚠️  ${table}: table may not exist yet`)
      } else {
        console.log(`   ✅ ${table}: exists and accessible`)
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Could not verify tables: ${error}`)
  }

  console.log("\n✅ Supabase setup verification complete!")
  console.log("\n📝 Next steps:")
  console.log("   1. Run migrations: npm run migrate")
  console.log("   2. Test auth: npm run dev")
  console.log("   3. Visit http://localhost:3000 and try signing up")
}

verifySuabaseSetup().catch(console.error)
