import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim() || !schoolName.trim() || !email.trim() || !password) {
      setError('সব ফিল্ড পূরণ করুন')
      return
    }
    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে')
      return
    }
    setError('')
    setSuccess('')
    setBusy(true)
    const { error } = await signUp(email, password, fullName, schoolName)
    if (error) {
      const msg = error.message || ''
      setError(msg || 'সাইন আপ ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।')
    } else {
      setSuccess('রেজিস্ট্রেশন সফল! ড্যাশবোর্ডে নিয়ে যাচ্ছি…')
      setTimeout(() => navigate('/app', { replace: true }), 800)
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-bold">বে</div>
            <div>
              <p className="font-heading font-bold text-gray-900 leading-none">বেজখণ্ড ট্র্যাকার</p>
              <p className="text-xs text-gray-500">লোকাল DB • ১-১২ ক্লাস</p>
            </div>
          </div>

          <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl shadow-gray-900/5 p-6 sm:p-8">
            <h1 className="text-2xl font-heading font-bold tracking-tight text-gray-900">অ্যাকাউন্ট তৈরি</h1>
            <p className="text-sm text-gray-500 mt-2">নতুন স্কুল — ৩০ সেকেন্ডে শুরু</p>

            {error && (
              <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 flex gap-2">
                <span className="shrink-0">⚠</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3">
                {success}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-gray-900 text-white p-4 flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center shrink-0">✓</div>
              <div className="text-sm">
                <p className="font-medium">কোনো ইমেইল ভেরিফিকেশন নেই</p>
                <p className="text-white/70 text-xs mt-1">সাইন আপ → তাৎক্ষণিক লগইন → ড্যাশবোর্ড</p>
              </div>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">স্কুলের নাম *</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all"
                  placeholder="বেজখণ্ড সঃ প্রাঃ বিদ্যালয়"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">প্রধান শিক্ষকের নাম *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all"
                  placeholder="মোঃ কামরুল হাসান"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">ইমেইল *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">পাসওয়ার্ড *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 pr-12 text-sm placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all"
                    placeholder="কমপক্ষে ৬ অক্ষর"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 text-gray-500 text-xs font-medium"
                  >
                    {showPass ? 'লুকান' : 'দেখুন'}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">লোকালি SHA-256 হ্যাশ — কোথাও পাঠানো হয় না</p>
              </div>
              <button type="submit" disabled={busy} className="w-full rounded-xl bg-gray-900 text-white py-3.5 text-sm font-semibold hover:bg-black disabled:opacity-50 transition-colors shadow-lg shadow-gray-900/10">
                {busy ? 'তৈরি হচ্ছে…' : 'অ্যাকাউন্ট তৈরি →'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              ইতিমধ্যে আছে? <Link to="/login" className="font-semibold text-gray-900 hover:underline">লগইন করুন</Link>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">IndexedDB • SHA-256 • অফলাইন PWA</p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-gray-900 to-teal-900" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-600 rounded-full blur-[100px] opacity-20" />
        <div className="relative flex flex-col justify-center p-12 max-w-xl">
          <h2 className="text-4xl font-heading font-bold tracking-tight leading-tight">
            ১২ ক্লাস, <span className="text-emerald-200">এক অ্যাপ</span>
          </h2>
          <p className="text-white/70 mt-4 leading-relaxed">১ম থেকে ১২শ — সব ক্লাস, সব বিষয়, সব শিক্ষার্থী — এক ক্লিকে। CSV/Excel/JSON থেকে ইমপোর্ট বা হাতে লিখুন।</p>
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-xs">1</span>
              স্কুল + শিক্ষক তৈরি — ১০ সেকেন্ড
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-xs">2</span>
              শিক্ষার্থী যোগ — হাতে বা ফাইল থেকে
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center text-xs">3</span>
              ফলাফল → GPA → প্রিন্ট — অফলাইন
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
