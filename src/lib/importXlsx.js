const CLASS_SHEETS = [
  ['প্রথম', 1],
  ['দ্বিতীয়', 2],
  ['তৃতীয়', 3],
  ['চতুর্থ', 4],
  ['পঞ্চম', 5]
]

const C = { roll: 1, merit: 2, name: 3, guardian: 4, village: 5, attendance: 19 }

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}
function str(v) {
  if (v == null) return ''
  return String(v).trim()
}
function cell(ws, r, c) {
  return ws[XLSX.utils.encode_cell({ r, c })]
}

export async function parseWorkbook(wb) {
  const XLSX = await import('xlsx')
  const ws = wb.Sheets['Settings']
  const g = (r, c) => (cell(ws, r, c) ? cell(ws, r, c).v : '')
  const school = {
    name: str(g(4, 1)),
    exam: str(g(5, 1)),
    year: str(g(6, 1)),
    cardTitle: str(g(7, 1)),
    address: str(g(10, 1)),
    headTeacherLabel: str(g(8, 1)) || 'প্রধান শিক্ষক',
    classTeacherLabel: str(g(9, 1)) || 'ক্লাস শিক্ষক',
    publicationDate: str(g(11, 1))
  }
  const gradeScale = []
  for (let r = 15; r <= 21; r++) {
    const minPct = num(g(r, 0))
    if (minPct == null) continue
    gradeScale.push({ minPct, grade: str(g(r, 1)), gpa: num(g(r, 2)), status: str(g(r, 3)), remark: str(g(r, 4)) })
  }
  gradeScale.sort((a, b) => a.minPct - b.minPct)
  const toggles = {
    showGuardian: str(g(35, 1)) === 'Yes',
    showVillage: str(g(36, 1)) === 'Yes',
    showAttendance: str(g(37, 1)) === 'Yes',
    showMerit: str(g(38, 1)) === 'Yes',
    showGpa: str(g(39, 1)) === 'Yes',
    showGradeBadge: str(g(40, 1)) === 'Yes',
    showSignature: str(g(41, 1)) === 'Yes'
  }
  const passPct = num(g(30, 10)) ?? 33

  const subjectsByClass = {}
  const students = []
  for (const [sheetName, classId] of CLASS_SHEETS) {
    const cws = wb.Sheets[sheetName]
    if (!cws) continue
    const subjects = []
    for (let c = 6; c <= 13; c++) {
      const label = cell(cws, 4, c)
      if (!label || str(label.v) === '') break
      subjects.push({ name: str(label.v), fullMark: num(cell(cws, 3, c)?.v) ?? 0 })
    }
    subjectsByClass[classId] = subjects
    for (let r = 5; r < 45; r++) {
      const name = cell(cws, r, C.name)
      if (!name || str(name.v) === '') continue
      const subs = subjects.map((s, i) => ({ ...s, obtained: num(cell(cws, r, 6 + i)?.v) }))
      students.push({
        id: `${classId}_${num(cell(cws, r, C.roll)?.v) || students.length + 1}`,
        classId,
        roll: num(cell(cws, r, C.roll)?.v) ?? 0,
        merit: num(cell(cws, r, C.merit)?.v),
        name: str(name.v),
        guardian: str(cell(cws, r, C.guardian)?.v),
        village: str(cell(cws, r, C.village)?.v),
        attendancePct: num(cell(cws, r, C.attendance)?.v),
        subjects: subs
      })
    }
  }
  return { school, gradeScale, toggles, passPct, subjectsByClass, students, classes: [1, 2, 3, 4, 5] }
}

export async function importXlsxFile(file) {
  const XLSX = await import('xlsx')
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  return parseWorkbook(wb)
}
