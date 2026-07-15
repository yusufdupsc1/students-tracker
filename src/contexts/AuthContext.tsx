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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, school:schools(*)')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data as AuthContextType['profile'])
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return { error: null }
    } catch (e) {
      return { error: e as Error }
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email: string, password: string, fullName: string, schoolName: string) {
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      if (!authData.user) throw new Error('No user returned')

      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .insert({ name: schoolName } as any)
        .select()
        .single()

      if (schoolError) throw schoolError
      const schoolId = (school as School).id

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: 'admin',
          school_id: schoolId
        } as any)

      if (profileError) throw profileError

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          school_id: schoolId,
          plan_id: 'basic',
          status: 'trialing'
        } as any)

      if (subError) throw subError

      return { error: null }
    } catch (e) {
      return { error: e as Error }
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
