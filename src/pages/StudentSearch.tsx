import { useState, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import {
  calculateTotal,
  calculateAverage,
  lookupGpaAndGrade,
  calculateResult,
  calculateMeritRank
} from '../lib/calculations'
import { useAuth } from '../contexts/AuthContext'
import type { Student, ClassConfig, MTRRecord, MTRSkillStatus } from '../types'
import { CLASS_NAMES } from '../lib/classes'

type SkillKey = 'banglaReading' | 'mathFourRules' | 'englishReading'
const SKILLS: { key: SkillKey; label: string }[] = [
  { key: 'banglaReading', label: 'বাংলা সাবলীল পঠন' },
  { key: 'mathFourRules', label: 'গণিত চার নিয়ম দক্ষতা' },
  { key: 'englishReading', label: 'English সাবলীল পঠন' }
]

const RESULT_STYLE: Record<'Pass' | 'Fail' | 'Incomplete', string> = {
  Pass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Fail: 'bg-red-50 text-red-700 border-red-200',
  Incomplete: 'bg-amber-50 text-amber-700 border-amber-200'
}
const RESULT_LABEL: Record<'Pass' | 'Fail' | 'Incomplete', string> = {
  Pass: 'উত্তীর্ণ',
  Fail: 'অনুত্তীর্ণ',
  Incomplete: 'অসম্পূর্ণ'
}

function defaultRecord(s: Student): MTRRecord {
  return {
    id: `${s.classId}_${s.roll}`,
    studentId: s.id,
    classId: s.classId,
    roll: s.roll,
    banglaReading: 'unassessed',
    mathFourRules: 'unassessed',
    englishReading: 'unassessed'
  }
}

function skillPill(v: MTRSkillStatus) {
  const map = {
    yes: { t: 'হ্যাঁ', c: 'bg-emerald-600 text-white' },
    no: { t: 'না', c: 'bg-red-600 text-white' },
    unassessed: { t: '—', c: 'bg-gray-100 text-gray-500 border border-gray-200' }
  }
  const { t, c } = map[v]
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c}`}>{t}</span>
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

const RECENT_KEY = 'bejkhonda-recent-searches'

export default function StudentSearch() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
  const [query, setQuery] = useState('')
  const [filterClass, setFilterClass] = useState<number | 'all'>('all')
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })

  const students = useLiveQuery(
    () => schoolId ? db.students.where('schoolId').equals(schoolId).toArray() : db.students.toArray()
  )
  const classes = useLiveQuery(
    () => schoolId ? db.classes.where('schoolId').equals(schoolId).toArray() : db.classes.toArray()
  )
  const scale = useLiveQuery(
    () => schoolId ? db.gradingScale.where('schoolId').equals(schoolId).toArray() : db.gradingScale.toArray()
  )
  const mtrAll = useLiveQuery(
    () => schoolId ? db.mtrRecords.where('schoolId').equals(schoolId).toArray() : db.mtrRecords.toArray()
  )

  const classMap = useMemo(() => {
    const m = new Map<number, ClassConfig>()
    for (const c of classes ?? []) m.set(c.id, c)
    return m
  }, [classes])

  const mtrMap = useMemo(() => {
    const m = new Map<string, MTRRecord>()
    for (const r of mtrAll ?? []) m.set(r.studentId, r)
    return m
  }, [mtrAll])

  const ranksByClass = useMemo(() => {
    const out: Record<number, Record<string, number>> = {}
    for (const c of classes ?? []) {
      const list = (students ?? []).filter((s) => s.classId === c.id)
      out[c.id] = calculateMeritRank(list, c)
    }
    return out
  }, [classes, students])

  const q = normalize(query)
  const matches = useMemo(() => {
    let all = students ?? []
    if (filterClass !== 'all') {
      all = all.filter(s => s.classId === filterClass)
    }
    if (q === '') return all
    return all.filter(
      (s) =>
        normalize(s.name).includes(q) ||
        String(s.roll).includes(q) ||
        normalize(s.guardian ?? '').includes(q) ||
        normalize(s.village ?? '').includes(q) ||
        normalize((s as any).phone ?? '').includes(q)
    )
  }, [students, q, filterClass])

  const sortedMatches = useMemo(
    () =>
      [...matches].sort((a, b) => {
        if (a.classId !== b.classId) return a.classId - b.classId
        return (a.roll || 0) - (b.roll || 0)
      }),
    [matches]
  )

  const pushRecent = (term: string) => {
    const t = term.trim()
    if (!t || t.length < 2) return
    setRecent(prev => {
      const next = [t, ...prev.filter(x => x !== t)].slice(0, 5)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }

  useEffect(() => {
    if (q.length >= 2) {
      const t = setTimeout(() => pushRecent(q), 800)
      return () => clearTimeout(t)
    }
  }, [q])

  if (!students || !classes || !scale || scale.length === 0) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="h-14 bg-gray-100 rounded-2xl" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight text-gray-900">অনুসন্ধান</h1>
        <p className="text-sm text-gray-500 mt-1">নাম, রোল, গ্রাম বা ফোন দিয়ে খুঁজুন — সব ডেটা লোকাল</p>
      </div>

      {/* Search — professional, trending with filter pills */}
      <div className="rounded-[1.5rem] bg-white border border-gray-100 shadow-sm p-4 space-y-4">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="নাম, রোল, অভিভাবক, গ্রাম, ফোন…"
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pl-12 pr-12 text-sm placeholder:text-gray-400 focus:bg-white focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all"
            aria-label="শিক্ষার্থী অনুসন্ধান"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs font-medium text-gray-500">ফিল্টার:</span>
          <button
            onClick={() => setFilterClass('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterClass === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            সব ক্লাস
          </button>
          {(classes ?? []).slice(0, 8).map(c => (
            <button
              key={c.id}
              onClick={() => setFilterClass(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterClass === c.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {recent.length > 0 && !q && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400">সাম্প্রতিক:</span>
            {recent.map(r => (
              <button
                key={r}
                onClick={() => setQuery(r)}
                className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-xs text-gray-600 transition-colors"
              >
                {r}
              </button>
            ))}
            <button onClick={() => { setRecent([]); localStorage.removeItem(RECENT_KEY)}} className="text-xs text-gray-400 hover:text-gray-600 ml-1">মুছুন</button>
          </div>
        )}
      </div>

      {/* Results meta */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {q || filterClass !== 'all' ? `${sortedMatches.length} জন পাওয়া গেছে` : `${students.length} জন মোট`} 
          <span className="hidden sm:inline"> • স্থায়ী লোকাল DB</span>
        </p>
        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
          IndexedDB ✓
        </span>
      </div>

      {students.length === 0 ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">◈</div>
          <p className="font-medium text-gray-900">এখনও কোনো শিক্ষার্থী নেই</p>
          <p className="text-sm text-gray-500 mt-1">Roster থেকে যোগ করুন বা Import থেকে ফাইল আনুন</p>
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="rounded-[1.5rem] border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-gray-900 font-medium">কোনো ফলাফল নেই</p>
          <p className="text-sm text-gray-500 mt-1">“{query}” এর সাথে মিলে যাওয়া শিক্ষার্থী পাওয়া যায়নি</p>
          <button onClick={() => { setQuery(''); setFilterClass('all')}} className="mt-4 px-4 py-2 rounded-full bg-gray-900 text-white text-sm hover:bg-black transition-colors">
            ফিল্টার রিসেট
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {sortedMatches.map((s) => {
            const cc = classMap.get(s.classId)
            if (!cc) return null
            const avg = calculateAverage(s, cc)
            const { gpa } = lookupGpaAndGrade(avg, scale)
            const result = calculateResult(s, cc, scale)
            const total = calculateTotal(s, cc)
            const rank = ranksByClass[s.classId]?.[s.id]
            const rec = mtrMap.get(s.id) ?? defaultRecord(s)

            return (
              <div key={s.id} className="group rounded-[1.5rem] bg-white border border-gray-100 p-5 hover:shadow-lg hover:shadow-gray-900/5 hover:border-gray-200 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-heading font-semibold text-gray-900 truncate">{s.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-6 h-6 rounded-lg bg-gray-900 text-white flex items-center justify-center text-xs font-bold">{s.classId}</span>
                        {CLASS_NAMES[s.classId]}
                      </span>
                      <span>রোল {s.roll}</span>
                      {s.guardian && <span>• {s.guardian}</span>}
                    </p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${RESULT_STYLE[result]}`}>
                    {RESULT_LABEL[result]}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">মোট</div>
                    <div className="font-bold text-gray-900">{total}</div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">গড়</div>
                    <div className="font-bold text-gray-900">{avg.toFixed(1)}%</div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <div className="text-xs text-gray-500">GPA</div>
                    <div className="font-bold text-gray-900">{gpa.toFixed(2)}</div>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-3">
                    <div className="text-xs text-emerald-700">মেধা</div>
                    <div className="font-bold text-emerald-700">{rank ?? '—'}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 mb-2">MTR</p>
                  <div className="flex gap-2">
                    {SKILLS.map((sk) => (
                      <div key={sk.key} className="flex-1 text-center">
                        <div className="text-xs text-gray-500 truncate">{sk.label.split(' ')[0]}</div>
                        <div className="mt-1 flex justify-center">{skillPill(rec[sk.key])}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
