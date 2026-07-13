import { db } from './schema'
import { seedRealData } from './seedReal'
import type { School, GradingScaleRow, ClassConfig, SubjectSlot } from '../types'

export const DEFAULT_GRADING_SCALE: GradingScaleRow[] = [
  { minPercent: 0, gpa: 0, grade: 'F', remark: 'উন্নতির জন্য বিশেষ যত্ন প্রয়োজন' },
  { minPercent: 33, gpa: 1, grade: 'D', remark: 'আরও অনুশীলন প্রয়োজন' },
  { minPercent: 40, gpa: 2, grade: 'C', remark: 'সন্তোষজনক' },
  { minPercent: 50, gpa: 3, grade: 'B', remark: 'ভালো' },
  { minPercent: 60, gpa: 3.5, grade: 'A-', remark: 'খুব ভালো' },
  { minPercent: 70, gpa: 4, grade: 'A', remark: 'চমৎকার' },
  { minPercent: 80, gpa: 5, grade: 'A+', remark: 'অসাধারণ' }
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

export const DEFAULT_CLASSES: ClassConfig[] = [
  { id: 1, name: 'প্রথম', subjects: subjects(SUBJECTS_3, 50) },
  { id: 2, name: 'দ্বিতীয়', subjects: subjects(SUBJECTS_3, 50) },
  { id: 3, name: 'তৃতীয়', subjects: subjects(SUBJECTS_6, 70) },
  { id: 4, name: 'চতুর্থ', subjects: subjects(SUBJECTS_6, 70) },
  { id: 5, name: 'পঞ্চম', subjects: subjects(SUBJECTS_6, 70) }
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
  if (existing > 0) return false

  try {
    if (await seedRealData()) return true
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
