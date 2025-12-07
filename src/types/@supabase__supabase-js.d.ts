// Type declaration for @supabase/supabase-js to help TypeScript resolve the module
declare module '@supabase/supabase-js' {
  export interface SupabaseClientOptions<SchemaName extends string = 'public'> {
    auth?: {
      persistSession?: boolean
      storage?: Storage | null
      autoRefreshToken?: boolean
      detectSessionInUrl?: boolean
      flowType?: 'pkce' | 'implicit'
    }
    db?: {
      schema?: SchemaName
    }
    global?: {
      headers?: Record<string, string>
    }
    realtime?: {
      params?: {
        eventsPerSecond?: number
      }
    }
  }

  export interface SupabaseClient<Database = any, SchemaNameOrClientOptions = any, SchemaName extends string = 'public'> {
    auth: {
      getSession: () => Promise<any>
      getUser: () => Promise<any>
      signInWithPassword: (credentials: { email: string; password: string }) => Promise<any>
      signUp: (credentials: { email: string; password: string; options?: any }) => Promise<any>
      signOut: () => Promise<any>
      onAuthStateChange: (callback: (event: string, session: any) => void) => { data: { subscription: any }; error: any }
    }
    from: (table: string) => any
    rpc: (fn: string, args?: any) => any
    storage: any
    realtime: any
    rest: any
  }

  export function createClient<Database = any, SchemaName extends string = 'public'>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: SupabaseClientOptions<SchemaName>
  ): SupabaseClient<Database, any, SchemaName>

  export type { SupabaseClient, SupabaseClientOptions }
}

