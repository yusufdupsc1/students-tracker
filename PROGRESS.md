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

## Next (P1 — explicitly out of scope this batch)
- Route-level ErrorBoundary (F3).
- Repository layer extraction (F6/F8/testability).
- Lazy seed import + memoized dashboards + manualChunks (F7/F8).
- Repository/print-parity tests (F11); result-policy strategy; encrypted backup; QR TS port.
