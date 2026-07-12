import { NavLink, Outlet } from 'react-router-dom'

type NavItem = { to: string; label: string; end?: boolean }

const NAV: NavItem[] = [
  { to: '/', label: 'ড্যাশবোর্ড', end: true },
  { to: '/roster', label: 'শ্রেণি তালিকা' },
  { to: '/report-card', label: 'ফলাফল কার্ড' },
  { to: '/mtr', label: 'MTR ট্র্যাকিং' },
  { to: '/search', label: 'অনুসন্ধান' },
  { to: '/settings', label: 'সেটিংস' }
]

function linkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'bg-maroon text-white font-semibold'
    : 'text-gray-700 hover:bg-maroon/10'
}

export default function Layout() {
  return (
    <div className="min-h-full flex flex-col md:flex-row bg-gray-50 text-gray-900 font-sans">
      {/* Desktop sidebar */}
      <aside className="app-sidebar hidden md:flex md:flex-col md:w-64 md:shrink-0 bg-white border-r border-gray-200">
        <div className="px-5 py-5 text-xl font-bold text-maroon border-b border-gray-200">
          বেজখণ্ড
        </div>
        <nav className="flex flex-col p-3 gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `px-4 py-3 rounded-lg text-base ${linkClass({ isActive })}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="app-topbar md:hidden sticky top-0 z-10 bg-maroon text-white px-4 py-3 text-lg font-bold">
          বেজখণ্ড
        </header>
        <main className="app-main flex-1 p-4 pb-28 md:pb-6 md:p-8 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="app-bottomnav md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200 flex justify-around pb-[env(safe-area-inset-bottom)]">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 text-center px-1 py-3 text-xs ${isActive ? 'text-maroon font-semibold' : 'text-gray-500'}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
