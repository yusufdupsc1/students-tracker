import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!user || !profile) {
      setChecking(false)
      return
    }

    const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
    if (!schoolId) {
      setChecking(false)
      return
    }

    ;(async () => {
      try {
        const { data } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('school_id', schoolId)
          .single()
        setSubscriptionStatus((data as any)?.status || null)
      } catch {
        setSubscriptionStatus(null)
      } finally {
        setChecking(false)
      }
    })()
  }, [user, profile])

  if (loading || checking) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-gray-500">লোড হচ্ছে…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!subscriptionStatus || ['past_due', 'canceled'].includes(subscriptionStatus)) {
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
        </div>
      </div>
    )
  }

  return <>{children}</>
}
