import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getStoredSession,
  setStoredSession,
  clearStoredSession,
  signInLocal,
  signUpLocal,
  loadProfileLocal,
  signOutLocal,
  type LocalAuthUser,
  type LocalProfile,
} from '../lib/localAuth'

// Keep same export names so Login/Signup/ProtectedRoute don't need to change
interface AuthContextType {
  user: LocalAuthUser | null
  profile: LocalProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, schoolName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalAuthUser | null>(null)
  const [profile, setProfile] = useState<LocalProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        // Ensure persistent storage is requested (IndexedDB stays under pressure)
        try {
          if (navigator.storage?.persist) {
            const already = await navigator.storage.persisted()
            if (!already) await navigator.storage.persist()
          }
        } catch {}

        // One-time cleanup: remove legacy Supabase keys (local lite mode — no email verification, no external DB)
        try {
          Object.keys(localStorage).forEach((k) => {
            if (k.startsWith('sb-') || k.includes('supabase') || k.startsWith('supabase-') || k === 'supabase.auth.token') {
              localStorage.removeItem(k)
            }
          })
        } catch {}

        const session = getStoredSession()
        if (!session) {
          if (!cancelled) {
            setUser(null)
            setProfile(null)
            setLoading(false)
          }
          return
        }

        // Validate session: user must still exist in DB
        const prof = await loadProfileLocal(session.id)
        if (!prof) {
          // Session stale (user deleted) → clear
          clearStoredSession()
          if (!cancelled) {
            setUser(null)
            setProfile(null)
          }
        } else {
          if (!cancelled) {
            setUser(session)
            setProfile(prof)
          }
        }
      } catch (e) {
        console.error('[LocalAuth] init error:', e)
        if (!cancelled) {
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    // Listen for storage changes (multi-tab sync)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'bejkhonda-session') {
        const sess = getStoredSession()
        if (!sess) {
          setUser(null)
          setProfile(null)
        } else {
          loadProfileLocal(sess.id).then((p) => {
            setUser(sess)
            setProfile(p)
          })
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  async function signIn(email: string, password: string) {
    setLoading(true)
    try {
      const { user: u, profile: p } = await signInLocal(email, password)
      setUser(u)
      setProfile(p)
      setStoredSession(u)
      return { error: null }
    } catch (e) {
      const err = e as Error
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email: string, password: string, fullName: string, schoolName: string) {
    setLoading(true)
    try {
      const { user: u, profile: p } = await signUpLocal(email, password, fullName, schoolName)
      setUser(u)
      setProfile(p)
      setStoredSession(u)
      return { error: null }
    } catch (e) {
      const err = e as Error
      return { error: err }
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    await signOutLocal()
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
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

// Re-export types for convenience
export type { LocalAuthUser as User, LocalProfile }
