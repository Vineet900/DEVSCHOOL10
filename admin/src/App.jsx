import { Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminContent from './pages/AdminContent'
import AdminQuizzes from './pages/AdminQuizzes'
import AdminUsers from './pages/AdminUsers'
import AdminAssessments from './pages/AdminAssessments'
import AdminStudyPoints from './pages/AdminStudyPoints'
import AdminAiSettings from './pages/AdminAiSettings'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminSettings from './pages/AdminSettings'

export default function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="content" element={<AdminContent />} />
        <Route path="courses" element={<AdminContent />} />
        <Route path="quizzes" element={<AdminQuizzes />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="assessments" element={<AdminAssessments />} />
        <Route path="points" element={<AdminStudyPoints />} />
        <Route path="ai" element={<AdminAiSettings />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
