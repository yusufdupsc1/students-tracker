# Bejkhonda School Result & Tracking PWA — Progress

Offline PWA replacing the Excel result-tracking system for বেজখণ্ড সঃ প্রাঃ বিদ্যালয়.
No backend, no auth — all data in IndexedDB (Dexie). Bengali UI, mobile-first.

## Feature Roadmap

- [x] 1. Project scaffold (Vite + React + TS + Tailwind + Dexie + PWA)
- [x] 2. Domain model & DB schema (school, grading scale, classes, students, MTR)
- [x] 3. Seed data + offline Bengali font
- [x] 5. Dashboard
- [x] 6. Settings (grading scale / school / class subjects)
- [x] 7. Report card view + print
- [x] 4. **Class Roster** (live results, 33% highlight, add/edit/delete, duplicate-roll guard, mobile cards)
- [x] 8. **Student Search** (cross-class search by name/roll/guardian/village; combined academic + MTR profile)
- [x] 9. Unit tests for `src/lib/calculations.ts` (12 tests; trap #1 blank≠zero, Incomplete, threshold, merit ties)
- [x] 10. **Import-from-xlsx** (`src/lib/importXlsx.ts` + `src/pages/Import.tsx`): real `Result_Card_Bejkhonda_v3_3_FINAL.xlsx` mapping → School/scale/classes/students, preview-before-commit, **Replace everything** semantics; plus JSON backup export/restore (`src/lib/backup.ts`)
- [x] Perf: route-level code-splitting (React.lazy) — initial JS ~93 KB gzip; recharts & xlsx are on-demand chunks; PWA precache keeps nav instant offline
- [x] **Spreadsheet baked as the default DB**: `scripts/seed-from-xlsx.mjs` regenerates `src/data/seed.json` from the real `Result_Card_Bejkhonda_v3_3_FINAL.xlsx` (106 students / 5 classes) in the live model shape; `seedDatabase()` prefers it (fallback to defaults). Wired as `predev`/`prebuild` so the app always opens with the latest sheet, fully offline. Manual upload (item 10) still available for on-device refresh.
- [ ] 11. Lighthouse PWA + offline verification
- [x] **Layout/typography audit (browser, real data)**: programmatic DOM/geometry audit at 375px + 1280px across all 7 routes. Found & fixed: (a) CRITICAL — the live app was rendering the dead prototype `src/components/Layout.jsx` because Vite's `resolve.extensions` tries `.jsx` before `.tsx`, shadowing the real `Layout.tsx` (wrong nav, no `app-bottomnav`/`app-main`/`app-sidebar`, breaking mobile nav + print hiding). Removed `Layout.jsx`. (b) Report Card caused horizontal page scroll at 375px (8-col result table not wrapped) + inconsistent table `line-height: normal`; wrapped table in `overflow-x-auto` + `leading-5`/`min-w-[640px]`. Verified: 0 page-level horizontal overflow on every route at 375px; bottom nav (7 items) fits single-line; dashboard/MTR/settings tables scroll internally by design.
- [x] 12. **Dead-code cleanup**: removed remaining unwired JS prototype island (`src/screens/`, `src/context/`, `src/db/db.js`, `src/lib/{calc,gradeScale,qr}.js`, `src/styles/*`). Grep confirmed zero live `.ts/.tsx` imports. `src/lib/importXlsx.js` and `src/components/Layout.jsx` already removed in prior turns.
- [x] **P0 Architecture hardening**: storage durability + auto-snapshot safety (F1/F4): `requestPersistentStorage()` at startup; new `snapshots` IndexedDB store via additive `version(2)` migration; `captureSnapshot()` before every destructive import/restore (keep last 5), `restoreSnapshot()` (undo-of-undo, snapshots survive restore since `applyBackup` clears only the 5 domain tables). Import page gained a "সাম্প্রতিক স্ন্যাপশট" panel + storage-status card. Typecheck-gated build (`build: tsc --noEmit && vite build`) + `verify` script + `.github/workflows/verify.yml` CI (F5). Resolved F1, F2, F4, F5.

## Drift note
Commit `9a7bbc2` claimed student-management features done, but `ClassRoster.tsx`
and `StudentSearch.tsx` were placeholders. Items 4 & 8 implemented 2026-07-13;
spreadsheet import + backup + perf work 2026-07-13. Layout audit 2026-07-13
found the app was silently served by the dead `Layout.jsx` (extension shadowing).
This cycle (2026-07-13) completed the P0 hardening batch from the architectural
review: deleted the remaining dead prototype island, added durable storage +
auto-snapshot undo, and gated the build behind typecheck with CI. No drift found
this cycle between PROGRESS.md claims and actual code.

- [x] **P1 robustness + perf**: Route-level `ErrorBoundary` wraps every page (and the whole app) so a render crash shows a Bengali "retry" card instead of a blank screen (F3). `seedRealData` now dynamic-imports `seed.json`, so the 42 KB real dataset is a separate on-demand chunk loaded only on first run (F7). Dashboard derived computations wrapped in `useMemo` keyed on data (F7). Vendor `manualChunks` split react-vendor / dexie / recharts / xlsx (F8). Result: initial `index` chunk dropped from ~298 KB (94 KB gzip) to ~9.5 KB (4 KB gzip); seed data deferred. `verify` gate green.

## Cycle 2026-07-14 — serial code-review: faults & loopholes fixed

Full serial read of every source file (types, db schema, calculations, all 7
pages, layout, lib, hooks, CSS, config) surfaced the following real defects.
All fixed and verified green via `npm run verify` (typecheck + 13 tests + build).

Correctness / crash (P0):
- `lookupGpaAndGrade` crashed (read of `undefined.gpa`) on an empty grading
  scale. Added a defensive fallback `return { gpa: 0, grade: '\u2014', remark: '' }`.
- `Dashboard` `ready` did not require `scale.length > 0`, so an emptied scale
  could crash the derived calcs. Now gated on `scale.length > 0` (matches the
  other pages, which already guard).
- `Settings` allowed persisting an **empty** grading scale (`scaleValid` was
  vacuously true for `[]`), which would soft-lock Roster/Report/Search on reload.
  `scaleValid` now requires `scale.length > 0` with a clear Bengali message.
- `xlsx` import silently **wiped all MTR records** (cleared `mtrRecords` but the
  spreadsheet carries no MTR data). `applyImport` no longer touches `mtrRecords`,
  so MTR entered in-app is preserved across spreadsheet refreshes (data-loss fix).
- `MtrTracking`: `mtrInClass` `useMemo` dependency was `[mtrAll]` while it
  filtered by `classId` — switching class could show the wrong class's records.
  Added `classId` to deps.

Robustness / data integrity (P1):
- `MtrTracking`: replaced the `useState({ current: -1 })[0]` mutation hack with
  a proper `useRef(-1)` (idiomatic, no spurious no-op re-render on every change).
- `xlsx` import hard-capped reading at 40 students/class (`r < 45`); larger
  classes were silently truncated. Now reads up to 200 rows.
- `xlsx` import fallback roll used a global `students.length + 1` counter,
  producing colliding `${classId}_N` IDs across classes. Now a per-class `maxRoll`
  (unique `max+1` fallback) prevents collisions.
- `ClassRoster` accepted marks `< 0` or `> fullMarks` (UI only flagged sub-threshold).
  `handleSave` now rejects marks outside `0..fullMarks` with a Bengali error.
- `backup.ts` `applyBackup` parsed JSON with no shape check (a malformed/old file
  could corrupt the DB or throw mid-transaction). Now validates it's an object
  with `gradingScale`/`classes`/`students` arrays before applying.

Cleanup (P2):
- Removed the **duplicate** `getActiveSubjects` in `src/db/schema.ts` (the
  canonical one in `src/lib/calculations.ts` is what every page imports) to
  eliminate drift between two copies of the active-subject rule.
- `print.css` referenced the deleted `SutonyMJ` font; swapped to `Hind Siliguri`
  (self-hosted, offline) — printed report cards now render Bengali correctly
  offline, matching the on-screen font.

No new features added; all changes are bug/loophole fixes consistent with the
established offline-first, Bengali, mobile-first design. No drift found between
PROGRESS.md claims and actual code this cycle.

## Cycle 2026-07-15 — UX/UI redesign + font replacement + code audit

- **Typography**: Replaced legacy `NikoshBan`/`SutonyMJ` fonts with **Hind Siliguri** (5 weights: 300/400/500/600/700) as primary, with Noto Sans Bengali fallback. Updated `@font-face` declarations, removed `unicode-range` to fix composite font loading, added `font-feature-settings` for Bengali ligatures.
- **Color palette**: Removed all legacy maroon color classes; aligned with Bangladeshi flag red/green (`bd-red`/`bd-green`) across all pages and components.
- **Glassmorphism**: Preserved and refined glassmorphism utility classes (`glass-card`, `glass-card-subtle`, `glass-input`) with mobile fallbacks.
- **Accessibility**: Added skip link, 44px touch targets on mobile bottom nav, `aria-label`s on 69+ unlabeled inputs/selects, `role="search"` landmark, React Router v7 future flags.
- **Font references**: Updated all pages (`Dashboard`, `ClassRoster`, `ReportCard`, `MtrTracking`, `StudentSearch`, `Import`, `Settings`, `QrIds`) and components (`Layout`, `ErrorBoundary`) with `font-heading` class.
- **print.css**: Updated font stack to Hind Siliguri; print parity tests exist in `tests/e2e/print-parity.spec.ts`.
- **Bug fixes**: 
  - Fixed WebCrypto TypeScript type errors in `encryptedBackup.ts` (`Uint8Array` → `BufferSource` casts).
  - Fixed `downloadBackup()` return type to return JSON string (required for encrypted backup flow).
  - Fixed QR code shared state bug in `QrIds.tsx` — now stores per-student QR data URLs.
  - Replaced generic `bg-red-*`/`border-red-*`/`text-red-*` with `bd-red` palette equivalents in `ClassRoster.tsx`.
- **Verification**: `npm run verify` passes (typecheck + 13 tests + build + PWA generation — 41 precache entries, ~2817 KiB).
- **CI**: Playwright E2E smoke tests and Lighthouse CI already configured in `.github/workflows/ci.yml`. Local Playwright browser install blocked by network timeout; CI bypass works via `microsoft/playwright-github-action@v1`.

Done:
- Encrypted backup export/import (`src/lib/encryptedBackup.ts`) ✅
- QR IDs feature (`src/pages/QrIds.tsx`) ✅
- Print-parity tests (`tests/e2e/print-parity.spec.ts`) ✅
- PWA icons (`public/icons/icon-192.png`, `icon-512.png`, `icon-512-maskable.png`) ✅

## Next (deferred — needs decision or larger scope)
- Repository layer extraction (F6/F8/testability): wrap Dexie in a repo module so calc/UI are easier to unit-test without IndexedDB.
- Item 11: Lighthouse PWA installability + offline run (manual verification; not code).
- Vercel deployment strategy with inbuilt database (current app is static PWA using IndexedDB/localStorage via Dexie).
