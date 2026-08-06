import { db } from './schema'
import { buildBackup, applyBackup } from '../lib/backup'

const MAX_SNAPSHOTS = 5

/** Capture a full-data snapshot before a destructive op; keep only the last N. */
export async function captureSnapshot(reason: string): Promise<void> {
  const backup = await buildBackup()
  const json = JSON.stringify(backup)
  // Guard: prevent >4MB snapshots (IndexedDB bloat). Skip if too large, warn user.
  if (json.length > 4_000_000) {
    console.warn(`[Snapshot] skipped — too large (${(json.length/1024/1024).toFixed(2)}MB) for reason: ${reason}`)
    return
  }
  await db.snapshots.add({
    schoolId: backup.school?.id,
    createdAt: new Date().toISOString(),
    reason,
    json
  } as any)
  const all = await db.snapshots.orderBy('createdAt').toArray()
  if (all.length > MAX_SNAPSHOTS) {
    const excess = all.slice(0, all.length - MAX_SNAPSHOTS)
    await db.snapshots.bulkDelete(excess.map((s) => s.id!))
  }
}

export async function restoreSnapshot(id: number): Promise<void> {
  const snap = await db.snapshots.get(id)
  if (!snap) throw new Error('snapshot not found')
  await captureSnapshot('স্ন্যাপশট পুনরুদ্ধারের পূর্বে') // undo-of-undo
  await applyBackup(snap.json)
}
