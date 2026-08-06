import { db } from '../db/schema'
import type { ImportResult } from './importXlsx'
import type { School, GradingScaleRow, ClassConfig, Student } from '../types'
import { CLASS_NAMES } from './classes'

// Simple CSV parser that handles quoted fields with commas and newlines
function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = []
  let curRow: string[] = []
  let cur = ''
  let inQuotes = false

  const pushField = () => {
    curRow.push(cur)
    cur = ''
  }
  const pushRow = () => {
    // Trim \r
    if (curRow.length === 1 && curRow[0] === '' && cur === '') {
      curRow = []
      cur = ''
      return
    }
    pushField()
    // Only push non-empty rows
    if (curRow.some((f) => f.trim() !== '')) {
      rows.push(curRow.map((f) => f.trim()))
    }
    curRow = []
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      pushField()
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++
      pushRow()
    } else {
      cur += ch
    }
  }
  // Last field/row
  if (inQuotes) {
    // Unterminated quote — still push
    pushRow()
  } else if (cur !== '' || curRow.length > 0) {
    pushRow()
  }

  if (rows.length === 0) return { headers: [], rows: [] }
  const headers = rows[0].map((h) => h.trim())
  const dataRows = rows.slice(1).filter((r) => r.some((c) => c.trim() !== ''))
  return { headers, rows: dataRows }
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '').replace(/_/g, '')
}

function isHeader(headers: string[], candidates: string[]): number {
  const norm = headers.map(normalizeHeader)
  for (const c of candidates) {
    const idx = norm.indexOf(normalizeHeader(c))
    if (idx !== -1) return idx
  }
  return -1
}

function findHeader(headers: string[], candidates: string[]): number {
  return isHeader(headers, candidates)
}

