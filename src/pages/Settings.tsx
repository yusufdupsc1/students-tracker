import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { useAuth } from '../contexts/AuthContext'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import type { School, ClassConfig, GradingScaleRow, SubjectSlot } from '../types'
import { DarkModeToggle } from '../components/DarkModeToggle'

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)
}

type ScaleRowLocal = GradingScaleRow & { _uid: string }


function AddNewClassForm({ classes }: { classes: ClassConfig[] }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const nextId = classes.length ? Math.max(...classes.map(c => c.id)) + 1 : 1
  async function onAdd() {
    const trimmed = name.trim()
    if (!trimmed) {
      alert('ক্লাসের নাম দিন')
      return
    }
    if (classes.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('এই নামে ক্লাস ইতিমধ্যে আছে')
      return
    }
    setBusy(true)
    try {
      const newClass: ClassConfig = {
        id: nextId,
        name: trimmed,
        subjects: [
          { id: 'bangla-' + Date.now(), name: 'বাংলা', fullMarks: 100 },
          { id: 'english-' + Date.now(), name: 'English', fullMarks: 100 },
          { id: 'math-' + Date.now(), name: 'গণিত', fullMarks: 100 },
        ],
        schoolId: 'school',
      }
      await db.classes.put(newClass)
      setName('')
    } catch (e) {
      alert('যোগ করতে সমস্যা')
    } finally {
      setBusy(false)
    }
  }
  async function onDelete(id: number) {
    const cls = classes.find(c => c.id === id)
    if (!cls) return
    if (!window.confirm(`ক্লাস ${cls.name} (${id}) মুছবেন? এর শিক্ষার্থীরা থাকলে orphan হবে।`)) return
    if (!window.confirm('নিশ্চিত? মুছে ফেলা শিক্ষার্থী ফিরে পাবেন না।')) return
    await db.classes.delete(id)
  }
  return (
    <div>
      <div className="flex gap-2">
        <input value={name} onChange={e => setName(e.target.value)} placeholder={`নতুন ক্লাস নাম (উদা: ত্রয়োদশ, প্লে, ${nextId})`} className="glass-input flex-1" />
        <button onClick={onAdd} disabled={busy} className="btn-primary whitespace-nowrap">
          {busy ? '...' : `+ ক্লাস ${nextId}`}
        </button>
      </div>
      {classes.length > 12 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {classes.filter(c => c.id > 12).map(c => (
            <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-bd-green-300 bg-white px-3 py-1.5 text-xs font-medium">
              {c.name} ({c.id})
              <button onClick={() => onDelete(c.id)} className="text-bd-red-600 hover:text-bd-red-800">×</button>
            </span>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-gray-400">১-১২ ডিফল্ট, এর বাইরে যেকোনো নামে ক্লাস যোগ করা যায় — Roster/Report/Import সবখানে দেখা যাবে।</p>
    </div>
  )
}


function Field({
  label,
  value,
  onChange,
  type = 'text'
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <input
        type={type}
        className="glass-input mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export default function Settings() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
  const [savedAt, setSavedAt] = useState(0)

  // --- School (single row) — 100% local IndexedDB, no Supabase ---
  const schoolLive = useLiveQuery(() => db.school.get('school'))
  const [school, setSchool] = useState<School | null>(null)
  useEffect(() => {
    if (schoolLive && !school) setSchool(schoolLive)
  }, [schoolLive, school])

  const saveSchool = useDebouncedCallback((s: School) => {
    void db.school.put(s)
    setSavedAt(Date.now())
    // Also keep per-user school copy in sync (for multi-school local)
    if (schoolId && s.id !== schoolId) {
      // If user has separate schoolId, keep that one too
      void db.school.put({ ...s, id: schoolId }).catch(() => {})
    }
  }, 600)
  const onSchool = (patch: Partial<School>) => {
    if (!school) return
    const next = { ...school, ...patch }
    setSchool(next)
    saveSchool(next)
  }

  // --- Grading scale (table keyed by minPercent) ---
  const scaleLive = useLiveQuery(
    () => schoolId ? db.gradingScale.where('schoolId').equals(schoolId).toArray() : db.gradingScale.toArray(),
    [schoolId]
  )
  const [scale, setScale] = useState<ScaleRowLocal[]>([])
  useEffect(() => {
    if (scaleLive && scale.length === 0) {
      setScale(scaleLive.map((r) => ({ ...r, _uid: uid() })))
    }
  }, [scaleLive, scale.length])

  const saveScale = useDebouncedCallback((rows: ScaleRowLocal[]) => {
    const clean = rows.map(({ _uid, ...r }) => r)
    void db.transaction('rw', db.gradingScale, async () => {
      await db.gradingScale.clear()
      await db.gradingScale.bulkPut(clean)
    })
    setSavedAt(Date.now())
  }, 600)

  const scaleDuplicate = (() => {
    const seen = new Set<number>()
    let dup = false
    for (const r of scale) {
      if (seen.has(r.minPercent)) dup = true
      seen.add(r.minPercent)
    }
    return dup
  })()
  const scaleValid =
    scale.length > 0 &&
    !scaleDuplicate &&
    scale.every(
      (r) =>
        r.minPercent >= 0 &&
        r.minPercent <= 100 &&
        !Number.isNaN(r.gpa) &&
        r.grade.trim() !== ''
    )

  const updateScaleRow = (u: string, patch: Partial<ScaleRowLocal>) => {
    const next = scale.map((r) => (r._uid === u ? { ...r, ...patch } : r))
    setScale(next)
    if (scaleValid) saveScale(next)
  }
  const addScaleRow = () => {
    const next = [...scale, { _uid: uid(), minPercent: 100, gpa: 0, grade: '', remark: '' }]
    setScale(next)
  }
  const removeScaleRow = (u: string) => {
    const next = scale.filter((r) => r._uid !== u)
    setScale(next)
    if (scaleValid) saveScale(next)
  }

  // --- Per-class subject configuration ---
  const classesLive = useLiveQuery(
    () => schoolId ? db.classes.where('schoolId').equals(schoolId).toArray() : db.classes.toArray(),
    [schoolId]
  )
  const [classes, setClasses] = useState<ClassConfig[]>([])
  useEffect(() => {
    if (classesLive && classes.length === 0) setClasses(classesLive)
  }, [classesLive, classes.length])

  const saveClasses = useDebouncedCallback((all: ClassConfig[]) => {
    void db.classes.bulkPut(all)
    setSavedAt(Date.now())
  }, 600)

  const updateClass = (classId: number, subjects: SubjectSlot[]) => {
    const next = classes.map((c) => (c.id === classId ? { ...c, subjects } : c))
    setClasses(next)
    saveClasses(next)
  }
  const updateSubject = (classId: number, subjId: string, patch: Partial<SubjectSlot>) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return
    updateClass(
      classId,
      cls.subjects.map((s) => (s.id === subjId ? { ...s, ...patch } : s))
    )
  }
  const addSubject = (classId: number) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls || cls.subjects.length >= 8) return
    updateClass(classId, [...cls.subjects, { id: uid(), name: '', fullMarks: 0 }])
  }
  const removeSubject = (classId: number, subjId: string) => {
    const cls = classes.find((c) => c.id === classId)
    if (!cls) return
    updateClass(
      classId,
      cls.subjects.filter((s) => s.id !== subjId)
    )
  }

  // --- "saved" indicator ---
  const showSaved = Date.now() - savedAt < 1500
  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(0), 1500)
    return () => clearTimeout(t)
  }, [savedAt])

  const scaleSorted = [...scale].sort((a, b) => b.minPercent - a.minPercent)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-heading font-bold text-bd-green-900 tracking-tight">সেটিংস</h1>

      {/* School info — extended for goal: complete school profile */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-4 text-bd-green-900">স্কুলের তথ্য — প্রোফাইল</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="স্কুলের নাম" value={school?.name ?? ''} onChange={(v) => onSchool({ name: v })} />
          <Field label="প্রধান শিক্ষক" value={(school as any)?.principalName ?? ''} onChange={(v) => onSchool({ principalName: v } as any)} />
          <Field label="গ্রাম" value={school?.village ?? ''} onChange={(v) => onSchool({ village: v })} />
          <Field label="ডাকঘর" value={school?.postOffice ?? ''} onChange={(v) => onSchool({ postOffice: v })} />
          <Field label="উপজেলা" value={school?.upazila ?? ''} onChange={(v) => onSchool({ upazila: v })} />
          <Field label="জেলা" value={school?.district ?? ''} onChange={(v) => onSchool({ district: v })} />
          <Field label="EIIN" value={(school as any)?.eiin ?? ''} onChange={(v) => onSchool({ eiin: v } as any)} />
          <Field label="স্থাপিত" value={(school as any)?.establishedYear ?? ''} onChange={(v) => onSchool({ establishedYear: v } as any)} />
          <Field label="ফোন" value={(school as any)?.phone ?? ''} onChange={(v) => onSchool({ phone: v } as any)} />
          <Field label="ইমেইল" value={(school as any)?.email ?? ''} onChange={(v) => onSchool({ email: v } as any)} />
          <Field label="শিক্ষাবর্ষ" value={(school as any)?.academicYear ?? ''} onChange={(v) => onSchool({ academicYear: v } as any)} />
          <Field label="সেশন" value={(school as any)?.session ?? ''} onChange={(v) => onSchool({ session: v } as any)} />
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-600">পরীক্ষা টার্ম (কমা দিয়ে আলাদা)</span>
            <input className="glass-input mt-1.5" value={((school as any)?.examTerms ?? []).join(', ')} onChange={(e) => onSchool({ examTerms: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } as any)} placeholder="প্রান্তিক-১, প্রান্তিক-২, বার্ষিক" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-600">শাখা (কমা দিয়ে)</span>
            <input className="glass-input mt-1.5" value={((school as any)?.sections ?? []).join(', ')} onChange={(e) => onSchool({ sections: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } as any)} placeholder="ক, খ, গ" />
          </label>
        </div>
        <p className="mt-4 text-xs text-gray-400 font-medium">পরিবর্তন স্বয়ংক্রিয়ভাবে লোকাল ডেটাবেসে সংরক্ষিত — সব ফর্মে (Add Student, Report) প্রতিফলিত হয়।</p>
      </section>

      {/* Grading scale */}
      <section className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-bd-green-900">গ্রেড স্কেল</h2>
          <button
            className="btn-primary"
            onClick={addScaleRow}
          >
            + সারি যোগ করুন
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-bd-green-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-sm text-bd-green-800 bg-bd-green-50/50">
                <th className="py-3 pr-3 font-semibold">ন্যূনতম %</th>
                <th className="py-3 pr-3 font-semibold">GPA</th>
                <th className="py-3 pr-3 font-semibold">গ্রেড</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {scaleSorted.map((r) => (
                <tr key={r._uid} className="border-t border-bd-green-100">
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      className="glass-input w-24"
                      value={r.minPercent}
                      onChange={(e) =>
                        updateScaleRow(r._uid, { minPercent: Number(e.target.value) })
                      }
                      aria-label={`ন্যূনতম % (${r.grade || 'গ্রেড'})`}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      type="number"
                      step="0.01"
                      className="glass-input w-20"
                      value={r.gpa}
                      onChange={(e) => updateScaleRow(r._uid, { gpa: Number(e.target.value) })}
                      aria-label={`GPA (${r.grade || 'গ্রেড'})`}
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <input
                      className="glass-input w-20"
                      value={r.grade}
                      onChange={(e) => updateScaleRow(r._uid, { grade: e.target.value })}
                      aria-label={`গ্রেড (ন্যূনতম ${r.minPercent}%)`}
                    />
                  </td>
                  <td className="py-2.5">
                    <button
                      className="text-bd-red-600 text-sm font-medium hover:text-bd-red-800 transition-colors duration-200"
                      onClick={() => removeScaleRow(r._uid)}
                    >
                      মুছুন
                    </button>
                  </td>
                </tr>
              ))}
              {scaleSorted.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-gray-400">
                    কোনো সারি নেই
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {scaleDuplicate && (
          <p className="mt-3 text-sm text-bd-red-700 font-medium">
            ন্যূনতম % এর মান ডুপ্লিকেট হতে পারবে না (রেঞ্জ ওভারল্যাপ)।
          </p>
        )}
        {!scaleValid && !scaleDuplicate && (
          <p className="mt-3 text-sm text-bd-red-700 font-medium">
            {scale.length === 0
              ? 'কমপক্ষে একটি গ্রেড সারি থাকতে হবে।'
              : 'সব সারিতে বৈধ % (০–১০০), GPA ও গ্রেড থাকতে হবে।'}
          </p>
        )}
        <p className="mt-3 text-xs text-gray-400">
          এই টেবিলটিই গ্রেডের একমাত্র উৎস (single source of truth) — লোকালেই সংরক্ষিত।
        </p>
      </section>

      {/* Per-class subjects */}
      <section className="space-y-4">
        <h2 className="text-lg font-heading font-semibold text-bd-green-900">ক্লাস অনুযায়ী বিষয় ও পূর্ণমান</h2>
        {classes.map((cls) => (
          <div key={cls.id} className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-semibold text-bd-green-900">ক্লাস {cls.name}</h3>
              <button
                className="rounded-xl border border-bd-green-700 px-4 py-2 text-bd-green-700 text-sm font-semibold disabled:opacity-40 hover:bg-bd-green-50 transition-all duration-200"
                disabled={cls.subjects.length >= 8}
                onClick={() => addSubject(cls.id)}
              >
                + বিষয় (স্লট {cls.subjects.length}/8)
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-bd-green-100">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm text-bd-green-800 bg-bd-green-50/50">
                    <th className="py-3 pr-3 font-semibold">বিষয়ের নাম</th>
                    <th className="py-3 pr-3 font-semibold">পূর্ণমান (০ = নিষ্ক্রিয়)</th>
                    <th className="py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cls.subjects.map((s) => (
                    <tr key={s.id} className="border-t border-bd-green-100">
                      <td className="py-2.5 pr-3">
                        <input
                          className="glass-input w-full min-w-[160px]"
                          value={s.name}
                          onChange={(e) => updateSubject(cls.id, s.id, { name: e.target.value })}
                          aria-label={`বিষয় (ক্লাস ${cls.name})`}
                        />
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="number"
                          className="glass-input w-28"
                          value={s.fullMarks}
                          onChange={(e) =>
                            updateSubject(cls.id, s.id, { fullMarks: Number(e.target.value) })
                          }
                          aria-label={`পূর্ণমান (ক্লাস ${cls.name})`}
                        />
                      </td>
                      <td className="py-2.5">
                        <button
                          className="text-bd-red-600 text-sm font-medium hover:text-bd-red-800 transition-colors duration-200"
                          onClick={() => removeSubject(cls.id, s.id)}
                        >
                          মুছুন
                        </button>
                      </td>
                    </tr>
                  ))}
                  {cls.subjects.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-3 text-gray-400">
                        কোনো সক্রিয় বিষয় নেই
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      {/* Add New Class — dynamic, aligns with goal: any class beyond 12 */}
      <section className="glass-card p-6 border-2 border-bd-green-200 bg-bd-green-50/30">
        <h2 className="text-lg font-heading font-semibold mb-2 text-bd-green-900">নতুন ক্লাস যোগ করুন</h2>
        <p className="text-sm text-gray-500 mb-3">যেকোনো নতুন ক্লাস (১৩+, প্লে, নার্সারি, কাস্টম) যোগ করুন — সাথে বিষয় ও পূর্ণমান ঠিক করুন। সব পেজে (Roster, Report, MTR, QR) তাৎক্ষণিক দেখা যাবে।</p>
        <AddNewClassForm classes={classes} />
      </section>

      {/* Other Options — aligning with school goal */}
      <section className="glass-card p-6">
        <h2 className="text-lg font-heading font-semibold mb-3 text-bd-green-900">অন্যান্য অপশন — স্কুল ম্যানেজমেন্ট</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-bd-green-100 p-4 bg-white">
            <div className="font-semibold text-bd-green-800">গ্রুপ (৯-১২)</div>
            <div className="text-xs text-gray-500 mt-1">Science / Arts / Commerce — Add Student ফর্মে দেখা যাবে</div>
            <input className="glass-input mt-2" value={((school as any)?.groups ?? []).join(', ')} onChange={(e) => onSchool({ groups: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) } as any)} placeholder="Science, Arts, Commerce" />
          </div>
          <div className="rounded-xl border border-bd-green-100 p-4 bg-white">
            <div className="font-semibold text-bd-green-800">থিম</div>
            <div className="text-xs text-gray-500 mt-1">ডার্ক / লাইট — সিস্টেম অনুযায়ী</div>
            <div className="mt-2"><DarkModeToggle /></div>
          </div>
          <div className="rounded-xl border border-bd-green-100 p-4 bg-white">
            <div className="font-semibold text-bd-green-800">লোগো URL</div>
            <div className="text-xs text-gray-500 mt-1">প্রিন্ট কার্ডে লোগো দেখাতে URL দিন (ঐচ্ছিক)</div>
            <input className="glass-input mt-2" value={(school as any)?.logoUrl ?? ''} onChange={(e) => onSchool({ logoUrl: e.target.value } as any)} placeholder="https://..." />
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-400">এই অপশনগুলো Add Student, Report Card, MTR, QR — সবখানে প্রযোজ্য।</div>
      </section>

      {/* Factory Reset — local lite DB */}
      <section className="glass-card p-6 border-2 border-bd-red-200 bg-bd-red-50/30">
        <h2 className="text-lg font-heading font-semibold mb-2 text-bd-red-700">ডেঞ্জার জোন — সব ডেটা রিসেট</h2>
        <p className="text-sm text-gray-600 mb-4">
          এই বাটন চাপলে <b>IndexedDB + LocalStorage</b> এর সব ডেটা (স্কুল, শিক্ষার্থী, ইউজার, সেশন) মুছে যাবে এবং ব্রাউজার রিফ্রেশ হয়ে আবার <b>নতুন করে সাইন আপ</b> করতে হবে। Vercel এ deploy এর পর নতুন ইউজাররা এখান থেকেই শুরু করবে — কোনো ইমেইল ভেরিফিকেশন লাগে না।
        </p>
        <button
          onClick={async () => {
            const first = window.confirm('⚠️ আপনি কি নিশ্চিত? সব লোকাল ডেটা মুছে যাবে!')
            if (!first) return
            const second = window.prompt('নিশ্চিত করতে লিখুন: RESET')
            if (second !== 'RESET') {
              alert('বাতিল করা হয়েছে। RESET লিখতে হয়।')
              return
            }
            try {
              // Clear Dexie + localStorage session + fallbacks
              const { db } = await import('../db/schema')
              await db.delete()
              localStorage.removeItem('bejkhonda-session')
              localStorage.removeItem('bejkhonda-users-fallback')
              localStorage.removeItem('bejkhonda-school-fallback')
              localStorage.removeItem('bejkhonda-remote-sync-meta')
              // Also clear all bejkhonda keys
              Object.keys(localStorage).forEach(k => {
                if (k.startsWith('bejkhonda')) localStorage.removeItem(k)
              })
              alert('✅ সব ডেটা মুছে ফেলা হয়েছে। এখন নতুন করে সাইন আপ করুন।')
              window.location.href = '/signup'
              setTimeout(() => window.location.reload(), 500)
            } catch (e) {
              console.error(e)
              alert('রিসেট করতে সমস্যা হয়েছে। DevTools → Application → Clear Storage চেষ্টা করুন।')
            }
          }}
          className="w-full sm:w-auto rounded-xl bg-bd-red-600 text-white px-6 py-3 text-sm font-bold hover:bg-bd-red-700 transition-colors"
        >
          🗑️ সব ডেটা মুছে ফেলুন (Factory Reset)
        </button>
        <p className="mt-3 text-xs text-gray-400">
          টিপস: নতুন ইউজার ইমেইল + পাসওয়ার্ড (৬ অক্ষর) দিয়ে সাইন আপ করবে → তাৎক্ষণিক লগইন → কোনো ইমেইল ভেরিফিকেশন নেই।
        </p>
      </section>

      {/* Saved indicator */}
      {showSaved && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-30 rounded-full bg-bd-green-700 px-5 py-2.5 text-white text-sm font-medium shadow-soft-lg">
          সংরক্ষিত ✓
        </div>
      )}
    </div>
  )
}
