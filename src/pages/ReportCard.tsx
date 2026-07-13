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
    <div className="report-card mx-auto max-w-[800px] border-2 border-maroon rounded-lg p-5 bg-white text-gray-900">
      {/* Header */}
      <div className="text-center">
        <div className="text-2xl font-bold text-maroon">{school.name}</div>
        <div className="text-sm text-gray-600">{school.village}, {school.postOffice}, {school.upazila}, {school.district}</div>
        <div className="mt-1 h-0.5 bg-[#C9A227]" />
        <div className="mt-1 text-sm font-semibold tracking-[0.3em] text-[#C9A227]">★ ACADEMIC RECORD ★</div>
        <div className="text-sm text-gray-700">শ্রেণি: {classConfig.name} | ফলাফল কার্ড</div>
      </div>

      {/* Student info */}
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm border border-maroon rounded p-3">
        <div><span className="text-gray-500">নাম:</span> <b>{student.name}</b></div>
        <div><span className="text-gray-500">রোল:</span> <b>{student.roll}</b></div>
        <div><span className="text-gray-500">মেধা স্থান:</span> <b>{rank ?? '—'}</b></div>
        <div><span className="text-gray-500">অভিভাবক:</span> <b>{student.guardian || '—'}</b></div>
        <div><span className="text-gray-500">গ্রাম:</span> <b>{student.village || '—'}</b></div>
        <div><span className="text-gray-500">উপস্থিতি:</span> <b>{student.attendance != null ? student.attendance + '%' : '—'}</b></div>
      </div>

      {/* Subject table */}
      <div className="overflow-x-auto">
        <table className="mt-3 w-full border-collapse text-sm leading-5 min-w-[640px]">
          <thead>
            <tr className="bg-maroon text-white">
              <th className="border border-maroon px-2 py-1 text-left">বিষয়</th>
              <th className="border border-maroon px-2 py-1">পূর্ণ</th>
              <th className="border border-maroon px-2 py-1">প্রাপ্ত</th>
              <th className="border border-maroon px-2 py-1">%</th>
              <th className="border border-maroon px-2 py-1">GPA</th>
              <th className="border border-maroon px-2 py-1">গ্রেড</th>
              <th className="border border-maroon px-2 py-1">স্ট্যাটাস</th>
              <th className="border border-maroon px-2 py-1 text-left">মন্তব্য</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.name}>
                <td className="border border-maroon px-2 py-1">{r.name}</td>
                <td className="border border-maroon px-2 py-1 text-center">{r.full}</td>
                <td className="border border-maroon px-2 py-1 text-center">{r.obtained}</td>
                <td className="border border-maroon px-2 py-1 text-center">{r.pct}</td>
                <td className="border border-maroon px-2 py-1 text-center">{r.gpa}</td>
                <td className="border border-maroon px-2 py-1 text-center">{r.grade}</td>
                <td className="border border-maroon px-2 py-1 text-center">{r.status}</td>
                <td className="border border-maroon px-2 py-1">{r.remark}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm font-semibold">
        <div>মোট নম্বর: <span className="text-maroon">{total}</span></div>
        <div>গড় %: <span className="text-maroon">{avg.toFixed(2)}</span></div>
        <div>GPA: <span className="text-maroon">{gpa.toFixed(2)}</span></div>
        <div>গ্রেড: <span className="text-maroon">{grade}</span></div>
        <div>ফলাফল: <span className="text-maroon">{result}</span></div>
        <div>{promotionLabel(result)}</div>
      </div>

      {/* Performance meter */}
      <div className="mt-2">
        <div className="text-xs text-gray-500 mb-1">Performance Meter</div>
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#C9A227]" style={{ width: `${avg}%` }} />
        </div>
      </div>

      {/* Remark */}
      <div className="mt-2 text-sm">মন্তব্য: <b>{remark}</b></div>

      {/* Signature lines */}
      <div className="mt-6 flex justify-between text-sm">
        <div className="border-t border-gray-400 pt-1 w-1/4 text-center">ক্লাস শিক্ষক</div>
        <div className="border-t border-gray-400 pt-1 w-1/4 text-center">প্রধান শিক্ষক</div>
        <div className="border-t border-gray-400 pt-1 w-1/4 text-center">অভিভাবক</div>
      </div>
    </div>
  )
}

export default function ReportCard() {
  const [params, setParams] = useSearchParams()
  const [classId, setClassId] = useState<number>(Number(params.get('classId')) || 1)
  const [studentId, setStudentId] = useState<string>(params.get('studentId') || '')
  const [batch, setBatch] = useState(false)

  const classConfig = useLiveQuery(() => db.classes.get(classId), [classId])
  const students = useLiveQuery(() => db.students.where('classId').equals(classId).toArray(), [classId])
  const scale = useLiveQuery(() => db.gradingScale.toArray())
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
        <h1 className="text-2xl font-bold text-maroon">ফলাফল কার্ড</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex gap-1">
            {CLASS_LIST.map((c) => (
              <button
                key={c}
                onClick={() => setClassId(c)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  classId === c ? 'bg-maroon text-white border-maroon' : 'border-gray-300 text-gray-700'
                }`}
              >
                {['প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম'][c - 1]}
              </button>
            ))}
          </div>
          {!batch && (
            <select
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={selected?.id ?? ''}
              onChange={(e) => setStudentId(e.target.value)}
            >
              {sorted.map((s) => (
                <option key={s.id} value={s.id}>
                  রোল {s.roll} — {s.name}
                </option>
              ))}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm ml-auto">
            <input type="checkbox" checked={batch} onChange={(e) => setBatch(e.target.checked)} />
            ব্যাচ প্রিন্ট (পুরো ক্লাস)
          </label>
          <button
            className="rounded-lg bg-maroon text-white px-4 py-2 text-sm"
            onClick={() => window.print()}
          >
            প্রিন্ট করুন
          </button>
        </div>
        {batch && (
          <p className="text-sm text-gray-500">
            ব্যাচ মোড: এই ক্লাসের {sorted.length} জন শিক্ষার্থীর জন্য একটি করে পৃষ্ঠা তৈরি হবে।
          </p>
        )}
      </div>

      <div className="mt-4 space-y-6">
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
