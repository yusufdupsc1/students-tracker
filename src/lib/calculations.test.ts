import { describe, it, expect } from 'vitest'
import {
  getActiveSubjects,
  calculateTotal,
  calculateAverage,
  lookupGpaAndGrade,
  passThreshold,
  calculateResult,
  calculateMeritRank
} from './calculations'
import type { Student, ClassConfig, GradingScaleRow } from '../types'

const SCALE: GradingScaleRow[] = [
  { minPercent: 0, gpa: 0, grade: 'F', remark: 'উন্নতির জন্য' },
  { minPercent: 33, gpa: 1, grade: 'D', remark: 'আরও অনুশীলন' },
  { minPercent: 40, gpa: 2, grade: 'C', remark: 'সন্তোষজনক' },
  { minPercent: 50, gpa: 3, grade: 'B', remark: 'ভালো' },
  { minPercent: 80, gpa: 5, grade: 'A+', remark: 'অসাধারণ' }
]

function subject(id: string, name: string, fullMarks: number) {
  return { id, name, fullMarks }
}

function classConfig(subjects: { name: string; fullMarks: number }[]): ClassConfig {
  return { id: 1, name: 'প্রথম', subjects: subjects.map((s) => subject(s.name, s.name, s.fullMarks)) }
}

function student(roll: number, marks: Record<string, number | null>): Student {
  return { id: `1_${roll}`, classId: 1, roll, name: `S${roll}`, marks }
}

describe('getActiveSubjects', () => {
  it('excludes slots whose fullMarks is 0', () => {
    const cc = classConfig([
      { name: 'বাংলা', fullMarks: 50 },
      { name: 'English', fullMarks: 0 },
      { name: 'গণিত', fullMarks: 50 }
    ])
    expect(getActiveSubjects(cc).map((s) => s.name)).toEqual(['বাংলা', 'গণিত'])
  })
})

describe('calculateTotal', () => {
  const cc = classConfig([
    { name: 'বাংলা', fullMarks: 50 },
    { name: 'English', fullMarks: 50 },
    { name: 'গণিত', fullMarks: 50 }
  ])
  it('sums only entered marks, skipping blank (null is NOT 0)', () => {
    const s = student(1, { বাংলা: 50, English: null, গণিত: 40 })
    expect(calculateTotal(s, cc)).toBe(90)
  })
  it('counts an explicit 0 as a real mark', () => {
    const s = student(2, { বাংলা: 0, English: 10, গণিত: 20 })
    expect(calculateTotal(s, cc)).toBe(30)
  })
})

describe('calculateAverage', () => {
  const cc = classConfig([
    { name: 'বাংলা', fullMarks: 50 },
    { name: 'English', fullMarks: 50 },
    { name: 'গণিত', fullMarks: 50 }
  ])
  it('uses the FULL denominator even when some marks are blank (trap #1)', () => {
    // 50 obtained of 150 full = 33.33%, NOT 50/50 = 100%.
    const s = student(1, { বাংলা: 50, English: null, গণিত: null })
    expect(calculateAverage(s, cc)).toBeCloseTo(33.3333, 3)
  })
  it('computes a plain average when all marks present', () => {
    const s = student(2, { বাংলা: 40, English: 35, গণিত: 45 })
    expect(calculateAverage(s, cc)).toBeCloseTo((120 / 150) * 100, 3)
  })
})

describe('lookupGpaAndGrade', () => {
  it('maps ascending boundaries (VLOOKUP TRUE)', () => {
    expect(lookupGpaAndGrade(0, SCALE).grade).toBe('F')
    expect(lookupGpaAndGrade(33, SCALE).grade).toBe('D')
    expect(lookupGpaAndGrade(80, SCALE).grade).toBe('A+')
    expect(lookupGpaAndGrade(95, SCALE).grade).toBe('A+')
    expect(lookupGpaAndGrade(79.9, SCALE).grade).toBe('B')
  })
})

describe('passThreshold', () => {
  it('derives the lowest non-F boundary from the scale', () => {
    expect(passThreshold(SCALE)).toBe(33)
  })
  it('falls back to 33 only when the scale has no non-F row', () => {
    expect(passThreshold([{ minPercent: 0, gpa: 0, grade: 'F', remark: '' }])).toBe(33)
  })
})

describe('calculateResult', () => {
  const cc = classConfig([
    { name: 'বাংলা', fullMarks: 50 },
    { name: 'English', fullMarks: 50 },
    { name: 'গণিত', fullMarks: 50 }
  ])
  it('returns Incomplete when any active subject is blank (never Fail)', () => {
    const s = student(1, { বাংলা: 50, English: 50, গণিত: null })
    expect(calculateResult(s, cc, SCALE)).toBe('Incomplete')
  })
  it('returns Pass when every subject is at/above threshold', () => {
    const s = student(2, { বাংলা: 40, English: 35, গণিত: 45 })
    expect(calculateResult(s, cc, SCALE)).toBe('Pass')
  })
  it('returns Fail when a subject is below threshold', () => {
    const s = student(3, { বাংলা: 10, English: 45, গণিত: 45 })
    expect(calculateResult(s, cc, SCALE)).toBe('Fail')
  })
})

describe('calculateMeritRank', () => {
  const cc = classConfig([
    { name: 'বাংলা', fullMarks: 50 },
    { name: 'English', fullMarks: 50 },
    { name: 'গণিত', fullMarks: 50 }
  ])
  it('ranks by total descending with competition ties', () => {
    const list = [
      student(1, { বাংলা: 50, English: 50, গণিত: 50 }), // 150
      student(2, { বাংলা: 40, English: 40, গণিত: 40 }), // 120
      student(3, { বাংলা: 0, English: 0, গণিত: 0 }), // 0
      student(4, { বাংলা: 40, English: 40, গণিত: 40 }) // 120 (tie with roll 2)
    ]
    const ranks = calculateMeritRank(list, cc)
    expect(ranks['1_1']).toBe(1)
    expect(ranks['1_2']).toBe(2)
    expect(ranks['1_4']).toBe(2) // tie shares rank 2
    expect(ranks['1_3']).toBe(4)
  })
})
