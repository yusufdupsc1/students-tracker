import { db } from './schema'
import { buildBackup, applyBackup } from '../lib/backup'

const MAX_SNAPSHOTS = 5

/** Capture a full-data snapshot before a destructive op; keep only the last N. */
export async function captureSnapshot(reason: string): Promise<void> {
  const backup = await buildBackup()
  await db.snapshots.add({
    createdAt: new Date().toISOString(),
    reason,
    json: JSON.stringify(backup)
  })
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
