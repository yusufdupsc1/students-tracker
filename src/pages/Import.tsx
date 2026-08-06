import { useState, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { importXlsxFile, applyImport, type ImportResult } from '../lib/importXlsx'
import { importCsvFile, exportCsv, downloadCsv } from '../lib/importCsv'
import { importJsonFile } from '../lib/importJson'
import { downloadBackup, applyBackup, buildBackup } from '../lib/backup'
import { encryptBackup, decryptBackup, type EncryptedBackup } from '../lib/encryptedBackup'
import { db } from '../db/schema'
import { captureSnapshot, restoreSnapshot } from '../db/snapshots'
import { storageStatus } from '../lib/persistence'
import { getActiveSubjects } from '../lib/calculations'
import { StudentFormModal, emptyForm, type FormState } from '../components/StudentFormModal'
import { CLASS_NAMES } from '../lib/classes'
import { useAuth } from '../contexts/AuthContext'
import type { Student } from '../types'

export default function Import() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id

  // Unified file import (xlsx / csv / json)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [fileType, setFileType] = useState<'xlsx' | 'csv' | 'json' | ''>('')

  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [backupError, setBackupError] = useState('')
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupDone, setBackupDone] = useState(false)

  const [encPassword, setEncPassword] = useState('')
  const [encFile, setEncFile] = useState<File | null>(null)
  const [encError, setEncError] = useState('')
  const [encBusy, setEncBusy] = useState(false)
  const [encDone, setEncDone] = useState(false)

  const [storage, setStorage] = useState<{
    usage: number
    quota: number
    persisted: boolean
  } | null>(null)

  // Manual Add Student (independent of import)
  const [addModal, setAddModal] = useState<FormState | null>(null)
  const [addError, setAddError] = useState('')
  const [addClassId, setAddClassId] = useState(1)
  const addClassConfig = useLiveQuery(
    () => (schoolId ? db.classes.where('schoolId').equals(schoolId).and((c) => c.id === addClassId).first() : db.classes.get(addClassId)),
    [schoolId, addClassId]
  )
  // For manual add modal: react to the class selected inside the modal as well
  const effectiveAddClassId = addModal?.classId ?? addClassId
  const modalClassConfig = useLiveQuery(
    () => (schoolId ? db.classes.where('schoolId').equals(schoolId).and((c) => c.id === effectiveAddClassId).first() : db.classes.get(effectiveAddClassId)),
    [schoolId, effectiveAddClassId]
  )
  const addActive = useMemo(() => {
    const cfg = modalClassConfig ?? addClassConfig
    return cfg ? getActiveSubjects(cfg) : []
  }, [modalClassConfig, addClassConfig])

  const snapshots = useLiveQuery(
    () => db.snapshots.orderBy('createdAt').reverse().toArray(),
    [],
    [] as { id?: number; createdAt: string; reason: string }[]
  )

  useEffect(() => {
    void storageStatus().then(setStorage)
  }, [])

  const classCounts = useMemo(() => {
    const m: Record<number, number> = {}
    for (const s of result?.students ?? []) m[s.classId] = (m[s.classId] ?? 0) + 1
    return m
  }, [result])

  // Unified file picker: handles .xlsx, .xls, .csv, .json
  async function onPickFile(file: File) {
    setError('')
    setDone(false)
    setFileName(file.name)
    setResult(null)

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('ফাইলটি অনেক বড় (১০ MB-এর বেশি)।')
      return
    }

    const lower = file.name.toLowerCase()
    const isXlsx = lower.endsWith('.xlsx') || lower.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel')
    const isCsv = lower.endsWith('.csv') || file.type.includes('csv')
    const isJson = lower.endsWith('.json') || file.type.includes('json')

    try {
      let parsed: ImportResult | null = null
      if (isCsv) {
        setFileType('csv')
        parsed = await importCsvFile(file)
      } else if (isJson) {
        setFileType('json')
        parsed = await importJsonFile(file)
      } else if (isXlsx) {
        setFileType('xlsx')
        parsed = await importXlsxFile(file)
      } else {
        // Try to detect by content: try xlsx, then csv, then json
        try {
          parsed = await importXlsxFile(file)
          setFileType('xlsx')
        } catch {
          try {
            parsed = await importCsvFile(file)
            setFileType('csv')
          } catch {
            parsed = await importJsonFile(file)
            setFileType('json')
          }
        }
      }

      if (!parsed) throw new Error('পার্স করা যায়নি')
      if (parsed.students.length === 0) {
        setError('কোনো শিক্ষার্থী পাওয়া যায়নি। ফাইল যাচাই করুন।')
        return
      }
      setResult(parsed)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ফাইল পড়া যায়নি'
      setError(msg)
    }
  }

  async function onCommit() {
    if (!result) return
    const typeLabel = fileType === 'csv' ? 'CSV' : fileType === 'json' ? 'JSON' : 'স্প্রেডশিট'
    if (!window.confirm(`${typeLabel} থেকে ${result.students.length} জন শিক্ষার্থী — বর্তমান সব ডেটা প্রতিস্থাপিত হবে। নিশ্চিত?`)) {
      return
    }
    setBusy(true)
    try {
      await captureSnapshot(`${typeLabel} ইমপোর্টের পূর্বে`)
      await applyImport(result)
      setDone(true)
      setResult(null)
      setFileName('')
      setFileType('')
    } catch {
      setError('ডেটা সংরক্ষণে সমস্যা হয়েছে।')
    } finally {
      setBusy(false)
    }
  }

  // Manual Add Student handlers (consistent with ClassRoster)
  function openAdd() {
    setAddError('')
    setAddModal(emptyForm(addClassId, addActive))
  }

  async function handleManualSave() {
    if (!addModal) return
    const targetClassId = addModal.classId
    const targetConfig = await db.classes.get(targetClassId)
    const targetActive = targetConfig ? getActiveSubjects(targetConfig) : addActive
    const rollNum = Number(addModal.roll)
    if (!Number.isInteger(rollNum) || rollNum < 1) {
      setAddError('রোল সঠিক নয়')
      return
    }
    if (!addModal.name.trim()) {
      setAddError('নাম আবশ্যক')
      return
    }
    const attendanceRaw = addModal.attendance.trim()
    const attendance = attendanceRaw === '' ? undefined : Number(attendanceRaw)
    if (attendance != null && (!Number.isFinite(attendance) || attendance < 0 || attendance > 100)) {
      setAddError('উপস্থিতি ০–১০০')
      return
    }
    const marks: Record<string, number | null> = {}
    for (const s of targetActive) {
      const raw = addModal.marks[s.name]?.trim() ?? ''
      if (raw === '') marks[s.name] = null
      else {
        const n = Number(raw)
        if (!Number.isFinite(n) || n < 0 || n > s.fullMarks) {
          setAddError(`${s.name}: ০–${s.fullMarks}`)
          return
        }
        marks[s.name] = n
      }
    }
    const id = `${targetClassId}_${rollNum}`
    const student: Student = {
      id,
      classId: targetClassId,
      roll: rollNum,
      name: addModal.name.trim(),
      guardian: addModal.guardian.trim() || undefined,
      village: addModal.village.trim() || undefined,
      attendance,
      marks,
      section: addModal.section.trim() || undefined,
      group: addModal.group.trim() || undefined,
      gender: (addModal.gender as any) || undefined,
      dob: addModal.dob.trim() || undefined,
      phone: addModal.phone.trim() || undefined,
      bloodGroup: addModal.bloodGroup.trim() || undefined,
      religion: addModal.religion.trim() || undefined,
      address: addModal.address.trim() || undefined,
    }
    try {
      await db.transaction('rw', db.students, db.mtrRecords, async () => {
        if (addModal.id && addModal.id !== id) await db.students.delete(addModal.id)
        await db.students.put(student)
      })
      setAddModal(null)
      setAddError('')
    } catch (e) {
      if (e instanceof Error && e.name === 'ConstraintError') setAddError(`রোল ${rollNum} ইতিমধ্যে ব্যবহৃত`)
      else setAddError('সংরক্ষণে সমস্যা')
    }
  }

  async function onCommitBackup() {
    if (!backupFile) return
    if (!window.confirm('ব্যাকআপ থেকে সব ডেটা পুনরুদ্ধার করা হবে (বর্তমান ডেটা মুছে যাবে)। চালিয়ে যাবেন?')) {
      return
    }
    setBackupBusy(true)
    setBackupError('')
    try {
      const text = await backupFile.text()
      await captureSnapshot('ব্যাকআপ পুনরুদ্ধারের পূর্বে')
      await applyBackup(text)
      setBackupDone(true)
      setBackupFile(null)
    } catch {
      setBackupError('ব্যাকআপ ফাইল সঠিক নয় বা পড়া যায়নি।')
    } finally {
      setBackupBusy(false)
    }
  }

  async function onEncryptedExport() {
    if (!encPassword) {
      setEncError('দয়া করে একটি পাসওয়ার্ড দিন।')
      return
    }
    setEncBusy(true)
    setEncError('')
    try {
      const text = await downloadBackup()
      const encrypted = await encryptBackup(text, encPassword)
      const blob = new Blob([JSON.stringify(encrypted)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bejkhonda-backup-encrypted-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setEncDone(true)
      setEncPassword('')
    } catch {
      setEncError('এনক্রিপ্টেড ব্যাকআপ তৈরি করতে সমস্যা হয়েছে।')
    } finally {
      setEncBusy(false)
    }
  }

  async function onEncryptedImport() {
    if (!encFile) return
    if (!encPassword) {
      setEncError('দয়া করে ডিক্রিপ্ট পাসওয়ার্ড দিন।')
      return
    }
    setEncBusy(true)
    setEncError('')
    try {
      const text = await encFile.text()
      const encrypted = JSON.parse(text) as EncryptedBackup
      const decrypted = await decryptBackup(encrypted, encPassword)
      await captureSnapshot('এনক্রিপ্টেড ব্যাকআপ পুনরুদ্ধারের পূর্বে')
      await applyBackup(decrypted)
      setEncDone(true)
      setEncFile(null)
      setEncPassword('')
    } catch {
      setEncError('এনক্রিপ্টেড ব্যাকআপ ফাইল সঠিক নয় বা পাসওয়ার্ড ভুল।')
    } finally {
      setEncBusy(false)
    }
  }

  async function handleExportCsv() {
    try {
      const csv = await exportCsv()
      downloadCsv(csv)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'CSV এক্সপোর্ট ব্যর্থ'
      setError(msg)
    }
  }

  async function handleExportJson() {
    try {
      const data = await buildBackup()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bejkhonda-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('JSON এক্সপোর্ট ব্যর্থ')
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-bd-green-900 tracking-tight">ইমপোর্ট ও ব্যাকআপ</h1>

      {/* Manual Add Student — independent of import, consistent across app */}
      <div className="glass-card p-6 border-2 border-bd-green-200">
        <h2 className="text-lg font-heading font-semibold mb-1 text-bd-green-900">ম্যানুয়াল — নতুন শিক্ষার্থী যোগ করুন</h2>
        <p className="text-sm text-gray-500 mb-4">ইমপোর্ট ছাড়াই যেকোনো ক্লাসে (1-12) সরাসরি শিক্ষার্থী যোগ করুন — সব অপশনসহ (রোল, নাম, অভিভাবক, গ্রাম, উপস্থিতি, সব বিষয়ের নম্বর)।</p>
        <div className="flex flex-wrap gap-3 items-center">
          <select value={String(addClassId)} onChange={(e) => setAddClassId(Number(e.target.value))} className="glass-input">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                {CLASS_NAMES[c]} ({c})
              </option>
            ))}
          </select>
          <button onClick={openAdd} className="btn-primary">
            + {CLASS_NAMES[addClassId]} — নতুন শিক্ষার্থী
          </button>
          <span className="text-xs text-gray-400">বা শ্রেণি তালিকা পেজ থেকেও যোগ করা যায় — একই ফর্ম, একই লজিক</span>
        </div>
      </div>

      {/* Unified import: xlsx / csv / json */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-1 text-bd-green-900">ফাইল থেকে ইমপোর্ট — .xlsx / .csv / .json</h2>
        <p className="text-sm text-gray-500 mb-4">
          একই ফ্লোতে তিন ফরম্যাট সাপোর্টেড। ফাইল নির্বাচন করুন → প্রিভিউ → প্রতিস্থাপন। সব ক্লাস (1-12) সাপোর্টেড।
        </p>

        <div className="flex flex-wrap gap-2 mb-3 text-xs">
          <span className="rounded-full bg-bd-green-50 border border-bd-green-200 px-3 py-1">.xlsx — বেজখণ্ড শিট (12 শিট + Settings)</span>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1">.csv — Class,Roll,Name,Guardian,Village,Attendance,Subject... </span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1">.json — ImportResult / Backup JSON / Students array</span>
        </div>

        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-bd-green-300 px-4 py-10 text-center cursor-pointer hover:border-bd-green-500 hover:bg-bd-green-50/30 transition-all duration-200">
          <span className="text-bd-green-700 font-heading font-semibold text-lg">ফাইল নির্বাচন করুন</span>
          <span className="text-xs text-gray-400 font-medium">{fileName || '.xlsx / .csv / .json ফাইল ড্রপ বা ক্লিক করুন'}</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.json,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onPickFile(f)
            }}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={handleExportCsv} className="rounded-xl border border-blue-300 text-blue-700 px-4 py-2 text-sm font-medium hover:bg-blue-50">
            CSV এক্সপোর্ট
          </button>
          <button onClick={handleExportJson} className="rounded-xl border border-amber-300 text-amber-700 px-4 py-2 text-sm font-medium hover:bg-amber-50">
            JSON এক্সপোর্ট
          </button>
          <button onClick={() => void downloadBackup()} className="rounded-xl border border-bd-green-300 text-bd-green-700 px-4 py-2 text-sm font-medium hover:bg-bd-green-50">
            ব্যাকআপ JSON এক্সপোর্ট
          </button>
        </div>

        {error && <div className="mt-4 rounded-xl bg-bd-red-50 border border-bd-red-300 text-bd-red-700 text-sm px-4 py-2.5">{error}</div>}

        {result && (
          <div className="mt-4 rounded-2xl border border-bd-green-200 bg-bd-green-50/50 p-5">
            <div className="text-sm font-heading font-semibold text-bd-green-900">
              প্রিভিউ — {fileType.toUpperCase()} {fileName && `(${fileName})`}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                স্কুল: <b>{result.school.name}</b>
              </div>
              <div>
                শিক্ষার্থী: <b>{result.students.length}</b> জন
              </div>
              <div>
                ক্লাস: <b>{result.classes.length}</b> টি
              </div>
              <div>
                গ্রেড স্কেল: <b>{result.gradingScale.length}</b> সারি
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.classes.map((c) => (
                <span key={c.id} className="rounded-full bg-white border border-bd-green-200 px-3 py-1.5 text-xs font-medium">
                  {CLASS_NAMES[c.id]}: {classCounts[c.id] ?? 0} • {c.subjects.length} বিষয়
                </span>
              ))}
            </div>

            {result.issues.length > 0 && (
              <details className="mt-4">
                <summary className="text-sm text-gold-dark font-semibold cursor-pointer hover:text-gold transition-colors duration-200">
                  {result.issues.length} টি সতর্কতা (দেখুন)
                </summary>
                <ul className="mt-2 list-disc pl-5 text-xs text-gray-600 space-y-1">
                  {result.issues.slice(0, 20).map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              </details>
            )}

            <button onClick={onCommit} disabled={busy} className="btn-primary mt-4 w-full">
              {busy ? 'সংরক্ষণ হচ্ছে…' : `সব ডেটা প্রতিস্থাপন করুন (${fileType.toUpperCase()})`}
            </button>
            <p className="mt-2 text-xs text-gray-400 text-center">একই লজিক: .xlsx = .csv = .json — সবই applyImport দিয়ে atomic replace</p>
          </div>
        )}

        {done && (
          <div className="mt-4 rounded-xl bg-bd-green-50 border border-bd-green-300 text-bd-green-800 text-sm px-4 py-2.5 font-medium">
            ফাইল থেকে ডেটা সফলভাবে ইমপোর্ট হয়েছে — সব ক্লাসে (1-12) প্রযোজ্য।
          </div>
        )}
      </div>

      {/* Backup */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-1 text-bd-green-900">ব্যাকআপ (JSON) — লোকাল</h2>
        <p className="text-sm text-gray-500 mb-4 font-medium">সম্পূর্ণ ডেটা লোকালভাবে এক্সপোর্ট করুন বা পূর্ববর্তী ব্যাকআপ থেকে পুনরুদ্ধার করুন। কোনো সার্ভার লাগে না।</p>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => void downloadBackup()} className="btn-secondary">
            ব্যাকআপ এক্সপোর্ট
          </button>

          <label className="rounded-xl border border-bd-green-200 px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-bd-green-50 transition-all duration-200 font-medium">
            ব্যাকআপ থেকে পুনরুদ্ধার
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && !f.name.toLowerCase().endsWith('.json')) {
                  setBackupError('দয়া করে একটি .json ব্যাকআপ ফাইল নির্বাচন করুন।')
                  setBackupFile(null)
                  return
                }
                if (f && f.size > 50 * 1024 * 1024) {
                  setBackupError('ব্যাকআপ ফাইলটি অনেক বড় (৫০ MB-এর বেশি)।')
                  setBackupFile(null)
                  return
                }
                setBackupFile(f ?? null)
                setBackupDone(false)
                setBackupError('')
              }}
            />
          </label>
        </div>

        {backupFile && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium truncate">{backupFile.name}</span>
            <button onClick={onCommitBackup} disabled={backupBusy} className="btn-primary">
              {backupBusy ? 'পুনরুদ্ধার…' : 'পুনরুদ্ধার করুন'}
            </button>
          </div>
        )}
        {backupError && <div className="mt-3 rounded-xl bg-bd-red-50 border border-bd-red-300 text-bd-red-700 text-sm px-4 py-2.5">{backupError}</div>}
        {backupDone && (
          <div className="mt-3 rounded-xl bg-bd-green-50 border border-bd-green-300 text-bd-green-800 text-sm px-4 py-2.5 font-medium">
            ব্যাকআপ থেকে ডেটা পুনরুদ্ধার করা হয়েছে।
          </div>
        )}
      </div>

      {/* Encrypted backup */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-1 text-bd-green-900">এনক্রিপ্টেড ব্যাকআপ (AES-256-GCM)</h2>
        <p className="text-sm text-gray-500 mb-4 font-medium">পাসওয়ার্ড দিয়ে এনক্রিপ্ট করা ব্যাকআপ এক্সপোর্ট বা ইমপোর্ট করুন — সম্পূর্ণ অফলাইন।</p>

        <div className="flex flex-wrap gap-3">
          <button onClick={onEncryptedExport} disabled={encBusy} className="btn-secondary">
            {encBusy ? 'এনক্রিপ্ট হচ্ছে…' : 'এনক্রিপ্টেড এক্সপোর্ট'}
          </button>

          <label className="rounded-xl border border-bd-green-200 px-4 py-2.5 text-sm text-gray-700 cursor-pointer hover:bg-bd-green-50 transition-all duration-200 font-medium">
            এনক্রিপ্টেড পুনরুদ্ধার
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f && !f.name.toLowerCase().endsWith('.json')) {
                  setEncError('দয়া করে একটি .json ফাইল নির্বাচন করুন।')
                  setEncFile(null)
                  return
                }
                setEncFile(f ?? null)
                setEncDone(false)
                setEncError('')
              }}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="password"
            value={encPassword}
            onChange={(e) => setEncPassword(e.target.value)}
            placeholder="পাসওয়ার্ড"
            className="glass-input w-48"
          />
          {encFile && (
            <button onClick={onEncryptedImport} disabled={encBusy} className="btn-primary">
              {encBusy ? 'ডিক্রিপ্ট হচ্ছে…' : 'ডিক্রিপ্ট ও পুনরুদ্ধার'}
            </button>
          )}
        </div>

        {encError && <div className="mt-3 rounded-xl bg-bd-red-50 border border-bd-red-300 text-bd-red-700 text-sm px-4 py-2.5">{encError}</div>}
        {encDone && (
          <div className="mt-3 rounded-xl bg-bd-green-50 border border-bd-green-300 text-bd-green-800 text-sm px-4 py-2.5 font-medium">
            এনক্রিপ্টেড ব্যাকআপ সফলভাবে প্রসেস করা হয়েছে।
          </div>
        )}
      </div>

      {/* Storage durability status */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-1 text-bd-green-900">স্টোরেজ অবস্থা</h2>
        {storage === null ? (
          <p className="text-sm text-gray-500">স্টোরেজ তথ্য উপলব্ধ নয়।</p>
        ) : (
          <div className="text-sm space-y-2">
            <div>
              স্থায়ী স্টোরেজ: {storage.persisted ? <span className="text-bd-green-700 font-semibold">হ্যাঁ ✓</span> : <span className="text-gold-dark font-semibold">না</span>}
            </div>
            {!storage.persisted && <p className="text-xs text-gold-dark font-medium">স্টোরেজ চাপের সময় ব্রাউজার ডেটা মুছে ফেলতে পারে। প্রয়োজনে ব্যাকআপ এক্সপোর্ট করে রাখুন।</p>}
            {storage.quota > 0 && <div className="text-gray-500">ব্যবহৃত: {(storage.usage / 1048576).toFixed(2)} MB / মোট {(storage.quota / 1048576).toFixed(0)} MB</div>}
          </div>
        )}
      </div>

      {/* Auto-snapshots */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-1 text-bd-green-900">সাম্প্রতিক স্ন্যাপশট (Undo)</h2>
        <p className="text-sm text-gray-500 mb-3 font-medium">ইমপোর্ট বা ব্যাকআপ পুনরুদ্ধারের আগে স্বয়ংক্রিয়ভাবে স্ন্যাপশট নেওয়া হয়।</p>

        {snapshots.length === 0 ? (
          <p className="text-sm text-gray-400">কোনো স্ন্যাপশট নেই।</p>
        ) : (
          <ul className="divide-y divide-bd-green-100">
            {snapshots.map((s) => (
              <li key={s.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-bd-green-900">{s.reason}</div>
                  <div className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString('bn-BD')}</div>
                </div>
                <button
                  onClick={async () => {
                    if (window.confirm('এই স্ন্যাপশট থেকে ডেটা পুনরুদ্ধার করা হবে। চালিয়ে যাবেন?')) {
                      try {
                        await restoreSnapshot(s.id!)
                      } catch {}
                    }
                  }}
                  className="shrink-0 rounded-xl border border-bd-green-700 text-bd-green-700 px-4 py-2 text-sm font-semibold hover:bg-bd-green-50 transition-all duration-200"
                >
                  পুনরুদ্ধার
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {addModal && (
        <StudentFormModal
          form={addModal}
          setForm={setAddModal}
          active={addActive}
          onClose={() => {
            setAddModal(null)
            setAddError('')
          }}
          onSave={handleManualSave}
          error={addError}
          classNames={CLASS_NAMES}
        />
      )}
    </section>
  )
}
