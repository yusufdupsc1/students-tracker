// Domain types — Bejkhonda School Management (1-12 + expandable)

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
  /** 1..N (1-12 default, extensible) */
  id: number
  /** Bengali class name, e.g. প্রথম / ষষ্ঠ / Custom */
  name: string
  /** Up to 12 subject slots. A slot is active only if fullMarks > 0. */
  subjects: SubjectSlot[]
  /** Optional section/group info */
  sections?: string[] // e.g. ["ক", "খ", "গ"]
  group?: string // Science/Arts/Commerce for 9-12
}

export interface School {
  /** UUID from local auth (fixed 'school' in lite mode) */
  id: string
  name: string
  village: string
  postOffice: string
  upazila: string
  district: string
  // New options aligning with app goal
  academicYear?: string // e.g. "2025"
  session?: string // e.g. "2025-2026"
  phone?: string
  email?: string
  principalName?: string
  eiin?: string // EIIN for secondary
  establishedYear?: string
  logoUrl?: string
  examTerms?: string[] // e.g. ["প্রান্তিক-১", "প্রান্তিক-২", "বার্ষিক"]
  sections?: string[] // e.g. ["ক", "খ"]
  groups?: string[] // e.g. ["Science", "Arts", "Commerce"]
}

export interface Student {
  schoolId?: string
  /** `${classId}_${roll}` — stable composite id. */
  id: string
  classId: number // 1..N
  /** Unique within the class. */
  roll: number
  name: string
  guardian?: string
  village?: string
  /** Attendance percentage. */
  attendance?: number
  /** Subject name -> obtained mark. `null` means NOT YET ENTERED (blank, not zero). */
  marks: Record<string, number | null>
  // New fields aligning with school goal
  section?: string // ক/খ/গ
  group?: string // Science/Arts/Commerce
  gender?: 'male' | 'female' | 'other'
  dob?: string // YYYY-MM-DD
  phone?: string
  email?: string
  bloodGroup?: string // A+, B+ etc.
  religion?: string
  address?: string
  admissionDate?: string
  previousSchool?: string
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
