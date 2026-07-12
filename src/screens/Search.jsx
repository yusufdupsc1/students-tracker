import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../context/StoreContext.jsx'
import { db } from '../db/db.js'
import { computeStudent } from '../lib/calc.js'
import { CLASS_NAMES } from '../lib/gradeScale.js'

export default function Search() {
  const navigate = useNavigate()
  const { settings, ready } = useStore()
  const [q, setQ] = useState('')
  const students = useLiveQuery(() => db.students.toArray(), [], [])

  if (!ready) return <div className="panel">লোড হচ্ছে…</div>

  const scale = settings.gradeScale
  const passPct = settings.passPct
  const term = q.trim().toLowerCase()
  const results = term
    ? students
        .map((s) => ({ s, c: computeStudent(s, { gradeScale: scale, passPct }) }))
        .filter(({ s }) => s.name.toLowerCase().includes(term) || String(s.roll) === term || String(s.roll).includes(term))
    : []

  const resClass = (r) => (r === 'Passed' ? 'pass' : r === 'Failed' ? 'fail' : r === 'Incomplete' ? 'incomplete' : 'nomarks')

  return (
    <div>
      <h1>অনুসন্ধান</h1>
      <div className="panel">
        <label>নাম বা রোল দিয়ে খুঁজুন</label>
        <input style={{ width: '100%', maxWidth: 420 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="যেমন: মেঘনা বা 1" />
      </div>

      {term && (
        <div className="panel">
          <h2>{results.length} টি ফলাফল</h2>
          <table>
            <thead><tr><th>ক্লাস</th><th>রোল</th><th>নাম</th><th>%</th><th>GPA</th><th>গ্রেড</th><th>ফলাফল</th><th></th></tr></thead>
            <tbody>
              {results.map(({ s, c }) => (
                <tr key={s.id}>
                  <td>{CLASS_NAMES[s.classId]}</td>
                  <td>{s.roll}</td>
                  <td>{s.name}</td>
                  <td>{c.avgPct ?? '—'}</td>
                  <td>{c.overallGpa ?? '—'}</td>
                  <td>{c.overallGrade ?? '—'}</td>
                  <td><span className={`badge ${resClass(c.result)}`}>{c.result}</span></td>
                  <td><button className="ghost" style={{ padding: '3px 8px' }} onClick={() => navigate(`/card/${s.classId}/${s.id}`)}>কার্ড</button></td>
                </tr>
              ))}
              {results.length === 0 && <tr><td colSpan={8} className="muted">কিছু পাওয়া যায়নি</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
