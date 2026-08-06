import { describe, it, expect, beforeEach } from 'vitest'
import { importCsvFile, exportCsv } from './importCsv'
import { db } from '../db/schema'

// Helper to create a File from string
function csvFile(content: string, name = 'test.csv'): File {
  return new File([content], name, { type: 'text/csv' })
}

describe('importCsvFile', () => {
  beforeEach(async () => {
    // Ensure DB is clean for isolated test (but don't delete users)
    await db.students.clear()
    await db.classes.clear()
    // Re-seed minimal classes for test
    const { DEFAULT_CLASSES } = await import('../db/seed')
    await db.classes.bulkPut(DEFAULT_CLASSES.slice(0, 2))
  })

  it('parses CSV with English headers', async () => {
    const csv = `Class,Roll,Name,Guardian,Village,Attendance,Bangla,English,Math
1,1,Rahim,Parent,Bejkhonda,90,40,35,45
1,2,Karim,Parent2,Village2,85,30,30,30`
    const file = csvFile(csv)
    const result = await importCsvFile(file)
    expect(result.students).toHaveLength(2)
    expect(result.students[0].name).toBe('Rahim')
    expect(result.students[0].classId).toBe(1)
    expect(result.students[0].roll).toBe(1)
    expect(result.students[0].marks['Bangla']).toBe(40)
  })

  it('parses CSV with Bengali headers', async () => {
    const csv = `শ্রেণি,রোল,নাম,অভিভাবক,গ্রাম,উপস্থিতি,বাংলা,English
2,5,Ayesha,Guardian,Village,95,45,40`
    const file = csvFile(csv)
    const result = await importCsvFile(file)
    expect(result.students).toHaveLength(1)
    expect(result.students[0].name).toBe('Ayesha')
    expect(result.students[0].classId).toBe(2)
  })

  it('handles quoted fields with commas', async () => {
    const csv = `Class,Roll,Name,Guardian
1,1,"Rahim, Jr.",Parent`
    const file = csvFile(csv)
    const result = await importCsvFile(file)
    expect(result.students[0].name).toBe('Rahim, Jr.')
  })

  it('throws on empty file', async () => {
    const file = csvFile('')
    await expect(importCsvFile(file)).rejects.toThrow()
  })

  it('throws when Name column missing', async () => {
    const csv = `Class,Roll,Guardian\n1,1,Parent`
    const file = csvFile(csv)
    await expect(importCsvFile(file)).rejects.toThrow('Name')
  })

  it('auto-assigns roll when missing', async () => {
    const csv = `Class,Name\n1,Rahim`
    const file = csvFile(csv)
    const result = await importCsvFile(file)
    expect(result.students[0].roll).toBe(1)
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

describe('exportCsv', () => {
  it('exports students to CSV with correct headers', async () => {
    await db.students.clear()
    await db.students.put({
      id: '1_1',
      classId: 1,
      roll: 1,
      name: 'Test',
      marks: { 'বাংলা': 40, 'English': 35 },
      schoolId: 'school',
    } as any)
    const csv = await exportCsv()
    expect(csv).toContain('Class')
    expect(csv).toContain('Roll')
    expect(csv).toContain('Test')
    expect(csv).toContain('40')
  })

  it('throws when no students', async () => {
    await db.students.clear()
    await expect(exportCsv()).rejects.toThrow('কোনো শিক্ষার্থী')
  })
})
