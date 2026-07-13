import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { db } from '../db/schema'
import {
  calculateAverage,
  lookupGpaAndGrade,
  calculateResult
} from '../lib/calculations'
import type { Student, ClassConfig, GradingScaleRow } from '../types'

// Pass rate at/above this (among evaluated students) is considered "Excellent".
const EXCELLENT_PASS_RATE = 80
const STATUS_EXCELLENT = 'Excellent'
const STATUS_REVIEW = 'Review Needed'

interface Derived {
  avg: number
  gpa: number
  grade: string
  result: 'Pass' | 'Fail' | 'Incomplete'
}

function derive(
  student: Student,
  classConfig: ClassConfig,
  gradingScale: GradingScaleRow[]
): Derived {
  const avg = calculateAverage(student, classConfig)
  const { gpa, grade } = lookupGpaAndGrade(avg, gradingScale)
  const result = calculateResult(student, classConfig, gradingScale)
  return { avg, gpa, grade, result }
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex-1 min-w-[140px]">
      <div className={`text-3xl font-bold ${accent ? 'text-maroon' : 'text-gray-900'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const classes = useLiveQuery(() => db.classes.toArray())
  const students = useLiveQuery(() => db.students.toArray())
  const scale = useLiveQuery(() => db.gradingScale.toArray())

  if (!classes || !students || !scale || classes.length === 0) {
    return <p className="text-gray-500 p-4">লোড হচ্ছে…</p>
  }

  const classMap = new Map(classes.map((c) => [c.id, c]))
  const derivedAll = useMemo(
    () =>
      students
        .map((s) => (classMap.get(s.classId) ? derive(s, classMap.get(s.classId)!, scale) : null))
        .filter((d): d is Derived => d !== null),
    [students, classes, scale]
  )

  const classSummaries = useMemo(
    () =>
      [...classes]
        .sort((a, b) => a.id - b.id)
        .map((cc) => {
          const list = students.filter((s) => s.classId === cc.id)
          const d = list.map((s) => derive(s, cc, scale))
          const count = list.length
          const a = d.map((x) => x.avg).filter((x) => !Number.isNaN(x))
          const avg = a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
          const p = d.filter((x) => x.result === 'Pass').length
          const f = d.filter((x) => x.result === 'Fail').length
          const ev = p + f
          const passRate = ev ? (p / ev) * 100 : 0
          const status = count === 0 ? '—' : passRate >= EXCELLENT_PASS_RATE ? STATUS_EXCELLENT : STATUS_REVIEW
          return { id: cc.id, name: cc.name, count, avg, passRate, status }
        }),
    [classes, students, scale]
  )

  const chartData = useMemo(
    () =>
      classSummaries.map((c) => ({
        name: c.name,
        avg: Math.round(c.avg * 10) / 10,
        pass: Math.round(c.passRate * 10) / 10
      })),
    [classSummaries]
  )

  const totalStudents = students.length
  const passed = derivedAll.filter((d) => d.result === 'Pass').length
  const failed = derivedAll.filter((d) => d.result === 'Fail').length
  const evaluated = passed + failed
  const overallPass = evaluated ? (passed / evaluated) * 100 : 0
  const avgs = derivedAll.map((d) => d.avg).filter((a) => !Number.isNaN(a))
  const overallAvg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0
  const aPlus = derivedAll.filter((d) => d.grade === 'A+').length

  const isEmpty = totalStudents === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-maroon">ড্যাশবোর্ড</h1>

      {/* KPI cards */}
      <div className="flex flex-wrap gap-3">
        <Kpi label="মোট শিক্ষার্থী" value={String(totalStudents)} />
        <Kpi label="সামগ্রিক পাস %" value={totalStudents ? overallPass.toFixed(1) + '%' : '—'} accent />
        <Kpi label="সামগ্রিক গড় %" value={totalStudents ? overallAvg.toFixed(1) + '%' : '—'} />
        <Kpi label="A+ শিক্ষার্থী" value={String(aPlus)} />
      </div>

      {isEmpty && (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
          এখনও কোনো শিক্ষার্থী যোগ করা হয়নি। ক্লাস তালিকা থেকে শিক্ষার্থী যোগ করুন।
        </div>
      )}

      {/* Per-class summary table */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-4">ক্লাস অনুযায়ী সারসংক্ষেপ</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[480px]">
            <thead>
              <tr className="text-sm text-gray-600 border-b border-gray-200">
                <th className="py-2 pr-4">ক্লাস</th>
                <th className="py-2 pr-4">শিক্ষার্থী</th>
                <th className="py-2 pr-4">গড় %</th>
                <th className="py-2 pr-4">পাস %</th>
                <th className="py-2">অবস্থা</th>
              </tr>
            </thead>
            <tbody>
              {classSummaries.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4">{c.count}</td>
                  <td className="py-2 pr-4">{c.count ? c.avg.toFixed(1) + '%' : '—'}</td>
                  <td className="py-2 pr-4">{c.count ? c.passRate.toFixed(1) + '%' : '—'}</td>
                  <td className="py-2">
                    <span
                      className={
                        c.status === STATUS_EXCELLENT
                          ? 'inline-block rounded-full bg-green-100 text-green-700 px-3 py-1 text-sm'
                          : c.status === STATUS_REVIEW
                            ? 'inline-block rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-sm'
                            : 'inline-block rounded-full bg-gray-100 text-gray-500 px-3 py-1 text-sm'
                      }
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Chart */}
      <section className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-4">ক্লাসভিত্তিক গড় % ও পাস %</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="avg" name="গড় %" fill="#811B22" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pass" name="পাস %" fill="#A8323B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
