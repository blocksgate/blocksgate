import { supabase } from './client'

interface User {
  id: string
  email?: string
  role?: string
}

export async function verifyToken(token: string): Promise<User> {
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error) {
    throw new Error('Invalid token')
  }

  if (!user) {
    throw new Error('User not found')
  }

  return {
    id: user.id,
    email: user.email || undefined,
    role: user.role || undefined
  }
}