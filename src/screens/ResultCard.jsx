import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useStore } from '../context/StoreContext.jsx'
import { db } from '../db/db.js'
import { computeStudent } from '../lib/calc.js'
import { CLASS_LIST, CLASS_NAMES } from '../lib/gradeScale.js'

const CO_FIELDS = [
  { key: 'activity', label: 'Activity' },
  { key: 'workEdu', label: 'Work Education' },
  { key: 'artEdu', label: 'Art Education' },
  { key: 'health', label: 'Health & Sports' }
]
const TRAITS = [
  { key: 'regularity', label: 'Regularity & Punctuality' },
  { key: 'sincerity', label: 'Sincerity' },
  { key: 'behaviour', label: 'Behaviour & Values' },
  { key: 'respect', label: 'Respectfulness' }
]
const LEVELS = ['Good', 'Very Good', 'Excellent']
const defaultCo = () => Object.fromEntries([...CO_FIELDS, ...TRAITS].map((f) => [f.key, 'Good']))

function CardSheet({ student, calc, settings, onCoChange }) {
  const co = student.coscho || defaultCo()
  const t = settings.toggles
  const gradeScale = settings.gradeScale
  return (
    <div className="card-sheet">
      <div className="school-name">{settings.school.name}</div>
      <div className="school-sub">{settings.school.address}</div>
      <div className="academic">★ ACADEMIC RECORD ★</div>
      <div className="exam-line">
        {settings.school.exam} | সেশন: {settings.school.year} | শ্রেণি: {CLASS_NAMES[student.classId]} | {settings.school.cardTitle}
      </div>

      <div className="info-block">
        <div><b>নাম:</b> {student.name}</div>
        <div><b>রোল:</b> {student.roll}</div>
        {t.showMerit && <div><b>মেধা স্থান:</b> {student.merit ?? '—'}</div>}
        {t.showGuardian && <div><b>অভিভাবক:</b> {student.guardian || '—'}</div>}
        {t.showVillage && <div><b>গ্রাম:</b> {student.village || '—'}</div>}
        {t.showAttendance && <div><b>উপস্থিতি:</b> {student.attendancePct ?? '—'}%</div>}
      </div>

      <div className="section-title">Scholastic Area</div>
      <table>
        <thead>
          <tr><th>Subjects</th><th>Full</th><th>Obtained</th><th>%</th><th>GPA</th><th>Grade</th><th>Status</th><th>Remark</th></tr>
        </thead>
        <tbody>
          {calc.perSubject.map((s) => (
            <tr key={s.name}>
              <td>{s.name}</td>
              <td>{s.fullMark}</td>
              <td>{s.obtained ?? '—'}</td>
              <td>{s.pct ?? '—'}</td>
              <td>{s.gpa ?? '—'}</td>
              <td>{s.grade ?? '—'}</td>
              <td>{s.pass ? 'Pass' : s.pass === false ? 'Fail' : '—'}</td>
              <td>{s.remark ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row spread" style={{ marginTop: 8 }}>
        <div><b>Overall Marks:</b> {calc.totalObtained} / {calc.totalFull}</div>
        <div><b>Percentage:</b> {calc.avgPct ?? '—'}%</div>
        {t.showGpa && <div><b>Overall GPA:</b> {calc.overallGpa ?? '—'}</div>}
        <div><b>Grade:</b> {calc.overallGrade ?? '—'}</div>
        <div><b>Result:</b> {calc.result}</div>
      </div>
      <div style={{ marginTop: 4 }}><b>{calc.result === 'Passed' ? 'Promoted' : calc.result === 'Failed' ? 'Not Promoted' : 'Pending'}</b></div>

      <div className="meter-wrap">
        <div className="muted" style={{ fontSize: 12 }}>Performance Meter</div>
        <div className="meter"><span style={{ width: `${calc.avgPct ?? 0}%` }} /></div>
      </div>

      <div className="section-title">Co-scholastic Area</div>
      <table>
        <tbody>
          {[...CO_FIELDS, ...TRAITS].map((f) => (
            <tr key={f.key}>
              <td style={{ width: '70%' }}>{f.label}</td>
              <td>
                {onCoChange ? (
                  <select value={co[f.key]} onChange={(e) => onCoChange(f.key, e.target.value)}>
                    {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                ) : (
                  co[f.key]
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="section-title">Grading Scale</div>
      <table className="scale-legend">
        <thead><tr><th>Min %</th><th>Grade</th><th>GPA</th><th>Status</th><th>Remark</th></tr></thead>
        <tbody>
          {gradeScale.map((g) => (
            <tr key={g.grade}><td>{g.minPct}</td><td>{g.grade}</td><td>{g.gpa}</td><td>{g.status}</td><td>{g.remark}</td></tr>
          ))}
        </tbody>
      </table>

      {t.showSignature && (
        <div className="sig-row">
          <div className="sig">ক্লাস শিক্ষক</div>
          <div className="sig">প্রধান শিক্ষক</div>
          <div className="sig">অভিভাবক</div>
        </div>
      )}
    </div>
  )
}

export default function ResultCard() {
  const { classId, studentId } = useParams()
  const navigate = useNavigate()
  const { settings, ready, updateStudent } = useStore()
  const [tab, setTab] = useState(classId ? Number(classId) : 1)

  const list = useLiveQuery(() => db.students.where('classId').equals(tab).toArray(), [tab], [])

  useEffect(() => { if (classId) setTab(Number(classId)) }, [classId])

  if (!ready) return <div className="panel">লোড হচ্ছে…</div>

  const scale = settings.gradeScale
  const passPct = settings.passPct
  const sorted = [...list].sort((a, b) => (a.roll || 0) - (b.roll || 0))
  const single = studentId ? sorted.find((s) => s.id === studentId) : null
  const cards = single ? [single] : sorted

  const onCoChange = async (key, val) => {
    if (!single) return
    const coscho = { ...(single.coscho || defaultCo()), [key]: val }
    const next = { ...single, coscho }
    await updateStudent(next)
  }

  return (
    <div>
      <h1>ফলাফল কার্ড</h1>
      <div className="class-tabs no-print">
        {CLASS_LIST.map((c) => (
          <button key={c} className={tab === c ? 'class-tab active' : 'class-tab'} onClick={() => { setTab(c); navigate(`/card/${c}`) }}>
            {CLASS_NAMES[c]}
          </button>
        ))}
      </div>
      <div className="row spread no-print" style={{ marginBottom: 12 }}>
        <div className="muted">{single ? single.name : `ক্লাস ${CLASS_NAMES[tab]} — ${cards.length} কার্ড`}</div>
        <div className="row">
          <button className="secondary" onClick={() => navigate('/students/' + tab)}>শিক্ষার্থী তালিকা</button>
          <button onClick={() => window.print()}>প্রিন্ট করুন</button>
        </div>
      </div>

      <div className="print-area">
        {cards.map((s) => (
          <CardSheet
            key={s.id}
            student={s}
            calc={computeStudent(s, { gradeScale: scale, passPct })}
            settings={settings}
            onCoChange={single ? onCoChange : null}
          />
        ))}
        {cards.length === 0 && <div className="panel muted">কোনো শিক্ষার্থী নেই</div>}
      </div>
    </div>
  )
}
