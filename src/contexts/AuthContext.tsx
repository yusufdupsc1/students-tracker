import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { School, UserProfile } from '../lib/database.types'

interface AuthContextType {
  user: User | null
  profile: (UserProfile & { school: School }) | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, schoolName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AuthContextType['profile']>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function init() {
      try {
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            console.warn('[Auth] getSession timeout fallback after 4s')
            setLoading(false)
          }
        }, 4000)

        const { data: { session }, error } = await supabase.auth.getSession()
        if (cancelled) return
        clearTimeout(timeoutId)

        if (error) {
          console.error('[Auth] getSession error:', error)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        console.log('[Auth] getSession:', session?.user?.email || 'no session')
        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            await loadProfile(session.user.id)
          } catch {
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        if (!cancelled) setLoading(false)
      } catch (err) {
        if (cancelled) return
        if (timeoutId) clearTimeout(timeoutId)
        console.error('[Auth] init error:', err)
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return
      console.log('[Auth] state change:', _event, session?.user?.email || 'logged out')
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          await loadProfile(session.user.id)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, school:schools(*)')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[Auth] loadProfile error:', error.message)
      // If profile missing, set null but don't throw hard – allows recovery
      if (error.code === 'PGRST116') {
        setProfile(null)
        return
      }
      throw error
    }
    if (!data) {
      console.warn('[Auth] No profile found for user', userId)
      setProfile(null)
      return
    }
    setProfile(data as AuthContextType['profile'])
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const trimmedEmail = email.trim().toLowerCase()
      const { data, error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
      if (error) throw error
      if (data.user) {
        try {
          await loadProfile(data.user.id)
        } catch {
          // profile may not exist yet (e.g., email confirmation flow created auth but no profile)
          // Try to handle pending signup recovery: if no profile, keep user logged in but profile null
          // ProtectedRoute will handle missing subscription case gracefully
          setProfile(null)
        }
      }
      return { error: null }
    } catch (e) {
      const err = e as Error
      console.error('[Auth] signIn failed:', err.message)
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email: string, password: string, fullName: string, schoolName: string) {
    setLoading(true)
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedName = fullName.trim()
    const trimmedSchool = schoolName.trim()

    if (!trimmedEmail || !password || !trimmedName || !trimmedSchool) {
      setLoading(false)
      return { error: new Error('সব ফিল্ড পূরণ করুন') }
    }
    if (password.length < 6) {
      setLoading(false)
      return { error: new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে') }
    }

    let createdSchoolId: string | null = null
    let createdUserId: string | null = null

    try {
      // 1. Create auth user – with email confirmations disabled, this returns a session immediately
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedName, school_name: trimmedSchool },
          // when confirmations disabled, Supabase logs in immediately
          // emailRedirectTo is still useful if confirmations get enabled
          emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
        },
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('ইউজার তৈরি হয়নি')

      createdUserId = authData.user.id

      // If no session (email confirmation required), inform user and stop – profile creation will happen after confirmation on next login
      if (!authData.session) {
        console.warn('[Auth] No session after signup – email confirmation required')
        return { error: null } // allow caller to redirect to login with message
      }

      // 2. Create school
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({ name: trimmedSchool } as any)
        .select()
        .single()

      if (schoolError) {
        // Cleanup auth user if possible? Cannot delete auth via anon, so just report
        throw new Error(`স্কুল তৈরি ব্যর্থ: ${schoolError.message}`)
      }
      createdSchoolId = (school as School).id

      // 3. Create profile linked to school and auth user
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: createdUserId,
          email: trimmedEmail,
          full_name: trimmedName,
          role: 'admin',
          school_id: createdSchoolId,
        } as any)

      if (profileError) {
        // Cleanup orphaned school
        if (createdSchoolId) {
          try {
            await supabase.from('schools').delete().eq('id', createdSchoolId)
          } catch {}
        }
        throw new Error(`প্রোফাইল তৈরি ব্যর্থ: ${profileError.message}`)
      }

      // 4. Create trialing subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          school_id: createdSchoolId,
          plan_id: 'basic',
          status: 'trialing',
        } as any)

      if (subError) {
        console.error('[Auth] Subscription create failed (non-fatal):', subError.message)
        // Don't fail signup for subscription error – ProtectedRoute will handle missing subscription gracefully
        // Try to continue; user can still access app
      }

      // Reload profile to populate context
      await loadProfile(createdUserId)

      return { error: null }
    } catch (e) {
      const err = e as Error
      console.error('[Auth] signUp failed:', err.message)
      // Provide Bengali-friendly error mapping
      if (err.message.includes('already registered') || err.message.includes('already exists') || err.message.includes('User already registered')) {
        return { error: new Error('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।') }
      }
      if (err.message.includes('Password should be at least 6 characters')) {
        return { error: new Error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে') }
      }
      if (err.message.includes('Database error') || err.message.includes('RLS') || err.message.includes('row-level security')) {
        return { error: new Error('ডাটাবেস অনুমতি ত্রুটি। অনুগ্রহ করে পরে আবার চেষ্টা করুন বা সাপোর্টে যোগাযোগ করুন।') }
      }
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
