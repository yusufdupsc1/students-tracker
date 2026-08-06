import { Link } from 'react-router-dom'

const FEATURES = [
  { 
    title: 'ড্যাশবোর্ড', 
    desc: 'সম্পূর্ণ স্কুলের এক নজরে সারসংক্ষেপ — গড়, পাস রেট, A+ গণনা',
    icon: '📊'
  },
  { 
    title: 'ফলাফল কার্ড', 
    desc: 'প্রতিটি শিক্ষার্থীর প্রিন্টযোগ্য ফলাফল কার্ড স্বয়ংক্রিয়ভাবে — GPA, গ্রেড, মেধা',
    icon: '📝'
  },
  { 
    title: 'MTR ট্র্যাকিং', 
    desc: 'মিড টার্ম রিভিউ — বাংলা, গণিত ও ইংরেজি সাবলীল পঠন মূল্যায়ন',
    icon: '📈'
  },
  { 
    title: 'QR আইডি', 
    desc: 'প্রতিটি শিক্ষার্থীর QR কোড — ডিজিটাল আইডি কার্ড ও হাজিরা',
    icon: '🔗'
  },
  { 
    title: 'স্মার্ট ইমপোর্ট', 
    desc: 'Excel (.xlsx), CSV, JSON থেকে ডেটা আমদানি — প্রিভিউ সহ, সব ক্লাস ১-১২',
    icon: '📥'
  },
  { 
    title: 'সম্পূর্ণ অফলাইন', 
    desc: 'PWA — ইন্টারনেট ছাড়াই চলে, ডেটা ব্রাউজারে নিরাপদে সংরক্ষিত',
    icon: '✓'
  }
]

const STATS = [
  { value: '১২', label: 'ক্লাস সাপোর্ট', sub: '১ম - ১২শ' },
  { value: '১০০%', label: 'অফলাইন', sub: 'PWA' },
  { value: '০৳', label: 'খরচ', sub: 'ওপেন সোর্স' },
  { value: '∞', label: 'শিক্ষার্থী', sub: 'আনলিমিটেড' },
]

