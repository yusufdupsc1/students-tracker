/**
 * Supabase client — OPTIONAL in local lite mode
 * 
 * By default the app uses 100% in-browser IndexedDB (Dexie) — no external DB.
 * This file is kept for backward compatibility / optional cloud sync.
 * If VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are empty, auth uses local IndexedDB (see src/lib/localAuth.ts).
 * 
 * To re-enable Supabase auth, set in .env.local:
 *   VITE_USE_SUPABASE=true
 *   VITE_SUPABASE_URL=...
 *   VITE_SUPABASE_ANON_KEY=...
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const useSupabase = import.meta.env.VITE_USE_SUPABASE === 'true'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const fallbackUrl = 'https://hzgaflrabmrcsokhoatv.supabase.co'

if (useSupabase) {
  if (!supabaseUrl) console.warn('[Supabase] VITE_SUPABASE_URL not set — Supabase auth disabled, falling back to local')
  if (!supabaseAnonKey) console.warn('[Supabase] VITE_SUPABASE_ANON_KEY not set — Supabase auth will fail')
} else {
  // Local lite mode — no warning, this is the default
  if (import.meta.env.DEV) console.log('[Supabase] Local lite mode — IndexedDB via Dexie (no external DB)')
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

// Helper to know if cloud auth is active
export const isSupabaseEnabled = () => useSupabase && !!supabaseUrl && !!supabaseAnonKey

export type { Database }
