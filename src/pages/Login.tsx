import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('ইমেইল ও পাসওয়ার্ড দিন')
      return
    }
    setError('')
    setBusy(true)
    const { error } = await signIn(email, password)
    if (error) {
      const msg = error.message || ''
      if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed') || msg.includes('confirm')) {
        setError('আপনার ইমেইল নিশ্চিত করা হয়নি। অনুগ্রহ করে ইমেইলে পাঠানো লিংকে ক্লিক করুন, তারপর আবার লগইন করুন।')
      } else if (msg.includes('Invalid login credentials') || msg.includes('Invalid login')) {
        setError('লগইন ব্যর্থ: ইমেইল বা পাসওয়ার্ড ভুল। রিসেট প্রয়োজন হলে সাপোর্টে যোগাযোগ করুন।')
      } else if (msg.includes('Email rate limit exceeded')) {
        setError('অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।')
      } else {
        setError(msg || 'লগইন ব্যর্থ হয়েছে। ইমেইল বা পাসওয়ার্ড চেক করুন।')
      }
    } else {
      navigate('/app', { replace: true })
    }
    setBusy(false)
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-bd-green-50 via-white to-bd-green-50/50 p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <h1 className="text-2xl font-heading font-bold text-center mb-2 text-bd-green-900">লগইন</h1>
        <p className="text-center text-sm text-gray-500 mb-6">আপনার স্কুল অ্যাকাউন্টে প্রবেশ করুন</p>
        {error && (
          <div className="mb-4 rounded-xl bg-bd-red-50 border border-bd-red-300 text-bd-red-700 text-sm px-4 py-2.5">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="glass-input w-full"
              placeholder="admin@school.edu.bd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="glass-input w-full"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'লগইন হচ্ছে…' : 'লগইন'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          অ্যাকাউন্ট নেই? <Link to="/signup" className="text-bd-green-700 font-semibold hover:underline">সাইন আপ করুন</Link>
        </p>
        <p className="mt-2 text-center text-xs text-gray-400">
          সমস্যা হলে <a href="mailto:support@bejkhonda.app" className="underline">সাপোর্টে যোগাযোগ</a> করুন
        </p>
      </div>
    </div>
  )
}
