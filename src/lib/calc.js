// Single source of truth for grading, GPA, result, remark and per-subject stats.
// Pure functions, no DOM. Reads grade scale / pass % from settings (never hardcode).

export function gradeFromPct(pct, scale) {
  if (pct == null || isNaN(pct)) return null
  let match = scale[0]
  for (let i = 0; i < scale.length; i++) {
    if (pct >= scale[i].minPct) match = scale[i]
    else break
  }
  return match
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

// student: { subjects: [{ name, obtained (number|null), fullMark }] }
// opts: { gradeScale: [...], passPct: number }
export function computeStudent(student, opts) {
  const scale = opts.gradeScale
  const passPct = opts.passPct ?? 33
  const subjects = (student.subjects || []).map((s) => ({ ...s }))

  const totalFull = subjects.reduce((a, s) => a + (Number(s.fullMark) || 0), 0)
  const entered = subjects.filter((s) => s.obtained !== null && s.obtained !== undefined && s.obtained !== '')
  const totalObtained = entered.reduce((a, s) => a + Number(s.obtained), 0)

  const perSubject = subjects.map((s) => {
    const obtained = s.obtained === null || s.obtained === undefined || s.obtained === '' ? null : Number(s.obtained)
    const fullMark = Number(s.fullMark) || 0
    if (obtained === null) {
      return { name: s.name, obtained: null, fullMark, pct: null, grade: null, gpa: null, status: null, remark: null, pass: null }
    }
    const pct = fullMark > 0 ? round2((obtained / fullMark) * 100) : 0
    const info = gradeFromPct(pct, scale)
    const pass = obtained >= (passPct / 100) * fullMark
    return {
      name: s.name,
      obtained,
      fullMark,
      pct,
      grade: info ? info.grade : null,
      gpa: info ? info.gpa : null,
      status: info ? info.status : null,
      remark: info ? info.remark : null,
      pass
    }
  })

  // No marks
  if (entered.length === 0) {
    return {
      state: 'nomarks',
      totalObtained: 0,
      totalFull,
      avgPct: null,
      perSubject,
      overallGrade: null,
      overallGpa: null,
      result: 'No marks',
      remark: ''
    }
  }

  // Incomplete (some, not all, marks present)
  if (entered.length < subjects.length) {
    const avgPct = totalFull > 0 ? round2((totalObtained / totalFull) * 100) : 0
    return {
      state: 'incomplete',
      totalObtained,
      totalFull,
      avgPct,
      perSubject,
      overallGrade: null,
      overallGpa: null,
      result: 'Incomplete',
      remark: 'Marks incomplete'
    }
  }

  // Complete
  const avgPct = totalFull > 0 ? round2((totalObtained / totalFull) * 100) : 0
  const failed = perSubject.some((s) => s.pass === false)
  if (failed) {
    const failInfo = scale.find((g) => g.status === 'Fail') || scale[0]
    return {
      state: 'complete',
      totalObtained,
      totalFull,
      avgPct,
      perSubject,
      overallGrade: failInfo.grade,
      overallGpa: failInfo.gpa,
      result: 'Failed',
      remark: failInfo.remark
    }
  }
  const info = gradeFromPct(avgPct, scale)
  return {
    state: 'complete',
    totalObtained,
    totalFull,
    avgPct,
    perSubject,
    overallGrade: info.grade,
    overallGpa: info.gpa,
    result: 'Passed',
    remark: info.remark
  }
}

export function sumBy(arr, fn) {
  return arr.reduce((a, x) => a + fn(x), 0)
}
