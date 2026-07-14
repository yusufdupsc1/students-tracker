import type {
  Student,
  ClassConfig,
  GradingScaleRow,
  SubjectSlot
} from '../types'

/** Active subjects for a class: only slots with fullMarks > 0 count. */
export function getActiveSubjects(classConfig: ClassConfig): SubjectSlot[] {
  return classConfig.subjects.filter((s) => s.fullMarks > 0)
}

function enteredMark(student: Student, name: string): number | null {
  const v = student.marks[name]
  // `undefined` (key missing) and `null` (explicitly blank) are both "not entered".
  return v == null ? null : v
}

/**
 * Sum of ENTERED marks for active subjects.
 * Blank marks (null/undefined) are SKIPPED — they are never treated as 0.
 * An explicit 0 IS counted, because 0 is a real mark, not a missing one.
 */
export function calculateTotal(student: Student, classConfig: ClassConfig): number {
  return getActiveSubjects(classConfig).reduce((sum, s) => {
    const m = enteredMark(student, s.name)
    return m == null ? sum : sum + m
  }, 0)
}

/**
 * Average % = total obtained / sum of ALL active subjects' full marks * 100.
 * The denominator uses every active subject's full marks, even when some marks
 * are still blank (this is what makes an "Incomplete" student's average correct,
 * e.g. 5 obtained of 150 full = 3.33%, NOT 5/50 = 10%).
 */
export function calculateAverage(student: Student, classConfig: ClassConfig): number {
  const active = getActiveSubjects(classConfig)
  const totalFull = active.reduce((a, s) => a + s.fullMarks, 0)
  if (totalFull === 0) return 0
  return (calculateTotal(student, classConfig) / totalFull) * 100
}

/**
 * VLOOKUP-style ascending lookup: the scale row with the largest minPercent
 * that is <= average. The grading scale is the single source of truth.
 */
export function lookupGpaAndGrade(
  average: number,
  gradingScale: GradingScaleRow[]
): { gpa: number; grade: string; remark: string } {
  const sorted = [...gradingScale].sort((a, b) => a.minPercent - b.minPercent)
  if (sorted.length === 0) return { gpa: 0, grade: '\u2014', remark: '' }
  let match = sorted[0]
  for (const row of sorted) {
    if (average >= row.minPercent) match = row
    else break
  }
  return { gpa: match.gpa, grade: match.grade, remark: match.remark ?? '' }
}

/** Lowest passing percentage, derived from the scale (the first non-F boundary). */
export function passThreshold(gradingScale: GradingScaleRow[]): number {
  const passing = gradingScale.filter((r) => r.grade !== 'F')
  if (passing.length === 0) return 33
  return Math.min(...passing.map((r) => r.minPercent))
}

/**
 * Result status:
 *
 *  - 'Incomplete' — when ANY active subject's mark is still blank (missing),
 *    regardless of how many other subjects have marks. A blank is NOT a 0, so a
 *    student with one empty box is "Incomplete", never "Fail". (This also covers
 *    the all-blank case.)
 *  - 'Fail'  — every active subject has a mark, but at least one subject's
 *    percentage is below the pass threshold (subject-wise fail).
 *  - 'Pass'  — every active subject has a mark AND all are at/above the threshold.
 */
export function calculateResult(
  student: Student,
  classConfig: ClassConfig,
  gradingScale: GradingScaleRow[]
): 'Pass' | 'Fail' | 'Incomplete' {
  const active = getActiveSubjects(classConfig)

  const enteredCount = active.filter((s) => enteredMark(student, s.name) != null).length
  if (enteredCount < active.length) {
    // ----- BLANK vs ZERO -----
    // We only get here if a mark is missing. If we had treated blanks as 0 we would
    // wrongly compute a low average and could call this student "Fail". Instead it is
    // explicitly "Incomplete" until every active subject has a real mark.
    return 'Incomplete'
  }

  const threshold = passThreshold(gradingScale)
  for (const s of active) {
    const m = enteredMark(student, s.name) as number
    const pct = (m / s.fullMarks) * 100
    if (pct < threshold) return 'Fail'
  }
  return 'Pass'
}

/**
 * Merit rank within a class, by total descending (competition ranking:
 * tied totals share a rank, the next distinct total resumes at its 1-based index).
 * Uses calculateTotal so blank marks never masquerade as 0 in the ranking.
 */
export function calculateMeritRank(
  students: Student[],
  classConfig: ClassConfig
): Record<string, number> {
  const ranked = students
    .map((s) => ({ id: s.id, total: calculateTotal(s, classConfig) }))
    .sort((a, b) => b.total - a.total)

  const ranks: Record<string, number> = {}
  let rank = 1
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0 && ranked[i].total !== ranked[i - 1].total) rank = i + 1
    ranks[ranked[i].id] = rank
  }
  return ranks
}
