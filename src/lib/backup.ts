import { db } from '../db/schema'
import type { School, GradingScaleRow, ClassConfig, Student, MTRRecord } from '../types'

export interface Backup {
  version: 1
  exportedAt: string
  school?: School
  gradingScale: GradingScaleRow[]
  classes: ClassConfig[]
  students: Student[]
  mtrRecords: MTRRecord[]
}

export async function buildBackup(): Promise<Backup> {
  const [school, gradingScale, classes, students, mtrRecords] = await Promise.all([
    db.school.get('school'),
    db.gradingScale.toArray(),
    db.classes.toArray(),
    db.students.toArray(),
    db.mtrRecords.toArray()
  ])
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    school,
    gradingScale,
    classes,
    students,
    mtrRecords
  }
}

export async function downloadBackup(): Promise<string> {
  const data = await buildBackup()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `bejkhonda-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  return json
}

/** Replace all app data with the contents of a JSON backup (atomic). */
export async function applyBackup(json: string): Promise<void> {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('ব্যাকআপ ফাইল সঠিক JSON নয়')
  }
  const data = parsed as Backup
  if (
    !data ||
    typeof data !== 'object' ||
    !Array.isArray(data.gradingScale) ||
    !Array.isArray(data.classes) ||
    !Array.isArray(data.students)
  ) {
    throw new Error('ব্যাকআপ ফাইলের গঠন সঠিক নয়')
  }
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
      if (data.school) await db.school.put(data.school)
      await db.gradingScale.bulkPut(data.gradingScale ?? [])
      await db.classes.bulkPut(data.classes ?? [])
      await db.students.bulkPut(data.students ?? [])
      await db.mtrRecords.bulkPut(data.mtrRecords ?? [])
    }
  )
}
