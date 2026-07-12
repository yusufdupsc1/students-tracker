// Default grading config. The live values are stored in IndexedDB (Settings) and
// seeded from the spreadsheet; these are only fallbacks used if storage is empty.

export const DEFAULT_GRADE_SCALE = [
  { minPct: 0, grade: 'F', gpa: 0, status: 'Fail', remark: 'উন্নতির জন্য বিশেষ যত্ন প্রয়োজন' },
  { minPct: 33, grade: 'D', gpa: 1, status: 'Pass', remark: 'আরও অনুশীলন প্রয়োজন' },
  { minPct: 40, grade: 'C', gpa: 2, status: 'Pass', remark: 'সন্তোষজনক' },
  { minPct: 50, grade: 'B', gpa: 3, status: 'Pass', remark: 'ভালো' },
  { minPct: 60, grade: 'A-', gpa: 3.5, status: 'Pass', remark: 'খুব ভালো' },
  { minPct: 70, grade: 'A', gpa: 4, status: 'Pass', remark: 'চমৎকার' },
  { minPct: 80, grade: 'A+', gpa: 5, status: 'Pass', remark: 'অসাধারণ' }
]

export const DEFAULT_PASS_PCT = 33

export const DEFAULT_TOGGLES = {
  showGuardian: true,
  showVillage: true,
  showAttendance: true,
  showMerit: true,
  showGpa: true,
  showGradeBadge: true,
  showSignature: true
}

export const CLASS_NAMES = {
  1: 'প্রথম',
  2: 'দ্বিতীয়',
  3: 'তৃতীয়',
  4: 'চতুর্থ',
  5: 'পঞ্চম'
}

export const CLASS_LIST = [1, 2, 3, 4, 5]

export function getScale(settings) {
  return (settings && settings.gradeScale && settings.gradeScale.length) ? settings.gradeScale : DEFAULT_GRADE_SCALE
}

export function getPassPct(settings) {
  return (settings && settings.passPct != null) ? settings.passPct : DEFAULT_PASS_PCT
}

export function getSubjectsByClass(settings) {
  return (settings && settings.subjectsByClass) ? settings.subjectsByClass : {}
}
