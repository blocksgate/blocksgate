// Type declaration for @supabase/ssr to help TypeScript resolve the module
declare module '@supabase/ssr' {
  import type { SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'

  export interface CookieOptionsWithName {
    name?: string
    domain?: string
    maxAge?: number
    path?: string
    sameSite?: 'strict' | 'lax' | 'none'
    secure?: boolean
  }

  export interface CookieMethodsServer {
    getAll(): Array<{ name: string; value: string }>
    setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptionsWithName }>): void
  }

  export function createServerClient<Database = any, SchemaName extends string = 'public'>(
    supabaseUrl: string,
    supabaseKey: string,
    options: SupabaseClientOptions<SchemaName> & {
      cookieOptions?: CookieOptionsWithName
      cookies: CookieMethodsServer
      cookieEncoding?: 'raw' | 'base64url'
    }
  ): SupabaseClient<Database, SchemaName>

  export function createBrowserClient<Database = any, SchemaName extends string = 'public'>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<SchemaName>
  ): SupabaseClient<Database, SchemaName>
}

