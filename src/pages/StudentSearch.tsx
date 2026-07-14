import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import {
  calculateTotal,
  calculateAverage,
  lookupGpaAndGrade,
  calculateResult,
  calculateMeritRank
} from '../lib/calculations'
import type { Student, ClassConfig, MTRRecord, MTRSkillStatus } from '../types'

const CLASS_NAMES = ['', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম']

type SkillKey = 'banglaReading' | 'mathFourRules' | 'englishReading'
const SKILLS: { key: SkillKey; label: string }[] = [
  { key: 'banglaReading', label: 'বাংলা সাবলীল পঠন' },
  { key: 'mathFourRules', label: 'গণিত চার নিয়ম দক্ষতা' },
  { key: 'englishReading', label: 'English সাবলীল পঠন' }
]

const RESULT_STYLE: Record<'Pass' | 'Fail' | 'Incomplete', string> = {
  Pass: 'bg-bd-green-100 text-bd-green-800 border-bd-green-300',
  Fail: 'bg-bd-red-100 text-bd-red-800 border-bd-red-300',
  Incomplete: 'bg-gold/15 text-yellow-800 border-gold/30'
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
    yes: { t: 'হ্যাঁ', c: 'bg-bd-green-600 text-white' },
    no: { t: 'না', c: 'bg-bd-red-600 text-white' },
    unassessed: { t: '—', c: 'bg-gray-100 text-gray-600 border border-gray-200' }
  }
  const { t, c } = map[v]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c}`}>{t}</span>
  )
}

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

export default function StudentSearch() {
  const [query, setQuery] = useState('')

  const students = useLiveQuery(() => db.students.toArray())
  const classes = useLiveQuery(() => db.classes.toArray())
  const scale = useLiveQuery(() => db.gradingScale.toArray())
  const mtrAll = useLiveQuery(() => db.mtrRecords.toArray())

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

  // Merit rank is per class — compute once per class over all its students.
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
    const all = students ?? []
    if (q === '') return all
    return all.filter(
      (s) =>
        normalize(s.name).includes(q) ||
        String(s.roll).includes(q) ||
        normalize(s.guardian ?? '').includes(q) ||
        normalize(s.village ?? '').includes(q)
    )
  }, [students, q])

  const sortedMatches = useMemo(
    () =>
      [...matches].sort((a, b) => {
        if (a.classId !== b.classId) return a.classId - b.classId
        return (a.roll || 0) - (b.roll || 0)
      }),
    [matches]
  )

  if (!students || !classes || !scale || scale.length === 0) {
    return <p className="text-gray-500 p-4">লোড হচ্ছে…</p>
  }

  return (
    <section>
      <h1 className="text-3xl font-heading font-bold text-bd-green-900 mb-5 tracking-tight">অনুসন্ধান</h1>

      <div role="search" className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="নাম, রোল, অভিভাবক বা গ্রাম লিখুন…"
          className={`glass-input ${query ? 'pr-10' : ''} pl-12`}
          aria-label="শিক্ষার্থী অনুসন্ধান"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-bd-green-700 transition-colors duration-200 p-1"
            aria-label="সন্ধান মুছে ফেলুন"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {students.length === 0 ? (
        <div className="mt-6 glass-card-subtle p-8 text-center text-gray-500 border-dashed">
          এখনও কোনো শিক্ষার্থী যোগ করা হয়নি। ক্লাস তালিকা থেকে শিক্ষার্থী যোগ করুন।
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="mt-6 glass-card-subtle p-8 text-center text-gray-500 border-dashed">
          “{query}” এর সাথে মিলে যাওয়া কোনো শিক্ষার্থী পাওয়া যায়নি।
        </div>
      ) : (
        <p className="mt-4 text-sm text-gray-500 font-medium">{sortedMatches.length} জন শিক্ষার্থী পাওয়া গেছে</p>
      )}

      <div className="mt-4 space-y-3">
        {sortedMatches.map((s) => {
          const cc = classMap.get(s.classId)
          if (!cc) return null
          const avg = calculateAverage(s, cc)
          const { gpa, grade } = lookupGpaAndGrade(avg, scale)
          const result = calculateResult(s, cc, scale)
          const total = calculateTotal(s, cc)
          const rank = ranksByClass[s.classId]?.[s.id]
          const rec = mtrMap.get(s.id) ?? defaultRecord(s)

          return (
            <div key={s.id} className="glass-card p-5 hover:shadow-soft-lg transition-all duration-200">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-heading font-semibold text-base text-bd-green-900">
                    {s.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-medium">
                    রোল {s.roll} · {CLASS_NAMES[s.classId]}
                    {s.guardian ? ` · অভিভাবক: ${s.guardian}` : ''}
                    {s.village ? ` · ${s.village}` : ''}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${RESULT_STYLE[result]}`}
                >
                  {RESULT_LABEL[result]}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-medium">
                <span>মোট: <span className="text-bd-green-700">{total}</span></span>
                <span>গড়: <span className="text-bd-green-700">{avg.toFixed(2)}%</span></span>
                <span>GPA: <span className="text-bd-green-700">{gpa.toFixed(2)}</span></span>
                <span>গ্রেড: <span className="text-bd-green-700">{grade}</span></span>
                <span>মেধা: <span className="text-bd-green-700">{rank ?? '—'}</span></span>
              </div>

              <div className="mt-3 border-t border-bd-green-100 pt-3">
                <div className="text-xs font-semibold text-gray-500 mb-2">MTR দক্ষতা</div>
                <div className="space-y-1.5">
                  {SKILLS.map((sk) => (
                    <div key={sk.key} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">{sk.label}</span>
                      {skillPill(rec[sk.key])}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
