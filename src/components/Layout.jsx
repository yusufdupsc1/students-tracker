import { NavLink, Outlet } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'ড্যাশবোর্ড', end: true },
  { to: '/students', label: 'শিক্ষার্থী' },
  { to: '/card', label: 'ফলাফল কার্ড' },
  { to: '/search', label: 'অনুসন্ধান' },
  { to: '/mtr', label: 'MTR' },
  { to: '/qr', label: 'QR আইডি' },
  { to: '/data', label: 'ইমপোর্ট/এক্সপোর্ট' },
  { to: '/settings', label: 'সেটিংস' }
]

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Students Tracker</div>
        <nav className="main-nav">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
