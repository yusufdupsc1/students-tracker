import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
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
        setError('লগইন ব্যর্থ: ইমেইল বা পাসওয়ার্ড ভুল।')
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

  const fillDemo = () => {
    setEmail('demo@bejkhonda.edu.bd')
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold">বে</div>
            <div>
              <p className="font-heading font-bold text-gray-900 leading-none">বেজখণ্ড ট্র্যাকার</p>
              <p className="text-xs text-gray-500">অফলাইন • লোকাল • PWA</p>
            </div>
            <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              লোকাল DB
            </span>
          </div>

          <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl shadow-gray-900/5 p-6 sm:p-8">
            <h1 className="text-2xl font-heading font-bold tracking-tight text-gray-900">স্বাগতম</h1>
            <p className="text-sm text-gray-500 mt-2">আপনার স্কুল অ্যাকাউন্টে প্রবেশ করুন</p>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex gap-2">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all"
                  placeholder="admin@school.edu.bd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 pr-12 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-medium"
                  >
                    {showPass ? 'লুকান' : 'দেখুন'}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={busy} className="w-full rounded-xl bg-gray-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-gray-900/10">
                {busy ? 'লগইন হচ্ছে…' : 'লগইন →'}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">বা</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-700">ডেমো অ্যাকাউন্ট</p>
              <p className="text-xs text-gray-500 mt-1">প্রথমবার? ডেমো দিয়ে টেস্ট করুন — কোনো ইমেইল ভেরিফিকেশন লাগে না</p>
              <button onClick={fillDemo} className="mt-3 w-full rounded-xl bg-white border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors">
                ডেমো তথ্য বসান
              </button>
              <p className="text-xs text-gray-400 mt-2">demo@bejkhonda.edu.bd / demo123</p>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600">
              অ্যাকাউন্ট নেই? <Link to="/signup" className="font-semibold text-gray-900 hover:underline">সাইন আপ করুন</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            সব ডেটা আপনার ব্রাউজারে — <span className="font-medium text-gray-600">IndexedDB</span> • অফলাইন PWA
          </p>
        </div>
      </div>

      {/* Right — branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-1 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-gray-900 to-teal-900" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600 rounded-full blur-[100px] opacity-20" />
        <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-teal-600 rounded-full blur-[120px] opacity-15" />
        <div className="relative flex flex-col justify-center p-12 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium w-fit">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            ১-১২ ক্লাস • ১০০% অফলাইন
          </div>
          <h2 className="text-4xl font-heading font-bold tracking-tight mt-6 leading-tight">
            স্কুল ম্যানেজমেন্ট<br />
            <span className="text-emerald-200">সহজ, দ্রুত, নির্ভরযোগ্য</span>
          </h2>
          <p className="text-white/70 mt-4 leading-relaxed">হাজিরা, নম্বর, ফলাফল কার্ড, MTR — সব এক জায়গায়। Excel/CSV/JSON থেকে ইমপোর্ট, এক ক্লিকে প্রিন্ট।</p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
              <div className="text-xl font-bold">১২</div>
              <div className="text-xs text-white/70">ক্লাস</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
              <div className="text-xl font-bold">∞</div>
              <div className="text-xs text-white/70">শিক্ষার্থী</div>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 p-4">
              <div className="text-xl font-bold">০৳</div>
              <div className="text-xs text-white/70">আজীবন ফ্রি</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
