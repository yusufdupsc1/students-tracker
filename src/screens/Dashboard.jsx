import { useLiveQuery } from 'dexie-react-hooks'
import { useStore } from '../context/StoreContext.jsx'
import { db } from '../db/db.js'
import { computeStudent } from '../lib/calc.js'
import { CLASS_LIST, CLASS_NAMES } from '../lib/gradeScale.js'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { settings, ready } = useStore()
  const students = useLiveQuery(() => db.students.toArray(), [], [])
  if (!ready) return <div className="panel">লোড হচ্ছে…</div>

  const scale = settings.gradeScale
  const passPct = settings.passPct

  const perClass = CLASS_LIST.map((cid) => {
    const list = students.filter((s) => s.classId === cid)
    const computed = list.map((s) => computeStudent(s, { gradeScale: scale, passPct }))
    const passed = computed.filter((c) => c.result === 'Passed').length
    const failed = computed.filter((c) => c.result === 'Failed').length
    const inc = computed.filter((c) => c.result === 'Incomplete').length
    const nomarks = computed.filter((c) => c.result === 'No marks').length
    const withAvg = computed.filter((c) => c.avgPct != null)
    const avg = withAvg.length ? withAvg.reduce((a, c) => a + c.avgPct, 0) / withAvg.length : 0
    const gpaSum = computed.filter((c) => c.overallGpa != null).reduce((a, c) => a + c.overallGpa, 0)
    const gpaCount = computed.filter((c) => c.overallGpa != null).length
    return { cid, enrolled: list.length, passed, failed, inc, nomarks, avg, gpa: gpaCount ? gpaSum / gpaCount : 0 }
  })

  const totals = perClass.reduce(
    (a, c) => ({
      enrolled: a.enrolled + c.enrolled,
      passed: a.passed + c.passed,
      failed: a.failed + c.failed,
      inc: a.inc + c.inc,
      nomarks: a.nomarks + c.nomarks
    }),
    { enrolled: 0, passed: 0, failed: 0, inc: 0, nomarks: 0 }
  )

  return (
    <div>
      <h1>ড্যাশবোর্ড</h1>
      <div className="panel">
        <div className="kpis">
          <div className="kpi"><div className="v">{totals.enrolled}</div><div className="l">মোট শিক্ষার্থী</div></div>
          <div className="kpi"><div className="v" style={{ color: 'var(--ok)' }}>{totals.passed}</div><div className="l">পাস</div></div>
          <div className="kpi"><div className="v" style={{ color: 'var(--bad)' }}>{totals.failed}</div><div className="l">ফেল</div></div>
          <div className="kpi"><div className="v" style={{ color: 'var(--warn)' }}>{totals.inc}</div><div className="l">অসম্পূর্ণ</div></div>
          <div className="kpi"><div className="v">{totals.nomarks}</div><div className="l">মার্ক নেই</div></div>
        </div>
      </div>

      <div className="panel">
        <h2>ক্লাস অনুযায়ী ফলাফল</h2>
        <table>
          <thead>
            <tr><th>ক্লাস</th><th>ভর্তি</th><th>পাস</th><th>ফেল</th><th>অসম্পূর্ণ</th><th>গড় %</th><th>গড় GPA</th><th></th></tr>
          </thead>
          <tbody>
            {perClass.map((c) => (
              <tr key={c.cid}>
                <td>{CLASS_NAMES[c.cid]}</td>
                <td>{c.enrolled}</td>
                <td>{c.passed}</td>
                <td>{c.failed}</td>
                <td>{c.inc}</td>
                <td>{c.avg.toFixed(2)}</td>
                <td>{c.gpa.toFixed(2)}</td>
                <td><Link className="nav-link" to={`/students/${c.cid}`}>দেখুন</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
