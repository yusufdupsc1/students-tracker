import { db } from './schema'
import type { School, GradingScaleRow, ClassConfig, Student } from '../types'

interface RealSeed {
  school: School
  gradingScale: GradingScaleRow[]
  classes: ClassConfig[]
  students: Student[]
}

/**
 * Seed the database from the baked-in real spreadsheet data (generated at build
 * time by scripts/seed-from-xlsx.mjs from Result_Card_Bejkhonda_v3_3_FINAL.xlsx).
 * The JSON is dynamically imported so it stays out of the initial bundle and is
 * only fetched on first run when the DB is empty.
 * Caller is responsible for the "only when empty" guard.
 */
export async function seedRealData(): Promise<boolean> {
  const seed = (await import('../data/seed.json')).default as unknown as RealSeed
  if (!seed?.classes?.length) return false
  await db.transaction(
    'rw',
    db.school,
    db.gradingScale,
    db.classes,
    db.students,
    db.mtrRecords,
    async () => {
      await db.school.put(seed.school)
      await db.gradingScale.bulkPut(seed.gradingScale)
      await db.classes.bulkPut(seed.classes)
      await db.students.bulkPut(seed.students)
    }
  )
  return true
}
