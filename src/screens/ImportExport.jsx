import { useState } from 'react'
import { useStore } from '../context/StoreContext.jsx'
import { db } from '../db/db.js'
import { importXlsxFile } from '../lib/importXlsx.js'
import { computeStudent } from '../lib/calc.js'
import { CLASS_LIST, CLASS_NAMES } from '../lib/gradeScale.js'

function download(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

async function buildExport(students, settings) {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()
  const scale = settings.gradeScale
  const passPct = settings.passPct

  for (const cid of CLASS_LIST) {
    const list = students.filter((s) => s.classId === cid).sort((a, b) => (a.roll || 0) - (b.roll || 0))
    const subjNames = (settings.subjectsByClass[cid] || []).map((s) => s.name)
    const header = ['#', 'রোল', 'মেধা', 'নাম', 'অভিভাবক', 'গ্রাম', ...subjNames, 'মোট', 'গড় %', 'GPA', 'গ্রেড', 'ফলাফল', 'উপস্থিতি %']
    const rows = [header]
    list.forEach((s, idx) => {
      const c = computeStudent(s, { gradeScale: scale, passPct })
      rows.push([
        idx + 1, s.roll, s.merit ?? '', s.name, s.guardian || '', s.village || '',
        ...s.subjects.map((x) => (x.obtained ?? '')),
        c.totalObtained, c.avgPct ?? '', c.overallGpa ?? '', c.overallGrade ?? '', c.result, s.attendancePct ?? ''
      ])
    })
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), CLASS_NAMES[cid])
  }

  const setRows = [['School Name', settings.school.name], ['Exam', settings.school.exam], ['Year', settings.school.year], ['Card Title', settings.school.cardTitle], ['Address', settings.school.address], ['Publication Date', settings.school.publicationDate], ['Pass %', passPct]]
  setRows.push([])
  setRows.push(['Min %', 'Grade', 'GPA', 'Status', 'Remark'])
  scale.forEach((g) => setRows.push([g.minPct, g.grade, g.gpa, g.status, g.remark]))
  setRows.push([])
  setRows.push(['Toggle', 'Value'])
  Object.entries(settings.toggles).forEach(([k, v]) => setRows.push([k, v ? 'Yes' : 'No']))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(setRows), 'Settings')
  return wb
}

export default function ImportExport() {
  const { settings, ready, applyImport, resetAll } = useStore()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  if (!ready) return <div className="panel">লোড হচ্ছে…</div>

  const onFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setBusy(true)
    try {
      const parsed = await importXlsxFile(file)
      if (!parsed.students || parsed.students.length === 0) { setStatus('কোনো ডাটা পাওয়া যায়নি — সঠিক ফাইল?'); return }
      await applyImport(parsed)
      setStatus(`ইমপোর্ট সফল: ${parsed.students.length} শিক্ষার্থী।`)
    } catch (err) {
      setStatus('ত্রুটি: ' + err.message)
    } finally { setBusy(false) }
  }

  const exportJson = async () => {
    const students = await db.students.toArray()
    const data = {
      school: settings.school, gradeScale: settings.gradeScale, toggles: settings.toggles,
      passPct: settings.passPct, subjectsByClass: settings.subjectsByClass, classes: settings.classes, students
    }
    download('students-tracker-backup.json', JSON.stringify(data, null, 2), 'application/json')
    setStatus('JSON ব্যাকআপ ডাউনলোড হয়েছে।')
  }

  const exportXlsx = async () => {
    const students = await db.students.toArray()
    const wb = await buildExport(students, settings)
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    download('students-tracker-export.xlsx', out, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setStatus('xlsx এক্সপোর্ট হয়েছে।')
  }

  const onReset = async () => {
    if (confirm('সব ডাটা মুছে আবার সিড করবেন?')) { await resetAll(); setStatus('রিসেট ও পুনরায় সিড করা হয়েছে।') }
  }

  return (
    <div>
      <h1>ইমপোর্ট / এক্সপোর্ট</h1>
      <div className="panel">
        <h2>ইমপোর্ট xlsx</h2>
        <p className="muted">শ্রেণি শিট (প্রথম/দ্বিতীয়/...) ও Settings শিট সহ Export করা ফাইল বা মূল ফাইল আপলোড করুন।</p>
        <input type="file" accept=".xlsx,.xls" onChange={onFile} disabled={busy} />
      </div>

      <div className="panel">
        <h2>এক্সপোর্ট</h2>
        <div className="row">
          <button onClick={exportJson}>JSON ব্যাকআপ</button>
          <button className="secondary" onClick={exportXlsx}>xlsx এক্সপোর্ট</button>
        </div>
      </div>

      <div className="panel">
        <h2>রিসেট</h2>
        <p className="muted">সমস্ত ডাটা মুছে মূল স্প্রেডশিট থেকে পুনরায় সিড করুন।</p>
        <button className="danger" onClick={onReset}>রিসেট ও রিসিড</button>
      </div>

      {status && <div className="toast">{status}</div>}
    </div>
  )
}
