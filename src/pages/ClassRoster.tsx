import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import {
  calculateTotal,
  calculateAverage,
  lookupGpaAndGrade,
  calculateResult,
  calculateMeritRank,
  passThreshold,
  getActiveSubjects
} from '../lib/calculations'
import { useAuth } from '../contexts/AuthContext'
import type { Student, ClassConfig, GradingScaleRow } from '../types'

const CLASS_LIST = [1, 2, 3, 4, 5]
const CLASS_NAMES = ['', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম']

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

function ResultBadge({ result }: { result: 'Pass' | 'Fail' | 'Incomplete' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${RESULT_STYLE[result]}`}
    >
      {RESULT_LABEL[result]}
    </span>
  )
}

type FormState = {
  id: string | null
  roll: string
  name: string
  guardian: string
  village: string
  attendance: string
  marks: Record<string, string>
}

function emptyForm(active: { name: string }[]): FormState {
  const marks: Record<string, string> = {}
  for (const s of active) marks[s.name] = ''
  return { id: null, roll: '', name: '', guardian: '', village: '', attendance: '', marks }
}

function studentToForm(s: Student, active: { name: string }[]): FormState {
  const marks: Record<string, string> = {}
  for (const sub of active) {
    const m = s.marks?.[sub.name]
    marks[sub.name] = m == null ? '' : String(m)
  }
  return {
    id: s.id,
    roll: String(s.roll),
    name: s.name,
    guardian: s.guardian ?? '',
    village: s.village ?? '',
    attendance: s.attendance != null ? String(s.attendance) : '',
    marks
  }
}

function StudentFormModal({
  form,
  setForm,
  active,
  onClose,
  onSave,
  error
}: {
  form: FormState
  setForm: (f: FormState) => void
  active: { name: string; fullMarks: number }[]
  onClose: () => void
  onSave: () => void
  error: string
}) {
  const setMark = (name: string, value: string) =>
    setForm({ ...form, marks: { ...form.marks, [name]: value } })

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-heading font-semibold text-bd-green-900">
            {form.id ? 'শিক্ষার্থী সম্পাদনা' : 'নতুন শিক্ষার্থী'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 text-2xl leading-none px-2"
            aria-label="বন্ধ করুন"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">রোল</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={form.roll}
                onChange={(e) => setForm({ ...form, roll: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">উপস্থিতি %</span>
              <input
                type="number"
                min={0}
                max={100}
                inputMode="decimal"
                value={form.attendance}
                onChange={(e) => setForm({ ...form, attendance: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-gray-600">নাম</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">অভিভাবক</span>
              <input
                value={form.guardian}
                onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">গ্রাম</span>
              <input
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="pt-1">
            <div className="text-sm font-medium text-gray-700 mb-2">নম্বর (প্রতি বিষয়)</div>
            <div className="grid grid-cols-2 gap-3">
              {active.map((s) => {
                const raw = form.marks[s.name]?.trim() ?? ''
                const m = raw === '' ? null : Number(raw)
                const pct = m == null || !Number.isFinite(m) ? null : (m / s.fullMarks) * 100
                return (
                  <label key={s.name} className="text-sm">
                    <span className="text-gray-600">
                      {s.name} <span className="text-gray-400">/ {s.fullMarks}</span>
                    </span>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        inputMode="decimal"
                        value={raw}
                        placeholder="—"
                        onChange={(e) => setMark(s.name, e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                      />
                      {pct != null && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">{pct.toFixed(0)}%</span>
                      )}
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-bd-red-50 border border-bd-red-300 text-bd-red-700 text-sm px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            বাতিল
          </button>
          <button
            onClick={onSave}
            className="btn-primary flex-1"
          >
            সংরক্ষণ
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClassRoster() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
  const [classId, setClassId] = useState(1)
  const [modal, setModal] = useState<FormState | null>(null)
  const [error, setError] = useState('')

  const classConfig = useLiveQuery(
    () => schoolId ? db.classes.where('schoolId').equals(schoolId).and(c => c.id === classId).first() : db.classes.get(classId),
    [schoolId, classId]
  )
  const students = useLiveQuery(
    () => schoolId ? db.students.where('schoolId').equals(schoolId).and(s => s.classId === classId).toArray() : db.students.where('classId').equals(classId).toArray(),
    [schoolId, classId]
  )
  const scale = useLiveQuery(
    () => schoolId ? db.gradingScale.where('schoolId').equals(schoolId).toArray() : db.gradingScale.toArray(),
    [schoolId]
  )

  const active = useMemo<{ name: string; fullMarks: number }[]>(
    () => (classConfig ? getActiveSubjects(classConfig) : []),
    [classConfig]
  )

  const sorted = useMemo(
    () => [...(students ?? [])].sort((a, b) => (a.roll || 0) - (b.roll || 0)),
    [students]
  )

  const ranks = useMemo(
    () => (classConfig && students ? calculateMeritRank(students, classConfig) : {}),
    [students, classConfig]
  )

  const threshold = scale && scale.length ? passThreshold(scale) : 33
  const scaleRows: GradingScaleRow[] = scale ?? []

  function openAdd() {
    setError('')
    setModal(emptyForm(active))
  }

  function openEdit(s: Student) {
    setError('')
    setModal(studentToForm(s, active))
  }

  async function handleSave() {
    if (!modal) return
    const rollNum = Number(modal.roll)
    if (!Number.isInteger(rollNum) || rollNum < 1) {
      setError('রোল সঠিক নয় (১ বা তার বেশি হতে হবে)')
      return
    }
    if (!modal.name.trim()) {
      setError('নাম আবশ্যক')
      return
    }
    const attendanceRaw = modal.attendance.trim()
    const attendance =
      attendanceRaw === '' ? undefined : Number(attendanceRaw)
    if (attendance != null && (!Number.isFinite(attendance) || attendance < 0 || attendance > 100)) {
      setError('উপস্থিতি ০–১০০ এর মধ্যে হতে হবে')
      return
    }

    const marks: Record<string, number | null> = {}
    for (const s of active) {
      const raw = modal.marks[s.name]?.trim() ?? ''
      if (raw === '') {
        marks[s.name] = null
      } else {
        const n = Number(raw)
        if (!Number.isFinite(n)) {
          setError(`${s.name}: নম্বর সঠিক নয়`)
          return
        }
        if (n < 0) {
          setError(`${s.name}: নম্বর ০-এর কম হতে পারবে না`)
          return
        }
        if (n > s.fullMarks) {
          setError(`${s.name}: নম্বর পূর্ণমান ${s.fullMarks}-এর বেশি হতে পারবে না`)
          return
        }
        marks[s.name] = n
      }
    }

    const id = `${classId}_${rollNum}`
    const student: Student = {
      id,
      classId,
      roll: rollNum,
      name: modal.name.trim(),
      guardian: modal.guardian.trim() || undefined,
      village: modal.village.trim() || undefined,
      attendance,
      marks
    }

    try {
      await db.transaction('rw', db.students, db.mtrRecords, async () => {
        if (modal.id && modal.id !== id) {
          await db.students.delete(modal.id)
        }
        await db.students.put(student)
      })
      setModal(null)
      setError('')
    } catch (e) {
      if (e instanceof Error && e.name === 'ConstraintError') {
        setError(`রোল ${rollNum} ইতিমধ্যে ব্যবহৃত`)
      } else {
        setError('সংরক্ষণে সমস্যা হয়েছে')
      }
    }
  }

  async function handleDelete(s: Student) {
    if (!window.confirm(`রোল ${s.roll} — ${s.name} মুছে ফেলবেন?`)) return
    await db.transaction('rw', db.students, db.mtrRecords, async () => {
      await db.students.delete(s.id)
      await db.mtrRecords.where('studentId').equals(s.id).delete()
    })
  }

  function subjectCell(s: { name: string; fullMarks: number }, mark: number | null) {
    if (mark == null) return <span className="text-gray-400">—</span>
    const pct = (mark / s.fullMarks) * 100
    const low = pct < threshold
    return (
      <span className={low ? 'text-bd-red-600 font-semibold' : ''} title={`${pct.toFixed(1)}%`}>
        {mark}
      </span>
    )
  }

  if (!classConfig || !scale || scale.length === 0) {
    return <p className="text-gray-500 p-4">লোড হচ্ছে…</p>
  }

  return (
    <section>
      <h1 className="text-2xl font-heading font-bold text-bd-green-900 mb-4">শ্রেণি তালিকা</h1>

      {/* Class tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CLASS_LIST.map((c) => (
          <button
            key={c}
            onClick={() => {
              setClassId(c)
              setModal(null)
              setError('')
            }}
            className={`px-3 py-2 rounded-lg text-sm border ${
              classId === c ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {CLASS_NAMES[c]}
          </button>
        ))}
      </div>

      <div className="no-print mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          মোট শিক্ষার্থী: {sorted.length} | পাসের সীমা: {threshold}%
        </p>
        <button
          onClick={openAdd}
          className="btn-primary"
        >
          + নতুন শিক্ষার্থী
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="glass-card-subtle p-8 text-center border-dashed">
          <p className="text-gray-600 font-medium">এই ক্লাসে এখনও কোনো শিক্ষার্থী যোগ করা হয়নি।</p>
          <button
            onClick={openAdd}
            className="btn-secondary mt-3"
          >
            প্রথম শিক্ষার্থী যোগ করুন
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-bd-green-100 bg-white/80 shadow-soft">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-bd-green-800 to-bd-green-700 text-white">
                  <th className="px-3 py-2 text-left">রোল</th>
                  <th className="px-3 py-2 text-left">নাম</th>
                  <th className="px-3 py-2 text-center">মেধা</th>
                  {active.map((s) => (
                    <th key={s.name} className="px-3 py-2 text-center">
                      {s.name}
                      <span className="block text-[10px] font-normal opacity-80">/ {s.fullMarks}</span>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-center">মোট</th>
                  <th className="px-3 py-2 text-center">গড়%</th>
                  <th className="px-3 py-2 text-center">GPA</th>
                  <th className="px-3 py-2 text-center">গ্রেড</th>
                  <th className="px-3 py-2 text-center">ফলাফল</th>
                  <th className="no-print px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const total = calculateTotal(s, classConfig as ClassConfig)
                  const avg = calculateAverage(s, classConfig as ClassConfig)
                  const { gpa, grade } = lookupGpaAndGrade(avg, scaleRows)
                  const result = calculateResult(s, classConfig as ClassConfig, scaleRows)
                  return (
                    <tr key={s.id} className="border-t border-bd-green-100 hover:bg-bd-green-50/40 transition-colors duration-150">
                      <td className="px-3 py-2 font-medium">{s.roll}</td>
                      <td className="px-3 py-2">{s.name}</td>
                      <td className="px-3 py-2 text-center">{ranks[s.id] ?? '—'}</td>
                      {active.map((sub) => (
                        <td key={sub.name} className="px-3 py-2 text-center">
                          {subjectCell(sub, s.marks?.[sub.name] ?? null)}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-center font-semibold">{total}</td>
                      <td className="px-3 py-2 text-center">{avg.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">{gpa.toFixed(2)}</td>
                      <td className="px-3 py-2 text-center font-semibold">{grade}</td>
                      <td className="px-3 py-2 text-center">
                        <ResultBadge result={result} />
                      </td>
                      <td className="no-print px-3 py-2 text-right whitespace-nowrap">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-bd-green-700 text-xs font-semibold mr-2 hover:text-bd-green-900 transition-colors duration-200"
                        >
                          সম্পাদনা
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="text-bd-red-600 text-xs font-semibold hover:text-bd-red-800 transition-colors duration-200"
                        >
                          মুছুন
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sorted.map((s) => {
              const total = calculateTotal(s, classConfig as ClassConfig)
              const avg = calculateAverage(s, classConfig as ClassConfig)
              const { gpa, grade } = lookupGpaAndGrade(avg, scaleRows)
              const result = calculateResult(s, classConfig as ClassConfig, scaleRows)
              return (
                <div key={s.id} className="glass-card p-4 hover:shadow-soft-lg transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-heading font-semibold">
                        রোল {s.roll} — {s.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        মেধা স্থান: {ranks[s.id] ?? '—'} | উপস্থিতি:{' '}
                        {s.attendance != null ? s.attendance + '%' : '—'}
                      </div>
                    </div>
                    <ResultBadge result={result} />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                    {active.map((sub) => {
                      const m = s.marks?.[sub.name] ?? null
                      const low = m != null && (m / sub.fullMarks) * 100 < threshold
                      return (
                        <div
                          key={sub.name}
                          className={`rounded-lg border px-1 py-2 ${
                            low ? 'border-bd-red-300 bg-bd-red-50' : 'border-bd-green-200 bg-bd-green-50/30'
                          }`}
                        >
                          <div className="text-[11px] text-gray-500 truncate">{sub.name}</div>
                          <div
                            className={`text-base font-heading font-bold ${
                              m == null ? 'text-gray-400' : low ? 'text-bd-red-600' : 'text-gray-900'
                            }`}
                          >
                            {m == null ? '—' : m}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                    <span>মোট: <span className="text-bd-green-700">{total}</span></span>
                    <span>গড়: <span className="text-bd-green-700">{avg.toFixed(2)}%</span></span>
                    <span>GPA: <span className="text-bd-green-700">{gpa.toFixed(2)}</span></span>
                    <span>গ্রেড: <span className="text-bd-green-700">{grade}</span></span>
                  </div>

                  <div className="no-print mt-3 flex gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="flex-1 rounded-lg border border-bd-green-700 text-bd-green-700 py-2.5 text-sm font-semibold hover:bg-bd-green-50 transition-all duration-200"
                    >
                      সম্পাদনা
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      className="flex-1 rounded-lg border border-bd-red-300 text-bd-red-700 py-2.5 text-sm font-semibold hover:bg-bd-red-50 transition-all duration-200"
                    >
                      মুছুন
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {modal && (
        <StudentFormModal
          form={modal}
          setForm={setModal}
          active={active}
          onClose={() => {
            setModal(null)
            setError('')
          }}
          onSave={handleSave}
          error={error}
        />
      )}
    </section>
  )
}
