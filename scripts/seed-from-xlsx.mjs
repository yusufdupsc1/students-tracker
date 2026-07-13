import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const XLSX_PATH = resolve(ROOT, 'Result_Card_Bejkhonda_v3_3_FINAL.xlsx')

// One sheet per class + a 'Settings' sheet. Coordinates are 0-indexed (A1 = {r:0,c:0}).
const CLASS_SHEETS = [
  ['প্রথম', 1],
  ['দ্বিতীয়', 2],
  ['তৃতীয়', 3],
  ['চতুর্থ', 4],
  ['পঞ্চম', 5]
]

const C = {
  roll: 1, // B
  merit: 2, // C (computed, not stored)
  name: 3, // D
  guardian: 4, // E
  village: 5, // F
  attendance: 19 // T
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
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

function parseAddress(addr) {
  const out = { village: '', postOffice: '', upazila: '', district: '' }
  if (!addr) return out
  for (const part of addr.split(',')) {
    const p = str(part)
    if (p.startsWith('গ্রাম')) out.village = p.replace(/^গ্রাম[:：]?\s*/, '').trim()
    else if (p.startsWith('পোস্ট')) out.postOffice = p.replace(/^পোস্ট[:：]?\s*/, '').trim()
    else if (p.startsWith('উপজেলা')) out.upazila = p.replace(/^উপজেলা[:：]?\s*/, '').trim()
    else if (p.startsWith('জেলা')) out.district = p.replace(/^জেলা[:：]?\s*/, '').replace(/[।.]$/, '').trim()
  }
  return out
}

function readSettings(wb) {
  const ws = wb.Sheets['Settings']
  const g = (r, c) => {
    const cell = getCell(ws, r, c)
    return cell ? cell.v : ''
  }
  const address = parseAddress(str(g(10, 1)))
  const school = {
    id: 'school',
    name: str(g(4, 1)) || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়',
    village: address.village,
    postOffice: address.postOffice,
    upazila: address.upazila,
    district: address.district
  }
  const gradingScale = []
  for (let r = 15; r <= 21; r++) {
    const minPct = num(g(r, 0))
    if (minPct == null) continue
    gradingScale.push({
      minPercent: minPct,
      gpa: num(g(r, 2)) ?? 0,
      grade: str(g(r, 1)),
      remark: str(g(r, 4))
    })
  }
  gradingScale.sort((a, b) => a.minPercent - b.minPercent)
  return { school, gradingScale }
}

function readClassesAndStudents(wb) {
  const classes = []
  const students = []
  for (const [sheetName, classId] of CLASS_SHEETS) {
    const ws = wb.Sheets[sheetName]
    if (!ws) {
      console.warn(`sheet "${sheetName}" not found`)
      continue
    }
    // Subject labels at row 5 (index 4), full marks at row 4 (index 3).
    const subjects = []
    for (let c = 6; c <= 13; c++) {
      const label = getCell(ws, 4, c)
      if (!label || str(label.v) === '') break
      subjects.push({
        id: slug(str(label.v)) || `subj-${c}`,
        name: str(label.v),
        fullMarks: num(getCell(ws, 3, c)?.v) ?? 0
      })
    }
    classes.push({ id: classId, name: sheetName, subjects })

    for (let r = 5; r < 45; r++) {
      const nameCell = getCell(ws, r, C.name)
      const name = nameCell ? str(nameCell.v) : ''
      if (!name) continue
      const roll = num(getCell(ws, r, C.roll)?.v)
      // null stays null (blank) — never coerced to 0 (trap #1).
      const marks = {}
      subjects.forEach((s, i) => {
        marks[s.name] = num(getCell(ws, r, 6 + i)?.v)
      })
      const attendance = num(getCell(ws, r, C.attendance)?.v)
      students.push({
        id: `${classId}_${roll ?? students.length + 1}`,
        classId,
        roll: roll ?? 0,
        name,
        guardian: str(getCell(ws, r, C.guardian)?.v) || undefined,
        village: str(getCell(ws, r, C.village)?.v) || undefined,
        attendance: attendance ?? undefined,
        marks
      })
    }
  }
  return { classes, students }
}

function main() {
  const wb = XLSX.readFile(XLSX_PATH)
  const { school, gradingScale } = readSettings(wb)
  const { classes, students } = readClassesAndStudents(wb)

  const seed = { school, gradingScale, classes, students }
  const outDir = resolve(ROOT, 'src/data')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(resolve(outDir, 'seed.json'), JSON.stringify(seed, null, 2), 'utf8')

  console.log(`Seed written: ${students.length} students across ${classes.length} classes`)
  classes.forEach((c) =>
    console.log(
      `  class ${c.name}: ${students.filter((s) => s.classId === c.id).length} students, ${c.subjects.length} subjects`
    )
  )
}

main()
