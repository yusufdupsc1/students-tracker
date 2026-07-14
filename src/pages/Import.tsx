import { useState, useMemo, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { importXlsxFile, applyImport, type ImportResult } from '../lib/importXlsx'
import { downloadBackup, applyBackup } from '../lib/backup'
import { db } from '../db/schema'
import { captureSnapshot, restoreSnapshot } from '../db/snapshots'
import { storageStatus } from '../lib/persistence'

const CLASS_NAMES = ['', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম']

export default function Import() {
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const [backupFile, setBackupFile] = useState<File | null>(null)
  const [backupError, setBackupError] = useState('')
  const [backupBusy, setBackupBusy] = useState(false)
  const [backupDone, setBackupDone] = useState(false)

  const [storage, setStorage] = useState<{
    usage: number
    quota: number
    persisted: boolean
  } | null>(null)

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

  async function onPickXlsx(file: File) {
    setError('')
    setDone(false)
    setFileName(file.name)
    try {
      const parsed = await importXlsxFile(file)
      if (parsed.students.length === 0) {
        setError('কোনো শিক্ষার্থী পাওয়া যায়নি। শিটের বিন্যাস যাচাই করুন।')
        setResult(null)
        return
      }
      setResult(parsed)
    } catch (e) {
      setResult(null)
      setError('ফাইল পড়া যায়নি। সঠিক .xlsx ফাইল নির্বাচন করুন।')
    }
  }

  async function onCommit() {
    if (!result) return
    if (!window.confirm('বর্তমান সব ডেটা (স্কুল, গ্রেড স্কেল, ক্লাস ও শিক্ষার্থী) প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?')) {
      return
    }
    setBusy(true)
    try {
      await captureSnapshot('স্প্রেডশিট ইমপোর্টের পূর্বে')
      await applyImport(result)
      setDone(true)
      setResult(null)
      setFileName('')
    } catch {
      setError('ডেটা সংরক্ষণে সমস্যা হয়েছে।')
    } finally {
      setBusy(false)
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

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold text-maroon">ইমপোর্ট ও ব্যাকআপ</h1>

      {/* Spreadsheet import */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-1">স্প্রেডশিট থেকে ইমপোর্ট (.xlsx)</h2>
        <p className="text-sm text-gray-500 mb-4">
          বেজখণ্ড ফলাফল শিট (প্রতি ক্লাস একটি শিট + Settings) নির্বাচন করুন। ডেটা আগে প্রিভিউ করা হবে,
          তারপর প্রতিস্থাপন করা যাবে।
        </p>

        <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center cursor-pointer hover:border-maroon">
          <span className="text-maroon font-semibold">ফাইল নির্বাচন করুন</span>
          <span className="text-xs text-gray-400">
            {fileName || '.xlsx ফাইল এখানে ড্রপ করুন বা ক্লিক করুন'}
          </span>
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void onPickXlsx(f)
            }}
          />
        </label>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-xl border border-maroon/30 bg-maroon/5 p-4">
            <div className="text-sm font-semibold text-maroon">প্রিভিউ</div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
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
            <div className="mt-2 flex flex-wrap gap-2">
              {result.classes.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full bg-white border border-gray-300 px-3 py-1 text-xs"
                >
                  {CLASS_NAMES[c.id]}: {classCounts[c.id] ?? 0} • {c.subjects.length} বিষয়
                </span>
              ))}
            </div>

            {result.issues.length > 0 && (
              <details className="mt-3">
                <summary className="text-sm text-amber-700 cursor-pointer">
                  {result.issues.length} টি সতর্কতা (দেখুন)
                </summary>
                <ul className="mt-1 list-disc pl-5 text-xs text-gray-600 space-y-0.5">
                  {result.issues.slice(0, 20).map((iss, i) => (
                    <li key={i}>{iss}</li>
                  ))}
                </ul>
              </details>
            )}

            <button
              onClick={onCommit}
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-maroon text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            >
              {busy ? 'সংরক্ষণ হচ্ছে…' : 'সব ডেটা প্রতিস্থাপন করুন'}
            </button>
          </div>
        )}

        {done && (
          <div className="mt-3 rounded-lg bg-green-50 border border-green-300 text-green-800 text-sm px-3 py-2">
            স্প্রেডশিট থেকে ডেটা সফলভাবে ইমপোর্ট হয়েছে।
          </div>
        )}
      </div>

      {/* Backup */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-1">ব্যাকআপ (JSON)</h2>
        <p className="text-sm text-gray-500 mb-4">
          সম্পূর্ণ ডেটা এক্সপোর্ট করুন বা পূর্ববর্তী ব্যাকআপ থেকে পুনরুদ্ধার করুন।
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void downloadBackup()}
            className="rounded-lg border border-maroon text-maroon px-4 py-2 text-sm font-semibold"
          >
            ব্যাকআপ এক্সপোর্ট
          </button>

          <label className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 cursor-pointer">
            ব্যাকআপ থেকে পুনরুদ্ধার
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                setBackupFile(f ?? null)
                setBackupDone(false)
                setBackupError('')
              }}
            />
          </label>
        </div>

        {backupFile && (
          <div className="mt-3 flex items-center gap-3">
            <span className="text-sm text-gray-600 truncate">{backupFile.name}</span>
            <button
              onClick={onCommitBackup}
              disabled={backupBusy}
              className="rounded-lg bg-maroon text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            >
              {backupBusy ? 'পুনরুদ্ধার…' : 'পুনরুদ্ধার করুন'}
            </button>
          </div>
        )}
        {backupError && (
          <div className="mt-2 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2">
            {backupError}
          </div>
        )}
        {backupDone && (
          <div className="mt-2 rounded-lg bg-green-50 border border-green-300 text-green-800 text-sm px-3 py-2">
            ব্যাকআপ থেকে ডেটা পুনরুদ্ধার করা হয়েছে।
          </div>
        )}
      </div>

      {/* Storage durability status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-1">স্টোরেজ অবস্থা</h2>
        {storage === null ? (
          <p className="text-sm text-gray-500">স্টোরেজ তথ্য উপলব্ধ নয়।</p>
        ) : (
          <div className="text-sm space-y-1">
            <div>
              স্থায়ী স্টোরেজ:{' '}
              {storage.persisted ? (
                <span className="text-green-700 font-semibold">হ্যাঁ ✓</span>
              ) : (
                <span className="text-amber-700 font-semibold">না</span>
              )}
            </div>
            {!storage.persisted && (
              <p className="text-xs text-amber-700">
                স্টোরেজ চাপের সময় ব্রাউজার ডেটা মুছে ফেলতে পারে। প্রয়োজনে ব্যাকআপ
                এক্সপোর্ট করে রাখুন।
              </p>
            )}
            {storage.quota > 0 && (
              <div className="text-gray-500">
                ব্যবহৃত: {(storage.usage / 1048576).toFixed(2)} MB / মোট{' '}
                {(storage.quota / 1048576).toFixed(0)} MB
              </div>
            )}
          </div>
        )}
      </div>

      {/* Auto-snapshots (undo for destructive imports/restores) */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-lg font-semibold mb-1">সাম্প্রতিক স্ন্যাপশট</h2>
        <p className="text-sm text-gray-500 mb-3">
          ইমপোর্ট বা ব্যাকআপ পুনরুদ্ধারের আগে স্বয়ংক্রিয়ভাবে স্ন্যাপশট নেওয়া হয়।
          প্রয়োজনে পূর্বাবস্থায় ফিরে যেতে পারবেন।
        </p>

        {snapshots.length === 0 ? (
          <p className="text-sm text-gray-400">কোনো স্ন্যাপশট নেই।</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {snapshots.map((s) => (
              <li key={s.id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{s.reason}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleString('bn-BD')}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    if (
                      window.confirm('এই স্ন্যাপশট থেকে ডেটা পুনরুদ্ধার করা হবে। চালিয়ে যাবেন?')
                    ) {
                      try {
                        await restoreSnapshot(s.id!)
                      } catch {
                        /* ignore */
                      }
                    }
                  }}
                  className="shrink-0 rounded-lg border border-maroon text-maroon px-3 py-1.5 text-sm font-semibold"
                >
                  পুনরুদ্ধার
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
