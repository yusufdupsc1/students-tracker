import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [show, setShow] = useState(!navigator.onLine)

  useEffect(() => {
    const onOnline = () => {
      setIsOffline(false)
      // Show briefly then hide
      setTimeout(() => setShow(false), 2000)
    }
    const onOffline = () => {
      setIsOffline(true)
      setShow(true)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 flex justify-center p-3 pointer-events-none transition-all duration-300 ${
        isOffline ? 'translate-y-0' : 'translate-y-0'
      }`}
    >
      <div
        className={`px-4 py-2.5 rounded-full text-sm font-medium shadow-lg backdrop-blur border flex items-center gap-2 ${
          isOffline
            ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
            : 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-600/20'
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-white animate-pulse' : 'bg-white'}`} />
        {isOffline ? 'অফলাইন — ডেটা লোকালি সংরক্ষিত হচ্ছে' : '✓ অনলাইন — সিঙ্ক রেডি'}
      </div>
    </div>
  )
}
