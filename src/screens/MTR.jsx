import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useStore } from '../context/StoreContext.jsx'
import { db } from '../db/db.js'
import { CLASS_LIST, CLASS_NAMES } from '../lib/gradeScale.js'

const SKILLS = ['বাংলা সাবলীল পঠন', 'গণিত চার নিয়ম দক্ষতা', 'English সাবলীল পঠন']
const STATUS = ['সক্ষম', 'অক্ষম']

function autoComment(ratings) {
  if (!ratings || ratings.length === 0) return '—'
  const cap = ratings.filter((r) => r === 'সক্ষম').length
  if (cap === ratings.length) return 'দক্ষ'
  if (cap === 0) return 'অদক্ষ'
  return 'আংশিক দক্ষ'
}

export default function MTR() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { getMtr, saveMtr, ready } = useStore()
  const [tab, setTab] = useState(classId ? Number(classId) : 1)
  const [entries, setEntries] = useState([])
  const [mtrLoaded, setMtrLoaded] = useState(false)

  const students = useLiveQuery(() => db.students.where('classId').equals(tab).toArray(), [tab], [])
  const mtr = useLiveQuery(() => db.mtr.get(`mtr_${tab}`), [tab], null)

  useEffect(() => { if (classId) setTab(Number(classId)) }, [classId])
  useEffect(() => {
    if (mtr) {
      setEntries(mtr.entries || [])
      setMtrLoaded(true)
    }
  }, [mtr])

  if (!ready) return <div className="panel">লোড হচ্ছে…</div>

  const sorted = [...students].sort((a, b) => (a.roll || 0) - (b.roll || 0))
  const getEntry = (sid) => entries.find((e) => e.studentId === sid)

  const setRating = (sid, name, roll, skillIdx, val) => {
    setEntries((prev) => {
      const existing = prev.find((e) => e.studentId === sid)
      let ratings
      if (existing) {
        ratings = [...existing.ratings]
        ratings[skillIdx] = val
        return prev.map((e) => (e.studentId === sid ? { ...e, ratings } : e))
      }
      ratings = SKILLS.map((_, i) => (i === skillIdx ? val : 'অক্ষম'))
      return [...prev, { studentId: sid, name, roll, ratings }]
    })
  }

  const save = async () => { await saveMtr(tab, entries); alert('সংরক্ষণ করা হয়েছে') }

  // summary per skill
  const totalStudents = sorted.length
  const summary = SKILLS.map((_, i) => {
    const capable = entries.filter((e) => e.ratings && e.ratings[i] === 'সক্ষম').length
    return { capable, incapable: totalStudents - capable, pct: totalStudents ? Math.round((capable / totalStudents) * 100) : 0 }
  })

  return (
    <div>
      <h1>MTR — মিড টার্ম রিভিয়ু</h1>
      <div className="class-tabs no-print">
        {CLASS_LIST.map((c) => (
          <button key={c} className={tab === c ? 'class-tab active' : 'class-tab'} onClick={() => { setTab(c); navigate(`/mtr/${c}`) }}>
            {CLASS_NAMES[c]}
          </button>
        ))}
      </div>

      <div className="panel no-print">
        <h2>সারাংশ — ক্লাস {CLASS_NAMES[tab]}</h2>
        <table>
          <thead><tr><th>দক্ষতা</th><th>সক্ষম</th><th>অক্ষম</th><th>%</th></tr></thead>
          <tbody>
            {SKILLS.map((s, i) => (
              <tr key={s}><td>{s}</td><td>{summary[i].capable}</td><td>{summary[i].incapable}</td><td>{summary[i].pct}%</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <div className="row spread">
          <h2 style={{ margin: 0 }}>দক্ষতা মূল্যায়ন — {totalStudents} জন</h2>
          <button className="no-print" onClick={save}>সংরক্ষণ</button>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table>
            <thead><tr><th>রোল</th><th>নাম</th>{SKILLS.map((s) => <th key={s}>{s}</th>)}<th>মন্তব্য</th></tr></thead>
            <tbody>
              {sorted.map((s) => {
                const e = getEntry(s.id)
                const ratings = e ? e.ratings : SKILLS.map(() => 'অক্ষম')
                return (
                  <tr key={s.id}>
                    <td>{s.roll}</td>
                    <td>{s.name}</td>
                    {SKILLS.map((_, i) => (
                      <td key={i}>
                        <select value={ratings[i] || 'অক্ষম'} onChange={(ev) => setRating(s.id, s.name, s.roll, i, ev.target.value)}>
                          {STATUS.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </td>
                    ))}
                    <td>{autoComment(ratings)}</td>
                  </tr>
                )
              })}
              {sorted.length === 0 && <tr><td colSpan={SKILLS.length + 3} className="muted">কোনো শিক্ষার্থী নেই</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
