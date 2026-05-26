import React, { useEffect, Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useApp } from './context/AppContext'
import ShellLayout from './components/ShellLayout'

// Lazy loaded pages for performance
const HomePage = lazy(() => import('./pages/HomePage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const ChapterPage = lazy(() => import('./pages/ChapterPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const QuizzesPage = lazy(() => import('./pages/QuizzesPage'))
const PracticePage = lazy(() => import('./pages/PracticePage'))
const TutorPage = lazy(() => import('./pages/TutorPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const LegalDocumentPage = lazy(() => import('./pages/LegalDocumentPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RoadmapBuilderPage = lazy(() => import('./pages/RoadmapBuilderPage'))

/**
 * Global Loading State
 */
const LoadingScreen = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg-page">
    <div className="w-12 h-12 rounded-full border-4 border-brand-cyan/20 border-t-brand-cyan animate-spin" />
    <p className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">Calibrating Roadmap...</p>
  </div>
)

/**
 * Auth Guard
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, profile, loading } = useApp()
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'ADMIN') return <Navigate to="/home" replace />
  
  return children
}

export default function App() {
  const { user, loading } = useApp()
  const { pathname } = useLocation()

  useEffect(() => {
    document.title = 'DevSchool Pro | Enterprise Edition'
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  if (loading) return <LoadingScreen />

  return (
    <div className="bg-bg-page min-h-screen text-slate-900 dark:text-white selection:bg-brand-cyan/30 transition-colors duration-300">
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a0f1e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            fontSize: '0.8rem',
            fontWeight: '900',
          },
        }}
      />
      
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={user ? <Navigate to="/home" replace /> : <LoginPage />} />

          {/* Protected Shell Routes */}
          <Route element={
            <ProtectedRoute>
              <ShellLayout />
            </ProtectedRoute>
          }>
            <Route path="/home" element={<HomePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/roadmap/builder" element={<RoadmapBuilderPage />} />
            <Route path="/chapter/:courseId/:chapterId" element={<ChapterPage />} />
            <Route path="/quizzes" element={<QuizzesPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:slug" element={<LegalDocumentPage />} />
            
            {/* Admin HQ */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}