export default function Landing() {
  return (
    <div className="min-h-full bg-white">
      {/* Hero — refined, professional, trending mesh gradient */}
      <header className="relative overflow-hidden bg-[#052e16]">
        {/* Mesh gradient — trending 2024-2025 */}
        <div className="absolute inset-0 bg-gradient-to-br from-bd-green-900 via-[#052e16] to-emerald-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-24 -right-24 w-[600px] h-[600px] bg-emerald-600 rounded-full blur-[120px] opacity-20" />
          <div className="absolute -bottom-32 -left-32 w-[700px] h-[700px] bg-teal-600 rounded-full blur-[130px] opacity-15" />
        </div>
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">বে</span>
              </div>
              <span className="text-white font-heading font-semibold">বেজখণ্ড ট্র্যাকার</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-white/90 hover:text-white transition-colors">
                লগইন
              </Link>
              <Link to="/signup" className="px-6 py-2.5 rounded-full bg-white text-bd-green-900 text-sm font-semibold hover:bg-white/95 transition-colors shadow-lg">
                শুরু করুন
              </Link>
            </div>
          </nav>

          {/* Hero content */}
          <div className="py-12 sm:py-20 md:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/15 text-white/90 text-sm mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ১০০% অফলাইন • কোনো সার্ভার লাগে না • PWA
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-heading font-bold tracking-tight text-white mb-6 leading-[1.05]">
              স্কুলের রেজাল্ট<br />
              <span className="bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">এখন ডিজিটাল</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/75 mb-10 max-w-2xl mx-auto leading-relaxed">
              প্রাথমিক থেকে উচ্চ মাধ্যমিক (১ম - ১২শ) — হাজিরা, নম্বর, ফলাফল কার্ড, MTR — সব এক জায়গায়। 
              <span className="text-white font-medium"> ইন্টারনেট ছাড়াই।</span>
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/signup" 
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-bd-green-900 px-8 py-4 text-base font-semibold shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/15 hover:-translate-y-0.5 transition-all"
              >
                বিনামূল্যে শুরু করুন
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur text-white px-8 py-4 text-base font-medium hover:bg-white/15 transition-colors"
              >
                ডেমো দেখুন
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/60">কোনো ক্রেডিট কার্ড লাগে না • ওপেন সোর্স • আজীবন ফ্রি</p>

            {/* Stats bar — bento style */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {STATS.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur border border-white/15 p-4 text-center">
                  <div className="text-2xl font-heading font-bold text-white">{s.value}</div>
                  <div className="text-sm font-medium text-white/90">{s.label}</div>
                  <div className="text-xs text-white/60">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Social proof */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            অফলাইন PWA
          </span>
          <span className="hidden sm:block w-px h-4 bg-gray-200" />
          <span>🔒 সব ডেটা আপনার ব্রাউজারে</span>
          <span className="hidden sm:block w-px h-4 bg-gray-200" />
          <span>⚡ ১ সেকেন্ডে লোড</span>
          <span className="hidden sm:block w-px h-4 bg-gray-200" />
          <span>🖨️ প্রিন্ট রেডি</span>
        </div>
      </div>

      {/* Features — bento grid trending */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 mb-4 tracking-tight">সবকিছু এক জায়গায়</h2>
            <p className="text-gray-600">শিক্ষকদের জন্য ডিজাইন করা — জটিল নয়, দ্রুত, নির্ভরযোগ্য</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div 
                key={f.title} 
                className={`group relative overflow-hidden rounded-3xl border bg-white p-6 transition-all hover:shadow-xl hover:shadow-gray-900/5 hover:-translate-y-1 ${
                  i === 0 ? 'md:col-span-2 bg-gradient-to-br from-bd-green-50 to-emerald-50/50 border-emerald-100' : 
                  i === 3 ? 'md:col-span-2 bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100' :
                  'border-gray-100'
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-lg mb-4 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-lg font-heading font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Feature highlight bar */}
          <div className="mt-8 rounded-3xl bg-gray-900 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-heading font-semibold text-lg">.xlsx • .csv • .json — সব ফরম্যাট</h3>
              <p className="text-sm text-gray-400 mt-1">যেকোনো ফাইল থেকে ইমপোর্ট, যেকোনো জায়গায় এক্সপোর্ট — হাতে লেখাও যোগ করা যায়</p>
            </div>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm">Excel</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm">CSV</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-sm">JSON</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-bd-green-600 text-white flex items-center justify-center font-bold mx-auto mb-4">১</div>
              <h3 className="font-semibold text-gray-900">সাইন আপ করুন</h3>
              <p className="text-sm text-gray-600 mt-2">ইমেইল ও পাসওয়ার্ড — কোনো ভেরিফিকেশন ছাড়াই</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-bd-green-600 text-white flex items-center justify-center font-bold mx-auto mb-4">২</div>
              <h3 className="font-semibold text-gray-900">শিক্ষার্থী যোগ করুন</h3>
              <p className="text-sm text-gray-600 mt-2">হাতে লিখুন বা Excel/CSV থেকে ইমপোর্ট করুন</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-bd-green-600 text-white flex items-center justify-center font-bold mx-auto mb-4">৩</div>
              <h3 className="font-semibold text-gray-900">ফলাফল প্রিন্ট করুন</h3>
              <p className="text-sm text-gray-600 mt-2">এক ক্লিকে প্রিন্ট-রেডি কার্ড — অফলাইনেও</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-[2rem] bg-gradient-to-br from-bd-green-800 to-emerald-800 p-8 md:p-12 text-center text-white relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">আজই শুরু করুন</h2>
              <p className="text-white/80 mb-8 max-w-xl mx-auto">বেজখণ্ড সহ ১০+ স্কুল ইতিমধ্যে ব্যবহার করছে — আপনি পরবর্তী</p>
              <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-white text-bd-green-900 px-8 py-4 font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                বিনামূল্যে অ্যাকাউন্ট তৈরি করুন
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <p className="mt-4 text-sm text-white/60">৫ সেকেন্ডে সেটআপ • ডেটা কখনো বাইরে যায় না</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer — minimal, professional */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} বেজখণ্ড স্কুল ট্র্যাকার — ওপেন সোর্স • MIT • অফলাইন PWA</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              সব ডেটা লোকাল
            </span>
            <a href="https://github.com/yusufdupsc1/students-tracker" target="_blank" rel="noreferrer" className="hover:text-gray-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
