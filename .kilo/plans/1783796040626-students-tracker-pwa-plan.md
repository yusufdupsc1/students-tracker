# Plan: Convert `Result_Card_Bejkhonda_v3_3_FINAL.xlsx` → PWA (students-tracker)

> Source of truth: `/home/neo/Music/students-tracker/Result_Card_Bejkhonda_v3_3_FINAL.xlsx`
> (1.7 MB, 58 sheets). Inspected directly via stdlib `zipfile`/`ElementTree`. All facts below are verified against the file, not assumed.

## 0. Decisions (confirmed with user)
- **Stack:** React + Vite (not vanilla). Keep PWA offline ethos: Service Worker + manifest + IndexedDB.
- **v1 scope:** Core MVP **+ MTR module + Student QR ID module**.
- **Result card:** Full-faithful to the sheet's `Card *` layout.

## 1. Verified spreadsheet model

### 1.1 Sheets (58 total) — what to import
Functional visible sheets:
- Class data entry (one each): `প্রথম`, `দ্বিতীয়`, `তৃতীয়`, `চতুর্থ`, `পঞ্চম` → maps to classes 1–5.
- `Settings` — authoritative config (school info, **editable grade scale**, per-class subject full marks, print toggles).
- `Card প্রথম`…`Card পঞ্চম` — printable card templates (layout reference only; re-implemented in React, not imported).
- `MTR প্রথম`…`MTR পঞ্চম` + `MTR Summary` — skill-proficiency tracker (teacher-entered, currently all "মূল্যায়ন অসম্পূর্ণ").
- `Student QR ID` — roll/name/result/GPA per class (re-derived in app; QR generated client-side).
- `Dashboard`, `Student Search`, `Report Card Hub`, `How to Use`, `সূচিপত্র`, `TEACHER INSTRUCTIONS`, `Executive Summary`, `Card Template`, `ULTIMATE QA…`, `Advanced Features`, etc.
- **Skip all `state="hidden"` sheets** (Royal Theme QC, *Audit, FINAL QC, Senior Engineer QA, etc.) and all QA/audit/template sheets. Import ONLY: 5 class data sheets + the `Settings` sheet (for seed config). MTR/QR are read for reference; their data is teacher-entered in-app.

### 1.2 Two class schemas (verified)
| Class | Subjects | Full marks/subject |
|---|---|---|
| 1, 2 (`প্রথম`,`দ্বিতীয়`) | বাংলা, English, গণিত | 50 |
| 3, 4, 5 (`তৃতীয়`,`চতুর্থ`,`পঞ্চম`) | বাংলা, English, গণিত, প্রাথমিক বিজ্ঞান, বাংলাদেশ ও বিশ্বপরিচয়, ধর্ম | 70 |

- Subject full marks read from `Settings` sheet rows 27–31 (class → subject → full mark). Treat as single source; per-class subject set is derived from non-empty full-mark cells.

### 1.3 Class data-sheet layout (identical column positions across all 5 sheets)
- Rows 1–2: title (school name + exam/term/class line). Row 1 = school name `বেজখন্ড সঃ প্রাঃ বিদ্যালয়`.
- Row 4: `পূর্ণমান` (full marks) — numeric full marks live in subject columns (classes 1–2: G,H,I; classes 3–5: G..L). Other cells blank.
- Row 5: header labels.
- Rows 6–45: up to 40 student slots (pre-allocated). **Blank rows are interspersed between records** (e.g., `তৃতীয়` has a blank row 11 then more students). → Parser MUST scan 6..45 and collect rows where the name cell (D) is non-empty; do NOT stop at first blank.
- Fixed meta columns: `A`=# (group/serial), `B`=রোল (roll), `C`=মেধা (merit rank), `D`=শিক্ষার্থীর নাম (name), `E`=অভিভাবক (guardian), `F`=গ্রাম (village).
- Subject columns: G onward (3 or 6), names from row 5 at those columns.
- Computed columns (same positions all classes): `O`=মোট (total), `P`=গড় % (avg %), `Q`=GPA, `R`=গ্রেড (grade), `S`=ফলাফল (result), `T`=উপস্থিতি % (attendance), `U`=Auto Remark, `V`=QC Flag.

### 1.4 Three record states (verified)
- **Complete:** all subject marks present → compute total/avg/grade/GPA/result.
- **Incomplete:** some (not all) subject marks present → total/avg computed, but `গ্রেড`/`GPA` blank, result = `Incomplete`, remark = `Marks incomplete`, QC = `Missing marks`. (avg denominator = SUM of ALL subject full marks, e.g. সিয়াম: 5/150 = 3.33%.)
- **No marks:** no subject marks at all → result/QC = `No marks`, everything else blank.

