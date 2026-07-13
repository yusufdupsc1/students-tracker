import type { WorkBook, Sheet } from 'xlsx'
import { db } from '../db/schema'
import type { School, GradingScaleRow, ClassConfig, Student, SubjectSlot } from '../types'

// The source spreadsheet uses one sheet per class plus a 'Settings' sheet.
// Column/row coordinates below are 0-indexed (A1 = {r:0, c:0}), matching the
// existing Node seed script (scripts/seed-from-xlsx.mjs) and the dead importXlsx.js.
const SETTINGS_SHEET = 'Settings'
const CLASS_SHEETS: [string, number][] = [
  ['প্রথম', 1],
  ['দ্বিতীয়', 2],
  ['তৃতীয়', 3],
  ['চতুর্থ', 4],
  ['পঞ্চম', 5]
]

export interface ImportResult {
  school: School
  gradingScale: GradingScaleRow[]
  classes: ClassConfig[]
  students: Student[]
  /** Non-fatal warnings (e.g. missing roll) — import still proceeds. */
  issues: string[]
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function str(v: unknown): string {
  if (v == null) return ''
  return String(v).trim()
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export async function parseWorkbook(wb: WorkBook): Promise<ImportResult> {
  const XLSX = await import('xlsx')
  const issues: string[] = []

  const cellVal = (ws: Sheet | undefined, r: number, c: number): unknown => {
    if (!ws) return ''
    const cell = ws[XLSX.utils.encode_cell({ r, c })]
    return cell ? cell.v : ''
  }

  // --- Settings sheet: school + grading scale ---
  const settingsWs = wb.Sheets[SETTINGS_SHEET]
  if (!settingsWs) issues.push(`'Settings' শিট পাওয়া যায়নি`)

  const school: School = {
    id: 'school',
    name: str(cellVal(settingsWs, 4, 1)) || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়',
    village: str(cellVal(settingsWs, 10, 1)),
    postOffice: '',
    upazila: '',
    district: ''
  }

  const gradingScale: GradingScaleRow[] = []
  for (let r = 15; r <= 21; r++) {
    const minPct = num(cellVal(settingsWs, r, 0))
    if (minPct == null) continue
    gradingScale.push({
      minPercent: minPct,
      gpa: num(cellVal(settingsWs, r, 2)) ?? 0,
      grade: str(cellVal(settingsWs, r, 1)),
      remark: str(cellVal(settingsWs, r, 4))
    })
  }
  gradingScale.sort((a, b) => a.minPercent - b.minPercent)

  // --- Per-class sheets: subjects + students ---
  const classes: ClassConfig[] = []
  const students: Student[] = []

  for (const [sheetName, classId] of CLASS_SHEETS) {
    const cws = wb.Sheets[sheetName]
    if (!cws) {
      issues.push(`শিট "${sheetName}" পাওয়া যায়নি`)
      continue
    }

    const subjects: SubjectSlot[] = []
    for (let c = 6; c <= 13; c++) {
      const label = cws[XLSX.utils.encode_cell({ r: 4, c })]
      if (!label || str(label.v) === '') break
      const fullMarks = num(cws[XLSX.utils.encode_cell({ r: 3, c })]?.v) ?? 0
      subjects.push({ id: slug(str(label.v)), name: str(label.v), fullMarks })
    }
    classes.push({ id: classId, name: sheetName, subjects })

    for (let r = 5; r < 45; r++) {
      const name = str(cellVal(cws, r, 3))
      if (!name) continue
      const roll = num(cws[XLSX.utils.encode_cell({ r, c: 1 })]?.v)
      if (roll == null) issues.push(`ক্লাস ${sheetName}: "${name}" — রোল নেই`)

      const marks: Record<string, number | null> = {}
      subjects.forEach((s, i) => {
        // null stays null (blank) — never coerced to 0 (trap #1).
        marks[s.name] = num(cws[XLSX.utils.encode_cell({ r, c: 6 + i })]?.v)
      })

      const attendance = num(cws[XLSX.utils.encode_cell({ r, c: 19 })]?.v)
      students.push({
        id: `${classId}_${roll ?? students.length + 1}`,
        classId,
        roll: roll ?? 0,
        name,
        guardian: str(cws[XLSX.utils.encode_cell({ r, c: 4 })]?.v) || undefined,
        village: str(cws[XLSX.utils.encode_cell({ r, c: 5 })]?.v) || undefined,
        attendance: attendance ?? undefined,
        marks
      })
    }
  }

  return { school, gradingScale, classes, students, issues }
}

export async function importXlsxFile(file: File): Promise<ImportResult> {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  return parseWorkbook(wb)
}

/** Replace all app data with the parsed spreadsheet contents (atomic). */
export async function applyImport(result: ImportResult): Promise<void> {
  const { school, gradingScale, classes, students } = result
  await db.transaction(
    'rw',
    db.school,
    db.gradingScale,
    db.classes,
    db.students,
    db.mtrRecords,
    async () => {
      await db.school.clear()
      await db.gradingScale.clear()
      await db.classes.clear()
      await db.students.clear()
      await db.mtrRecords.clear()
      await db.school.put(school)
      await db.gradingScale.bulkPut(gradingScale)
      await db.classes.bulkPut(classes)
      await db.students.bulkPut(students)
    }
  )
}
