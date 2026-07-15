import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
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
import type { Student, ClassConfig, GradingScaleRow, School } from '../types'

const CLASS_LIST = [1, 2, 3, 4, 5]

function subjectRow(
  name: string,
  full: number,
  obtained: number | null,
  scale: GradingScaleRow[]
) {
  if (obtained == null) {
    return { name, full, obtained: '—', pct: '—', gpa: '—', grade: '—', status: '—', remark: '—' }
  }
  const pct = (obtained / full) * 100
  const { gpa, grade, remark } = lookupGpaAndGrade(pct, scale)
  const status = pct < passThreshold(scale) ? 'Fail' : 'Pass'
  return {
    name,
    full,
    obtained: String(obtained),
    pct: pct.toFixed(2),
    gpa: gpa.toFixed(2),
    grade,
    status,
    remark
  }
}

function promotionLabel(result: string) {
  if (result === 'Pass') return 'উত্তীর্ণ (Promoted)'
  if (result === 'Fail') return 'অনুত্তীর্ণ (Not Promoted)'
  return 'মুলতুবি (Pending)'
}

function ReportCardView({
  student,
  classConfig,
  scale,
  school,
  rank
}: {
  student: Student
  classConfig: ClassConfig
  scale: GradingScaleRow[]
  school: School
  rank?: number
}) {
  const active = getActiveSubjects(classConfig)
  const total = calculateTotal(student, classConfig)
  const avg = calculateAverage(student, classConfig)
  const { gpa, grade, remark } = lookupGpaAndGrade(avg, scale)
  const result = calculateResult(student, classConfig, scale)

  const rows = active.map((s) => subjectRow(s.name, s.fullMarks, student.marks?.[s.name] ?? null, scale))

  return (
    <div className="report-card mx-auto max-w-[800px] border-2 border-bd-green-800 rounded-2xl p-6 bg-white text-gray-900 shadow-soft-lg">
      {/* Header */}
      <div className="text-center">
        <div className="text-2xl font-heading font-bold text-bd-green-900">{school.name}</div>
        <div className="text-sm text-gray-600 font-medium">{school.village}, {school.postOffice}, {school.upazila}, {school.district}</div>
        <div className="mt-2 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="mt-2 text-sm font-heading font-semibold tracking-[0.3em] text-gold">★ ACADEMIC RECORD ★</div>
        <div className="text-sm text-gray-700 font-medium">শ্রেণি: {classConfig.name} | ফলাফল কার্ড</div>
      </div>

      {/* Student info */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm border border-bd-green-200 rounded-xl p-4 bg-bd-green-50/30">
        <div><span className="text-gray-500 font-medium">নাম:</span> <b className="text-bd-green-900">{student.name}</b></div>
        <div><span className="text-gray-500 font-medium">রোল:</span> <b className="text-bd-green-900">{student.roll}</b></div>
        <div><span className="text-gray-500 font-medium">মেধা স্থান:</span> <b className="text-bd-green-900">{rank ?? '—'}</b></div>
        <div><span className="text-gray-500 font-medium">অভিভাবক:</span> <b className="text-bd-green-900">{student.guardian || '—'}</b></div>
        <div><span className="text-gray-500 font-medium">গ্রাম:</span> <b className="text-bd-green-900">{student.village || '—'}</b></div>
        <div><span className="text-gray-500 font-medium">উপস্থিতি:</span> <b className="text-bd-green-900">{student.attendance != null ? student.attendance + '%' : '—'}</b></div>
      </div>

      {/* Subject table */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse text-sm leading-5 min-w-[640px]">
          <thead>
            <tr className="bg-gradient-to-r from-bd-green-800 to-bd-green-700 text-white">
              <th className="border border-bd-green-700 px-3 py-2 text-left font-semibold">বিষয়</th>
              <th className="border border-bd-green-700 px-3 py-2 text-center font-semibold">পূর্ণ</th>
              <th className="border border-bd-green-700 px-3 py-2 text-center font-semibold">প্রাপ্ত</th>
              <th className="border border-bd-green-700 px-3 py-2 text-center font-semibold">%</th>
              <th className="border border-bd-green-700 px-3 py-2 text-center font-semibold">GPA</th>
              <th className="border border-bd-green-700 px-3 py-2 text-center font-semibold">গ্রেড</th>
              <th className="border border-bd-green-700 px-3 py-2 text-center font-semibold">স্ট্যাটাস</th>
              <th className="border border-bd-green-700 px-3 py-2 text-left font-semibold">মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name} className="hover:bg-bd-green-50/30 transition-colors duration-150">
                <td className="border border-bd-green-200 px-3 py-2 font-medium">{r.name}</td>
                <td className="border border-bd-green-200 px-3 py-2 text-center">{r.full}</td>
                <td className="border border-bd-green-200 px-3 py-2 text-center">{r.obtained}</td>
                <td className="border border-bd-green-200 px-3 py-2 text-center">{r.pct}</td>
                <td className="border border-bd-green-200 px-3 py-2 text-center">{r.gpa}</td>
                <td className="border border-bd-green-200 px-3 py-2 text-center font-semibold">{r.grade}</td>
                <td className="border border-bd-green-200 px-3 py-2 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                    r.status === 'Pass' ? 'bg-bd-green-100 text-bd-green-800 border-bd-green-300' :
                    r.status === 'Fail' ? 'bg-bd-red-100 text-bd-red-800 border-bd-red-300' :
                    'bg-gold/15 text-yellow-800 border-gold/30'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="border border-bd-green-200 px-3 py-2">{r.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
        <div>মোট নম্বর: <span className="text-bd-green-700">{total}</span></div>
        <div>গড় %: <span className="text-bd-green-700">{avg.toFixed(2)}</span></div>
        <div>GPA: <span className="text-bd-green-700">{gpa.toFixed(2)}</span></div>
        <div>গ্রেড: <span className="text-bd-green-700">{grade}</span></div>
        <div>ফলাফল: <span className="text-bd-green-700">{result}</span></div>
        <div>{promotionLabel(result)}</div>
      </div>

      {/* Performance meter */}
      <div className="mt-3">
        <div className="text-xs text-gray-500 font-medium mb-1">Performance Meter</div>
        <div className="h-3 w-full bg-bd-green-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-gold-dark to-gold transition-all duration-500" style={{ width: `${avg}%` }} />
        </div>
      </div>

      {/* Remark */}
      <div className="mt-3 text-sm font-medium">মন্তব্য: <b className="text-bd-green-900">{remark}</b></div>

      {/* Signature lines */}
      <div className="mt-6 flex justify-between text-sm">
        <div className="border-t border-gray-400 pt-2 w-1/4 text-center text-gray-600">ক্লাস শিক্ষক</div>
        <div className="border-t border-gray-400 pt-2 w-1/4 text-center text-gray-600">প্রধান শিক্ষক</div>
        <div className="border-t border-gray-400 pt-2 w-1/4 text-center text-gray-600">অভিভাবক</div>
      </div>
    </div>
  )
}

export default function ReportCard() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
  const [params, setParams] = useSearchParams()
  const [classId, setClassId] = useState<number>(Number(params.get('classId')) || 1)
  const [studentId, setStudentId] = useState<string>(params.get('studentId') || '')
  const [batch, setBatch] = useState(false)

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
  const school = useLiveQuery(() => db.school.get('school'))

  // Keep URL in sync (so roster deep-links work and back/forward is sane).
  useEffect(() => {
    const next = new URLSearchParams()
    next.set('classId', String(classId))
    if (!batch && studentId) next.set('studentId', studentId)
    setParams(next, { replace: true })
  }, [classId, studentId, batch, setParams])

  const sorted = useMemo(
    () => [...(students ?? [])].sort((a, b) => (a.roll || 0) - (b.roll || 0)),
    [students]
  )
  const ranks = useMemo(
    () => (classConfig && students ? calculateMeritRank(students, classConfig) : {}),
    [students, classConfig]
  )

  const selected = sorted.find((s) => s.id === studentId) ?? sorted[0]

  if (!classConfig || !scale || scale.length === 0 || !school) {
    return <p className="text-gray-500 p-4">লোড হচ্ছে…</p>
  }

  const visible = batch ? sorted : selected ? [selected] : []

  return (
    <div>
      {/* Controls (hidden when printing) */}
      <div className="no-print space-y-3">
        <h1 className="text-3xl font-heading font-bold text-bd-green-900 tracking-tight">ফলাফল কার্ড</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1.5">
            {CLASS_LIST.map((c) => (
              <button
                key={c}
                onClick={() => setClassId(c)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  classId === c ? 'tab-active' : 'tab-inactive'
                }`}
              >
                {['প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম'][c - 1]}
              </button>
            ))}
          </div>
          {!batch && (
            <select
              className="glass-input"
              value={selected?.id ?? ''}
              onChange={(e) => setStudentId(e.target.value)}
              aria-label="শিক্ষার্থী বাছুন"
            >
              {sorted.map((s) => (
                <option key={s.id} value={s.id}>
                  রোল {s.roll} — {s.name}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm ml-auto font-medium text-gray-700">
            <input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} className="rounded border-bd-green-300 text-bd-green-700 focus:ring-bd-green-500" />
            ব্যাচ প্রিন্ট (পুরো ক্লাস)
          </label>
          <button
            className="btn-primary"
            onClick={() => window.print()}
          >
            প্রিন্ট করুন
          </button>
        </div>
        {batch && (
          <p className="text-sm text-gray-500 font-medium">
            ব্যাচ মোড: এই ক্লাসের {sorted.length} জন শিক্ষার্থীর জন্য একটি করে পৃষ্ঠা তৈরি হবে।
          </p>
        )}
      </div>

      <div className="mt-5 space-y-6">
        {visible.map((s) => (
          <ReportCardView
            key={s.id}
            student={s}
            classConfig={classConfig}
            scale={scale}
            school={school as School}
            rank={ranks[s.id]}
          />
        ))}
        {visible.length === 0 && (
          <p className="text-gray-500">এই ক্লাসে কোনো শিক্ষার্থী নেই।</p>
        )}
      </div>
    </div>
  )
}
