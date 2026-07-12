import { describe, it, expect } from 'vitest'
import { computeStudent, gradeFromPct } from './calc.js'
import { DEFAULT_GRADE_SCALE, DEFAULT_PASS_PCT } from './gradeScale.js'

const opts = { gradeScale: DEFAULT_GRADE_SCALE, passPct: DEFAULT_PASS_PCT }

function mk(subjects) {
  return { subjects }
}

describe('gradeFromPct', () => {
  it('maps boundaries ascending (VLOOKUP TRUE)', () => {
    expect(gradeFromPct(0, DEFAULT_GRADE_SCALE).grade).toBe('F')
    expect(gradeFromPct(33, DEFAULT_GRADE_SCALE).grade).toBe('D')
    expect(gradeFromPct(80, DEFAULT_GRADE_SCALE).grade).toBe('A+')
    expect(gradeFromPct(95, DEFAULT_GRADE_SCALE).grade).toBe('A+')
    expect(gradeFromPct(79.9, DEFAULT_GRADE_SCALE).grade).toBe('A')
  })
})

describe('computeStudent - মেঘনা (class 1, complete, top)', () => {
  const s = mk([
    { name: 'বাংলা', obtained: 50, fullMark: 50 },
    { name: 'English', obtained: 49, fullMark: 50 },
    { name: 'গণিত', obtained: 49, fullMark: 50 }
  ])
  const r = computeStudent(s, opts)
  it('totals', () => expect(r.totalObtained).toBe(148))
  it('avg %', () => expect(r.avgPct).toBe(98.67))
  it('GPA 5', () => expect(r.overallGpa).toBe(5))
  it('grade A+', () => expect(r.overallGrade).toBe('A+'))
  it('passed', () => expect(r.result).toBe('Passed'))
  it('remark অসাধারণ', () => expect(r.remark).toBe('অসাধারণ'))
})

describe('computeStudent - আছিয়া (class 3, subject-wise fail)', () => {
  const s = mk([
    { name: 'বাংলা', obtained: 25, fullMark: 70 },
    { name: 'English', obtained: 30, fullMark: 70 },
    { name: 'গণিত', obtained: 27, fullMark: 70 },
    { name: 'প্রাথমিক বিজ্ঞান', obtained: 21, fullMark: 70 },
    { name: 'বাংলাদেশ ও বিশ্বপরিচয়', obtained: 23, fullMark: 70 },
    { name: 'ধর্ম', obtained: 17, fullMark: 70 }
  ])
  const r = computeStudent(s, opts)
  it('avg % 34.05', () => expect(r.avgPct).toBe(34.05))
  it('forced F', () => expect(r.overallGrade).toBe('F'))
  it('GPA 0', () => expect(r.overallGpa).toBe(0))
  it('result Failed', () => expect(r.result).toBe('Failed'))
})

describe('computeStudent - সিয়াম (class 1, incomplete)', () => {
  const s = mk([
    { name: 'বাংলা', obtained: 5, fullMark: 50 },
    { name: 'English', obtained: null, fullMark: 50 },
    { name: 'গণিত', obtained: null, fullMark: 50 }
  ])
  const r = computeStudent(s, opts)
  it('total 5', () => expect(r.totalObtained).toBe(5))
  it('avg over full denominator 3.33', () => expect(r.avgPct).toBe(3.33))
  it('no grade', () => expect(r.overallGrade).toBeNull())
  it('result Incomplete', () => expect(r.result).toBe('Incomplete'))
})

describe('computeStudent - no marks', () => {
  const s = mk([
    { name: 'বাংলা', obtained: null, fullMark: 50 },
    { name: 'English', obtained: null, fullMark: 50 }
  ])
  const r = computeStudent(s, opts)
  it('result No marks', () => expect(r.result).toBe('No marks'))
  it('avg null', () => expect(r.avgPct).toBeNull())
})
