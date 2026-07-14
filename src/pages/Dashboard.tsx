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
    <div className="glass-card p-5 flex-1 min-w-[140px] group hover:shadow-soft-lg transition-all duration-200">
      <div className={`text-3xl font-heading font-bold transition-colors duration-200 ${accent ? 'text-bd-green-700' : 'text-gray-900 group-hover:text-bd-green-800'}`}>{value}</div>
      <div className="text-sm text-gray-500 mt-1.5 font-medium">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const classes = useLiveQuery(() => db.classes.toArray())
  const students = useLiveQuery(() => db.students.toArray())
  const scale = useLiveQuery(() => db.gradingScale.toArray())

  const ready = !!classes && !!students && !!scale && classes.length > 0 && scale.length > 0
  const classMap = useMemo(() => new Map((classes ?? []).map((c) => [c.id, c])), [classes])

  const derivedAll = useMemo<Derived[]>(() => {
    if (!ready) return []
    return (students ?? [])
      .map((s) => (classMap.get(s.classId) ? derive(s, classMap.get(s.classId)!, scale) : null))
      .filter((d): d is Derived => d !== null)
  }, [ready, students, classMap, scale])

  const classSummaries = useMemo(() => {
    if (!ready) return []
    return [...classes]
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
      })
  }, [ready, classes, students, scale])

  const chartData = useMemo(() => {
    if (!ready) return []
    return classSummaries.map((c) => ({
      name: c.name,
      avg: Math.round(c.avg * 10) / 10,
      pass: Math.round(c.passRate * 10) / 10
    }))
  }, [ready, classSummaries])

  const totalStudents = students?.length ?? 0
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
      <h1 className="text-3xl font-heading font-bold text-bd-green-900 tracking-tight">ড্যাশবোর্ড</h1>

      {!ready ? (
        <div className="glass-card-subtle p-8 text-center text-gray-500">
          লোড হচ্ছে…
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="flex flex-wrap gap-4">
            <Kpi label="মোট শিক্ষার্থী" value={String(totalStudents)} />
            <Kpi label="সামগ্রিক পাস %" value={totalStudents ? overallPass.toFixed(1) + '%' : '—'} accent />
            <Kpi label="সামগ্রিক গড় %" value={totalStudents ? overallAvg.toFixed(1) + '%' : '—'} />
            <Kpi label="A+ শিক্ষার্থী" value={String(aPlus)} />
          </div>

          {isEmpty && (
            <div className="glass-card-subtle p-8 text-center text-gray-500 border-dashed">
              এখনও কোনো শিক্ষার্থী যোগ করা হয়নি। ক্লাস তালিকা থেকে শিক্ষার্থী যোগ করুন।
            </div>
          )}

          {/* Per-class summary table */}
          <section className="glass-card p-6">
            <h2 className="text-lg font-heading font-semibold mb-4 text-bd-green-900">ক্লাস অনুযায়ী সারসংক্ষেপ</h2>
            <div className="overflow-x-auto rounded-xl border border-bd-green-100">
              <table className="w-full text-left border-collapse min-w-[480px]">
                <thead>
                  <tr className="text-sm text-bd-green-800 bg-bd-green-50/50">
                    <th className="px-4 py-3 font-semibold">ক্লাস</th>
                    <th className="px-4 py-3 font-semibold">শিক্ষার্থী</th>
                    <th className="px-4 py-3 font-semibold">গড় %</th>
                    <th className="px-4 py-3 font-semibold">পাস %</th>
                    <th className="px-4 py-3 font-semibold">অবস্থা</th>
                  </tr>
                </thead>
                <tbody>
                  {classSummaries.map((c) => (
                    <tr key={c.id} className="border-t border-bd-green-100 hover:bg-bd-green-50/30 transition-colors duration-150">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3">{c.count}</td>
                      <td className="px-4 py-3">{c.count ? c.avg.toFixed(1) + '%' : '—'}</td>
                      <td className="px-4 py-3">{c.count ? c.passRate.toFixed(1) + '%' : '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            c.status === STATUS_EXCELLENT
                              ? 'inline-flex items-center rounded-full bg-bd-green-100 text-bd-green-800 px-3 py-1 text-sm font-medium border border-bd-green-200'
                              : c.status === STATUS_REVIEW
                                ? 'inline-flex items-center rounded-full bg-gold/15 text-yellow-800 px-3 py-1 text-sm font-medium border border-gold/30'
                                : 'inline-flex items-center rounded-full bg-gray-100 text-gray-500 px-3 py-1 text-sm font-medium border border-gray-200'
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
          <section className="glass-card p-6">
            <h2 className="text-lg font-heading font-semibold mb-4 text-bd-green-900">ক্লাসভিত্তিক গড় % ও পাস %</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" />
                  <XAxis dataKey="name" tick={{ fill: '#065f46', fontSize: 13, fontFamily: 'Hind Siliguri, Noto Sans Bengali, system-ui' }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#065f46', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #d1fae5', 
                      boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.1)',
                      fontFamily: 'Hind Siliguri, Noto Sans Bengali, system-ui'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontFamily: 'Hind Siliguri, Noto Sans Bengali, system-ui', fontSize: 13 }}
                  />
                  <Bar dataKey="avg" name="গড় %" fill="#047857" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pass" name="পাস %" fill="#C9A227" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
