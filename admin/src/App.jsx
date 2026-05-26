import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminCourses from './pages/AdminCourses'
import AdminChapters from './pages/AdminChapters'
import AdminLessons from './pages/AdminLessons'
import AdminQuizzes from './pages/AdminQuizzes'
import AdminRewards from './pages/AdminRewards'
import AdminNotifications from './pages/AdminNotifications'
import AdminModeration from './pages/AdminModeration'
import AdminLogs from './pages/AdminLogs'
import AdminSettings from './pages/AdminSettings'
import AdminLogin from './pages/AdminLogin'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="chapters" element={<AdminChapters />} />
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="rewards" element={<AdminRewards />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="logs" element={<AdminLogs />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
