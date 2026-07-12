# Bejkhonda School Result & Tracking PWA — Project Context

## What this is
A Progressive Web App replacing an Excel-based student result-tracking system for
বেজখণ্ড সঃ প্রাঃ বিদ্যালয় (Bejkhonda Government Primary School), Kalai, Joypurhat,
Bangladesh. Used by teachers, often on budget Android phones with unreliable
internet. It MUST work fully offline after first load.

## Hard constraints
- No required backend. No auth. All data lives in the browser (IndexedDB via Dexie).
- Must be installable as a PWA and fully functional with no network connection.
- UI must support Bengali (Bangla) script correctly — bundle a Bengali-supporting
  web font (e.g. Noto Sans Bengali) so text renders offline, don't rely on a CDN font.
- Target device: low-spec Android phones and older laptops. Keep bundle size and
  re-render cost low. Avoid heavy animation, avoid large dependencies where a small
  one will do.
- Mobile-first layout: teachers will do most marks entry on a phone screen.

## Domain model (mirrors the source spreadsheet, do not invent a different shape)
- School: name, village, post office, upazila, district, grading scale table.
- Grading scale: ordered list of {minPercent, gpa, grade} rows (e.g. 80→A+/5.00,
  70→A/4.00 ... below 33 → F/0.00). Configurable, not hardcoded.
- 5 classes: প্রথম, দ্বিতীয়, তৃতীয়, চতুর্থ, পঞ্চম.
- Each class has up to 8 subject slots. A slot is "active" for that class only if
  it has a non-zero full-marks value (e.g. প্রথম/দ্বিতীয় use 3 subjects, তৃতীয়–পঞ্চম
  use 6). This must be configurable per class, not hardcoded to 3 or 6.
- Student: roll (unique within class), name, guardian name, village, per-subject
  marks, attendance %.
- Computed per student (never store these, always derive): total marks, average %,
  GPA (via grading scale lookup), letter grade, result status (Pass / Fail /
  Incomplete — Incomplete if any active subject's mark is missing, not zero),
  auto-remark (text banding based on average %), merit rank (within class, by total).
- MTR (Mid-Term Review) competency record per student: বাংলা সাবলীল পঠন (bool),
  গণিত চার নিয়ম দক্ষতা (bool), English সাবলীল পঠন (bool). Each is tri-state:
  not yet assessed / yes / no — do not default an unassessed skill to false.

## Known correctness traps (real bugs already found and fixed in the spreadsheet
## version of this system — do not reintroduce them)
1. Blank vs zero: an empty mark or unassessed MTR skill is NOT the same as 0.
   A student with a missing mark is "Incomplete", not "Fail". Never let a blank
   field silently compute as 0 in an average or a pass/fail decision.
2. Result / grade logic must key off the grading-scale table (single source of
   truth), never a second hardcoded copy of the thresholds anywhere else in the UI.
3. Whatever renders on screen must be the same thing that prints/exports as PDF —
   test the actual print/export output visually, not just the on-screen state.

## Code conventions
- TypeScript strict mode.
- Functional React components, hooks, no class components.
- Co-locate types in src/types/, DB schema in src/db/, calculation logic in
  src/lib/calculations.ts as pure, unit-testable functions (no React, no DB
  calls inside these — they take data in, return computed results out).
- Bengali UI labels stay in Bengali (this app is for Bengali-speaking teachers).
  Code (variable/function names, comments) stays in English.
