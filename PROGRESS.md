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
- [ ] 10. Import-from-xlsx wiring (`importXlsx.js` exists but is dead/unwired)
- [ ] 11. Lighthouse PWA + offline verification
- [ ] 12. Dead-code cleanup: remove unwired JS prototype (`src/screens/`, `src/context/`, `src/db/db.js`, `src/lib/{calc,gradeScale,importXlsx,qr}.js`, `src/components/Layout.jsx`, `src/styles/*`)

## Drift note
Commit `9a7bbc2` claimed student-management features done, but `ClassRoster.tsx`
and `StudentSearch.tsx` were placeholders. Item 4 (Class Roster) implemented
2026-07-13; item 8 still pending.