### 1.5 Grading / pass logic — CORRECTED (source = `Settings` sheet rows 16–22)
Grade scale is **VLOOKUP(TRUE) ascending**, min-percentage driven. Re-implement, do NOT read xlsx formulas:

| Min % | Grade | GPA | Status | Remark (Bangla) |
|---|---|---|---|---|
| 0 | F | 0 | Fail | উন্নতির জন্য বিশেষ যত্ন প্রয়োজন |
| 33 | D | 1 | Pass | আরও অনুশীলন প্রয়োজন |
| 40 | C | 2 | Pass | সন্তোষজনক |
| 50 | B | 3 | Pass | ভালো |
| 60 | A- | 3.5 | Pass | খুব ভালো |
| 70 | A | 4 | Pass | চমৎকার |
| 80 | A+ | 5 | Pass | অসাধারণ |

- `avg%` = Σobtained / Σ(full marks of ALL subjects) × 100 (full denominator even when incomplete).
- **Pass rule is SUBJECT-WISE, not avg-based** (the handover's "avg ≥ 33%" note is WRONG): a student FAILS if ANY subject's obtained < 33% of that subject's full marks. On failure, overall grade is forced to `F` (GPA 0), result = `Failed`. Verified: আছিয়া (তৃতীয়) avg 34.05% but ধর্ম 17/70 → fails → shows F/Fail; ইয়াসিন (দ্বিতীয়) avg 44% but বাংলা 12/50 → fails → F/Fail.
- Per-subject: also compute subject % and grade (same scale) → used in the card.
- This scale is **editable** in Settings; `calc.js` must read the scale from stored settings, not hardcode.

### 1.6 Settings sheet = seed config (rows verified)
- School: name `বেজখন্ড সঃ প্রাঃ বিদ্যালয়`, exam `প্রথম প্রান্তিক মূল্যায়ন`, year `২০২৬`, card title `Progress Report / ফলাফল কার্ড`, address, head/class teacher signature labels, publication date (serial `46362`).
- Grade scale rows 16–22 (above).
- Subject full marks rows 27–31 (above).
- Print toggles (rows 36–40): Show Guardian, Show Village, Show Attendance, Show Merit Position, Show GPA — all `Yes`.

### 1.7 Printable Card layout (`Card প্রথম`, sheet26 — full-faithful target)
Header (school name, address, `ACADEMIC RECORD`, exam/session/class line) → student info block (name, roll, merit rank, guardian, village, attendance%) → **Scholastic Area** table with per-subject rows: Subjects | Full | Obtained | % | GPA | Grade | Status | Remark → Overall Marks / Percentage / Grade / "Promoted" → Performance Meter (bar) + Overall GPA → **Co-scholastic Area** (Activity, Work Education, Art Education, Health & Sports + discipline traits: Regularity & Punctuality, Sincerity, Behaviour & Values, Respectfulness — all default `Good`) → Grading Scale legend → signature lines (Class Teacher / Principal / Guardian). Co-scholastic values are teacher-editable placeholders (default `Good`).

### 1.8 MTR module (Mid Term Review — skill tracker)
- Per class: students × skill columns (বাংলা সাবলীল পঠন, গণিত চার নিয়ম দক্ষতা, English সাবলীল পঠন) each rated `সক্ষম` (capable) / `অক্ষম` (incapable), plus auto comment.
- `MTR Summary`: per-class totals, capable/incapable counts and % per skill, school total (106). Currently all zeros (unfilled).
- In-app: teacher-entered data (separate Dexie table), summary view computed live.

### 1.9 Student QR ID module
- Per class: roll, name, result (Passed/Fail), GPA. QR encodes an offline-scannable payload (school/class/roll/name/result) — generated client-side with a QR lib, shown/printable as ID badges.

## 2. Project structure (React + Vite, repo root)
```
package.json, vite.config.js, index.html, .gitignore
public/
  manifest.webmanifest
  icons/ (192, 512, maskable png — generate placeholders)
  fonts/NotoSansBengali-{Regular,Medium,Bold}.woff2   # BUNDLED locally (offline rule)
scripts/
  seed-from-xlsx.mjs        # Node + SheetJS -> src/data/seed.json
src/
  main.jsx, App.jsx
  db/db.js                  # Dexie schema + seed loader
  lib/
    gradeScale.js           # default scale + per-class subject full marks (from Settings)
    calc.js                 # SINGLE SOURCE OF TRUTH: grade/gpa/result/remark/per-subject
    importXlsx.js           # SheetJS parse xlsx -> normalized {school, classes, students, mtr}
    qr.js                   # QR generation wrapper
  context/StoreContext.jsx  # settings + classes provider
  components/ Layout.jsx, Nav.jsx
  screens/
    Dashboard.jsx           # KPIs per class (enrolled, passed, failed, avg)
    Students.jsx + StudentForm.jsx   # list + add/edit/delete per class
    ResultCard.jsx          # full-faithful A4 printable card
    Search.jsx              # roll/name lookup across classes
    MTR.jsx                 # skill tracker (per class) + summary
    QrIds.jsx               # QR ID badges per class, printable
    Settings.jsx            # school/exam info, grade scale, subject full marks, toggles
    ImportExport.jsx        # xlsx import + JSON/xlsx export
  data/seed.json            # committed once (generated by scripts/seed-from-xlsx.mjs)
  styles/ (global.css, print.css with A4 @media print)
```

## 3. Dependencies
- `react`, `react-dom`, `react-router-dom`
- `vite`, `@vitejs/plugin-react`
- `dexie` (+ `dexie-react-hooks`) — IndexedDB
- `xlsx` (SheetJS) — runtime xlsx import + seed script
- `qrcode` — QR generation
- `vite-plugin-pwa` — manifest + service worker (Workbox precache) for offline/installable
- `vitest` — unit tests for `calc.js`
- Bundle **Noto Sans Bengali** woff2 in `public/fonts/` (do NOT use CDN font loading — offline rule).

## 4. Implementation tasks (ordered)
1. **Scaffold** Vite React app in repo root; add `.gitignore` (`node_modules`, `dist`, `*.log`); init git (repo currently empty, xlsx untracked — keep xlsx in root).
2. **`lib/gradeScale.js`** — default grade scale array + per-class subject→fullMark map (from §1.5/§1.2).
3. **`lib/calc.js`** — `gradeFromPct`, `subjectPass`, `computeStudent(student, scale, fullMarks)` returning `{totalObtained,totalFull,avgPct,perSubject,overallGrade,overallGpa,result,remark}`. Handle complete/Incomplete/No-marks. Single source of truth.
4. **`scripts/seed-from-xlsx.mjs`** — SheetJS read xlsx; import only 5 class sheets + Settings (skip hidden/QA). Normalize students (scan rows 6–45, skip blank-name rows). Emit `src/data/seed.json` = `{ school:{...settings}, students:[...], classes:[1..5] }`. MTR/QR left empty for teacher entry.
5. **`db/db.js`** — Dexie: `settings` (id `school`), `students` (classId, roll, merit, name, guardian, village, attendancePct, subjects[]), `mtr` (classId, entries[]), `meta`. Seed from `seed.json` on first run.
6. **`lib/importXlsx.js`** — reuse parser for runtime "Import xlsx" in UI; merges into Dexie.
7. **Screens:** Dashboard, Students+Form (CRUD with live recompute), Search, ResultCard (full-faithful + print.css A4), MTR (tracker + summary), QrIds (badges), Settings (edit scale/full marks/toggles/school), ImportExport.
8. **PWA:** `vite-plugin-pwa` manifest + SW precache all static assets; verify offline after first load. Bangla font bundled.
9. **Tests:** `vitest` fixture for মেঘনা → total 148, avg 98.67, GPA 5, A+, Passed, att 96, remark অসাধারণ; plus subject-wise fail case (আছিয়া) and incomplete case (সিয়াম).

## 5. Validation
1. `npm run dev`; open app. IndexedDB seeded: classes 1–5 with 35/22/20/17/12 students (total 106).
2. Class 1 shows মেঘনা (roll 1). Assert computed values match §1.5 fixture exactly.
3. Edit a mark → recompute live (total/avg/grade/result/remark).
4. Subject-wise fail: set one subject <33% → result becomes Failed, grade F, GPA 0.
5. Incomplete: clear one subject → result Incomplete, avg over full denominator, no grade.
6. Open Result Card → print preview matches A4 (header, per-subject rows, totals, co-scholastic, scale legend, signatures).
7. MTR: rate a student সক্ষম/অক্ষম → summary % updates.
8. QR IDs: generate badges per class; scan shows payload.
9. Install PWA; reload offline → app + data work (SW + IndexedDB).
10. Search by roll/name returns correct student.
11. `npm run build` + `npm run preview`; re-verify offline.

## 6. Risks / notes
- **Bangla rendering:** bundle Noto Sans Bengali locally (offline rule) — no CDN.
- **Card fidelity:** aim for faithful structure, not 1:1 pixel match.
- **Editable scale:** calc must read scale from Dexie settings, never hardcode (Settings can change boundaries/remarks).
- **Enrollment gaps:** class sheets have blank rows between records — scan whole region, skip blanks.
- **xlsx is import-only:** never a runtime dependency; IndexedDB is the system of record after first seed.
- **Images:** 106 PNGs in `xl/media` are logos/icons; not needed for PWA. Use generated placeholder PWA icons.
