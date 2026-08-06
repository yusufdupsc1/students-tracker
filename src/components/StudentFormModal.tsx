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
  section: string
  group: string
  gender: string
  dob: string
  phone: string
  bloodGroup: string
  religion: string
  address: string
  marks: Record<string, string>
}

export function emptyForm(classId: number, active: { name: string }[]): FormState {
  const marks: Record<string, string> = {}
  for (const s of active) marks[s.name] = ''
  return {
    id: null,
    classId,
    roll: '',
    name: '',
    guardian: '',
    village: '',
    attendance: '',
    section: '',
    group: '',
    gender: '',
    dob: '',
    phone: '',
    bloodGroup: '',
    religion: '',
    address: '',
    marks,
  }
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
    section: (s as any).section ?? '',
    group: (s as any).group ?? '',
    gender: (s as any).gender ?? '',
    dob: (s as any).dob ?? '',
    phone: (s as any).phone ?? '',
    bloodGroup: (s as any).bloodGroup ?? '',
    religion: (s as any).religion ?? '',
    address: (s as any).address ?? '',
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Build dynamic class options from classNames prop or fallback 1-12
  const classOptions = classNames
    ? Object.keys(classNames)
        .map(Number)
        .filter((n) => n > 0 && Number.isInteger(n))
        .sort((a, b) => a - b)
    : Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 p-0 md:p-4">
      <div className="bg-white w-full md:max-w-2xl md:rounded-xl rounded-t-xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-heading font-semibold text-bd-green-900">
            {form.id ? 'শিক্ষার্থী সম্পাদনা' : 'নতুন শিক্ষার্থী'}{' '}
            {classNames ? `— ${classNames[form.classId] ?? `ক্লাস ${form.classId}`}` : ''}
          </h2>
          <button onClick={onClose} className="text-gray-500 text-2xl leading-none px-2" aria-label="বন্ধ করুন">
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-4 py-3 space-y-4">
          {/* Academic core */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">ক্লাস *</span>
              <select
                value={String(form.classId)}
                onChange={(e) => setForm({ ...form, classId: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                {classOptions.map((c) => (
                  <option key={c} value={c}>
                    {classNames?.[c] ?? `ক্লাস ${c}`} ({c})
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="text-gray-600">রোল *</span>
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
            <label className="text-sm">
              <span className="text-gray-600">শাখা (Section)</span>
              <select
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">—</option>
                <option value="ক">ক</option>
                <option value="খ">খ</option>
                <option value="গ">গ</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">গ্রুপ (9-12)</span>
              <select
                value={form.group}
                onChange={(e) => setForm({ ...form, group: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">—</option>
                <option value="Science">Science</option>
                <option value="Arts">Arts</option>
                <option value="Commerce">Commerce</option>
                <option value="General">General</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-gray-600">লিঙ্গ</span>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">—</option>
                <option value="male">ছেলে</option>
                <option value="female">মেয়ে</option>
                <option value="other">অন্যান্য</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-gray-600">জন্ম তারিখ</span>
              <input
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
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

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">অভিভাবক</span>
              <input
                value={form.guardian}
                onChange={(e) => setForm({ ...form, guardian: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="পিতার নাম"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">ফোন</span>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="01XXXXXXXXX"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="text-gray-600">গ্রাম</span>
              <input
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="বেজখণ্ড"
              />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">রক্তের গ্রুপ</span>
              <select
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">—</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="text-gray-600">ধর্ম</span>
              <select
                value={form.religion}
                onChange={(e) => setForm({ ...form, religion: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 bg-white"
              >
                <option value="">—</option>
                <option value="Islam">Islam</option>
                <option value="Hindu">Hindu</option>
                <option value="Christian">Christian</option>
                <option value="Buddhist">Buddhist</option>
                <option value="Other">Other</option>
              </select>
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
              <span className="text-gray-600">ঠিকানা</span>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="বাড়ি/রাস্তা"
              />
            </label>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="text-sm font-medium text-gray-700 mb-2">নম্বর (প্রতি বিষয়) — সব ক্লাস 1-12 এর জন্য</div>
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
