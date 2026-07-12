import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import type { Student, MTRRecord, MTRSkillStatus, School } from '../types'

const CLASS_LIST = [1, 2, 3, 4, 5]
const CLASS_NAMES = ['', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম']

type SkillKey = 'banglaReading' | 'mathFourRules' | 'englishReading'
const SKILLS: { key: SkillKey; label: string }[] = [
  { key: 'banglaReading', label: 'বাংলা সাবলীল পঠন' },
  { key: 'mathFourRules', label: 'গণিত চার নিয়ম দক্ষতা' },
  { key: 'englishReading', label: 'English সাবলীল পঠন' }
]

// Government MTR official form: one row per (class, subject) pair.
const OFFICIAL_ROWS: { classId: number; skill: SkillKey; label: string }[] = [
  { classId: 3, skill: 'banglaReading', label: '৩য় শ্রেণি (বাংলা)' },
  { classId: 4, skill: 'mathFourRules', label: '৪র্থ শ্রেণি (গণিত)' },
  { classId: 5, skill: 'englishReading', label: '৫ম শ্রেণি (ইংরেজি)' }
]

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

function TriState({
  value,
  onChange
}: {
  value: MTRSkillStatus
  onChange: (v: MTRSkillStatus) => void
}) {
  const opts: { v: MTRSkillStatus; label: string; active: string }[] = [
    { v: 'unassessed', label: '—', active: 'bg-gray-300 text-gray-700 font-bold' },
    { v: 'yes', label: 'হ্যাঁ', active: 'bg-green-600 text-white font-bold' },
    { v: 'no', label: 'না', active: 'bg-red-600 text-white font-bold' }
  ]
  return (
    <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
      {opts.map((o) => (
        <button
          key={o.v}
          type="button"
          title={o.v === 'unassessed' ? 'মূল্যায়ন হয়নি' : o.v === 'yes' ? 'সক্ষম' : 'অক্ষম'}
          onClick={() => onChange(o.v)}
          className={`px-3 py-1.5 text-sm min-w-[44px] ${
            value === o.v ? o.active : 'bg-white text-gray-500'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function MTRTracking() {
  const [tab, setTab] = useState<'entry' | 'summary' | 'official'>('entry')
  const [classId, setClassId] = useState(1)
  const [savedAt, setSavedAt] = useState(0)
  const [printing, setPrinting] = useState(false)

  const studentsAll = useLiveQuery(() => db.students.toArray())
  const mtrAll = useLiveQuery(() => db.mtrRecords.toArray())
  const school = useLiveQuery(() => db.school.get('school'))

  // Per-class data for the entry view.
  const studentsInClass = useMemo(
    () => (studentsAll ?? []).filter((s) => s.classId === classId),
    [studentsAll, classId]
  )
  const mtrInClass = useMemo(
    () => (mtrAll ?? []).filter((r) => r.classId === classId),
    [mtrAll, classId]
  )

  // Local editable mirror (snappy UI), re-synced on class change.
  const [records, setRecords] = useState<Record<string, MTRRecord>>({})
  const lastClass = useState({ current: -1 })[0]
  useEffect(() => {
    if (studentsInClass && mtrInClass && (Object.keys(records).length === 0 || lastClass.current !== classId)) {
      const map: Record<string, MTRRecord> = {}
      for (const s of studentsInClass) {
        const existing = mtrInClass.find((r) => r.studentId === s.id)
        map[s.id] = existing ?? defaultRecord(s)
      }
      setRecords(map)
      lastClass.current = classId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsInClass, mtrInClass, classId])

  const saveRecords = useDebouncedCallback((all: Record<string, MTRRecord>) => {
    void db.mtrRecords.bulkPut(Object.values(all))
    setSavedAt(Date.now())
  }, 500)

  const setSkill = (studentId: string, key: SkillKey, val: MTRSkillStatus) => {
    const next = { ...records, [studentId]: { ...records[studentId], [key]: val } }
    setRecords(next)
    saveRecords(next)
  }

  // Summary across all classes, derived from live data.
  const mtrMap = useMemo(() => {
    const map: Record<string, MTRRecord> = {}
    for (const r of mtrAll ?? []) map[r.studentId] = r
    return map
  }, [mtrAll])

  function skillCounts(cid: number, skill: SkillKey) {
    const list = (studentsAll ?? []).filter((s) => s.classId === cid)
    let yes = 0
    let no = 0
    let unassessed = 0
    for (const s of list) {
      const st = (mtrMap[s.id] ?? defaultRecord(s))[skill]
      if (st === 'yes') yes++
      else if (st === 'no') no++
      else unassessed++
    }
    const assessed = yes + no
    return {
      total: list.length,
      yes,
      no,
      unassessed,
      achievedPct: assessed ? (yes / assessed) * 100 : null
    }
  }

  function classSummary(cid: number) {
    const r = { yes: 0, no: 0, unassessed: 0 }
    for (const sk of SKILLS) {
      const c = skillCounts(cid, sk.key)
      r.yes += c.yes
      r.no += c.no
      r.unassessed += c.unassessed
    }
    const total = (studentsAll ?? []).filter((s) => s.classId === cid).length
    const assessed = r.yes + r.no
    return {
      total,
      ...r,
      achievedPct: assessed ? (r.yes / assessed) * 100 : null
    }
  }

  // Print the official form only.
  useEffect(() => {
    if (!printing) return
    const onAfter = () => setPrinting(false)
    window.addEventListener('afterprint', onAfter)
    window.print()
    return () => window.removeEventListener('afterprint', onAfter)
  }, [printing])

  if (!school) return <p className="text-gray-500 p-4">লোড হচ্ছে…</p>

  if (printing) {
    return <OfficialForm school={school} skillCounts={skillCounts} />
  }

  const showSaved = Date.now() - savedAt < 1500

  return (
    <div>
      <h1 className="text-2xl font-bold text-maroon">MTR ট্র্যাকিং</h1>

      {/* Tabs */}
      <div className="no-print mt-3 flex flex-wrap gap-2">
        {[
          { k: 'entry', label: 'মূল্যায়ন এন্ট্রি' },
          { k: 'summary', label: 'সারসংক্ষেপ' },
          { k: 'official', label: 'সরকারি ফর্ম' }
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as 'entry' | 'summary' | 'official')}
            className={`px-4 py-2 rounded-lg text-sm border ${
              tab === t.k ? 'bg-maroon text-white border-maroon' : 'border-gray-300 text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'entry' && (
        <div className="mt-4 space-y-4">
          <div className="no-print flex flex-wrap gap-2">
            {CLASS_LIST.map((c) => (
              <button
                key={c}
                onClick={() => setClassId(c)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  classId === c ? 'bg-maroon text-white border-maroon' : 'border-gray-300 text-gray-700'
                }`}
              >
                {CLASS_NAMES[c]}
              </button>
            ))}
          </div>

          {studentsInClass.map((s) => {
            const rec = records[s.id] ?? defaultRecord(s)
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="font-semibold">
                  রোল {s.roll} — {s.name}
                </div>
                {SKILLS.map((sk) => (
                  <div key={sk.key} className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">{sk.label}</span>
                    <TriState
                      value={rec[sk.key]}
                      onChange={(v) => setSkill(rec.studentId, sk.key, v)}
                    />
                  </div>
                ))}
              </div>
            )
          })}
          {studentsInClass.length === 0 && (
            <p className="text-gray-500">এই ক্লাসে কোনো শিক্ষার্থী নেই।</p>
          )}
          {showSaved && (
            <div className="no-print fixed bottom-20 md:bottom-6 right-4 z-30 rounded-full bg-maroon px-4 py-2 text-white text-sm shadow-lg">
              সংরক্ষিত ✓
            </div>
          )}
        </div>
      )}

      {tab === 'summary' && (
        <div className="mt-4 bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-semibold mb-3">ক্লাসভিত্তিক MTR সারসংক্ষেপ</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[560px]">
              <thead>
                <tr className="text-sm text-gray-600 border-b border-gray-200">
                  <th className="py-2 pr-4">ক্লাস</th>
                  <th className="py-2 pr-4">মোট</th>
                  <th className="py-2 pr-4">সক্ষম</th>
                  <th className="py-2 pr-4">অক্ষম</th>
                  <th className="py-2 pr-4">মূল্যায়ন বাকি</th>
                  <th className="py-2">% অর্জন</th>
                </tr>
              </thead>
              <tbody>
                {CLASS_LIST.map((c) => {
                  const sm = classSummary(c)
                  return (
                    <tr key={c} className="border-b border-gray-100">
                      <td className="py-2 pr-4 font-medium">{CLASS_NAMES[c]}</td>
                      <td className="py-2 pr-4">{sm.total}</td>
                      <td className="py-2 pr-4">{sm.yes}</td>
                      <td className="py-2 pr-4">{sm.no}</td>
                      <td className="py-2 pr-4">{sm.unassessed}</td>
                      <td className="py-2">{sm.achievedPct != null ? sm.achievedPct.toFixed(1) + '%' : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            % অর্জন = সক্ষম ÷ (সক্ষম + অক্ষম) — মূল্যায়ন-বাকি শিক্ষার্থী গণনায় আসে না।
          </p>
        </div>
      )}

      {tab === 'official' && (
        <div className="mt-4">
          <div className="no-print mb-3">
            <button
              className="rounded-lg bg-maroon text-white px-4 py-2 text-sm"
              onClick={() => setPrinting(true)}
            >
              প্রিন্ট করুন (সরকারি ফর্ম)
            </button>
          </div>
          <OfficialForm school={school} skillCounts={skillCounts} />
        </div>
      )}
    </div>
  )
}

function OfficialForm({
  school,
  skillCounts
}: {
  school: School
  skillCounts: (cid: number, skill: SkillKey) => { total: number; yes: number; no: number; unassessed: number; achievedPct: number | null }
}) {
  return (
    <div className="official-print mx-auto max-w-[800px] border-2 border-maroon rounded-lg p-5 bg-white">
      <div className="text-center">
        <div className="text-xl font-bold text-maroon">{school.name}</div>
        <div className="text-sm text-gray-600">
          {school.village}, {school.postOffice}, {school.upazila}, {school.district}
        </div>
        <div className="mt-1 h-0.5 bg-[#C9A227]" />
        <div className="mt-1 text-sm font-semibold tracking-[0.2em] text-[#C9A227]">
          MID TERM REVIEW (MTR) — সরকারি ফর্ম
        </div>
      </div>

      <table className="mt-3 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-maroon text-white">
            <th className="border border-maroon px-2 py-1">ক্রমিক</th>
            <th className="border border-maroon px-2 py-1 text-left">শ্রেণি ও বিষয়</th>
            <th className="border border-maroon px-2 py-1">মোট</th>
            <th className="border border-maroon px-2 py-1">সক্ষম</th>
            <th className="border border-maroon px-2 py-1">অক্ষম</th>
            <th className="border border-maroon px-2 py-1">মূল্যায়ন বাকি</th>
            <th className="border border-maroon px-2 py-1">% অর্জন</th>
          </tr>
        </thead>
        <tbody>
          {OFFICIAL_ROWS.map((row, i) => {
            const c = skillCounts(row.classId, row.skill)
            return (
              <tr key={row.label}>
                <td className="border border-maroon px-2 py-1 text-center">{i + 1}</td>
                <td className="border border-maroon px-2 py-1">{row.label}</td>
                <td className="border border-maroon px-2 py-1 text-center">{c.total}</td>
                <td className="border border-maroon px-2 py-1 text-center">{c.yes}</td>
                <td className="border border-maroon px-2 py-1 text-center">{c.no}</td>
                <td className="border border-maroon px-2 py-1 text-center">{c.unassessed}</td>
                <td className="border border-maroon px-2 py-1 text-center">
                  {c.achievedPct != null ? c.achievedPct.toFixed(1) + '%' : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="mt-6 flex justify-between text-sm">
        <div className="border-t border-gray-400 pt-1 w-1/3 text-center">শিক্ষক</div>
        <div className="border-t border-gray-400 pt-1 w-1/3 text-center">প্রধান শিক্ষক</div>
      </div>
    </div>
  )
}
