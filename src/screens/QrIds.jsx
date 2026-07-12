import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { useStore } from '../context/StoreContext.jsx'
import { db } from '../db/db.js'
import { computeStudent } from '../lib/calc.js'
import { buildQrPayload, renderQrDataUrl } from '../lib/qr.js'
import { CLASS_LIST, CLASS_NAMES } from '../lib/gradeScale.js'

export default function QrIds() {
  const { classId } = useParams()
  const navigate = useNavigate()
  const { settings, ready } = useStore()
  const [tab, setTab] = useState(classId ? Number(classId) : 1)
  const [images, setImages] = useState({})
  const reqRef = useRef(0)

  const students = useLiveQuery(() => db.students.where('classId').equals(tab).toArray(), [tab], [])

  useEffect(() => { if (classId) setTab(Number(classId)) }, [classId])

  useEffect(() => {
    if (!ready) return
    const req = ++reqRef.current
    const scale = settings.gradeScale
    const passPct = settings.passPct
    ;(async () => {
      const map = {}
      for (const s of students) {
        const c = computeStudent(s, { gradeScale: scale, passPct })
        const payload = buildQrPayload({
          schoolName: settings.school.name,
          classId: s.classId,
          className: CLASS_NAMES[s.classId],
          roll: s.roll,
          name: s.name,
          result: c.result,
          gpa: c.overallGpa
        })
        map[s.id] = await renderQrDataUrl(payload)
      }
      if (reqRef.current === req) setImages(map)
    })()
  }, [students, settings, ready])

  if (!ready) return <div className="panel">লোড হচ্ছে…</div>

  const sorted = [...students].sort((a, b) => (a.roll || 0) - (b.roll || 0))

  return (
    <div>
      <h1>QR আইডি ব্যাজ</h1>
      <div className="class-tabs no-print">
        {CLASS_LIST.map((c) => (
          <button key={c} className={tab === c ? 'class-tab active' : 'class-tab'} onClick={() => { setTab(c); navigate(`/qr/${c}`) }}>
            {CLASS_NAMES[c]}
          </button>
        ))}
      </div>
      <div className="row spread no-print" style={{ marginBottom: 12 }}>
        <div className="muted">{sorted.length} টি ব্যাজ</div>
        <button onClick={() => window.print()}>প্রিন্ট করুন</button>
      </div>

      <div className="qr-grid print-area">
        {sorted.map((s) => {
          const c = computeStudent(s, { gradeScale: settings.gradeScale, passPct: settings.passPct })
          return (
            <div className="qr-card" key={s.id}>
              {images[s.id] && <img src={images[s.id]} alt="qr" />}
              <div style={{ fontWeight: 700 }}>{s.name}</div>
              <div className="muted">ক্লাস {CLASS_NAMES[s.classId]} | রোল {s.roll}</div>
              <div>ফলাফল: <b>{c.result}</b>{c.overallGpa != null ? ` | GPA ${c.overallGpa}` : ''}</div>
            </div>
          )
        })}
        {sorted.length === 0 && <div className="panel muted">কোনো শিক্ষার্থী নেই</div>}
      </div>
    </div>
  )
}
