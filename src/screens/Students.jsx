import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useStore } from '../context/StoreContext.jsx'
import { db } from '../db/db.js'
import { computeStudent } from '../lib/calc.js'
import { CLASS_LIST, CLASS_NAMES } from '../lib/gradeScale.js'
import StudentForm from './StudentForm.jsx'

export default function Students() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { settings, ready, addStudent, updateStudent, deleteStudent } = useStore()
  const [tab, setTab] = useState(classId ? Number(classId) : 1)
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const students = useLiveQuery(() => db.students.where('classId').equals(tab).toArray(), [tab], [])

  if (!ready) return <div className="panel">লোড হচ্ছে…</div>

  const scale = settings.gradeScale
  const passPct = settings.passPct
  const subjDef = settings.subjectsByClass[tab] || []

  const sorted = [...students].sort((a, b) => (a.roll || 0) - (b.roll || 0))
  const computed = sorted.map((s) => ({ s, c: computeStudent(s, { gradeScale: scale, passPct }) }))

  const openAdd = () => { setEditing(null); setShowForm(true) }
  const openEdit = (s) => { setEditing(s); setShowForm(true) }
  const onSave = async (out) => {
    if (out.id && (await db.students.get(out.id))) await updateStudent(out)
    else await addStudent(out)
    setShowForm(false)
  }
  const onDelete = async (s) => { if (confirm(`মুছে ফেলবেন ${s.name}?`)) await deleteStudent(s.id) }

  const resClass = (r) => (r === 'Passed' ? 'pass' : r === 'Failed' ? 'fail' : r === 'Incomplete' ? 'incomplete' : 'nomarks')

  return (
    <div>
      <h1>শিক্ষার্থী</h1>
      <div className="class-tabs no-print">
        {CLASS_LIST.map((c) => (
          <button key={c} className={tab === c ? 'class-tab active' : 'class-tab'} onClick={() => { setTab(c); navigate(`/students/${c}`) }}>
            {CLASS_NAMES[c]}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="row spread">
          <h2 style={{ margin: 0 }}>ক্লাস {CLASS_NAMES[tab]} — {sorted.length} জন</h2>
          <button onClick={openAdd}>+ নতুন শিক্ষার্থী</button>
        </div>
        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table>
            <thead>
              <tr>
                <th>রোল</th><th>নাম</th><th>মেধা</th>
                {subjDef.map((s) => <th key={s.name}>{s.name}</th>)}
                <th>মোট</th><th>%</th><th>GPA</th><th>গ্রেড</th><th>ফলাফল</th><th className="no-print"></th>
              </tr>
            </thead>
            <tbody>
              {computed.map(({ s, c }) => (
                <tr key={s.id}>
                  <td>{s.roll}</td>
                  <td><a className="nav-link" href={`#/card/${tab}/${s.id}`} onClick={(e) => { e.preventDefault(); navigate(`/card/${tab}/${s.id}`) }}>{s.name}</a></td>
                  <td>{s.merit ?? ''}</td>
                  {s.subjects.map((sub) => <td key={sub.name}>{sub.obtained ?? '—'}</td>)}
                  <td>{c.totalObtained}</td>
                  <td>{c.avgPct ?? '—'}</td>
                  <td>{c.overallGpa ?? '—'}</td>
                  <td>{c.overallGrade ?? '—'}</td>
                  <td><span className={`badge ${resClass(c.result)}`}>{c.result}</span></td>
                  <td className="no-print">
                    <button className="ghost" style={{ padding: '3px 8px' }} onClick={() => openEdit(s)}>সম্পাদন</button>{' '}
                    <button className="danger" style={{ padding: '3px 8px' }} onClick={() => onDelete(s)}>মুছুন</button>
                  </td>
                </tr>
              ))}
              {computed.length === 0 && <tr><td colSpan={subjDef.length + 7} className="muted">কোনো শিক্ষার্থী নেই</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <StudentForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={onSave}
        student={editing}
        classId={tab}
        subjectsDef={subjDef}
        settings={settings}
      />
    </div>
  )
}
