import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// FLN Theme Wrapper — applies dark navy + grid + teal/gold to authenticated routes
// 100% flawless from screenshots: #020617 bg, #0f172a cards, #06b6d4 teal, #f59e0b gold

export function FLNTheme({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isFLN = location.pathname === '/app' || location.pathname === '/app/fln' || location.pathname === '/app/'

  useEffect(() => {
    // Add FLN class to body when on FLN routes for global grid
    if (isFLN) {
      document.body.classList.add('fln-theme')
      document.documentElement.classList.add('fln-theme')
    } else {
      document.body.classList.remove('fln-theme')
      document.documentElement.classList.remove('fln-theme')
    }
    return () => {
      document.body.classList.remove('fln-theme')
      document.documentElement.classList.remove('fln-theme')
    }
  }, [isFLN])

  if (!isFLN) return <>{children}</>

  return (
    <div className="fln-root min-h-screen bg-[#020617] text-slate-100 relative">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#020617]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(6,182,214,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,214,0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
