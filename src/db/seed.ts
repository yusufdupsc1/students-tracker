import { db } from './schema'
import { seedRealData } from './seedReal'
import type { School, GradingScaleRow, ClassConfig, SubjectSlot } from '../types'

export const DEFAULT_GRADING_SCALE: GradingScaleRow[] = [
  { schoolId: 'school', minPercent: 0, gpa: 0, grade: 'F', remark: 'উন্নতির জন্য বিশেষ যত্ন প্রয়োজন' },
  { schoolId: 'school', minPercent: 33, gpa: 1, grade: 'D', remark: 'আরও অনুশীলন প্রয়োজন' },
  { schoolId: 'school', minPercent: 40, gpa: 2, grade: 'C', remark: 'সন্তোষজনক' },
  { schoolId: 'school', minPercent: 50, gpa: 3, grade: 'B', remark: 'ভালো' },
  { schoolId: 'school', minPercent: 60, gpa: 3.5, grade: 'A-', remark: 'খুব ভালো' },
  { schoolId: 'school', minPercent: 70, gpa: 4, grade: 'A', remark: 'চমৎকার' },
  { schoolId: 'school', minPercent: 80, gpa: 5, grade: 'A+', remark: 'অসাধারণ' }
]

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function subjects(names: string[], fullMarks: number): SubjectSlot[] {
  return names.map((name) => ({ id: slug(name), name, fullMarks }))
}

const SUBJECTS_3 = ['বাংলা', 'English', 'গণিত']
const SUBJECTS_6 = [
  'বাংলা',
  'English',
  'গণিত',
  'প্রাথমিক বিজ্ঞান',
  'বাংলাদেশ ও বিশ্বপরিচয়',
  'ধর্ম'
]
// Secondary (6-8) — 7 subjects, 100 marks
const SUBJECTS_6_8 = [
  'বাংলা',
  'English',
  'গণিত',
  'বিজ্ঞান',
  'বাংলাদেশ ও বিশ্বপরিচয়',
  'ধর্ম',
  'ICT'
]
// SSC (9-10) — 8 subjects, 100 marks
const SUBJECTS_9_10 = [
  'বাংলা',
  'English',
  'গণিত',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'বাংলাদেশ ও বিশ্বপরিচয়',
  'ধর্ম'
]
// HSC (11-12) — 8 subjects, 100 marks (group-flexible, editable in Settings)
const SUBJECTS_11_12 = [
  'বাংলা',
  'English',
  'ICT',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'উচ্চতর গণিত',
  'অর্থনীতি'
]

export const DEFAULT_CLASSES: ClassConfig[] = [
  { schoolId: 'school', id: 1, name: 'প্রথম', subjects: subjects(SUBJECTS_3, 50) },
  { schoolId: 'school', id: 2, name: 'দ্বিতীয়', subjects: subjects(SUBJECTS_3, 50) },
  { schoolId: 'school', id: 3, name: 'তৃতীয়', subjects: subjects(SUBJECTS_6, 70) },
  { schoolId: 'school', id: 4, name: 'চতুর্থ', subjects: subjects(SUBJECTS_6, 70) },
  { schoolId: 'school', id: 5, name: 'পঞ্চম', subjects: subjects(SUBJECTS_6, 70) },
  { schoolId: 'school', id: 6, name: 'ষষ্ঠ', subjects: subjects(SUBJECTS_6_8, 100) },
  { schoolId: 'school', id: 7, name: 'সপ্তম', subjects: subjects(SUBJECTS_6_8, 100) },
  { schoolId: 'school', id: 8, name: 'অষ্টম', subjects: subjects(SUBJECTS_6_8, 100) },
  { schoolId: 'school', id: 9, name: 'নবম', subjects: subjects(SUBJECTS_9_10, 100) },
  { schoolId: 'school', id: 10, name: 'দশম', subjects: subjects(SUBJECTS_9_10, 100) },
  { schoolId: 'school', id: 11, name: 'একাদশ', subjects: subjects(SUBJECTS_11_12, 100) },
  { schoolId: 'school', id: 12, name: 'দ্বাদশ', subjects: subjects(SUBJECTS_11_12, 100) }
]

export const DEFAULT_SCHOOL: School = {
  id: 'school',
  name: 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়',
  village: 'বেজখণ্ড',
  postOffice: 'মাত্রাই',
  upazila: 'কালাই',
  district: 'জয়পুরহাট'
}

/**
 * Seed the database only on first load (when it is empty).
 * Prefers the baked-in REAL spreadsheet data; falls back to defaults if it is
 * missing. Returns true if data was seeded, false if data already existed.
 */
export async function seedDatabase(): Promise<boolean> {
  const existing = await db.classes.count()
  if (existing > 0) {
    // Ensure 6-12 exist for older DBs that only had 1-5
    await ensureClassesUpTo12()
    return false
  }

  try {
    if (await seedRealData()) {
      // Real seed only had 1-5 — add 6-12 on top
      await ensureClassesUpTo12()
      return true
    }
  } catch {
    // Fall through to defaults if the baked seed is unavailable.
  }

  await db.transaction(
    'rw',
    db.school,
    db.gradingScale,
    db.classes,
    async () => {
      await db.school.put(DEFAULT_SCHOOL)
      await db.gradingScale.bulkPut(DEFAULT_GRADING_SCALE)
      await db.classes.bulkPut(DEFAULT_CLASSES)
    }
  )
  return true
}

/**
 * Ensure classes 6-12 exist. For existing installations that only have 1-5,
 * add the missing ones without touching existing data.
 */
export async function ensureClassesUpTo12(): Promise<void> {
  const existingIds = new Set((await db.classes.toArray()).map((c) => c.id))
  const missing = DEFAULT_CLASSES.filter((c) => !existingIds.has(c.id))
  if (missing.length > 0) {
    await db.classes.bulkPut(missing)
    console.log(`[Seed] Added missing classes: ${missing.map((c) => c.name).join(', ')}`)
  }
}
