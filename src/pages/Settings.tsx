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
      <span className="text-sm text-gray-600">{label}</span>
      <input
        type={type}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-maroon focus:outline-none"
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
      <h1 className="text-2xl font-bold text-maroon">সেটিংস</h1>

      {/* School info */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-4">স্কুলের তথ্য</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="স্কুলের নাম" value={school?.name ?? ''} onChange={(v) => onSchool({ name: v })} />
          <Field label="গ্রাম" value={school?.village ?? ''} onChange={(v) => onSchool({ village: v })} />
          <Field label="ডাকঘর" value={school?.postOffice ?? ''} onChange={(v) => onSchool({ postOffice: v })} />
          <Field label="উপজেলা" value={school?.upazila ?? ''} onChange={(v) => onSchool({ upazila: v })} />
          <Field label="জেলা" value={school?.district ?? ''} onChange={(v) => onSchool({ district: v })} />
        </div>
        <p className="mt-3 text-xs text-gray-400">পরিবর্তন স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়।</p>
      </section>

      {/* Grading scale */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">গ্রেড স্কেল</h2>
          <button
            className="rounded-lg bg-maroon px-3 py-2 text-white text-sm"
            onClick={addScaleRow}
          >
            + সারি যোগ করুন
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-gray-600 border-b border-gray-200">
                <th className="py-2 pr-3">ন্যূনতম %</th>
                <th className="py-2 pr-3">GPA</th>
                <th className="py-2 pr-3">গ্রেড</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {scaleSorted.map((r) => (
                <tr key={r._uid} className="border-b border-gray-100">
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1"
                      value={r.minPercent}
                      onChange={(e) =>
                        updateScaleRow(r._uid, { minPercent: Number(e.target.value) })
                      }
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      step="0.01"
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1"
                      value={r.gpa}
                      onChange={(e) => updateScaleRow(r._uid, { gpa: Number(e.target.value) })}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1"
                      value={r.grade}
                      onChange={(e) => updateScaleRow(r._uid, { grade: e.target.value })}
                    />
                  </td>
                  <td className="py-2">
                    <button
                      className="text-red-600 text-sm"
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
          <p className="mt-2 text-sm text-red-600">
            ন্যূনতম % এর মান ডুপ্লিকেট হতে পারবে না (রেঞ্জ ওভারল্যাপ)।
          </p>
        )}
        {!scaleValid && !scaleDuplicate && (
          <p className="mt-2 text-sm text-red-600">
            সব সারিতে বৈধ % (০–১০০), GPA ও গ্রেড থাকতে হবে।
          </p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          এই টেবিলটিই গ্রেডের একমাত্র উৎস (single source of truth)।
        </p>
      </section>

      {/* Per-class subjects */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">ক্লাস অনুযায়ী বিষয় ও পূর্ণমান</h2>
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-maroon">ক্লাস {cls.name}</h3>
              <button
                className="rounded-lg border border-maroon px-3 py-1.5 text-maroon text-sm disabled:opacity-40"
                disabled={cls.subjects.length >= 8}
                onClick={() => addSubject(cls.id)}
              >
                + বিষয় (স্লট {cls.subjects.length}/8)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-gray-600 border-b border-gray-200">
                    <th className="py-2 pr-3">বিষয়ের নাম</th>
                    <th className="py-2 pr-3">পূর্ণমান (০ = নিষ্ক্রিয়)</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {cls.subjects.map((s) => (
                    <tr key={s.id} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <input
                          className="w-full min-w-[160px] rounded-lg border border-gray-300 px-2 py-1"
                          value={s.name}
                          onChange={(e) => updateSubject(cls.id, s.id, { name: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          className="w-28 rounded-lg border border-gray-300 px-2 py-1"
                          value={s.fullMarks}
                          onChange={(e) =>
                            updateSubject(cls.id, s.id, { fullMarks: Number(e.target.value) })
                          }
                        />
                      </td>
                      <td className="py-2">
                        <button
                          className="text-red-600 text-sm"
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
        <div className="fixed bottom-20 md:bottom-6 right-4 z-30 rounded-full bg-maroon px-4 py-2 text-white text-sm shadow-lg">
          সংরক্ষিত ✓
        </div>
      )}
    </div>
  )
}