export async function importCsvFile(file: File): Promise<ImportResult> {
  const text = await file.text()
  const { headers, rows } = parseCsvText(text)
  const issues: string[] = []

  if (headers.length === 0) {
    throw new Error('CSV ফাইল খালি বা হেডার পাওয়া যায়নি')
  }

  // Detect known columns (English + Bengali variants)
  const idxClass = findHeader(headers, ['class', 'classid', 'class_id', 'শ্রেণি', 'শ্রেণী', 'ক্লাস'])
  const idxRoll = findHeader(headers, ['roll', 'রোল'])
  const idxName = findHeader(headers, ['name', 'নাম', 'student', 'ছাত্র'])
  const idxGuardian = findHeader(headers, ['guardian', 'parent', 'অভিভাবক', 'পিতা'])
  const idxVillage = findHeader(headers, ['village', 'গ্রাম'])
  const idxAttendance = findHeader(headers, ['attendance', 'উপস্থিতি', 'present'])

  if (idxName === -1) throw new Error('CSV এ Name/নাম কলাম পাওয়া যায়নি')
  if (idxRoll === -1) issues.push('CSV এ Roll কলাম নেই — স্বয়ংক্রিয় রোল দেওয়া হবে')

  // Subject columns are any headers not in known set
  const knownIdx = new Set([idxClass, idxRoll, idxName, idxGuardian, idxVillage, idxAttendance].filter((i) => i !== -1))
  const subjectHeaders: { idx: number; name: string }[] = []
  headers.forEach((h, i) => {
    if (!knownIdx.has(i) && h.trim() !== '') {
      // Ignore empty or obvious non-subject headers like sl, id
      const norm = normalizeHeader(h)
      if (['sl', 'no', 'id', 'serial'].includes(norm)) return
      subjectHeaders.push({ idx: i, name: h.trim() })
    }
  })

  // Fetch existing school/classes/gradingScale to preserve
  const [existingSchool, existingClasses, existingScale] = await Promise.all([
    db.school.get('school'),
    db.classes.toArray(),
    db.gradingScale.toArray(),
  ])

  const school: School = existingSchool ?? {
    id: 'school',
    name: 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়',
    village: 'বেজখণ্ড',
    postOffice: 'মাত্রাই',
    upazila: 'কালাই',
    district: 'জয়পুরহাট',
  }

  const gradingScale: GradingScaleRow[] = existingScale.length
    ? existingScale
    : [
        { schoolId: 'school', minPercent: 0, gpa: 0, grade: 'F', remark: 'উন্নতির জন্য বিশেষ যত্ন প্রয়োজন' },
        { schoolId: 'school', minPercent: 33, gpa: 1, grade: 'D', remark: 'আরও অনুশীলন প্রয়োজন' },
        { schoolId: 'school', minPercent: 40, gpa: 2, grade: 'C', remark: 'সন্তোষজনক' },
        { schoolId: 'school', minPercent: 50, gpa: 3, grade: 'B', remark: 'ভালো' },
        { schoolId: 'school', minPercent: 60, gpa: 3.5, grade: 'A-', remark: 'খুব ভালো' },
        { schoolId: 'school', minPercent: 70, gpa: 4, grade: 'A', remark: 'চমৎকার' },
        { schoolId: 'school', minPercent: 80, gpa: 5, grade: 'A+', remark: 'অসাধারণ' },
      ]

  // Use existing classes or defaults (1-12)
  let resolvedClasses: ClassConfig[]
  if (existingClasses.length > 0) {
    resolvedClasses = existingClasses
  } else {
    const mod = await import('../db/seed')
    resolvedClasses = mod.DEFAULT_CLASSES
  }

  const classMap = new Map(resolvedClasses.map((c) => [c.id, c]))
  // Also map by name (Bengali) lowercased
  const classNameMap = new Map(resolvedClasses.map((c) => [c.name.trim().toLowerCase(), c.id]))
  // Add English numeric string
  resolvedClasses.forEach((c) => classNameMap.set(String(c.id), c.id))

  const students: Student[] = []
  const seenRoll = new Map<number, Set<number>>() // classId -> rolls

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const get = (idx: number) => (idx >= 0 && idx < row.length ? row[idx].trim() : '')

    const name = get(idxName)
    if (!name) {
      issues.push(`সারি ${r + 2}: নাম নেই — বাদ দেওয়া হয়েছে`)
      continue
    }

    // Resolve class
    let classId = 1
    if (idxClass !== -1) {
      const rawClass = get(idxClass).trim()
      if (rawClass) {
        const num = Number(rawClass)
        if (!Number.isNaN(num) && classMap.has(num)) {
          classId = num
        } else {
          const byName = classNameMap.get(rawClass.toLowerCase())
          if (byName) classId = byName
          else {
            // Try CLASS_NAMES mapping (Bengali names)
            const found = Object.entries(CLASS_NAMES).find(([, v]) => v.toLowerCase() === rawClass.toLowerCase())
            if (found) classId = Number(found[0])
            else issues.push(`সারি ${r + 2}: ক্লাস "${rawClass}" চেনা যায়নি — প্রথম ধরা হয়েছে`)
          }
        }
      }
    }

    const rollRaw = idxRoll !== -1 ? get(idxRoll) : ''
    let roll = Number(rollRaw)
    if (!rollRaw || Number.isNaN(roll) || roll <= 0) {
      // Auto roll: max+1 for that class
      const set = seenRoll.get(classId) ?? new Set<number>()
      // Also check existing students in DB for that class to avoid collision
      const existingRolls = new Set<number>()
      // We already have seenRoll, but also need to consider students already in array
      students.filter((s) => s.classId === classId).forEach((s) => existingRolls.add(s.roll))
      let candidate = 1
      while (set.has(candidate) || existingRolls.has(candidate)) candidate++
      roll = candidate
      issues.push(`সারি ${r + 2} (${name}): রোল স্বয়ংক্রিয় ${roll} দেওয়া হয়েছে`)
    }

    // Track roll
    if (!seenRoll.has(classId)) seenRoll.set(classId, new Set())
    if (seenRoll.get(classId)!.has(roll)) {
      issues.push(`সারি ${r + 2}: ক্লাস ${CLASS_NAMES[classId]} এ রোল ${roll} ডুপ্লিকেট — বাদ`)
      continue
    }
    seenRoll.get(classId)!.add(roll)

    const guardian = idxGuardian !== -1 ? get(idxGuardian) || undefined : undefined
    const village = idxVillage !== -1 ? get(idxVillage) || undefined : undefined
    const attendanceRaw = idxAttendance !== -1 ? get(idxAttendance) : ''
    let attendance: number | undefined = undefined
    if (attendanceRaw) {
      const n = Number(attendanceRaw)
      if (!Number.isNaN(n) && n >= 0 && n <= 100) attendance = n
    }

    // Marks: subjectHeaders mapping
    const marks: Record<string, number | null> = {}
    // For known class, get active subjects to validate
    const classConf = classMap.get(classId)
    const activeSubjects = classConf ? classConf.subjects.filter((s) => s.fullMarks > 0).map((s) => s.name) : []

    subjectHeaders.forEach(({ idx, name: subjName }) => {
      const raw = get(idx)
      if (raw === '') {
        marks[subjName] = null
      } else {
        const n = Number(raw)
        if (Number.isNaN(n)) {
          marks[subjName] = null
          issues.push(`সারি ${r + 2}: ${subjName} নম্বর "${raw}" সঠিক নয় — খালি ধরা হয়েছে`)
        } else {
          // Validate against fullMarks if known
          const subjDef = classConf?.subjects.find((s) => s.name === subjName)
          if (subjDef && n > subjDef.fullMarks) {
            issues.push(`সারি ${r + 2}: ${subjName} ${n} > পূর্ণমান ${subjDef.fullMarks} — তবুও সংরক্ষিত`)
          }
          marks[subjName] = n
        }
      }
    })

    // If no subject headers matched, try to infer from active subjects order (if CSV has marks in order without header)
    // Already handled above

    // Ensure all active subjects have at least null entry
    activeSubjects.forEach((subj) => {
      if (!(subj in marks)) marks[subj] = null
    })

    students.push({
      id: `${classId}_${roll}`,
      classId,
      roll,
      name,
      guardian: guardian || undefined,
      village: village || undefined,
      attendance,
      marks,
    })
  }

  if (students.length === 0) {
    throw new Error('CSV থেকে কোনো শিক্ষার্থী পাওয়া যায়নি। হেডার ও ডেটা যাচাই করুন।')
  }

  return {
    school,
    gradingScale,
    classes: resolvedClasses,
    students,
    issues,
  }
}

