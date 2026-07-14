import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import type { School, ClassConfig, GradingScaleRow, SubjectSlot } from '../types'

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

type ScaleRowLocal = GradingScaleRow & { _uid: string }

function Field({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        type={type}
        className="glass-input mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export default function Settings() {
  const [savedAt, setSavedAt] = useState(0)

  // --- School (single row) ---
  const schoolLive = useLiveQuery(() => db.school.get('school'))
  const [school, setSchool] = useState<School | null>(null)
  useEffect(() => {
    if (schoolLive && !school) setSchool(schoolLive)
  }, [schoolLive, school])

  const saveSchool = useDebouncedCallback((s: School) => {
    void db.school.put(s)
    setSavedAt(Date.now())
  }, 600)
  const onSchool = (patch: Partial<School>) => {
    if (!school) return
    const next = { ...school, ...patch }
    setSchool(next)
    saveSchool(next)
  }

  // --- Grading scale (table keyed by minPercent) ---
  const scaleLive = useLiveQuery(() => db.gradingScale.toArray())
  const [scale, setScale] = useState<ScaleRowLocal[]>([])
  useEffect(() => {
    if (scaleLive && scale.length === 0) {
      setScale(scaleLive.map((r) => ({ ...r, _uid: uid() })))
    }
  }, [scaleLive, scale.length])

  const saveScale = useDebouncedCallback((rows: ScaleRowLocal[]) => {
    const clean = rows.map(({ _uid, ...r }) => r)
    void db.transaction('rw', db.gradingScale, async () => {
      await db.gradingScale.clear()
      await db.gradingScale.bulkPut(clean)
    })
    setSavedAt(Date.now())
  }, 600)

  const scaleDuplicate = (() => {
    const seen = new Set<number>()
    let dup = false
    for (const r of scale) {
      if (seen.has(r.minPercent)) dup = true
      seen.add(r.minPercent)
    }
    return dup
  })()
  const scaleValid =
    scale.length > 0 &&
    !scaleDuplicate &&
    scale.every(
      (r) =>
        r.minPercent >= 0 &&
        r.minPercent <= 100 &&
        !Number.isNaN(r.gpa) &&
        r.grade.trim() !== ''
    )

  const updateScaleRow = (u: string, patch: Partial<ScaleRowLocal>) => {
    const next = scale.map((r) => (r._uid === u ? { ...r, ...patch } : r))
    setScale(next)
    if (scaleValid) saveScale(next)
  }
  const addScaleRow = () => {
    const next = [...scale, { _uid: uid(), minPercent: 100, gpa: 0, grade: '', remark: '' }]
    setScale(next)
  }
  const removeScaleRow = (u: string) => {
    const next = scale.filter((r) => r._uid !== u)
    setScale(next)
    if (scaleValid) saveScale(next)
  }

  // --- Per-class subject configuration ---
  const classesLive = useLiveQuery(() => db.classes.toArray())
  const [classes, setClasses] = useState<ClassConfig[]>([])
  useEffect(() => {
    if (classesLive && classes.length === 0) setClasses(classesLive)
  }, [classesLive, classes.length])

  const saveClasses = useDebouncedCallback((all: ClassConfig[]) => {
    void db.classes.bulkPut(all)
    setSavedAt(Date.now())
  }, 600)

  const updateClass = (classId: number, subjects: SubjectSlot[]) => {
    const next = classes.map((c) => (c.id === classId ? { ...c, subjects } : c))
    setClasses(next)
    saveClasses(next)
  }
  const updateSubject = (classId: number, subjId: string, patch: Partial<SubjectSlot>) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return
    updateClass(
      classId,
      cls.subjects.map((s) => (s.id === subjId ? { ...s, ...patch } : s))
    )
  }
  const addSubject = (classId: number) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls || cls.subjects.length >= 8) return
    updateClass(classId, [...cls.subjects, { id: uid(), name: '', fullMarks: 0 }])
  }
  const removeSubject = (classId: number, subjId: string) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return
    updateClass(
      classId,
      cls.subjects.filter((s) => s.id !== subjId)
    )
  }

  // --- "saved" indicator ---
  const showSaved = Date.now() - savedAt < 1500
  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(0), 1500)
    return () => clearTimeout(t)
  }, [savedAt])

  const scaleSorted = [...scale].sort((a, b) => b.minPercent - a.minPercent)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-bd-green-900 tracking-tight">সেটিংস</h1>

      {/* School info */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-4 text-bd-green-900">স্কুলের তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="স্কুলের নাম" value={school?.name ?? ''} onChange={(v) => onSchool({ name: v })} />
          <Field label="গ্রাম" value={school?.village ?? ''} onChange={(v) => onSchool({ village: v })} />
          <Field label="ডাকঘর" value={school?.postOffice ?? ''} onChange={(v) => onSchool({ postOffice: v })} />
          <Field label="উপজেলা" value={school?.upazila ?? ''} onChange={(v) => onSchool({ upazila: v })} />
          <Field label="জেলা" value={school?.district ?? ''} onChange={(v) => onSchool({ district: v })} />
        </div>
        <p className="mt-4 text-xs text-gray-400 font-medium">পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়।</p>
      </section>

      {/* Grading scale */}
      <section className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-bd-green-900">গ্রেড স্কেল</h2>
          <button
            className="btn-primary"
            onClick={addScaleRow}
          >
            + সারি যোগ করুন
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-bd-green-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-bd-green-800 bg-bd-green-50/50">
                <th className="py-3 pr-3 font-semibold">ন্যূনতম %</th>
                <th className="py-3 pr-3 font-semibold">GPA</th>
                <th className="py-3 pr-3 font-semibold">গ্রেড</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {scaleSorted.map((r) => (
                <tr key={r._uid} className="border-t border-bd-green-100">
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      className="glass-input w-24"
                      value={r.minPercent}
                      onChange={(e) =>
                        updateScaleRow(r._uid, { minPercent: Number(e.target.value) })
                      }
                      aria-label={`ন্যূনতম % (${r.grade || 'গ্রেড'})`}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      step="0.01"
                      className="glass-input w-20"
                      value={r.gpa}
                      onChange={(e) => updateScaleRow(r._uid, { gpa: Number(e.target.value) })}
                      aria-label={`GPA (${r.grade || 'গ্রেড'})`}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      className="glass-input w-20"
                      value={r.grade}
                      onChange={(e) => updateScaleRow(r._uid, { grade: e.target.value })}
                      aria-label={`গ্রেড (ন্যূনতম ${r.minPercent}%)`}
                    />
                  </td>
                  <td className="py-2.5">
                    <button
                      className="text-bd-red-600 text-sm font-medium hover:text-bd-red-800 transition-colors duration-200"
                      onClick={() => removeScaleRow(r._uid)}
                    >
                      মুছুন
                    </button>
                  </td>
                </tr>
              ))}
              {scaleSorted.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-gray-400">
                    কোনো সারি নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {scaleDuplicate && (
          <p className="mt-3 text-sm text-bd-red-700 font-medium">
            ন্যূনতম % এর মান ডুপ্লিকেট হতে পারবে না (রেঞ্জ ওভারল্যাপ)।
          </p>
        )}
        {!scaleValid && !scaleDuplicate && (
          <p className="mt-3 text-sm text-bd-red-700 font-medium">
            {scale.length === 0
              ? 'কমপক্ষে একটি গ্রেড সারি থাকতে হবে।'
              : 'সব সারিতে বৈধ % (০–১০০), GPA ও গ্রেড থাকতে হবে।'}
          </p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          এই টেবিলটিই গ্রেডের একমাত্র উৎস (single source of truth)।
        </p>
      </section>

      {/* Per-class subjects */}
      <section className="space-y-4">
        <h2 className="text-lg font-heading font-semibold text-bd-green-900">ক্লাস অনুযায়ী বিষয় ও পূর্ণমান</h2>
        {classes.map((cls) => (
          <div key={cls.id} className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-bd-green-900">ক্লাস {cls.name}</h3>
              <button
                className="rounded-xl border border-bd-green-700 px-4 py-2 text-bd-green-700 text-sm font-semibold disabled:opacity-40 hover:bg-bd-green-50 transition-all duration-200"
                disabled={cls.subjects.length >= 8}
                onClick={() => addSubject(cls.id)}
              >
                + বিষয় (স্লট {cls.subjects.length}/8)
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-bd-green-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-bd-green-800 bg-bd-green-50/50">
                    <th className="py-3 pr-3 font-semibold">বিষয়ের নাম</th>
                    <th className="py-3 pr-3 font-semibold">পূর্ণমান (০ = নিষ্ক্রিয়)</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cls.subjects.map((s) => (
                    <tr key={s.id} className="border-t border-bd-green-100">
                      <td className="py-2.5 pr-3">
                        <input
                          className="glass-input w-full min-w-[160px]"
                          value={s.name}
                          onChange={(e) => updateSubject(cls.id, s.id, { name: e.target.value })}
                          aria-label={`বিষয় (ক্লাস ${cls.name})`}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="number"
                          className="glass-input w-28"
                          value={s.fullMarks}
                          onChange={(e) =>
                            updateSubject(cls.id, s.id, { fullMarks: Number(e.target.value) })
                          }
                          aria-label={`পূর্ণমান (ক্লাস ${cls.name})`}
                        />
                      </td>
                      <td className="py-2.5">
                        <button
                          className="text-bd-red-600 text-sm font-medium hover:text-bd-red-800 transition-colors duration-200"
                          onClick={() => removeSubject(cls.id, s.id)}
                        >
                          মুছুন
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cls.subjects.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-gray-400">
                        কোনো সক্রিয় বিষয় নেই
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Saved indicator */}
      {showSaved && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-30 rounded-full bg-bd-green-700 px-5 py-2.5 text-white text-sm font-medium shadow-soft-lg">
          সংরক্ষিত ✓
        </div>
      )}
    </div>
  )
}
