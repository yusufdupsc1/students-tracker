import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { db, ensureSeeded, reseed as reseedDb } from '../db/db.js'

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      await ensureSeeded()
      const s = await db.settings.get('school')
      if (active) {
        setSettings(s)
        setReady(true)
      }
    })()
    return () => { active = false }
  }, [])

  const saveSettings = useCallback(async (patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      db.settings.put(next)
      return next
    })
  }, [])

  const addStudent = useCallback(async (stu) => {
    const id = stu.id || `${stu.classId}_${stu.roll || Date.now()}`
    await db.students.put({ ...stu, id })
    return id
  }, [])

  const updateStudent = useCallback(async (stu) => {
    await db.students.put(stu)
  }, [])

  const deleteStudent = useCallback(async (id) => {
    await db.students.delete(id)
  }, [])

  const getMtr = useCallback(async (classId) => {
    return db.mtr.get(`mtr_${classId}`)
  }, [])

  const saveMtr = useCallback(async (classId, entries) => {
    await db.mtr.put({ id: `mtr_${classId}`, classId, entries })
  }, [])

  const applyImport = useCallback(async (parsed) => {
    await db.transaction('rw', db.settings, db.students, async () => {
      await db.settings.put({
        id: 'school',
        school: parsed.school,
        gradeScale: parsed.gradeScale,
        toggles: parsed.toggles,
        passPct: parsed.passPct,
        subjectsByClass: parsed.subjectsByClass,
        classes: parsed.classes
      })
      await db.students.clear()
      await db.students.bulkPut(parsed.students)
    })
    const s = await db.settings.get('school')
    setSettings(s)
  }, [])

  const resetAll = useCallback(async () => {
    await reseedDb()
    const s = await db.settings.get('school')
    setSettings(s)
  }, [])

  const value = {
    ready,
    settings,
    saveSettings,
    addStudent,
    updateStudent,
    deleteStudent,
    getMtr,
    saveMtr,
    applyImport,
    resetAll
  }
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
