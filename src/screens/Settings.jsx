import { useState, useEffect } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { CLASS_LIST, CLASS_NAMES } from '../lib/gradeScale.js'

const TOGGLE_LABELS = [
  ['showGuardian', 'অভিভাবক দেখাও'],
  ['showVillage', 'গ্রাম দেখাও'],
  ['showAttendance', 'উপস্থিতি দেখাও'],
  ['showMerit', 'মেধা স্থান দেখাও'],
  ['showGpa', 'GPA দেখাও'],
  ['showGradeBadge', 'গ্রেড ব্যাজ দেখাও'],
  ['showSignature', 'স্বাক্ষর দেখাও']
]

export default function Settings() {
  const { settings, ready, saveSettings } = useStore()
  const [draft, setDraft] = useState(null)
  const [tab, setTab] = useState(1)
  const [msg, setMsg] = useState('')

  useEffect(() => { if (settings) setDraft(JSON.parse(JSON.stringify(settings))) }, [settings])
  if (!ready || !draft) return <div className="panel">লোড হচ্ছে…</div>

  const set = (path, val) => setDraft((d) => {
    const next = { ...d }
    if (path === 'school') next.school = { ...next.school, ...val }
    else if (path === 'passPct') next.passPct = val
    return next
  })

  const setScale = (i, key, val) => setDraft((d) => {
    const scale = d.gradeScale.map((g, j) => (j === i ? { ...g, [key]: key === 'minPct' || key === 'gpa' ? Number(val) : val } : g))
    return { ...d, gradeScale: scale }
  })

  const setSubj = (name, val) => setDraft((d) => ({
    ...d,
    subjectsByClass: { ...d.subjectsByClass, [tab]: d.subjectsByClass[tab].map((s) => (s.name === name ? { ...s, fullMark: Number(val) } : s)) }
  }))

  const toggle = (key) => setDraft((d) => ({ ...d, toggles: { ...d.toggles, [key]: !d.toggles[key] } }))

  const save = async () => {
    await saveSettings(draft)
    setMsg('সংরক্ষণ করা হয়েছে')
    setTimeout(() => setMsg(''), 2000)
  }

  const sch = draft.school
  return (
    <div>
      <h1>সেটিংস</h1>

      <div className="panel">
        <h2>স্কুল ও পরীক্ষা তথ্য</h2>
        <div className="row">
          <div style={{ flex: 2, minWidth: 220 }}><label>স্কুলের নাম</label><input style={{ width: '100%' }} value={sch.name} onChange={(e) => set('school', { name: e.target.value })} /></div>
          <div style={{ flex: 1 }}><label>পরীক্ষার নাম</label><input style={{ width: '100%' }} value={sch.exam} onChange={(e) => set('school', { exam: e.target.value })} /></div>
          <div><label>সাল</label><input value={sch.year} onChange={(e) => set('school', { year: e.target.value })} /></div>
          <div><label>কার্ড শিরোনাম</label><input value={sch.cardTitle} onChange={(e) => set('school', { cardTitle: e.target.value })} /></div>
          <div><label>প্রকাশ তারিখ</label><input value={sch.publicationDate} onChange={(e) => set('school', { publicationDate: e.target.value })} /></div>
        </div>
        <div style={{ marginTop: 8 }}><label>ঠিকানা</label><input style={{ width: '100%' }} value={sch.address} onChange={(e) => set('school', { address: e.target.value })} /></div>
      </div>

      <div className="panel">
        <h2>গ্রেড স্কেল (সম্পাদনাযোগ্য)</h2>
        <div className="row" style={{ marginBottom: 8 }}>
          <label>পাসের ন্যূনতম %</label>
          <input className="mark-input" type="number" value={draft.passPct} onChange={(e) => set('passPct', Number(e.target.value))} />
        </div>
        <table>
          <thead><tr><th>ন্যূনতম %</th><th>গ্রেড</th><th>GPA</th><th>স্ট্যাটাস</th><th>মন্তব্য</th></tr></thead>
          <tbody>
            {draft.gradeScale.map((g, i) => (
              <tr key={i}>
                <td><input className="mark-input" type="number" value={g.minPct} onChange={(e) => setScale(i, 'minPct', e.target.value)} /></td>
                <td><input style={{ width: 60 }} value={g.grade} onChange={(e) => setScale(i, 'grade', e.target.value)} /></td>
                <td><input className="mark-input" type="number" value={g.gpa} onChange={(e) => setScale(i, 'gpa', e.target.value)} /></td>
                <td><input style={{ width: 80 }} value={g.status} onChange={(e) => setScale(i, 'status', e.target.value)} /></td>
                <td><input style={{ width: '100%', minWidth: 160 }} value={g.remark} onChange={(e) => setScale(i, 'remark', e.target.value)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>বিষয় ও পূর্ণমান</h2>
        <div className="class-tabs">
          {CLASS_LIST.map((c) => (
            <button key={c} className={tab === c ? 'class-tab active' : 'class-tab'} onClick={() => setTab(c)}>{CLASS_NAMES[c]}</button>
          ))}
        </div>
        <table>
          <thead><tr><th>বিষয়</th><th>পূর্ণমান</th></tr></thead>
          <tbody>
            {(draft.subjectsByClass[tab] || []).map((s) => (
              <tr key={s.name}><td>{s.name}</td><td><input className="mark-input" type="number" value={s.fullMark} onChange={(e) => setSubj(s.name, e.target.value)} /></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h2>প্রিন্ট টগল</h2>
        <div className="row">
          {TOGGLE_LABELS.map(([k, label]) => (
            <label key={k} style={{ display: 'flex', gap: 6, alignItems: 'center', color: 'var(--ink)' }}>
              <input type="checkbox" checked={!!draft.toggles[k]} onChange={() => toggle(k)} /> {label}
            </label>
          ))}
        </div>
      </div>

      <div className="row spread">
        <button onClick={save}>সংরক্ষণ করুন</button>
        {msg && <span className="muted">{msg}</span>}
      </div>
    </div>
  )
}
