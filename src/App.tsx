import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import PageLoader from './components/PageLoader'

// Every route is code-split so the initial bundle is tiny; the recharts-heavy
// Dashboard chunk and the xlsx Import chunk load on demand.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const ClassRoster = lazy(() => import('./pages/ClassRoster'))
const ReportCard = lazy(() => import('./pages/ReportCard'))
const MtrTracking = lazy(() => import('./pages/MtrTracking'))
const StudentSearch = lazy(() => import('./pages/StudentSearch'))
const Import = lazy(() => import('./pages/Import'))
const Settings = lazy(() => import('./pages/Settings'))

function lazyPage(node: React.ReactNode) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={lazyPage(<Dashboard />)} />
        <Route path="roster" element={lazyPage(<ClassRoster />)} />
        <Route path="report-card" element={lazyPage(<ReportCard />)} />
        <Route path="mtr" element={lazyPage(<MtrTracking />)} />
        <Route path="search" element={lazyPage(<StudentSearch />)} />
        <Route path="import" element={lazyPage(<Import />)} />
        <Route path="settings" element={lazyPage(<Settings />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
