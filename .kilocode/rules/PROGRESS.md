This is one cycle of a standing review → fix → improve loop on this codebase.
This exact prompt will be run again after this cycle — leave the project in a
state where the next run can pick up cleanly.

## Step 0 — Bootstrap context (first run only)

If .kilocode/rules/project-context.md does not exist, create the
.kilocode/rules/ folder and that file with this exact content, then continue
to Step 1 in the same session:

---BEGIN project-context.md---

# Bejkhonda School Result & Tracking PWA — Project Context

## What this is

A Progressive Web App replacing an Excel-based student result-tracking system
for বেজখণ্ড সঃ প্রাঃ বিদ্যালয় (Bejkhonda Government Primary School), Kalai,
Joypurhat, Bangladesh. Used by teachers, often on budget Android phones with
unreliable internet. It MUST work fully offline after first load.

## Hard constraints

- No required backend. No auth. All data lives in the browser (IndexedDB via
  Dexie). No network calls anywhere in the app, ever.
- Must be installable as a PWA and fully functional with no network connection.
- Bengali script must render correctly offline — self-host a Bengali-supporting
  font (e.g. Noto Sans Bengali), never link a CDN font.
- Target device: low-spec Android phones and older laptops. Keep bundle size
  and re-render cost low.
- Mobile-first layout: teachers do most marks entry on a phone screen.
- Student data (names, marks, MTR records) is data about children: no
  analytics, no error-reporting SDKs, no third-party scripts, nothing leaves
  the device, ever.

## Domain model

- School: name, village, post office, upazila, district, grading scale table.
- Grading scale: ordered {minPercent, gpa, grade} rows, configurable in
  Settings — the ONE source of truth, never duplicated as a hardcoded
  threshold anywhere else.
- 5 classes: প্রথম, দ্বিতীয়, তৃতীয়, চতুর্থ, পঞ্চম. Each has up to 8 subject
  slots; a slot is active only if its full-marks value is non-zero, and this
  varies per class (e.g. প্রথম/দ্বিতীয় use 3 slots, তৃতীয়–পঞ্চম use 6) —
  configurable, not hardcoded to any specific count.
- Student: roll (unique within class), name, guardian, village, per-subject
  marks, attendance %.
- Computed, never stored: total, average %, GPA (via grading-scale lookup),
  grade, result (Pass / Fail / Incomplete — Incomplete if any active subject's
  mark is missing, not zero), auto-remark, merit rank within class.
- MTR competency record per student: বাংলা সাবলীল পঠন, গণিত চার নিয়ম দক্ষতা,
  English সাবলীল পঠন — each tri-state (not yet assessed / yes / no). Never
  default an unassessed skill to false.

## Known correctness traps (real bugs already found in the spreadsheet version

## of this system — do not reintroduce them)

1. Blank is not zero. A missing mark or unassessed MTR skill must never
   silently compute as 0 in an average, a pass/fail decision, or a percentage.
2. Grade/result logic must always key off the grading-scale table. A second
   hardcoded copy of a threshold anywhere is a bug waiting to drift.
3. What renders on screen must be what prints/exports. Verify the actual
   printed/exported output, not just the on-screen state — these are
   different guarantees and have diverged before.

## Code conventions

- TypeScript strict mode. Functional React components/hooks only.
- src/types/ for interfaces, src/db/ for the Dexie schema, src/lib/
  calculations.ts for pure calculation functions (no React, no DB calls
  inside them — data in, computed results out, unit-testable).
- Bengali UI labels stay in Bengali. Code identifiers and comments stay in
  English.
  ---END project-context.md---

Also create PROGRESS.md at the repo root if it doesn't exist, seeded with the
Feature Roadmap checklist from Step 3 below, all items unchecked.

Read project-context.md now (whether just created or pre-existing) before
doing anything else.

## Step 1 — Establish ground truth

Read PROGRESS.md. Do not trust it. Independently verify:

