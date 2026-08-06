import { db } from '../db/schema'
import type { ImportResult } from './importXlsx'
import type { School, GradingScaleRow, ClassConfig, Student } from '../types'
import { DEFAULT_CLASSES, DEFAULT_GRADING_SCALE, DEFAULT_SCHOOL } from '../db/seed'


function isImportResult(obj: any): boolean {
  return obj && typeof obj === 'object' && Array.isArray(obj.students) && Array.isArray(obj.classes) && obj.school
}

function isBackup(obj: any): boolean {
  return obj && typeof obj === 'object' && Array.isArray(obj.students) && Array.isArray(obj.classes) && Array.isArray(obj.gradingScale)
}

export async function importJsonFile(file: File): Promise<ImportResult> {
  const text = await file.text()
  let parsed: any
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('JSON ফাইল সঠিক নয় — পার্স করা যায়নি')
  }

  const issues: string[] = []

  // Fetch existing to preserve if file is partial
  const [existingSchool, existingClasses, existingScale] = await Promise.all([
    db.school.get('school'),
    db.classes.toArray(),
    db.gradingScale.toArray(),
  ])

  // Case 1: Full ImportResult or Backup style
  if (isImportResult(parsed) || isBackup(parsed)) {
    const school: School = parsed.school ?? existingSchool ?? DEFAULT_SCHOOL
    const classes: ClassConfig[] = Array.isArray(parsed.classes) && parsed.classes.length > 0 ? parsed.classes : existingClasses.length > 0 ? existingClasses : DEFAULT_CLASSES
    const gradingScale: GradingScaleRow[] = Array.isArray(parsed.gradingScale) && parsed.gradingScale.length > 0 ? parsed.gradingScale : existingScale.length > 0 ? existingScale : DEFAULT_GRADING_SCALE
    const students: Student[] = Array.isArray(parsed.students) ? parsed.students : []

    if (students.length === 0) throw new Error('JSON এ কোনো শিক্ষার্থী পাওয়া যায়নি')

    // Validate students
    const seen = new Set<string>()
    const validStudents: Student[] = []
    for (const s of students) {
      if (!s?.name || !s?.classId || !s?.roll) {
        issues.push(`বাদ দেওয়া হয়েছে: নাম/ক্লাস/রোল নেই — ${JSON.stringify(s).slice(0, 60)}`)
        continue
      }
      const id = s.id ?? `${s.classId}_${s.roll}`
      if (seen.has(id)) {
        issues.push(`ডুপ্লিকেট: ${s.name} (ক্লাস ${s.classId} রোল ${s.roll})`)
        continue
      }
      seen.add(id)
      validStudents.push({ ...s, id })
    }

    return {
      school,
      gradingScale,
      classes,
      students: validStudents,
      issues,
    }
  }

  // Case 2: Simple array of students
  if (Array.isArray(parsed)) {
    const arr = parsed as any[]
    const students: Student[] = []
    for (let i = 0; i < arr.length; i++) {
      const s = arr[i]
      if (!s?.name) {
        issues.push(`সারি ${i + 1}: নাম নেই — বাদ`)
        continue
      }
      const classId = Number(s.classId ?? s.class ?? 1)
      const roll = Number(s.roll ?? i + 1)
      if (!classId || classId < 1 || classId > 12) {
        issues.push(`সারি ${i + 1}: ক্লাস ${s.classId} সঠিক নয় — 1 ধরা হয়েছে`)
      }
      students.push({
        id: s.id ?? `${classId}_${roll}`,
        classId: classId >= 1 && classId <= 12 ? classId : 1,
        roll: Number.isInteger(roll) && roll > 0 ? roll : i + 1,
        name: String(s.name).trim(),
        guardian: s.guardian ? String(s.guardian).trim() : undefined,
        village: s.village ? String(s.village).trim() : undefined,
        attendance: s.attendance != null ? Number(s.attendance) : undefined,
        marks: s.marks && typeof s.marks === 'object' ? s.marks : {},
      })
    }
    if (students.length === 0) throw new Error('JSON অ্যারে থেকে কোনো শিক্ষার্থী পাওয়া যায়নি')

    return {
      school: existingSchool ?? DEFAULT_SCHOOL,
      gradingScale: existingScale.length > 0 ? existingScale : DEFAULT_GRADING_SCALE,
      classes: existingClasses.length > 0 ? existingClasses : DEFAULT_CLASSES,
      students,
      issues,
    }
  }

  // Case 3: Object with students field
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.students)) {
    return importJsonFile(new File([JSON.stringify({ ...parsed, classes: parsed.classes ?? existingClasses, school: parsed.school ?? existingSchool, gradingScale: parsed.gradingScale ?? existingScale })], 'temp.json', { type: 'application/json' }))
  }

  throw new Error('JSON ফরম্যাট চেনা যায়নি। Export করা JSON বা সঠিক ImportResult JSON দিন।')
}

export function exportJsonFile(data: unknown, filename?: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `bejkhonda-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return json
}