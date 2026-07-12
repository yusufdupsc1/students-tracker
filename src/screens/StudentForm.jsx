import { useState, useEffect } from 'react'

export default function StudentForm({ open, onClose, onSave, student, classId, subjectsDef, settings }) {
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (!open) return
    if (student) {
      setForm({
        ...student,
        subjects: student.subjects.map((s) => ({ ...s }))
      })
    } else {
      setForm({
        id: '',
        classId,
        roll: '',
        merit: '',
        name: '',
        guardian: '',
        village: '',
        attendancePct: '',
        subjects: (subjectsDef || []).map((s) => ({ name: s.name, fullMark: s.fullMark, obtained: null }))
      })
    }
  }, [open, student, classId, subjectsDef])

  if (!open || !form) return null

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setSub = (i, v) => setForm((f) => ({ ...f, subjects: f.subjects.map((s, j) => (j === i ? { ...s, obtained: v === '' ? null : Number(v) } : s)) }))

  const save = () => {
    const out = { ...form }
    out.roll = form.roll === '' ? null : Number(form.roll)
    out.merit = form.merit === '' ? null : Number(form.merit)
    out.attendancePct = form.attendancePct === '' ? null : Number(form.attendancePct)
    if (!out.id && out.roll != null) out.id = `${out.classId}_${out.roll}`
    onSave(out)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{student ? 'শিক্ষার্থী সম্পাদনা' : 'নতুন শিক্ষার্থী'}</h2>
        <div className="row">
          <div><label>রোল</label><input value={form.roll ?? ''} onChange={(e) => setField('roll', e.target.value)} /></div>
          <div><label>মেধা স্থান</label><input value={form.merit ?? ''} onChange={(e) => setField('merit', e.target.value)} /></div>
          <div><label>উপস্থিতি %</label><input value={form.attendancePct ?? ''} onChange={(e) => setField('attendancePct', e.target.value)} /></div>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <div style={{ flex: 2, minWidth: 220 }}><label>নাম</label><input style={{ width: '100%' }} value={form.name} onChange={(e) => setField('name', e.target.value)} /></div>
          <div style={{ flex: 1 }}><label>অভিভাবক</label><input style={{ width: '100%' }} value={form.guardian} onChange={(e) => setField('guardian', e.target.value)} /></div>
          <div style={{ flex: 1 }}><label>গ্রাম</label><input style={{ width: '100%' }} value={form.village} onChange={(e) => setField('village', e.target.value)} /></div>
        </div>

        <div className="section-title" style={{ marginTop: 12 }}>প্রাপ্ত নম্বর</div>
        <div className="row">
          {form.subjects.map((s, i) => (
            <div key={s.name}><label>{s.name} / {s.fullMark}</label>
              <input className="mark-input" type="number" value={s.obtained ?? ''} onChange={(e) => setSub(i, e.target.value)} /></div>
          ))}
        </div>

        <div className="row spread" style={{ marginTop: 16 }}>
          <button className="ghost" onClick={onClose}>বাতিল</button>
          <button onClick={save}>সংরক্ষণ</button>
        </div>
      </div>
    </div>
  )
}
