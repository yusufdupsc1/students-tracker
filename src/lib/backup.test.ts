import { describe, it, expect, beforeEach } from 'vitest'
import { buildBackup, applyBackup } from './backup'
import { db } from '../db/schema'

describe('backup', () => {
  beforeEach(async () => {
    await db.school.clear()
    await db.classes.clear()
    await db.students.clear()
    await db.gradingScale.clear()
    await db.mtrRecords.clear()
    await db.snapshots.clear()
    const { DEFAULT_SCHOOL, DEFAULT_CLASSES, DEFAULT_GRADING_SCALE } = await import('../db/seed')
    await db.school.put(DEFAULT_SCHOOL)
    await db.classes.bulkPut(DEFAULT_CLASSES.slice(0,2))
    await db.gradingScale.bulkPut(DEFAULT_GRADING_SCALE)
  })

  it('builds backup with all fields', async () => {
    const backup = await buildBackup()
    expect(backup.version).toBe(1)
    expect(backup.school).toBeDefined()
    expect(backup.classes.length).toBeGreaterThan(0)
    expect(backup.gradingScale.length).toBeGreaterThan(0)
    expect(backup.exportedAt).toBeDefined()
  })

  it('applies backup and restores data', async () => {
    const backup = await buildBackup()
    const json = JSON.stringify(backup)
    await db.students.put({ id: '1_1', classId: 1, roll: 1, name: 'Temp', marks: {}, schoolId: 'school' } as any)
    await applyBackup(json)
    const students = await db.students.toArray()
    expect(students.length).toBe(backup.students.length)
  })

  it('throws on invalid JSON', async () => {
    await expect(applyBackup('not json')).rejects.toThrow()
  })

  it('throws on invalid structure', async () => {
    await expect(applyBackup(JSON.stringify({ foo: 'bar' }))).rejects.toThrow()
  })
})
