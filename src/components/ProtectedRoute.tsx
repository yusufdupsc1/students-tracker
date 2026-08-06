import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-gray-500">লোড হচ্ছে…</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // In local lite mode every authenticated user has trialing access.
  // No external subscription check needed — data is 100% local.
  // If profile missing (very old session), show recovery.
  if (!profile) {
    return (
      <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-bd-green-50 via-white to-bd-green-50/50 p-4">
        <div className="glass-card p-8 max-w-md text-center">
          <h1 className="text-lg font-heading font-bold text-amber-700 mb-3">প্রোফাইল পাওয়া যায়নি</h1>
          <p className="text-sm text-gray-600 mb-4">
            আপনার সেশন পুরানো। অনুগ্রহ করে লগআউট করে আবার লগইন করুন।
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => window.location.reload()} className="btn-primary">
              রিফ্রেশ
            </button>
            <button
              onClick={async () => {
                localStorage.removeItem('bejkhonda-session')
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
