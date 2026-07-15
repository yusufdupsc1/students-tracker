/**
 * Remote sync service — pushes/pulls the full app database to/from Vercel Blob.
 *
 * Data model (JSON shape):
 * {
 *   exportedAt: string (ISO)
 *   school: School | null
 *   gradingScale: GradingScaleRow[]
 *   classes: ClassConfig[]
 *   students: Student[]
 *   mtrRecords: MTRRecord[]
 * }
 */

const API_URL = '/api/db'
const STORAGE_KEY = 'bejkhonda-remote-sync-meta'

interface SyncMeta {
  lastSyncAt: number
  lastRemoteModified: number
}

function getMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { lastSyncAt: 0, lastRemoteModified: 0 }
  } catch {
    return { lastSyncAt: 0, lastRemoteModified: 0 }
  }
}

function setMeta(meta: SyncMeta) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meta))
}

export async function downloadRemote(): Promise<unknown> {
  const res = await fetch(`${API_URL}?action=download`, {
    headers: { 'Accept': 'application/json' }
  })
  if (!res.ok) throw new Error(`Remote download failed: ${res.status}`)
  return res.json()
}

export async function uploadRemote(data: unknown): Promise<void> {
  const json = JSON.stringify(data, null, 2)
  const res = await fetch(`${API_URL}?action=upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-token': String(import.meta.env.VITE_ADMIN_TOKEN || '')
    },
    body: json
  })
  if (!res.ok) throw new Error(`Remote upload failed: ${res.status}`)
}

export async function resetRemote(): Promise<void> {
  const res = await fetch(`${API_URL}?action=reset`, {
    method: 'POST',
    headers: {
      'x-admin-token': String(import.meta.env.VITE_ADMIN_TOKEN || '')
    }
  })
  if (!res.ok) throw new Error(`Remote reset failed: ${res.status}`)
}

export async function syncFromRemote(): Promise<{ imported: boolean; records: number }> {
  const data = await downloadRemote()
  const meta = getMeta()

  if (meta.lastSyncAt > 0 && meta.lastRemoteModified > 0) {
    const localAge = Date.now() - meta.lastSyncAt
    if (localAge < 60_000) {
      return { imported: false, records: 0 }
    }
  }

  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).students)) {
    throw new Error('Remote data invalid')
  }

  const db = (await import('../db/schema')).db

  await db.transaction('rw', db.school, db.gradingScale, db.classes, db.students, db.mtrRecords, async () => {
    await db.school.clear()
    await db.gradingScale.clear()
    await db.classes.clear()
    await db.students.clear()
    await db.mtrRecords.clear()

    const p = parsed as any
    if (p.school) await db.school.put(p.school)
    if (Array.isArray(p.gradingScale)) await db.gradingScale.bulkPut(p.gradingScale)
    if (Array.isArray(p.classes)) await db.classes.bulkPut(p.classes)
    if (Array.isArray(p.students)) await db.students.bulkPut(p.students)
    if (Array.isArray(p.mtrRecords)) await db.mtrRecords.bulkPut(p.mtrRecords)
  })

  setMeta({
    lastSyncAt: Date.now(),
    lastRemoteModified: Date.now()
  })

  return {
    imported: true,
    records: Array.isArray((parsed as any).students) ? (parsed as any).students.length : 0
  }
}

export async function syncToRemote(): Promise<void> {
  const { db } = await import('../db/schema')
  const [school, gradingScale, classes, students, mtrRecords] = await Promise.all([
    db.school.get('school'),
    db.gradingScale.toArray(),
    db.classes.toArray(),
    db.students.toArray(),
    db.mtrRecords.toArray()
  ])

  const payload = {
    exportedAt: new Date().toISOString(),
    school,
    gradingScale,
    classes,
    students,
    mtrRecords
  }

  await uploadRemote(payload)

  setMeta({
    lastSyncAt: Date.now(),
    lastRemoteModified: Date.now()
  })
}
