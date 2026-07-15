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
  if (!res.ok) {
    if (res.status === 404) throw new Error('Remote database not found. Push data first.')
    throw new Error(`Remote download failed: ${res.status}`)
  }
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('Remote data is corrupted')
  }
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
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Remote upload failed: ${res.status} — ${errText}`)
  }
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
    if (localAge < 10_000) {
      return { imported: false, records: 0 }
    }
  }

  const parsed = typeof data === 'string' ? JSON.parse(data) : data
  if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as any).students)) {
    throw new Error('Remote data invalid')
  }

  const { db } = await import('../db/schema')
  const { captureSnapshot } = await import('../db/snapshots')

  await captureSnapshot('রিমোট সিঙ্কের পূর্বে')

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
  const { captureSnapshot } = await import('../db/snapshots')

  const [school, gradingScale, classes, students, mtrRecords] = await Promise.all([
    db.school.get('school'),
    db.gradingScale.toArray(),
    db.classes.toArray(),
    db.students.toArray(),
    db.mtrRecords.toArray()
  ])

  if (!school || classes.length === 0 || students.length === 0) {
    throw new Error('No local data to sync')
  }

  await captureSnapshot('রিমোট সিঙ্কের পূর্বে')

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
