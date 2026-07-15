// Domain types — mirror the spreadsheet model exactly (see .kilocode/rules/project-context.md).

export interface GradingScaleRow {
  schoolId?: string
  minPercent: number
  gpa: number
  grade: string
  /** Banding remark for the grade (e.g. A+ -> "অসাধারণ"). Part of the scale = single source. */
  remark: string
}

export interface SubjectSlot {
  id: string
  name: string
  /** 0 means the slot is INACTIVE for this class. A non-zero value makes it active. */
  fullMarks: number
}

export interface ClassConfig {
  schoolId?: string
  /** 1..5 */
  id: number
  /** Bengali class name, e.g. প্রথম */
  name: string
  /** Up to 8 subject slots. A slot is active only if fullMarks > 0. */
  subjects: SubjectSlot[]
}

export interface School {
  /** UUID from Supabase Auth. */
  id: string
  name: string
  village: string
  postOffice: string
  upazila: string
  district: string
}

export interface Student {
  schoolId?: string
  /** `${classId}_${roll}` — stable composite id. */
  id: string
  classId: number
  /** Unique within the class. */
  roll: number
  name: string
  guardian?: string
  village?: string
  /** Attendance percentage. */
  attendance?: number
  /** Subject name -> obtained mark. `null` means NOT YET ENTERED (blank, not zero). */
  marks: Record<string, number | null>
}

export type MTRSkillStatus = 'yes' | 'no' | 'unassessed'

export interface MTRRecord {
  schoolId?: string
  /** `${classId}_${roll}` — one competency record per student. */
  id: string
  studentId: string
  classId: number
  roll: number
  /** বাংলা সাবলীল পঠন */
  banglaReading: MTRSkillStatus
  /** গণিত চার নিয়ম দক্ষতা */
  mathFourRules: MTRSkillStatus
  /** English সাবলীল পঠন */
  englishReading: MTRSkillStatus
}
