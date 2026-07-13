# Cycle 1 Plan — Build the Class Roster (roadmap item 4)

> Standing review → fix → improve loop. State verified by read-only inspection of
> `/home/neo/Music/students-tracker` on 2026-07-13. Plan-mode only: no files were
> created or mutated; build/typecheck/dev were NOT run (they run in the execution
> cycle). After `plan_exit`, choose "implement" to execute.

## State at start of cycle (ground truth)
- `.kilocode/rules/project-context.md` exists and matches the required content. ✅
- Root `PROGRESS.md` does **not** exist; only `.kilo/PROGRESS.md` (which is just a
  copy of this loop prompt). Step 0 residual below.
- Commit `9a7bbc2 "feat: add student management features…"` claims done work, but
  `src/pages/ClassRoster.tsx` and `src/pages/StudentSearch.tsx` are **placeholders**.
  This is drift — treat items 4 and 8 as NOT done.
- Active TS app is otherwise real and correct: `Dashboard`, `Settings`,
  `ReportCard`, `MtrTracking` work; `calculations.ts` is the single source of truth
  (blank≠zero, `Incomplete`, `passThreshold` derived from scale — only `33` fallback
  in `calculations.ts:64` and seed data, both acceptable).
- A parallel, **unwired** JS prototype exists (`src/screens/*.jsx`,
  `src/context/StoreContext.jsx`, `src/db/db.js`, `src/lib/{calc,gradeScale,importXlsx,qr}.js`,
  `src/components/Layout.jsx`, `src/styles/*`). It is dead/duplicate code. The only
  tests (`calc.test.js`) cover the dead `calc.js`, not `calculations.ts`.

## Step 0 residual (do first, low risk)
- Create root `PROGRESS.md` seeded with the Feature Roadmap checklist (all items
  unchecked except 1–3 and 5–7, which are genuinely built). Record this drift note.

## Chosen item: implement Class Roster (`src/pages/ClassRoster.tsx`)
This is both the next unbuilt roadmap item AND the gate for every marks-entry
correctness check (items 1, 4 in Step 2 cannot be exercised until marks can be
entered). Build it on the EXISTING TS stack — do NOT wire or port the dead `.jsx`.

### Requirements (tied to correctness traps + UX)
1. **Class selector**: tabs for প্রথম/দ্বিতীয়/তৃতীয়/চতুর্থ/পঞ্চম (reuse the
   `CLASS_LIST`/`CLASS_NAMES` pattern from `ReportCard.tsx`/`MtrTracking.tsx`).
2. **Student rows** via `useLiveQuery` on `db.students` filtered by `classId`,
   sorted by `roll`. Live-compute each row with `calculations.ts`
   (`calculateTotal`, `calculateAverage`, `lookupGpaAndGrade`, `calculateResult`,
   `calculateMeritRank`). Show: roll, name, merit rank, per-subject marks, total,
   avg %, GPA, grade, result badge. Never store computed values.
3. **Blank ≠ zero**: subjects with no mark render `—`; row badge shows
   `Incomplete` (never `Pass`/`Fail`). Reuse `calculations.ts` so this is guaranteed.
4. **33% highlight**: any active subject whose obtained% < `passThreshold(scale)`
   is highlighted (red). `Incomplete` rows visually distinct from `Pass`/`Fail`.
5. **Add / edit / delete**: a form (modal or inline) for name, roll, guardian,
   village, attendance %, and per-active-subject mark (number input; empty = null).
   Subjects come from the class config (`getActiveSubjects`), so per-class counts
   (3 vs 6) work automatically.
6. **Duplicate roll**: insert via `db.students.put`/add inside a transaction;
   the schema already enforces `&[classId+roll]`. **Catch** the resulting error and
   show a clear inline message (e.g. `রোল <n> ইতিমধ্যে ব্যবহৃত`) — never silent overwrite.
7. **Mobile-first (≤375px)**: no horizontal scroll to read a student's result
   summary. Desktop = table; ≤~640px = stacked per-student cards (name/roll/result
   summary on top, subjects below). Reuse Layout's mobile bottom-nav context.
8. **Empty state**: when a class has zero students, show a Bengali empty-state
   prompt (no `NaN`/`undefined`/`—` overflow).
9. **No network**: no `fetch`/CDN; all data from Dexie. (Already true.)

### Files touched (this cycle only)
- `src/pages/ClassRoster.tsx` — implement (replace placeholder).
- `src/db/schema.ts` — only if a helper is needed (likely none; use existing).
- `PROGRESS.md` — Step 0 seed + mark item 4 done after verification.

### Explicitly NOT this cycle (note as future items, do not refactor now)
- Student Search (item 8) — still a placeholder; separate cycle.
- Dead-code cleanup: delete `src/screens/`, `src/context/`, `src/db/db.js`,
  `src/lib/{calc,gradeScale,importXlsx,qr}.js`, `src/components/Layout.jsx`,
  `src/styles/*`, and `calc.test.js` (dead). Code-health item — next cycle after roster.
- Unit tests for `src/lib/calculations.ts` (currently untested; dead `calc.test.js`
  covers the wrong file). Trap #1 deserves coverage.
- Import-from-xlsx wiring (item 10) — `importXlsx.js` exists but is dead/unwired.
- Lighthouse PWA + offline verification (item 11) — structurally present, unverified.

## Validation (execution cycle)
- `npm run typecheck` and `npm run build` pass (zero TS errors).
- `npm run dev`, open app → শ্রেণি তালিকা:
  - Add a student with SOME subjects blank → row shows `Incomplete`, blank subjects
    render `—`, avg computed over all active full-marks (e.g. 50/150 = 33.33%, not
    50/50). Confirms trap #1.
  - Add two students with the same roll in one class → clear inline duplicate error,
    no overwrite. Confirms checklist item 4.
  - A subject below 33% highlighted; result badge correct.
  - At 375px width: per-student cards, no horizontal scroll to see result summary.
  - Delete → row removed.
- Re-run the full Step 2 checklist (roster touched `calculations.ts`? No — it only
  *consumes* it; but it touches routing/screens, so re-verify items 1 & 4 plus UX
  375px and empty-state).
- Print parity: not gated on roster, but confirm roster view has no cut-off content
  (trap #3) if printed.

## Open question (not blocking this cycle)
**Result semantics**: `calculateResult` uses *per-subject* pass (every active
subject ≥ threshold ⇒ Pass). `project-context.md`/spreadsheet policy says
"Pass if ≥33%", which can read as *overall average* ≥33%. These differ for a student
who averages ≥33% but fails one subject. The current code is internally consistent
and sourced from the scale, so the roster (which only displays the result) needs no
decision now. Flag for a future cycle: confirm per-subject vs average-based pass.

## Commit
After verification: commit `feat: implement Class Roster with live results, 33%
highlight, duplicate-roll guard, and mobile cards` and update `PROGRESS.md`.