- Run the build and typecheck. Do they actually pass right now?
- Does `npm run dev` start with zero console errors?
- For every item PROGRESS.md marks done, spot-check the actual code — does
  the feature genuinely work, or is it a stub/partial/TODO?
  If you find drift between what's claimed and what's real, correct
  PROGRESS.md and treat the affected item as NOT done before proceeding.
  State explicitly in your final report whether drift was found this cycle.

## Step 2 — Run the standing quality checklist

Check current app state against every item below. Record pass/fail for each
in PROGRESS.md.

Correctness:

- [ ] Partial marks entry (some subjects filled, some blank) shows
      "Incomplete," never a Pass/Fail computed with blank-as-zero.
- [ ] An unassessed MTR skill is visually distinct from an explicit "no."
- [ ] Grep confirms no hardcoded grade/GPA threshold exists outside the
      Settings grading-scale table.
- [ ] Duplicate roll number within a class is blocked with a clear inline
      error, never a silent overwrite.
- [ ] Report Card and MTR submission view: actually print to PDF and open
      the result. Confirm it matches the on-screen state, nothing cut off.

Offline / PWA:

- [ ] Full reload with DevTools set to Offline works, including fonts.
- [ ] Lighthouse PWA installability + offline checks pass.

Privacy:

- [ ] Grep for fetch/axios/XHR/WebSocket anywhere in the codebase — should
      find nothing. Flag loudly if you find an exception, don't leave it in.
- [ ] No analytics, error-reporting, or third-party scripts present.

UX / device fit:

- [ ] Class Roster usable at 375px width, no horizontal scroll to see a
      student's result summary.
- [ ] Every screen has a real empty state (zero students/records) — no
      NaN/undefined rendered anywhere.

Code health:

- [ ] Zero TypeScript errors, zero ESLint errors.
- [ ] No dead code, unused imports, or commented-out blocks from prior cycles.

## Step 3 — Decide this cycle's work

Priority order — pick ONE:

1. Any failing correctness checklist item.
2. Any failing offline/PWA or privacy checklist item.
3. The next not-yet-built item from this Feature Roadmap:
   1. Project scaffold (Vite+React+TS+Tailwind+PWA plugin, routing, font)
   2. Data layer (Dexie schema, types, pure calculation functions)
   3. Settings (school info, grading scale editor, per-class subjects)
   4. Class Roster (marks entry, live-computed results, 33% highlight)
   5. Dashboard (KPI cards, per-class table, comparison chart)
   6. Report Card (view + print/PDF, batch print per class)
   7. MTR Tracking (tri-state entry, class rollup, official submission view)
   8. Student Search (combined academic + MTR profile, cross-class)
   9. QR verification IDs (per-student QR + printable class sheet)
   10. Import from existing .xlsx (SheetJS, sheet-to-class mapping, preview
       before commit) + JSON export for backup
   11. PWA hardening (real icons, install prompt, Lighthouse fixes)
4. Any failing UX/code-health item.
5. If everything above passes and the roadmap is complete: the single
   highest-value improvement you can identify. If you genuinely can't find
   one, say so plainly rather than manufacturing busywork.

If the item you'd do next requires a decision only I can make (a visual
design choice, a tradeoff with no clearly correct answer, anything affecting
what data the app touches) — stop here, ask me, and do not guess.

## Step 4 — Execute

Implement only the one item chosen. Do not opportunistically refactor
unrelated code this cycle, even if you spot something else worth fixing —
note it in PROGRESS.md as a future item instead.

## Step 5 — Verify

Re-run build + typecheck. Re-check the checklist item(s) related to what you
changed. If the change touched shared code (calculations.ts, the Dexie
schema, or routing), re-run the full Step 2 checklist, not just the one item.

## Step 6 — Record and stop

Update PROGRESS.md: state at start of cycle, what you found, what you
changed, what's still open, recommended priority for next cycle. Commit with
a message describing the actual change. Then stop — report a short summary
to me: what you did, what you found (fixed or not), anything drift-corrected
in Step 1, and anything that needs my decision. Do not start a second cycle
automatically.
