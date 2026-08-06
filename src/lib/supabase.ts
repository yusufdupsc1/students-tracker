import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Fallback to known project for local dev convenience, but warn if env missing in production.
// In production (Vercel), VITE_SUPABASE_* must be set via dashboard env vars.
const fallbackUrl = 'https://hzgaflrabmrcsokhoatv.supabase.co'

if (!supabaseUrl) {
  console.warn('[Supabase] VITE_SUPABASE_URL not set, using fallback project. Set env vars for production.')
}
if (!supabaseAnonKey) {
  console.warn('[Supabase] VITE_SUPABASE_ANON_KEY not set — auth will fail. Set it in .env or Vercel env.')
}

export const supabase = createClient<Database>(
  supabaseUrl || fallbackUrl,
  (supabaseAnonKey || (import.meta.env.DEV ? 'placeholder-key' : '')) as string,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
)

export type { Database }
