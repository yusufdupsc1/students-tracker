# API Documentation

## Overview

This document describes the data formats and APIs used in Bejkhonda School Tracker for importing, exporting, and backing up data.

## Table of Contents

- [Import Formats](#import-formats)
  - [Excel Spreadsheet (.xlsx)](#excel-spreadsheet-xlsx)
  - [JSON Backup (.json)](#json-backup-json)
- [Export Formats](#export-formats)
  - [JSON Backup](#json-backup)
- [Internal APIs](#internal-apis)
  - [Database Schema](#database-schema)
  - [Calculation Functions](#calculation-functions)

---

## Import Formats

### Excel Spreadsheet (.xlsx)

The app accepts `.xlsx` files with the following sheet structure:

#### Required Sheets

| Sheet Name | Purpose | Columns |
|------------|---------|---------|
| `Settings` | School info and grading scale | A: School Name, B: Village, C: Post Office, D: Upazila, E: District, F: Min%, G: GPA, H: Grade, I: Remark |
| `প্রথম` | Class 1 students | A: Roll, B: (unused), C: Name, D: Guardian, E: Village, F: (unused), G-V: Marks, W: Attendance |
| `দ্বিতীয়` | Class 2 students | Same as above |
| `তৃতীয়` | Class 3 students | Same as above |
| `চতুর্থ` | Class 4 students | Same as above |
| `পঞ্চম` | Class 5 students | Same as above |

#### Settings Sheet Format

```
Row 1: School Name | Village | Post Office | Upazila | District | Min% | GPA | Grade | Remark
Row 2+: Grading scale rows (e.g., 80 | 5.00 | A+ | Excellent)
```

#### Student Sheet Format

```
Row 1: Headers
Row 2+: Student data
  - Column A: Roll number
  - Column C: Student name
  - Column D: Guardian name
  - Column E: Village
  - Columns G onwards: Subject marks
  - Column W: Attendance percentage
```

#### Import Behavior

- **Replace semantics:** Import replaces all existing data (school, scale, classes, students)
- **MTR preservation:** Existing MTR records are NOT deleted (spreadsheet has no MTR data)
- **Validation:** Duplicate rolls within a class are rejected with an error
- **Preview:** Users see a summary before committing the import

### JSON Backup (.json)

Full database export/import in JSON format.

#### Backup Format

```json
{
  "school": {
    "id": "school",
    "name": "বেজখণ্ড সঃ প্রাঃ বিদ্যালয়",
    "village": "Bejkhonda",
    "postOffice": "...",
    "upazila": "...",
    "district": "..."
  },
  "gradingScale": [
    {
      "minPercent": 80,
      "gpa": 5.0,
      "grade": "A+",
      "remark": "Excellent"
    }
  ],
  "classes": [
    {
      "id": 1,
      "name": "প্রথম",
      "subjects": [
        { "id": "s1", "name": "বাংলা", "fullMarks": 100 },
        { "id": "s2", "name": "English", "fullMarks": 100 },
        { "id": "s3", "name": "গণিত", "fullMarks": 100 }
      ]
    }
  ],
  "students": [
    {
      "id": "1_1",
      "classId": 1,
      "roll": 1,
      "name": "Student Name",
      "guardian": "Parent Name",
      "village": "Village",
      "attendance": 85,
      "marks": {
        "বাংলা": 85,
        "English": 90,
        "গণিত": 78
      }
    }
  ]
}
```

#### Import Behavior

- **Validation:** File must be valid JSON with required arrays (`gradingScale`, `classes`, `students`)
- **Replace semantics:** Replaces all domain tables
- **Error handling:** Malformed files show a clear Bengali error message

---

## Export Formats

### JSON Backup

Export the complete database state for backup or migration.

**Export path:** `src/lib/backup.ts` → `downloadBackup()`

**File naming:** `bejkhonda-backup-YYYY-MM-DD.json`

---

## Internal APIs

### Database Schema

```typescript
// src/db/schema.ts

interface School {
  id: string              // Always 'school'
  name: string            // School name
  village: string
  postOffice: string
  upazila: string
  district: string
}

interface GradingScaleRow {
  minPercent: number      // Minimum percentage for this grade
  gpa: number            // Grade point average
  grade: string          // Grade label (e.g., 'A+')
  remark: string         // Descriptive remark
}

interface ClassConfig {
  id: number             // 1-5
  name: string           // Bengali class name
  subjects: Subject[]
}

interface Subject {
  id: string
  name: string
  fullMarks: number
}

interface Student {
  id: string             // `${classId}_${roll}`
  classId: number        // 1-5
  roll: number           // Unique within class
  name: string
  guardian?: string
  village?: string
  attendance?: number    // Percentage 0-100
  marks: Record<string, number | null>  // subjectName -> mark
}

interface MTRRecord {
  studentId: string
  term: string
  banglaReading: MTRSkillStatus
  mathFourRules: MTRSkillStatus
  englishReading: MTRSkillStatus
}

type MTRSkillStatus = 'yes' | 'no' | 'incomplete'

interface Snapshot {
  id?: number
  createdAt: string      // ISO timestamp
  reason: string         // Bengali label
  json: string           // Serialized Backup
}
```

### Calculation Functions

```typescript
// src/lib/calculations.ts

function calculateTotal(student: Student, classConfig: ClassConfig): number
// Sums all marks for active subjects (fullMarks > 0)

function calculateAverage(student: Student, classConfig: ClassConfig): number
// Returns percentage average across active subjects

function lookupGpaAndGrade(average: number, scale: GradingScaleRow[]): { gpa: number, grade: string, remark: string }
// Finds the highest matching grade boundary
// Returns safe fallback if scale is empty

function calculateResult(student: Student, classConfig: ClassConfig, scale: GradingScaleRow[]): 'Pass' | 'Fail' | 'Incomplete'
// Determines pass/fail based on average vs threshold

function passThreshold(scale: GradingScaleRow[]): number
// Returns the lowest minPercent in the scale (default 33 if empty)

function calculateMeritRank(students: Student[], classConfig: ClassConfig): Record<string, number>
// Returns { studentId: rank } sorted by total descending
// Handles ties with fractional ranking

function getActiveSubjects(classConfig: ClassConfig): Subject[]
// Filters subjects where fullMarks > 0
```

### Import/Export APIs

```typescript
// src/lib/importXlsx.ts

async function importXlsxFile(file: File): Promise<ImportResult>
// Parses .xlsx file and returns structured data
// Throws on malformed files

interface ImportResult {
  school: School
  gradingScale: GradingScaleRow[]
  classes: ClassConfig[]
  students: Student[]
  issues: string[]
}

// src/lib/backup.ts

async function downloadBackup(): Promise<void>
// Exports current DB state as JSON download

async function applyBackup(json: string): Promise<void>
// Imports JSON backup, replacing all data
// Validates structure before applying
```

---

## Data Validation Rules

| Rule | Implementation |
|------|---------------|
| Roll must be unique within class | `&[classId+roll]` compound index |
| Marks must be 0..fullMarks | Validated on save in ClassRoster |
| Grading scale min% must be 0..100 | Validated in Settings |
| At least one grading scale row required | `scaleValid` check in Settings |
| Attendance must be 0..100 | Number input validation |
| School name required | `trim() !== ''` check in Settings |

---

## Error Handling

| Error | User Message (Bengali) |
|-------|------------------------|
| Empty file | "ফাইলটি খালি।" |
| Invalid JSON | "ব্যাকআপ ফাইল সঠিক JSON নয়" |
| Malformed backup | "ব্যাকআপ ফাইলের গঠন সঠিক নয়" |
| No students in sheet | "কোনো শিক্ষার্থী পাওয়া যায়নি। শিটের বিন্যাস যাচাই করুন।" |
| File too large | "ফাইলটি অনেক বড় (১০ MB-এর বেশি)।" |
| Wrong file type | "দয়া করে একটি বৈধ .xlsx বা .xls ফাইল নির্বাচন করুন।" |
