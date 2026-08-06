import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'
import ErrorBoundary from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { OfflineIndicator } from './components/OfflineIndicator'
import { ToastProvider } from './components/Toast'
import { FLNTheme } from './components/FLNTheme'
import { db } from './db/schema'
import { startFaviconAnimation } from './lib/faviconAnimator'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'

// FLN Command Center — 100% from screenshots, now the main dashboard
const FLNCommandCenter = lazy(() => import('./pages/FLNCommandCenter'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ClassRoster = lazy(() => import('./pages/ClassRoster'))
const ReportCard = lazy(() => import('./pages/ReportCard'))
const MtrTracking = lazy(() => import('./pages/MtrTracking'))
const StudentSearch = lazy(() => import('./pages/StudentSearch'))
const Import = lazy(() => import('./pages/Import'))
const Settings = lazy(() => import('./pages/Settings'))
const QrIds = lazy(() => import('./pages/QrIds'))

function lazyPage(node: React.ReactNode) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{node}</Suspense>
    </ErrorBoundary>
  )
}

export default function App({ initPromise }: { initPromise?: Promise<void> }) {
  const school = useLiveQuery(() => db.school.get('school'))
  const [initDone, setInitDone] = useState(false)

  useEffect(() => {
    const name = school?.name || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'
    document.title = name
  }, [school])

  useEffect(() => {
    startFaviconAnimation()
  }, [])

  useEffect(() => {
    if (initPromise) {
      initPromise.then(() => setInitDone(true)).catch(() => setInitDone(true))
      const t = setTimeout(() => setInitDone(true), 2000)
      return () => clearTimeout(t)
    } else {
      setInitDone(true)
    }
  }, [initPromise])

  if (!initDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden">
        <div className="absolute inset-0 bg-[#020617]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(6,182,214,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,214,0.3) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(6,182,214,0.3)]" />
          <p className="text-sm font-medium text-cyan-400 font-mono tracking-widest">SYSTEM INITIALIZING</p>
          <p className="text-xs text-slate-500 mt-1 font-mono">IndexedDB • FLN Command Center</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <OfflineIndicator />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="app/*"
            element={
              <FLNTheme>
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              </FLNTheme>
            }
          >
            <Route index element={lazyPage(<FLNCommandCenter />)} />
            <Route path="dashboard" element={lazyPage(<Dashboard />)} />
            <Route path="roster" element={lazyPage(<ClassRoster />)} />
            <Route path="report-card" element={lazyPage(<ReportCard />)} />
            <Route path="mtr" element={lazyPage(<MtrTracking />)} />
            <Route path="search" element={lazyPage(<StudentSearch />)} />
            <Route path="import" element={lazyPage(<Import />)} />
            <Route path="settings" element={lazyPage(<Settings />)} />
            <Route path="qr-ids" element={lazyPage(<QrIds />)} />
            <Route path="fln" element={lazyPage(<FLNCommandCenter />)} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </ToastProvider>
  )
}
