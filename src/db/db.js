import Dexie from 'dexie'
import seed from '../data/seed.json'

export const db = new Dexie('students-tracker')
db.version(1).stores({
  settings: 'id',
  students: 'id, classId, roll',
  mtr: 'id, classId',
  meta: 'key'
})

export async function ensureSeeded() {
  const meta = await db.meta.get('seeded')
  if (meta && meta.value === true) return false
  await db.transaction('rw', db.settings, db.students, db.mtr, db.meta, async () => {
    const settings = {
      id: 'school',
      school: seed.school,
      gradeScale: seed.gradeScale,
      toggles: seed.toggles,
      passPct: seed.passPct,
      subjectsByClass: seed.subjectsByClass,
      classes: seed.classes
    }
    await db.settings.put(settings)
    await db.students.bulkPut(seed.students)
    for (const classId of seed.classes) {
      await db.mtr.put({ id: `mtr_${classId}`, classId, entries: [] })
    }
    await db.meta.put({ key: 'seeded', value: true })
  })
  return true
}

export async function clearAll() {
  await db.transaction('rw', db.settings, db.students, db.mtr, db.meta, async () => {
    await db.settings.clear()
    await db.students.clear()
    await db.mtr.clear()
    await db.meta.clear()
  })
}

export async function reseed() {
  await clearAll()
  await ensureSeeded()
}
