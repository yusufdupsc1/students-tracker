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
import { CLASS_LIST, CLASS_NAMES } from '../lib/classes'
import { StudentFormModal, emptyForm, studentToForm, type FormState } from '../components/StudentFormModal'

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
  // For modal: if user changes class inside modal, show that class's subjects
  const modalClassId = modal?.classId ?? classId
  const modalClassConfig = useLiveQuery(
    () => (schoolId ? db.classes.where('schoolId').equals(schoolId).and((c) => c.id === modalClassId).first() : db.classes.get(modalClassId)),
    [schoolId, modalClassId]
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
    () => {
      const cfg = modal ? modalClassConfig ?? classConfig : classConfig
      return cfg ? getActiveSubjects(cfg) : []
    },
    [classConfig, modalClassConfig, modal]
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
    setModal(emptyForm(classId, active))
  }

  function openEdit(s: Student) {
    setError('')
    // Need active for that student's class? Use current active but also handle marks for that class
    setModal(studentToForm(s, active))
  }

  async function handleSave() {
    if (!modal) return
    const targetClassId = modal.classId
    // Need to get active subjects for target class (might be different than current tab if user changed dropdown)
    const targetConfig = await db.classes.get(targetClassId)
    const targetActive = targetConfig ? getActiveSubjects(targetConfig) : active
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
    for (const s of targetActive) {
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

    const id = `${targetClassId}_${rollNum}`
    const student: Student = {
      id,
      classId: targetClassId,
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
      // If we added to a different class than current tab, switch to it
      if (targetClassId !== classId) setClassId(targetClassId)
    } catch (e) {
      if (e instanceof Error && e.name === 'ConstraintError') {
        setError(`রোল ${rollNum} ইতিমধ্যে ব্যবহৃত (ক্লাস ${CLASS_NAMES[targetClassId]})`)
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

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-500">
          মোট শিক্ষার্থী: {sorted.length} | পাসের সীমা: {threshold}% | <span className="text-bd-green-700 font-medium">ম্যানুয়াল + ইমপোর্ট উভয়ই</span>
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
          <p className="text-xs text-gray-400 mt-1">ম্যানুয়াল যোগ করুন বা Import পেজ থেকে .xlsx/.csv/.json ইমপোর্ট করুন</p>
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
          classNames={CLASS_NAMES}
        />
      )}
    </section>
  )
}
