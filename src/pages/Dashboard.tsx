import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { db } from '../db/schema'
import {
  calculateAverage,
  lookupGpaAndGrade,
  calculateResult
} from '../lib/calculations'
import { useAuth } from '../contexts/AuthContext'
import type { Student, ClassConfig, GradingScaleRow } from '../types'
import { Link } from 'react-router-dom'

const EXCELLENT_PASS_RATE = 80
const COLORS = ['#065f46', '#10b981', '#f59e0b', '#ef4444', '#6b7280']

function derive(
  student: Student,
  classConfig: ClassConfig,
  gradingScale: GradingScaleRow[]
) {
  const avg = calculateAverage(student, classConfig)
  const { gpa, grade } = lookupGpaAndGrade(avg, gradingScale)
  const result = calculateResult(student, classConfig, gradingScale)
  return { avg, gpa, grade, result }
}

export default function Dashboard() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
  const [timeRange] = useState<'all' | '7d' | '30d'>('all')

  const classes = useLiveQuery(() => schoolId ? db.classes.where('schoolId').equals(schoolId).toArray() : db.classes.toArray())
  const students = useLiveQuery(() => schoolId ? db.students.where('schoolId').equals(schoolId).toArray() : db.students.toArray())
  const scale = useLiveQuery(() => schoolId ? db.gradingScale.where('schoolId').equals(schoolId).toArray() : db.gradingScale.toArray())
  const school = useLiveQuery(() => db.school.get('school'))

  const ready = !!classes && !!students && !!scale && classes.length > 0 && scale.length > 0
  const classMap = useMemo(() => new Map((classes ?? []).map((c) => [c.id, c])), [classes])

  const derivedAll = useMemo(() => {
    if (!ready) return []
    return (students ?? [])
      .map((s) => (classMap.get(s.classId) ? derive(s, classMap.get(s.classId)!, scale) : null))
      .filter((d): d is NonNullable<typeof d> => d !== null)
  }, [ready, students, classMap, scale])

  const classSummaries = useMemo(() => {
    if (!ready) return []
    return [...classes]
      .sort((a, b) => a.id - b.id)
      .map((cc) => {
        const list = students!.filter((s) => s.classId === cc.id)
        const d = list.map((s) => derive(s, cc, scale!))
        const count = list.length
        const a = d.map((x) => x.avg).filter((x) => !Number.isNaN(x))
        const avg = a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0
        const p = d.filter((x) => x.result === 'Pass').length
        const f = d.filter((x) => x.result === 'Fail').length
        const ev = p + f
        const passRate = ev ? (p / ev) * 100 : 0
        const status = count === 0 ? '—' : passRate >= EXCELLENT_PASS_RATE ? 'Excellent' : 'Review'
        return { id: cc.id, name: cc.name, count, avg, passRate, status }
      })
  }, [ready, classes, students, scale])

  const chartData = useMemo(() => {
    if (!ready) return []
    return classSummaries.map((c) => ({
      name: c.name,
      গড়: Math.round(c.avg * 10) / 10,
      পাস: Math.round(c.passRate * 10) / 10
    }))
  }, [ready, classSummaries])

  const gradeDist = useMemo(() => {
    const counts: Record<string, number> = {}
    derivedAll.forEach(d => {
      counts[d.grade] = (counts[d.grade] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value)
  }, [derivedAll])

  const totalStudents = students?.length ?? 0
  const passed = derivedAll.filter((d) => d.result === 'Pass').length
  const failed = derivedAll.filter((d) => d.result === 'Fail').length
  const evaluated = passed + failed
  const overallPass = evaluated ? (passed / evaluated) * 100 : 0
  const avgs = derivedAll.map((d) => d.avg).filter((a) => !Number.isNaN(a))
  const overallAvg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0
  const aPlus = derivedAll.filter((d) => d.grade === 'A+').length
  const incomplete = derivedAll.filter((d) => d.result === 'Incomplete').length

  const isEmpty = totalStudents === 0

  if (!ready) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header — bento style */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight text-gray-900">
            ড্যাশবোর্ড
          </h1>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              {school?.name || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            {(school as any)?.academicYear || '২০২৫'} • লোকাল DB • PWA
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-100 rounded-full">
            {(['all','7d','30d'] as const).map(k => (
              <button 
                key={k} 
                onClick={() => {}}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${timeRange===k ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
              >
                {k==='all' ? 'সব' : k==='7d' ? '৭ দিন' : '৩০ দিন'}
              </button>
            ))}
          </div>
          <Link to="/app/roster" className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors">
            + শিক্ষার্থী
          </Link>
        </div>
      </div>

      {/* KPI — bento, trending with subtle gradients */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="col-span-2 md:col-span-1 rounded-[1.5rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-xs font-medium text-white/70 uppercase tracking-widest">মোট শিক্ষার্থী</p>
            <p className="text-3xl font-bold mt-2">{totalStudents}</p>
            <p className="text-xs text-white/70 mt-1">{classes?.length} টি ক্লাস • ১-১২</p>
          </div>
        </div>
        
        <div className="rounded-[1.5rem] bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">পাস %</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{evaluated ? overallPass.toFixed(1) + '%' : '—'}</p>
          <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${overallPass}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{passed} পাস • {failed} ফেল</p>
        </div>

        <div className="rounded-[1.5rem] bg-white border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-widest">গড় %</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalStudents ? overallAvg.toFixed(1) + '%' : '—'}</p>
          <p className="text-xs text-gray-500 mt-1">A+ {aPlus} জন • অসম্পূর্ণ {incomplete}</p>
        </div>

        <div className="rounded-[1.5rem] bg-amber-50 border border-amber-100 p-5">
          <p className="text-xs font-medium text-amber-800 uppercase tracking-widest">দ্রুত কাজ</p>
          <div className="mt-3 space-y-2">
            <Link to="/app/report-card" className="flex items-center justify-between text-sm font-medium text-amber-900 hover:text-black">
              ফলাফল কার্ড <span>→</span>
            </Link>
            <Link to="/app/import" className="flex items-center justify-between text-sm font-medium text-amber-900 hover:text-black">
              ইমপোর্ট <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {isEmpty ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-4">◈</div>
          <h3 className="font-semibold text-gray-900">এখনও কোনো শিক্ষার্থী নেই</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Roster থেকে হাতে লিখে যোগ করুন বা Excel/CSV/JSON থেকে ইমপোর্ট করুন — সব ক্লাস ১-১২ সাপোর্টেড</p>
          <Link to="/app/roster" className="inline-flex mt-4 px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-black transition-colors">
            প্রথম শিক্ষার্থী যোগ করুন
          </Link>
        </div>
      ) : (
        <>
          {/* Class summary — refined table */}
          <section className="rounded-[1.5rem] bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading font-semibold text-gray-900">ক্লাস অনুযায়ী</h2>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{classSummaries.length} ক্লাস</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3 font-medium">ক্লাস</th>
                    <th className="px-4 py-3 font-medium">শিক্ষার্থী</th>
                    <th className="px-4 py-3 font-medium">গড়</th>
                    <th className="px-4 py-3 font-medium">পাস</th>
                    <th className="px-6 py-3 font-medium text-right">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {classSummaries.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
                            {c.id}
                          </div>
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="font-medium">{c.count}</span>
                        <span className="text-gray-400 ml-1">জন</span>
                      </td>
                      <td className="px-4 py-4 text-sm">{c.count ? c.avg.toFixed(1) + '%' : '—'}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.passRate}%` }} />
                          </div>
                          <span className="text-sm">{c.count ? c.passRate.toFixed(0) + '%' : '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${
                          c.status === 'Excellent' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          c.status === 'Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {c.status === 'Excellent' ? '✓ Excellent' : c.status === 'Review' ? '◎ Review' : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Charts — bento */}
          <div className="grid lg:grid-cols-3 gap-4">
            <section className="lg:col-span-2 rounded-[1.5rem] bg-white border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">গড় বনাম পাস — ক্লাসভিত্তিক</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: '12px' }} />
                    <Bar dataKey="গড়" fill="#059669" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="পাস" fill="#111827" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-[1.5rem] bg-white border border-gray-100 p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-1">গ্রেড বণ্টন</h2>
              <p className="text-xs text-gray-500 mb-4">সব ক্লাস মিলিয়ে</p>
              <div className="h-64">
                {gradeDist.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={gradeDist} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={2}>
                        {gradeDist.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-400">ডেটা নেই</div>
                )}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-emerald-50 p-3">
                  <div className="text-lg font-bold text-emerald-700">{passed}</div>
                  <div className="text-xs text-emerald-600">পাস</div>
                </div>
                <div className="rounded-2xl bg-red-50 p-3">
                  <div className="text-lg font-bold text-red-700">{failed}</div>
                  <div className="text-xs text-red-600">ফেল</div>
                </div>
                <div className="rounded-2xl bg-gray-50 p-3">
                  <div className="text-lg font-bold text-gray-700">{incomplete}</div>
                  <div className="text-xs text-gray-500">অসম্পূর্ণ</div>
                </div>
              </div>
            </section>
          </div>

          {/* Quick actions — trending bento */}
          <div className="grid md:grid-cols-3 gap-4">
            <Link to="/app/report-card" className="group rounded-[1.5rem] bg-gray-900 text-white p-6 flex items-center justify-between hover:bg-black transition-colors">
              <div>
                <div className="font-semibold">ফলাফল কার্ড প্রিন্ট</div>
                <div className="text-sm text-white/60">প্রতি শিক্ষার্থী • ব্যাচ</div>
              </div>
              <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/15 transition-colors">→</span>
            </Link>
            <Link to="/app/import" className="group rounded-[1.5rem] bg-white border border-gray-100 p-6 flex items-center justify-between hover:border-gray-200 hover:shadow-sm transition-all">
              <div>
                <div className="font-semibold text-gray-900">ইমপোর্ট / এক্সপোর্ট</div>
                <div className="text-sm text-gray-500">.xlsx • .csv • .json</div>
              </div>
              <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors">⤓</span>
            </Link>
            <Link to="/app/settings" className="group rounded-[1.5rem] bg-emerald-50 border border-emerald-100 p-6 flex items-center justify-between hover:bg-emerald-100/50 transition-colors">
              <div>
                <div className="font-semibold text-emerald-900">সেটিংস</div>
                <div className="text-sm text-emerald-700/70">ক্লাস • বিষয় • গ্রেড</div>
              </div>
              <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">⚙</span>
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
