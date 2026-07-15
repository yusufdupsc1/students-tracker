import { useState, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { useAuth } from '../contexts/AuthContext'
import QRCode from 'qrcode'

const CLASS_LIST = [1, 2, 3, 4, 5]
const CLASS_NAMES = ['', 'প্রথম', 'দ্বিতীয়', 'তৃতীয়', 'চতুর্থ', 'পঞ্চম']

export default function QrIds() {
  const { profile } = useAuth()
  const schoolId = (profile as any)?.school?.id || (profile as any)?.school_id
  const [classId, setClassId] = useState(1)
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({})

  const students = useLiveQuery(
    () => schoolId ? db.students.where('schoolId').equals(schoolId).and(s => s.classId === classId).toArray() : db.students.where('classId').equals(classId).toArray(),
    [schoolId, classId]
  )

  const sorted = useMemo(
    () => [...(students ?? [])].sort((a, b) => (a.roll || 0) - (b.roll || 0)),
    [students]
  )

  const generateQr = async (studentId: string) => {
    const data = JSON.stringify({ id: studentId, ts: Date.now() })
    const url = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: { dark: '#811B22', light: '#ffffff' }
    })
    setQrDataUrls((prev) => ({ ...prev, [studentId]: url }))
  }

  const printAll = () => {
    window.print()
  }

  return (
    <section>
      <h1 className="text-3xl font-heading font-bold text-bd-green-900 mb-5 tracking-tight">QR আইডি</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {CLASS_LIST.map((c) => (
          <button
            key={c}
            onClick={() => setClassId(c)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
              classId === c
                ? 'tab-active'
                : 'tab-inactive'
            }`}
          >
            {CLASS_NAMES[c]}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-gray-500">এই ক্লাসে কোনো শিক্ষার্থী নেই।</p>
      ) : (
        <>
          <div className="mb-4 flex gap-3">
            <button onClick={printAll} className="btn-primary">
              সব প্রিন্ট করুন
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sorted.map((s) => (
              <div
                key={s.id}
                className="glass-card p-4 flex flex-col items-center gap-2 print:break-inside-avoid"
              >
                <div className="text-sm font-heading font-semibold text-bd-green-900 text-center">
                  {s.name}
                </div>
                <div className="text-xs text-gray-500">
                  রোল {s.roll} · {CLASS_NAMES[s.classId]}
                </div>
                <button
                  onClick={() => generateQr(s.id)}
                  className="mt-2 rounded-xl border border-bd-green-200 px-3 py-2 text-xs font-medium text-bd-green-700 hover:bg-bd-green-50 transition-all duration-200"
                >
                  QR দেখুন
                </button>
                {qrDataUrls[s.id] && (
                  <img
                    src={qrDataUrls[s.id]}
                    alt={`QR for ${s.name}`}
                    className="w-32 h-32 mt-2"
                  />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
