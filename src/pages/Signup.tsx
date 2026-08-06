import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const [fullName, setFullName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      // Prefer Bengali mapping from AuthContext, else generic
      setError(msg || 'সাইন আপ ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।')
    } else {
      setSuccess('রেজিস্ট্রেশন সফল! আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে…')
      setTimeout(() => navigate('/app', { replace: true }), 800)
    }
    setBusy(false)
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-br from-bd-green-50 via-white to-bd-green-50/50 p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <h1 className="text-2xl font-heading font-bold text-center mb-2 text-bd-green-900">স্কুল রেজিস্ট্রেশন</h1>
        <p className="text-center text-sm text-gray-500 mb-6">নতুন স্কুল অ্যাকাউন্ট তৈরি করুন — ১৪ দিন ফ্রি ট্রায়াল</p>
        {error && (
          <div className="mb-4 rounded-xl bg-bd-red-50 border border-bd-red-300 text-bd-red-700 text-sm px-4 py-2.5">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl bg-bd-green-50 border border-bd-green-300 text-bd-green-700 text-sm px-4 py-2.5">
            {success}
          </div>
        )}
        <div className="mb-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-2.5">
          সাইন আপের পর আপনি সরাসরি লগইন হয়ে ড্যাশবোর্ডে যাবেন। কোনো ইমেইল কনফার্মেশন প্রয়োজন নেই।
        </div>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">স্কুলের নাম *</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              required
              className="glass-input w-full"
              placeholder="বেজখণ্ড সঃ প্রাঃ বিদ্যালয়"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">প্রধান শিক্ষকের নাম *</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="glass-input w-full"
              placeholder="মোঃ কামরুল হাসান"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল *</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="glass-input w-full"
              placeholder="কমপক্ষে ৬ অক্ষর"
            />
            <p className="mt-1 text-xs text-gray-400">নিরাপদ পাসওয়ার্ড ব্যবহার করুন</p>
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'রেজিস্ট্রেশন হচ্ছে…' : 'রেজিস্ট্রেশন করুন'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          ইতিমধ্যে অ্যাকাউন্ট আছে? <Link to="/login" className="text-bd-green-700 font-semibold hover:underline">লগইন করুন</Link>
        </p>
      </div>
    </div>
  )
}
