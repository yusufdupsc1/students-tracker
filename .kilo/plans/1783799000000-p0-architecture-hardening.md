# P0 Architecture Hardening — Implementation Plan

> Derived from the architectural review. Scope = the **P0 batch** only:
> (1) storage durability + auto-snapshot safety, (2) delete dead prototype island,
> (3) typecheck-gated build + CI. All changes respect hard constraints: offline-only,
> no backend, no runtime network, small bundle, low-spec Android.
>
> Verify after each part: `npm run typecheck` && `npm run test` && `npm run build`.

---

## P0-1 — Storage durability + auto-snapshot before destructive ops
Fixes F1 (IndexedDB eviction / data-loss SPOF) and F4 (destructive import with no undo).
Also lightly seeds F6 (schema migration pattern).

### 1a. `src/db/schema.ts` — add `Snapshot` type + `version(2)` additive store
- Add exported interface:
  ```ts
  export interface Snapshot {
    id?: number
    createdAt: string   // ISO timestamp
    reason: string      // Bengali label shown in UI
    json: string        // serialized Backup
  }
  ```
- Add `snapshots!: Table<Snapshot, number>` field to `AppDB`.
- Keep the existing `this.version(1).stores({...})` UNCHANGED.
- Add an additive `this.version(2).stores({ ...same five..., snapshots: '++id, createdAt' })`.
  Comment it as the reference pattern for future migrations (always bump version).
- Keep `getActiveSubjects` helper as-is.

### 1b. NEW `src/lib/persistence.ts`
```ts
/** Best-effort: ask the browser NOT to evict our IndexedDB under storage pressure. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function storageStatus(): Promise<{ usage: number; quota: number; persisted: boolean } | null> {
  try {
    if (!navigator.storage?.estimate) return null
    const est = await navigator.storage.estimate()
    const persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false
    return { usage: est.usage ?? 0, quota: est.quota ?? 0, persisted }
  } catch {
    return null
  }
}
```

### 1c. NEW `src/db/snapshots.ts`
- Imports `db` from `./schema` and `buildBackup`, `applyBackup` from `../lib/backup`.
  (No cycle: `backup.ts` must NOT import `snapshots.ts`.)
```ts
import { db } from './schema'
import { buildBackup, applyBackup } from '../lib/backup'

const MAX_SNAPSHOTS = 5

/** Capture a full-data snapshot before a destructive op; keep only the last N. */
export async function captureSnapshot(reason: string): Promise<void> {
  const backup = await buildBackup()
  await db.snapshots.add({ createdAt: new Date().toISOString(), reason, json: JSON.stringify(backup) })
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
```
- Note: `applyBackup` clears only the 5 domain tables (NOT `snapshots`), so snapshots
  survive a restore. Confirm this remains true in `backup.ts`.

### 1d. `src/main.tsx` — request persistence at startup
- Add `import { requestPersistentStorage } from './lib/persistence'`.
- After `void seedDatabase()` add `void requestPersistentStorage()`.

### 1e. `src/pages/Import.tsx` — snapshot before destructive commits + snapshots panel + storage status
- Imports: add `useLiveQuery` (dexie-react-hooks), `db` (../db/schema),
  `captureSnapshot, restoreSnapshot` (../db/snapshots), `storageStatus` (../lib/persistence).
- In `onCommit` (xlsx): before `await applyImport(result)` call
  `await captureSnapshot('স্প্রেডশিট ইমপোর্টের পূর্বে')`.
- In `onCommitBackup` (JSON restore): before `await applyBackup(text)` call
  `await captureSnapshot('ব্যাকআপ পুনরুদ্ধারের পূর্বে')`.
- Add a **"সাম্প্রতিক স্ন্যাপশট"** card: `useLiveQuery(() => db.snapshots.orderBy('createdAt').reverse().toArray())`;
  list each with `createdAt` (localized) + `reason` + a "পুনরুদ্ধার" button (confirm → `restoreSnapshot(id)`).
  Empty state: "কোনো স্ন্যাপশট নেই।"
- Add a small **storage status** line (persisted ✓ / not; usage MB): load via `storageStatus()` in a
  `useEffect`. If not persisted, show hint that data may be cleared under storage pressure.

---

## P0-2 — Delete the dead prototype island
Fixes F2 (extension-shadowing landmine; the critical `Layout.jsx`/`importXlsx.js`
shadows were already removed, this eliminates the rest of the island).

Confirmed no live `.ts/.tsx/.css/.html` imports these (grep returned nothing).
Delete:
```
src/screens/            (8 .jsx: Dashboard, Students, StudentForm, ResultCard, MTR, Search, QrIds, ImportExport)
src/context/            (StoreContext.jsx)
src/db/db.js
src/lib/calc.js
src/lib/gradeScale.js
src/lib/qr.js            (QR reference impl — preserved in git history; TS port is future item F10)
src/styles/             (global.css, print.css — prototype styles; live app uses src/index.css + src/print.css)
```
Command:
```
rm -rf src/screens src/context src/db/db.js src/lib/calc.js src/lib/gradeScale.js src/lib/qr.js src/styles
```

---

## P0-3 — Typecheck-gated build + verify script + CI
Fixes F5 (no quality gate; regressions can ship).

### 3a. `package.json` scripts
- Change `"build"` to gate on types: `"build": "tsc --noEmit && vite build"`.
  (`prebuild` still runs the seed first.)
- Add `"verify": "npm run typecheck && npm run test && npm run build"`.

### 3b. NEW `.github/workflows/verify.yml`
```yaml
name: verify
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

---

## Validation
- `npm run typecheck` → 0 errors.
- `npm run test` → existing 12 calc tests still pass.
- `npm run build` → succeeds (now also type-gated); bundle unchanged in shape.
- Manual (dev): Import page shows storage-persisted status; doing an xlsx import or
  JSON restore first creates a snapshot; the snapshots panel lists it and "পুনরুদ্ধার" works.
- Confirm the app still boots with real seeded data (dead-island deletion caused no
  missing-import errors).

## Commit
`feat: P0 hardening — storage persist + auto-snapshot restore, delete dead prototype island, typecheck-gated build + CI`
Then update root `PROGRESS.md` (mark item 12 done; note F1/F2/F4/F5 resolved).

## Explicitly NOT in this batch (next: P1)
- Route-level ErrorBoundary (F3).
- Repository layer extraction (F8/F6/testability).
- Lazy seed import + memoized dashboards + manualChunks (F7/F8).
- Repository/print-parity tests (F11); result-policy strategy; encrypted backup; QR TS port.
