import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'

type Command = { id: string; label: string; desc: string; action: () => void; icon: string }

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const students = useLiveQuery(() => db.students.limit(5).toArray())

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen(v => !v)
      }
      if (e.key === '/' && !open && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const commands: Command[] = useMemo(() => [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', desc: 'সারসংক্ষেপ', icon: '◈', action: () => navigate('/app') },
    { id: 'roster', label: 'তালিকা — নতুন শিক্ষার্থী', desc: 'Class Roster', icon: '≡', action: () => navigate('/app/roster') },
    { id: 'report', label: 'ফলাফল কার্ড', desc: 'প্রিন্ট', icon: '✦', action: () => navigate('/app/report-card') },
    { id: 'search', label: 'অনুসন্ধান', desc: 'নাম/রোল/গ্রাম', icon: '⌕', action: () => navigate('/app/search') },
    { id: 'import', label: 'ইমপোর্ট', desc: '.xlsx .csv .json', icon: '⤓', action: () => navigate('/app/import') },
    { id: 'settings', label: 'সেটিংস', desc: 'ক্লাস/বিষয়', icon: '⚙', action: () => navigate('/app/settings') },
  ], [navigate])

  const filtered = commands.filter(c => !query || c.label.toLowerCase().includes(query.toLowerCase()) || c.desc.toLowerCase().includes(query.toLowerCase()))

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
      >
        <span>⌘K</span> সার্চ
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4">
      <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-white rounded-[1.5rem] shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <span className="text-gray-400">⌕</span>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="কমান্ড বা শিক্ষার্থী খুঁজুন… (/, ⌘K)"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
          />
          <button onClick={() => setOpen(false)} className="px-2 py-1 rounded-lg hover:bg-gray-100 text-xs">ESC</button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => { c.action(); setOpen(false); setQuery('') }}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-3"
            >
              <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm">{c.icon}</span>
              <div>
                <div className="text-sm font-medium text-gray-900">{c.label}</div>
                <div className="text-xs text-gray-500">{c.desc}</div>
              </div>
            </button>
          ))}
          {query && students && students.filter(s => s.name.toLowerCase().includes(query.toLowerCase())).slice(0,3).map(s => (
            <div key={s.id} className="px-3 py-2 text-sm text-gray-600">রোল {s.roll} — {s.name} (ক্লাস {s.classId})</div>
          ))}
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-gray-400">কোনো ফলাফল নেই</div>}
        </div>
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-between">
          <span>↑↓ নেভিগেট • Enter সিলেক্ট • ESC বন্ধ</span>
          <span className="hidden sm:inline">Trending 2025 — Command Palette</span>
        </div>
      </div>
    </div>
  )
}
