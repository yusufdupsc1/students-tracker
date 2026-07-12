import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import ClassRoster from './pages/ClassRoster'
import ReportCard from './pages/ReportCard'
import MtrTracking from './pages/MtrTracking'
import StudentSearch from './pages/StudentSearch'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="roster" element={<ClassRoster />} />
        <Route path="report-card" element={<ReportCard />} />
        <Route path="mtr" element={<MtrTracking />} />
        <Route path="search" element={<StudentSearch />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
