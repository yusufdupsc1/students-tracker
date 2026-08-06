import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { useAuth } from '../contexts/AuthContext'
import { storageStatus } from '../lib/persistence'

type NavItem = { to: string; label: string; icon: string; end?: boolean; badge?: string }

const PRIMARY_NAV: NavItem[] = [
  { to: '/app', label: 'ড্যাশবোর্ড', icon: '◈', end: true },
  { to: '/app/roster', label: 'তালিকা', icon: '≡' },
  { to: '/app/report-card', label: 'ফলাফল', icon: '✦' },
  { to: '/app/search', label: 'অনুসন্ধান', icon: '⌕' },
  { to: '#more', label: 'আরও', icon: '⋯' }
]

const SHEET_NAV: NavItem[] = [
  { to: '/app/mtr', label: 'Progress ট্র্যাকিং', icon: '⬢' },
  { to: '/app/qr-ids', label: 'QR আইডি', icon: '⬣' },
  { to: '/app/import', label: 'ইমপোর্ট ও ব্যাকআপ', icon: '⤓' },
  { to: '/app/settings', label: 'সেটিংস', icon: '⚙' }
]

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'bg-white text-bd-green-900 font-semibold shadow-lg shadow-bd-green-900/10'
    : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
}

export default function Layout() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const school = useLiveQuery(() => db.school.get('school'))
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [storage, setStorage] = useState<{ persisted: boolean; usagePercent: number } | null>(null)

  // Load storage status once
  useState(() => {
    storageStatus().then((s) => {
      if (s) setStorage({ persisted: s.persisted, usagePercent: s.usagePercent })
    })
  })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-[#fcfdfc] text-gray-900 font-body">
      {/* Desktop sidebar — refined, professional */}
      <aside className="app-sidebar hidden md:flex md:flex-col md:w-[280px] md:shrink-0 bg-[#052e16] text-white relative overflow-hidden">
        {/* Subtle mesh */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-600 rounded-full blur-[80px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative px-6 py-7 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white text-bd-green-900 flex items-center justify-center font-bold shadow-lg">
              বে
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-heading font-bold tracking-tight leading-tight truncate">
                {school?.name || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'}
              </h1>
              <p className="text-xs text-white/60 truncate">
                {(school as any)?.academicYear ? `শিক্ষাবর্ষ ${(school as any).academicYear}` : 'অফলাইন PWA • লোকাল'}
              </p>
            </div>
          </div>
          
          {/* Storage indicator — trending: subtle health dot */}
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${storage?.persisted ? 'bg-emerald-400 shadow shadow-emerald-400/50' : 'bg-amber-400 animate-pulse'}`} />
            <span className="text-white/70">
              {storage?.persisted ? 'স্থায়ী স্টোরেজ ✓' : 'স্টোরেজ চেক হচ্ছে…'}
            </span>
            {storage && storage.usagePercent > 0 && (
              <span className="ml-auto text-white/50">{storage.usagePercent}%</span>
            )}
          </div>
        </div>
        
        <nav className="relative flex flex-col p-3 gap-1 flex-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-widest text-white/40 uppercase">মেনু</p>
          {PRIMARY_NAV.filter(item => item.to !== '#more').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${linkClass({ isActive })}`
              }
            >
              <span className="w-8 h-8 rounded-lg bg-black/10 flex items-center justify-center text-sm">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
          <div className="my-3 border-t border-white/10" />
          <p className="px-3 pb-1 text-[11px] font-semibold tracking-widest text-white/40 uppercase">টুলস</p>
          {SHEET_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200 ${linkClass({ isActive })}`
              }
            >
              <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer — professional */}
        <div className="relative p-3 border-t border-white/10">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                {(profile as any)?.full_name?.[0] || profile?.email?.[0]?.toUpperCase() || 'অ'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{(profile as any)?.full_name || 'অ্যাডমিন'}</p>
                <p className="text-xs text-white/60 truncate">{profile?.email || ''}</p>
              </div>
              <svg className={`w-4 h-4 text-white/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{(profile as any)?.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{(profile as any)?.school?.name}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 mt-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1" />
                  </svg>
                  লগআউট
                </button>
              </div>
            )}
          </div>
          <p className="mt-3 text-center text-[11px] text-white/40">v1.1 • অফলাইন • লোকাল DB</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile top bar — enhanced */}
        <header className="app-topbar md:hidden sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-bd-green-900 text-white flex items-center justify-center font-bold text-sm">বে</div>
            <h1 className="font-heading font-bold text-gray-900 truncate text-[15px]">
              {school?.name || 'বেজখণ্ড'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${storage?.persisted ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold"
            >
              {(profile as any)?.full_name?.[0] || 'অ'}
            </button>
          </div>
        </header>

        {/* Mobile user menu */}
        {userMenuOpen && (
          <div className="md:hidden fixed inset-0 z-20" onClick={() => setUserMenuOpen(false)}>
            <div className="absolute top-14 right-4 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2" onClick={e => e.stopPropagation()}>
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{(profile as any)?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{profile?.email}</p>
              </div>
              <button onClick={handleSignOut} className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 mt-1">
                লগআউট
              </button>
            </div>
          </div>
        )}

        <a href="#app-main" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-bd-green-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
          মূল কনটেন্টে যান
        </a>
        <main id="app-main" className="app-main flex-1 p-4 pb-24 md:pb-8 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        {/* Footer — subtle, professional */}
        <footer className="hidden md:block border-t border-gray-100 py-4">
          <div className="max-w-6xl mx-auto px-8 flex items-center justify-between text-xs text-gray-400">
            <span>© {new Date().getFullYear()} বেজখণ্ড ট্র্যাকার • লোকাল DB • PWA</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              অফলাইন রেডি
            </span>
          </div>
        </footer>
      </div>

      {/* Mobile bottom nav — pill style trending */}
      <nav className="app-bottomnav md:hidden fixed bottom-0 inset-x-0 z-20 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto max-w-md bg-white rounded-[1.5rem] border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center p-1.5">
          {PRIMARY_NAV.map((item) => {
            if (item.to === '#more') {
              return (
                <button
                  key={item.to}
                  onClick={() => setSheetOpen(true)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl text-[11px] font-medium transition-all ${sheetOpen ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  <span className="text-base leading-none">{item.icon}</span>
                  {item.label}
                </button>
              )
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl text-[11px] font-medium transition-all ${isActive ? 'bg-gray-900 text-white shadow' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`
                }
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Mobile sheet — refined */}
      {sheetOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-gray-900/20 backdrop-blur-sm md:hidden" onClick={() => setSheetOpen(false)} />
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white rounded-t-[2rem] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl md:hidden animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h3 className="font-heading font-semibold text-gray-900 mb-4">আরও টুলস</h3>
            <div className="grid grid-cols-2 gap-3">
              {SHEET_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `p-4 rounded-2xl border text-left transition-all ${isActive ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-200 hover:bg-white'}`
                  }
                  onClick={() => setSheetOpen(false)}
                >
                  <div className="text-xl mb-2">{item.icon}</div>
                  <div className="text-sm font-medium">{item.label}</div>
                </NavLink>
              ))}
            </div>
            <button onClick={() => setSheetOpen(false)} className="mt-4 w-full py-3 rounded-2xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors">
              বন্ধ করুন
            </button>
          </div>
        </>
      )}
    </div>
  )
}
