import Dexie, { type Table } from 'dexie'
import type { School, GradingScaleRow, ClassConfig, Student, MTRRecord } from '../types'

export class AppDB extends Dexie {
  school!: Table<School, string>
  gradingScale!: Table<GradingScaleRow, number>
  classes!: Table<ClassConfig, number>
  students!: Table<Student, string>
  mtrRecords!: Table<MTRRecord, string>

  constructor() {
    super('bejkhonda-school')
    this.version(1).stores({
      // Single row keyed by 'school'.
      school: 'id',
      // One row per scale boundary; minPercent is the primary key.
      gradingScale: 'minPercent',
      // One row per class (id 1..5).
      classes: 'id',
      // Compound [classId+roll] is unique so a roll cannot repeat within a class.
      students: 'id, classId, roll, &[classId+roll]',
      // One competency record per student.
      mtrRecords: 'id, classId, studentId'
    })
  }
}

export const db = new AppDB()

/** Subjects that are actually active for a class (fullMarks > 0). */
export function getActiveSubjects(classConfig: ClassConfig) {
  return classConfig.subjects.filter((s) => s.fullMarks > 0)
}