// CSV Export helper — consistent with import
export async function exportCsv(): Promise<string> {
  const [students, classes] = await Promise.all([db.students.toArray(), db.classes.toArray()])
  if (students.length === 0) throw new Error('এক্সপোর্ট করার মতো কোনো শিক্ষার্থী নেই')

  // Collect union of all subject names
  const subjectSet = new Set<string>()
  classes.forEach((c) => c.subjects.filter((s) => s.fullMarks > 0).forEach((s) => subjectSet.add(s.name)))
  const subjects = Array.from(subjectSet)

  const headers = ['Class', 'Roll', 'Name', 'Guardian', 'Village', 'Attendance', ...subjects]
  const rows: string[] = []
  rows.push(headers.map(escapeCsvField).join(','))

  const sorted = [...students].sort((a, b) => a.classId - b.classId || a.roll - b.roll)
  for (const s of sorted) {
    const fields: string[] = []
    fields.push(escapeCsvField(String(s.classId))) // numeric id for reliable import, also show name?
    // Actually export classId as numeric, but also readable: we keep numeric
    fields.push(escapeCsvField(String(s.roll)))
    fields.push(escapeCsvField(s.name))
    fields.push(escapeCsvField(s.guardian ?? ''))
    fields.push(escapeCsvField(s.village ?? ''))
    fields.push(escapeCsvField(s.attendance != null ? String(s.attendance) : ''))

    // Need to shift because headers start with Class, so fields[0]=Class, 1=Roll, 2=Name, etc.
    // But we already pushed Class at index0, need to adjust: headers[0]=Class, so fields[0]=Class, 1=Roll -> correct
    // Above we pushed Class, Roll, Name... but headers includes Class at 0, so ok
    // Actually we pushed ClassId as first, but headers[0]=Class, so mapping correct

    // For subjects, need to map in same order as headers' subjects
    for (const subj of subjects) {
      const m = s.marks?.[subj]
      fields.push(escapeCsvField(m == null ? '' : String(m)))
    }
    rows.push(fields.join(','))
  }

  return rows.join('\n')
}

function escapeCsvField(field: string): string {
  if (field == null) return ''
  const needsQuote = field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')
  if (!needsQuote) return field
  return `"${field.replace(/"/g, '""')}"`
}

export function downloadCsv(csvText: string, filename?: string) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `bejkhonda-students-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
