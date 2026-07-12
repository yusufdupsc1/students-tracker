import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const XLSX_PATH = resolve(ROOT, 'Result_Card_Bejkhonda_v3_3_FINAL.xlsx')

const CLASS_SHEETS = [
  ['প্রথম', 1],
  ['দ্বিতীয়', 2],
  ['তৃতীয়', 3],
  ['চতুর্থ', 4],
  ['পঞ্চম', 5]
]

const C = {
  group: 0, // A
  roll: 1, // B
  merit: 2, // C
  name: 3, // D
  guardian: 4, // E
  village: 5, // F
  total: 14, // O
  avg: 15, // P
  gpa: 16, // Q
  grade: 17, // R
  result: 18, // S
  attendance: 19, // T
  remark: 20, // U
  qc: 21 // V
}

function excelSerialToISO(serial) {
  if (serial == null || isNaN(Number(serial))) return ''
  const ms = (Number(serial) - 25569) * 86400 * 1000
  const d = new Date(ms)
  if (isNaN(d.getTime())) return String(serial)
  return d.toISOString().slice(0, 10)
}

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

function str(v) {
  if (v == null) return ''
  return String(v).trim()
}

function getCell(ws, r, c) {
  const addr = XLSX.utils.encode_cell({ r, c })
  return ws[addr]
}

function readSettings(wb) {
  const ws = wb.Sheets['Settings']
  const g = (r, c) => {
    const cell = getCell(ws, r, c)
    return cell ? cell.v : ''
  }
  const school = {
    name: str(g(4, 1)),
    exam: str(g(5, 1)),
    year: str(g(6, 1)),
    cardTitle: str(g(7, 1)),
    address: str(g(10, 1)),
    headTeacherLabel: str(g(8, 1)) || 'প্রধান শিক্ষক',
    classTeacherLabel: str(g(9, 1)) || 'ক্লাস শিক্ষক',
    publicationDate: excelSerialToISO(g(11, 1))
  }
  const gradeScale = []
  for (let r = 15; r <= 21; r++) {
    const minPct = num(g(r, 0))
    if (minPct == null) continue
    gradeScale.push({
      minPct,
      grade: str(g(r, 1)),
      gpa: num(g(r, 2)),
      status: str(g(r, 3)),
      remark: str(g(r, 4))
    })
  }
  gradeScale.sort((a, b) => a.minPct - b.minPct)
  const toggles = {
    showGuardian: str(g(35, 1)) === 'Yes',
    showVillage: str(g(36, 1)) === 'Yes',
    showAttendance: str(g(37, 1)) === 'Yes',
    showMerit: str(g(38, 1)) === 'Yes',
    showGpa: str(g(39, 1)) === 'Yes',
    showGradeBadge: str(g(40, 1)) === 'Yes',
    showSignature: str(g(41, 1)) === 'Yes'
  }
  const passPct = num(g(30, 10)) ?? 33
  return { school, gradeScale, toggles, passPct }
}

function readClass(wb, sheetName, classId) {
  const ws = wb.Sheets[sheetName]
  // subject labels row 5 (index 4), full marks row 4 (index 3)
  const subjects = []
  for (let c = 6; c <= 13; c++) {
    const label = getCell(ws, 4, c)
    if (!label || str(label.v) === '') break
    subjects.push({ name: str(label.v), fullMark: num(getCell(ws, 3, c)?.v) ?? 0 })
  }
  const students = []
  for (let r = 5; r < 45; r++) {
    const name = getCell(ws, r, C.name)
    if (!name || str(name.v) === '') continue
    const obtainedCols = subjects.map((s, i) => ({ ...s, obtained: num(getCell(ws, r, 6 + i)?.v) }))
    students.push({
      classId,
      roll: num(getCell(ws, r, C.roll)?.v) ?? 0,
      merit: num(getCell(ws, r, C.merit)?.v),
      name: str(name.v),
      guardian: str(getCell(ws, r, C.guardian)?.v),
      village: str(getCell(ws, r, C.village)?.v),
      attendancePct: num(getCell(ws, r, C.attendance)?.v),
      subjects: obtainedCols
    })
  }
  return { classId, subjects, students }
}

function main() {
  const wb = XLSX.readFile(XLSX_PATH)
  const settings = readSettings(wb)
  const classes = []
  const students = []
  for (const [sheetName, classId] of CLASS_SHEETS) {
    const { subjects, students: stus } = readClass(wb, sheetName, classId)
    classes.push({ classId, subjects })
    stus.forEach((s) => {
      students.push({ ...s, id: `${classId}_${s.roll || students.length + 1}` })
    })
  }
  const seed = {
    school: settings.school,
    gradeScale: settings.gradeScale,
    toggles: settings.toggles,
    passPct: settings.passPct,
    subjectsByClass: Object.fromEntries(classes.map((c) => [c.classId, c.subjects])),
    classes: [1, 2, 3, 4, 5],
    students
  }
  const outDir = resolve(ROOT, 'src/data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'seed.json'), JSON.stringify(seed, null, 2), 'utf8')
  console.log('Seed written:', students.length, 'students across', classes.length, 'classes')
  classes.forEach((c) =>
    console.log(`  class ${c.classId}: ${seed.students.filter((s) => s.classId === c.classId).length} students, ${c.subjects.length} subjects`)
  )
}

main()
