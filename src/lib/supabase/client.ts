import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

// Do not read env vars at module import time to avoid throwing during
// static analysis / build steps. Instead, read them when creating the
// client so Next.js can import modules without requiring runtime envs.
let supabaseClient: ReturnType<typeof createSupabaseClient<Database>> | null = null

export function createClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}

// Backwards-compatible export: a lazy proxy that forwards property
// access to the real client returned by `createClient()`.
// This allows existing code that does `import { supabase } from "./client"`
// and calls `supabase.from(...)` to continue working without changing
// all call sites. The proxy will create the real client on first access.
export const supabase: any = new Proxy(
  {},
  {
    get(_target, prop: string) {
      const client = createClient()
      const value = (client as any)[prop]
      if (typeof value === 'function') return value.bind(client)
      return value
    },
  },
)
