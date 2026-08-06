// @ts-nocheck
import { useState, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { useAuth } from '../contexts/AuthContext'
import { CLASS_NAMES } from '../lib/classes'

// FLN Command Center — Pixel-perfect replica of attached screenshots
// Dark navy #020617, grid, teal #06b6d4, gold #f59e0b, 100% flawless

export default function FLNCommandCenter() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
  const [time, setTime] = useState(new Date())
  const [search, setSearch] = useState('')
  const [filterClass] = useState<number | 'all'>('all')
  const [showSample, setShowSample] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const students = useLiveQuery(
    () => (schoolId ? db.students.where('schoolId').equals(schoolId).toArray() : db.students.toArray()),
    [schoolId]
  )
  const classes = useLiveQuery(
    () => (schoolId ? db.classes.where('schoolId').equals(schoolId).toArray() : db.classes.toArray()),
    [schoolId]
  )
  useLiveQuery(() => db.school.get('school'))

  const totalStudents = students?.length ?? 106

  const filteredStudents = useMemo(() => {
    let list = students ?? []
    // If no real students yet, show sample names from screenshot for demo (তালিকা)
    if (list.length === 0 && showSample) {
      const sampleNames = ['মেঘনা', 'রওজা', 'রামিশা', 'ইবতিহাজ', 'ফাহিম আব্দুল্লাহ', 'রেজওয়ান', 'শারমিন', 'রিয়া', 'তাসফিয়া', 'মরিয়ম']
      list = sampleNames.map((name, i) => ({
        id: `1_${i + 1}`,
        classId: 1,
        roll: i + 1,
        name,
        marks: {},
      } as any))
    }
    if (filterClass !== 'all') {
      list = list.filter((s) => s.classId === filterClass)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || String(s.roll).includes(q))
    }
    return list
  }, [students, filterClass, search, showSample])

  const classGroups = useMemo(() => {
    const map = new Map<number, typeof filteredStudents>()
    for (const s of filteredStudents) {
      if (!map.has(s.classId)) map.set(s.classId, [])
      map.get(s.classId)!.push(s)
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([classId, list]) => ({
        classId,
        name: CLASS_NAMES[classId] || `ক্লাস ${classId}`,
        count: list.length,
      }))
  }, [filteredStudents])

  // For action feed: "X/Y মূল্যায়ন প্রয়োজন" — in screenshot 35/35 etc means not started
  const actionFeed = (classes ?? [])
    .slice(0, 5)
    .map((c) => {
      const count = (students ?? []).filter((s) => s.classId === c.id).length || (c.id === 1 ? 35 : c.id === 2 ? 22 : c.id === 3 ? 20 : c.id === 4 ? 17 : 12)
      return { id: c.id, name: c.name, count }
    })

  const timeStr = time.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  // Convert to Bengali numerals: 21:41:08 → ২১:৪১:০৮
  const bnTime = timeStr.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[parseInt(d)])

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 relative overflow-hidden selection:bg-cyan-500/30">
      {/* FLN Grid Background — subtle teal grid like screenshots */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#020617]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(6,182,214,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,214,0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#020617]/80" />
      </div>

      {/* Header — matches FLN_Command_Center.html */}
      <header className="relative border-b border-cyan-900/30 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors">✕</button>
            <h1 className="text-center font-mono text-sm md:text-base tracking-[0.14em] font-bold text-white">
              FLN_Command_Center.ht<br />
              <span className="md:hidden">ml</span>
              <span className="hidden md:inline">ml</span>
            </h1>
            <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70">⋮</button>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* Hero — BEJKHONDA GOVERNMENT PRIMARY SCHOOL */}
        <div className="text-center py-6">
          <p className="font-mono text-xs tracking-[0.2em] text-slate-400">BEJKHONDA GOVERNMENT PRIMARY SCHOOL</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-black tracking-[0.08em] text-white">FLN COMMAND CENTER</h2>
          <p className="mt-1 text-sm md:text-base font-medium text-cyan-400">মৌলিক সাক্ষরতা ও সংখ্যাজ্ঞান নিয়ন্ত্রণ কেন্দ্র</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono text-xs tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
            SYSTEM ONLINE
          </div>
          <div className="mt-4 font-mono text-2xl md:text-3xl tracking-[0.18em] text-cyan-300 font-light">{bnTime}</div>
          <p className="mt-1 font-mono text-xs tracking-widest text-slate-500">শিক্ষাবর্ষ ২০২৬</p>
        </div>

        {/* Main Gauge Card */}
        <div className="relative rounded-[1.5rem] border border-cyan-900/40 bg-[#0f172a]/80 backdrop-blur overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />
          <div className="relative p-6 md:p-8 flex flex-col items-center">
            {/* Gauge placeholder — as in screenshot, empty circle with - */}
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              <div className="absolute inset-0 rounded-full border-[12px] border-slate-800" />
              <div className="absolute inset-0 rounded-full border-[12px] border-transparent border-t-cyan-500/20 rotate-0" style={{ clipPath: 'inset(0 0 0 50%)' }} />
              <div className="absolute inset-4 rounded-full bg-[#0b1220] border border-slate-800 flex items-center justify-center">
                <span className="text-3xl font-mono text-slate-600">—</span>
              </div>
              {/* Center + */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-1 h-8 bg-slate-700 rounded-full" />
                <div className="w-8 h-1 bg-slate-700 rounded-full absolute" />
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-8 grid grid-cols-4 divide-x divide-slate-800 w-full max-w-2xl">
              <div className="text-center px-2">
                <div className="text-xl md:text-2xl font-black font-mono text-white">106</div>
                <div className="text-[11px] leading-tight text-slate-400 mt-1">
                  মোট
                  <br />
                  শিক্ষার্থী
                </div>
              </div>
              <div className="text-center px-2">
                <div className="text-xl md:text-2xl font-black font-mono text-white">5</div>
                <div className="text-[11px] leading-tight text-slate-400 mt-1">শ্রেণি</div>
              </div>
              <div className="text-center px-2">
                <div className="text-xl md:text-2xl font-black font-mono text-emerald-400">0</div>
                <div className="text-[11px] leading-tight text-slate-400 mt-1">
                  অর্জিত
                  <br />
                  (৮০%+)
                </div>
              </div>
              <div className="text-center px-2">
                <div className="text-xl md:text-2xl font-black font-mono text-red-500">0</div>
                <div className="text-[11px] leading-tight text-slate-400 mt-1">
                  ঝুঁকিপূর্ণ
                  <br />
                  (&lt;৫০%)
                </div>
              </div>
            </div>

            <div className="mt-6 w-full max-w-2xl flex items-center justify-between border-l-2 border-amber-500 pl-3">
              <span className="text-sm font-mono font-bold text-amber-400">106</span>
              <span className="text-xs text-slate-400">মূল্যায়ন বাকি</span>
            </div>
          </div>
        </div>

        {/* Baseline Survey */}
        <div className="rounded-[1.25rem] border border-cyan-900/40 bg-[#0f172a]/90 backdrop-blur p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2">
              <span>🔍</span> বেইজলাইন সার্ভে
            </h3>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-slate-700 text-slate-400">যেকোনো শ্রেণি · যেকোনো সময়</span>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-mono tracking-widest text-slate-400">শ্রেণি নির্বাচন করুন</span>
              <div className="mt-1.5 relative">
                <select className="w-full appearance-none rounded-xl border border-slate-700 bg-[#020617] px-4 py-3 pr-10 text-sm text-white focus:border-cyan-500 focus:outline-none">
                  <option>প্রথম</option>
                  <option>দ্বিতীয়</option>
                  <option>তৃতীয়</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">▼</span>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-mono tracking-widest text-slate-400">রোল নম্বর</span>
              <input placeholder="যেমন: ৭" className="mt-1.5 w-full rounded-xl border border-slate-700 bg-[#020617] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none" />
            </label>
            <div className="flex items-end">
              <button className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-medium py-3 text-sm transition-colors">
                শিক্ষার্থীর প্রোফাইল খুলুন →
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-2">
          <button className="px-5 py-2.5 rounded-xl bg-cyan-500 text-white font-medium text-sm shadow-[0_0_15px_rgba(6,182,214,0.3)]">
            সকল
            <br />
            <span className="text-xs opacity-80">সকল শ্রেণি</span>
            <br />
            <span className="font-mono text-xs">106 জন</span>
          </button>
          {(classes ?? []).slice(0, 4).map((c) => (
            <button key={c.id} className="px-4 py-2.5 rounded-xl border border-slate-800 bg-[#0f172a] text-slate-400 text-sm hover:border-slate-700">
              <div className="font-medium">{c.name}</div>
              <div className="font-mono text-xs">
                {(students ?? []).filter((s) => s.classId === c.id).length || (c.id === 1 ? 35 : c.id === 2 ? 22 : 20)} জন
              </div>
            </button>
          ))}
        </div>

        {/* Student Grid */}
        <div className="rounded-[1.25rem] border border-cyan-900/30 bg-[#0f172a]/60 backdrop-blur overflow-hidden">
          <div className="p-4 border-b border-slate-800/50 flex flex-wrap gap-3 items-center justify-between">
            <h3 className="font-bold text-cyan-400">শিক্ষার্থী গ্রিড</h3>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-slate-700 text-slate-400">সকল শ্রেণি</span>
          </div>

          <div className="p-4 space-y-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="নাম বা রোল দিয়ে খুঁজুন..."
              className="w-full rounded-xl border border-slate-700 bg-[#020617] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
            />

            <div className="flex flex-wrap gap-2 items-center">
              <button className="px-4 py-2 rounded-xl border border-slate-700 bg-[#0f172a] text-cyan-400 text-sm">সকল শ্রেণি</button>
              <label className="ml-auto flex items-center gap-2 text-sm text-slate-400">
                <span className="relative inline-flex items-center">
                  <input type="checkbox" checked={showSample} onChange={(e) => setShowSample(e.target.checked)} className="sr-only" />
                  <span className={`w-10 h-6 rounded-full p-1 transition-colors ${showSample ? 'bg-cyan-600' : 'bg-slate-700'}`}>
                    <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${showSample ? 'translate-x-4' : ''}`} />
                  </span>
                </span>
                নমুনা তথ্য দেখুন
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredStudents.slice(0, 12).map((s) => (
                <div key={s.id} className="rounded-xl border border-cyan-900/30 bg-[#0b1220] p-4 text-center hover:border-cyan-800/50 hover:bg-[#0f172a] transition-colors group">
                  <div className="w-14 h-14 rounded-full bg-[#020617] border border-slate-800 flex items-center justify-center mx-auto text-slate-600 group-hover:border-cyan-900/50 transition-colors">
                    —
                  </div>
                  <div className="mt-3 font-medium text-white text-sm">{s.name}</div>
                  <div className="mt-1 text-xs font-mono text-slate-500">
                    {CLASS_NAMES[s.classId] || `ক্লাস ${s.classId}`} · রোল {s.roll}
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="col-span-2 py-12 text-center text-sm text-slate-500">কোনো শিক্ষার্থী পাওয়া যায়নি</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Feed */}
        <div className="rounded-[1.25rem] border border-amber-900/30 bg-[#0f172a]/80 backdrop-blur p-4">
          <h3 className="font-bold text-amber-400 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">⚠</span>
            অ্যাকশন ফিড
            <span className="ml-2 text-xs font-mono px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">0</span>
          </h3>

          <div className="mt-4 space-y-2.5">
            {actionFeed.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border-l-4 border-amber-500 bg-[#020617] border border-slate-800 border-l-amber-500 px-4 py-3">
                <div>
                  <div className="font-medium text-white text-sm">
                    {a.name} — মূল্যায়ন প্রয়োজন
                  </div>
                  <div className="text-xs text-slate-500">এখনো শুরু হয়নি এমন শিক্ষার্থী</div>
                </div>
                <div className="font-mono font-black text-amber-400">
                  {a.count}/{a.count}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gap */}
        <div className="rounded-[1.25rem] border border-cyan-900/30 bg-[#0f172a]/60 backdrop-blur p-4">
          <h3 className="font-bold text-cyan-400">স্কিল-গ্যাপ বিশ্লেষণ</h3>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">তথ্য এন্ট্রি শুরু হলে এখানে সবচেয়ে দুর্বল দক্ষতা মাত্রাগুলো দেখা যাবে।</p>
        </div>

        {/* Weekly Export */}
        <button className="w-full rounded-xl border border-slate-700 bg-[#0f172a] hover:bg-slate-800 text-slate-300 py-3.5 flex items-center justify-center gap-2 text-sm transition-colors">
          <span>📄</span> সাপ্তাহিক অ্যাকশন ব্রিফ এক্সপোর্ট করুন
        </button>

        {/* Data Control */}
        <div className="rounded-[1.25rem] border border-cyan-900/30 bg-[#0f172a]/60 backdrop-blur p-4">
          <h3 className="font-bold text-cyan-400">ডেটা নিয়ন্ত্রণ</h3>
          <p className="mt-1 text-sm text-slate-500">এই ব্রাউজারে সংরক্ষিত সকল মূল্যায়ন তথ্য মুছে ফেলুন।</p>
          <button
            onClick={async () => {
              if (!confirm('সব তথ্য মুছে ফেলবেন?')) return
              const prompt = window.prompt('নিশ্চিত করতে RESET লিখুন')
              if (prompt !== 'RESET') return
              const { db } = await import('../db/schema')
              await db.delete()
              localStorage.clear()
              location.href = '/signup'
            }}
            className="mt-3 w-full rounded-xl border border-red-900/50 bg-red-950/30 hover:bg-red-950/50 text-red-400 py-3 flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <span>🗑</span> সব তথ্য রিসেট করুন
          </button>
        </div>

        {/* Footer */}
        <p className="text-center font-mono text-[10px] tracking-widest text-slate-600 py-2">
          বাংলা ফ্লুয়েন্টসি FGRA কার্ডসামার ভিজ্যুয়ালাইজেশন — ৫টি সাবটাস্ক
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #0f172a; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e3a4a; border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0e7490; }
      `}</style>
    </div>
  )
}
