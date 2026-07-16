import Dexie, { type Table } from 'dexie'
import type { School, GradingScaleRow, ClassConfig, Student, MTRRecord } from '../types'

export interface Snapshot {
  id?: number
  schoolId?: string
  createdAt: string // ISO timestamp
  reason: string // Bengali label shown in UI
  json: string // serialized Backup
}

export class AppDB extends Dexie {
  school!: Table<School, string>
  gradingScale!: Table<GradingScaleRow, number>
  classes!: Table<ClassConfig, number>
  students!: Table<Student, string>
  mtrRecords!: Table<MTRRecord, string>
  snapshots!: Table<Snapshot, number>

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
    // Additive migration pattern: never mutate a shipped version(1) block.
    // Bump the version and add the new store alongside the existing ones.
    this.version(2).stores({
      school: 'id',
      gradingScale: 'minPercent',
      classes: 'id',
      students: 'id, classId, roll, &[classId+roll]',
      mtrRecords: 'id, classId, studentId',
      snapshots: '++id, createdAt'
    })
    // Multi-tenancy: add schoolId to all tables for SaaS isolation.
    this.version(3).stores({
      school: 'id',
      gradingScale: 'schoolId, minPercent',
      classes: 'schoolId, id',
      students: 'schoolId, id, classId, roll, &[classId+roll]',
      mtrRecords: 'schoolId, id, classId, studentId',
      snapshots: '++id, schoolId, createdAt'
    })
  }
}

export const db = new AppDB()

