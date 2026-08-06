import { describe, it, expect, beforeEach } from 'vitest'
import { importJsonFile } from './importJson'
import { db } from '../db/schema'

function jsonFile(obj: any, name='test.json'): File {
  return new File([JSON.stringify(obj)], name, { type: 'application/json' })
}

describe('importJsonFile', () => {
  beforeEach(async () => {
    await db.students.clear()
    await db.classes.clear()
    const { DEFAULT_CLASSES } = await import('../db/seed')
    await db.classes.bulkPut(DEFAULT_CLASSES.slice(0,2))
    await db.school.put({ id: 'school', name: 'Test', village: '', postOffice: '', upazila: '', district: '' })
    await db.gradingScale.bulkPut([
      { schoolId: 'school', minPercent: 0, gpa: 0, grade: 'F', remark: '' },
      { schoolId: 'school', minPercent: 33, gpa: 1, grade: 'D', remark: '' },
    ])
  })

  it('parses ImportResult style', async () => {
    const data = {
      school: { id: 'school', name: 'Test', village: '', postOffice: '', upazila: '', district: '' },
      classes: [{ id: 1, name: 'প্রথম', subjects: [] }],
      gradingScale: [{ schoolId: 'school', minPercent: 0, gpa: 0, grade: 'F', remark: '' }],
      students: [{ id: '1_1', classId: 1, roll: 1, name: 'Rahim', marks: {} }]
    }
    const file = jsonFile(data)
    const result = await importJsonFile(file)
    expect(result.students).toHaveLength(1)
    expect(result.students[0].name).toBe('Rahim')
  })

  it('parses simple student array', async () => {
    const arr = [{ classId: 1, roll: 2, name: 'Karim', marks: {} }]
    const file = jsonFile(arr)
    const result = await importJsonFile(file)
    expect(result.students).toHaveLength(1)
  })

  it('throws on invalid JSON', async () => {
    const file = new File(['not json'], 'bad.json', { type: 'application/json' })
    await expect(importJsonFile(file)).rejects.toThrow()
  })

  it('throws on empty students', async () => {
    const file = jsonFile({ school: {}, classes: [], gradingScale: [], students: [] })
    await expect(importJsonFile(file)).rejects.toThrow()
  })
})
