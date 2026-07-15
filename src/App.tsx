import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'
import ErrorBoundary from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { db } from './db/schema'
import { startFaviconAnimation } from './lib/faviconAnimator'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'

// Every route is code-split so the initial bundle is tiny; the recharts-heavy
// Dashboard chunk and the xlsx Import chunk load on demand.
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

export default function App() {
  const school = useLiveQuery(() => db.school.get('school'))

  useEffect(() => {
    const name = school?.name || 'বেজখণ্ড সঃ প্রাঃ বিদ্যালয়'
    document.title = name
  }, [school])

  useEffect(() => {
    startFaviconAnimation()
  }, [])

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={lazyPage(<Dashboard />)} />
          <Route path="roster" element={lazyPage(<ClassRoster />)} />
          <Route path="report-card" element={lazyPage(<ReportCard />)} />
          <Route path="mtr" element={lazyPage(<MtrTracking />)} />
          <Route path="search" element={lazyPage(<StudentSearch />)} />
          <Route path="import" element={lazyPage(<Import />)} />
          <Route path="settings" element={lazyPage(<Settings />)} />
          <Route path="qr-ids" element={lazyPage(<QrIds />)} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  )
}
