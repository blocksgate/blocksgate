import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error("Auth callback error:", error)
        return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url))
      }
    } catch (error) {
      console.error("Auth callback exception:", error)
      return NextResponse.redirect(new URL("/auth/login?error=auth_failed", request.url))
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
