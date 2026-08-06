import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function check() {
      if (!user) {
        if (!cancelled) {
          setChecking(false)
          setSubscriptionStatus(null)
        }
        return
      }
      // Wait for profile to load; if no profile, don't block – allow recovery
      if (!profile) {
        // If user exists but profile not yet loaded, keep checking briefly
        // After 2s if still no profile, stop checking and allow app (maybe profile creation pending)
        const timer = setTimeout(() => {
          if (!cancelled && !profile) {
            setChecking(false)
            // No profile – treat as no subscription but don't hard block; let app show
            setSubscriptionStatus('trialing')
          }
        }, 2000)
        return () => clearTimeout(timer)
      }

      const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
      if (!schoolId) {
        if (!cancelled) {
          setChecking(false)
          setSubscriptionStatus('trialing')
        }
        return
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('school_id', schoolId)
          .maybeSingle()

        if (cancelled) return

        if (error) {
          console.warn('[ProtectedRoute] subscription fetch error:', error.message)
          setFetchError(error.message)
          // Fail open to trialing to avoid lockout due to RLS transient error
          setSubscriptionStatus('trialing')
        } else {
          setSubscriptionStatus((data as any)?.status || 'trialing')
        }
      } catch (e: any) {
        if (!cancelled) {
          console.warn('[ProtectedRoute] subscription exception:', e?.message)
          setSubscriptionStatus('trialing')
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    setChecking(true)
    setFetchError(null)
    check()

    // Also re-check if profile arrives later
    if (!profile && user) {
      const id = setTimeout(check, 1500)
      return () => clearTimeout(id)
    }
  }, [user, profile])

  if (loading || (user && checking && !fetchError)) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-gray-500">লোড হচ্ছে…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Only hard-block for past_due / canceled – missing subscription now defaults to trialing (fail open)
  if (subscriptionStatus && ['past_due', 'canceled'].includes(subscriptionStatus)) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-bd-green-50 via-white to-bd-green-50/50 p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <h1 className="text-2xl font-heading font-bold text-bd-red-700 mb-4">সাবস্ক্রিপশন মেয়াদ শেষ</h1>
          <p className="text-sm text-gray-600 mb-6">
            আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে। অনুগ্রহ করে প্ল্যান রিনিউ করুন।
          </p>
          <a href="mailto:support@bejkhonda.app" className="btn-primary">
            সাপোর্টে যোগাযোগ করুন
          </a>
          <button onClick={() => supabase.auth.signOut()} className="mt-4 block w-full text-sm text-gray-500 hover:text-gray-700">
            লগআউট
          </button>
        </div>
      </div>
    )
  }

  // If profile missing after login, show helpful message with recovery
  if (!profile) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-bd-green-50 via-white to-bd-green-50/50 p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <h1 className="text-lg font-heading font-bold text-amber-700 mb-3">প্রোফাইল লোড হচ্ছে</h1>
          <p className="text-sm text-gray-600 mb-4">
            আপনার অ্যাকাউন্ট তৈরি হয়েছে কিন্তু প্রোফাইল সম্পূর্ণ হয়নি। পৃষ্ঠাটি রিফ্রেশ করুন বা পুনরায় লগইন করুন।
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="btn-primary">
              রিফ্রেশ
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = '/login'
              }}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm"
            >
              লগআউট
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
