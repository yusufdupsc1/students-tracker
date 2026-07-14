import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

type NavItem = { to: string; label: string; end?: boolean }

const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'ড্যাশবোর্ড', end: true },
  { to: '/roster', label: 'তালিকা' },
  { to: '/report-card', label: 'ফলাফল' },
  { to: '/search', label: 'অনুসন্ধান' },
  { to: '#more', label: 'আরও' }
]

const SHEET_NAV: NavItem[] = [
  { to: '/mtr', label: 'Progress ট্র্যাকিং' },
  { to: '/import', label: 'ইমপোর্ট ও ব্যাকআপ' },
  { to: '/settings', label: 'সেটিংস' }
]

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'bg-white/15 text-white font-semibold backdrop-blur-sm shadow-sm'
    : 'text-bd-green-100 hover:bg-white/10 hover:text-white transition-all duration-200'
}

function mobileLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'text-bd-green-700 font-semibold'
    : 'text-gray-500 hover:text-bd-green-700 transition-all duration-200'
}

export default function Layout() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const school = useLiveQuery(() => db.school.get('school'))

  return (
    <div className="min-h-full flex flex-col md:flex-row bg-gradient-to-br from-bd-green-50 via-white to-bd-green-50/50 text-gray-900 font-body">
      {/* Desktop sidebar */}
      <aside className="app-sidebar hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-gradient-to-b from-bd-green-900 via-bd-green-800 to-bd-green-900 text-white relative overflow-hidden">
        {/* Decorative glass overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm pointer-events-none" />
        
        {/* Sidebar Header with enhanced glassmorphism */}
        <div className="relative px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* School icon / logo placeholder */}
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold tracking-wide text-white leading-tight">
                {school?.name || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'}
              </h1>
            </div>
          </div>
        </div>
        
        <nav className="relative flex flex-col p-3 gap-1.5 flex-1">
          {PRIMARY_NAV.filter(item => item.to !== '#more').map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-sm transition-all duration-200 ${linkClass({ isActive })}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="my-2 border-t border-white/10" />
          {SHEET_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-3 rounded-xl text-sm transition-all duration-200 ${linkClass({ isActive })}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="relative px-6 py-4 text-xs text-bd-green-200/60 border-t border-white/10">
          Offline PWA · সব ডেটা লোকাল
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="app-topbar md:hidden sticky top-0 z-10 bg-gradient-to-r from-bd-green-800 to-bd-green-700 text-white px-4 py-3 text-lg font-heading font-bold shadow-soft">
          {school?.name || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'}
        </header>
        <a href="#app-main" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-bd-green-700 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg">
          মূল কনটেন্টে যান
        </a>
        <main id="app-main" className="app-main flex-1 p-4 pb-24 md:pb-8 md:p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar — 5 items max */}
      <nav className="app-bottomnav md:hidden fixed bottom-0 inset-x-0 z-20 bg-white/90 backdrop-blur-md border-t border-bd-green-100 flex justify-around pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(6,78,59,0.05)]">
        {PRIMARY_NAV.map((item) => {
          if (item.to === '#more') {
            return (
              <button
                key={item.to}
                onClick={() => setSheetOpen(true)}
                className={`flex-1 text-center px-1 py-2.5 text-[11px] min-h-[44px] flex items-center justify-center transition-all duration-200 ${mobileLinkClass({ isActive: sheetOpen })}`}
              >
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
                `flex-1 text-center px-1 py-2.5 text-[11px] min-h-[44px] flex items-center justify-center transition-all duration-200 ${mobileLinkClass({ isActive })}`
              }
            >
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Mobile bottom sheet for secondary nav */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setSheetOpen(false)}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 inset-x-0 z-40 bg-white rounded-t-2xl p-4 pb-[env(safe-area-inset-bottom)] shadow-2xl md:hidden animate-slide-up">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
            <div className="space-y-1">
              {SHEET_NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `block px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive ? 'bg-bd-green-50 text-bd-green-800 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                  onClick={() => setSheetOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              className="mt-3 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all duration-200"
            >
              বন্ধ করুন
            </button>
          </div>
        </>
      )}
    </div>
  )
}
