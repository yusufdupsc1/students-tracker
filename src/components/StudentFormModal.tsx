import { useEffect } from 'react'
import type { Student } from '../types'

export type FormState = {
  id: string | null
  classId: number
  roll: string
  name: string
  guardian: string
  village: string
  attendance: string
  marks: Record<string, string>
}

export function emptyForm(classId: number, active: { name: string }[]): FormState {
  const marks: Record<string, string> = {}
  for (const s of active) marks[s.name] = ''
  return { id: null, classId, roll: '', name: '', guardian: '', village: '', attendance: '', marks }
}

export function studentToForm(s: Student, active: { name: string }[]): FormState {
  const marks: Record<string, string> = {}
  for (const sub of active) {
    const m = s.marks?.[sub.name]
    marks[sub.name] = m == null ? '' : String(m)
  }
  return {
    id: s.id,
    classId: s.classId,
    roll: String(s.roll),
    name: s.name,
    guardian: s.guardian ?? '',
    village: s.village ?? '',
    attendance: s.attendance != null ? String(s.attendance) : '',
    marks,
  }
}

export function StudentFormModal({
  form,
  setForm,
  active,
  onClose,
  onSave,
  error,
  classNames,
}: {
  form: FormState
  setForm: (f: FormState) => void
  active: { name: string; fullMarks: number }[]
  onClose: () => void
  onSave: () => void
  error: string
  classNames?: Record<number, string>
}) {
  const setMark = (name: string, value: string) => setForm({ ...form, marks: { ...form.marks, [name]: value } })

  // Auto-focus trap: close on Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-lg md:rounded-xl rounded-t-xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-heading font-semibold text-bd-green-900">
            {form.id ? 'শিক্ষার্থী সম্পাদনা' : 'নতুন শিক্ষার্থী'}{' '}
            {classNames ? `— ${classNames[form.classId] ?? `ক্লাস ${form.classId}`}` : ''}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-2xl leading-none px-2" aria-label="বন্ধ করুন">
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">ক্লাস</span>
              <select
                value={String(form.classId)}
                onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>
                    {classNames?.[c] ?? `ক্লাস ${c}`} ({c})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-gray-600">রোল</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                value={form.roll}
                onChange={(e) => setForm({ ...form, roll: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="1"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">উপস্থিতি %</span>
              <input
                type="number"
                min={0}
                max={100}
                inputMode="decimal"
                value={form.attendance}
                onChange={(e) => setForm({ ...form, attendance: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="85"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">গ্রাম</span>
              <input
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="বেজখণ্ড"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-gray-600">নাম *</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="মোঃ রহিম"
            />
          </label>

          <label className="block text-sm">
            <span className="text-gray-600">অভিভাবক</span>
            <input
              value={form.guardian}
              onChange={(e) => setForm({ ...form, guardian: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              placeholder="পিতার নাম"
            />
          </label>

          <div className="pt-1">
            <div className="text-sm font-medium text-gray-700 mb-2">নম্বর (প্রতি বিষয়)</div>
            {active.length === 0 ? (
              <p className="text-xs text-gray-400">এই ক্লাসে কোনো সক্রিয় বিষয় নেই — Settings থেকে বিষয় যোগ করুন।</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {active.map((s) => {
                  const raw = form.marks[s.name]?.trim() ?? ''
                  const m = raw === '' ? null : Number(raw)
                  const pct = m == null || !Number.isFinite(m) ? null : (m / s.fullMarks) * 100
                  return (
                    <label key={s.name} className="text-sm">
                      <span className="text-gray-600">
                        {s.name} <span className="text-gray-400">/ {s.fullMarks}</span>
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          inputMode="decimal"
                          value={raw}
                          placeholder="—"
                          onChange={(e) => setMark(s.name, e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                        {pct != null && <span className="text-xs text-gray-500 whitespace-nowrap">{pct.toFixed(0)}%</span>}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {error && <div className="rounded-lg bg-bd-red-50 border border-bd-red-300 text-bd-red-700 text-sm px-3 py-2">{error}</div>}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-gray-200">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700">
            বাতিল
          </button>
          <button onClick={onSave} className="btn-primary flex-1">
            সংরক্ষণ
          </button>
        </div>
      </div>
    </div>
  )
}
