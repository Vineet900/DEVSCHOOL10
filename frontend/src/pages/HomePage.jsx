import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomBanner from '../components/dashboard/BottomBanner'
import CourseCard from '../components/dashboard/CourseCard'
import GlassCard from '../components/dashboard/GlassCard'
import ProgressBar from '../components/dashboard/ProgressBar'
import RightRail from '../components/dashboard/RightRail'
import StatCard from '../components/dashboard/StatCard'
import TopNavbar from '../components/dashboard/TopNavbar'
import { useApp } from '../context/AppContext'
import { API_BASE_URL } from '../lib/api'

const API_BASE = API_BASE_URL

export default function HomePage() {
  const navigate = useNavigate()
  const { state, stats, metadata, actions } = useApp()
  const [dashboardData, setDashboardData] = useState(null)

  const accuracy = useMemo(() => {
    const values = Object.values(state.quizScores || {})
    if (values.length === 0) return 0
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  }, [state.quizScores])

  const activeCourse = useMemo(
    () => metadata.courses.find((course) => course.id === state.selectedCourseId) || metadata.courses[0] || null,
    [metadata.courses, state.selectedCourseId],
  )

  const activeChapterSlug = useMemo(() => {
    if (!activeCourse) return ''
    return activeCourse.chapters.find((chapter) => chapter.slug === state.selectedChapterId)?.slug || activeCourse.chapters[0]?.slug || ''
  }, [activeCourse, state.selectedChapterId])

  const realCourses = useMemo(() => {
    if (!metadata?.courses) return []
    const gradients = ['from-orange-500 to-amber-400', 'from-cyan-500 to-blue-500', 'from-violet-500 to-fuchsia-500']
    
    return metadata.courses.slice(0, 3).map((course, index) => {
      const total = course.chapters?.length || 1
      const completed = course.chapters?.filter((ch) => state.completedChapters[`${course.id}:${ch.slug}`]).length || 0
      const progress = Math.round((completed / total) * 100)
      
      return {
        id: course.id,
        title: course.title[state.language] || course.id.toUpperCase(),
        progress,
        gradient: gradients[index % gradients.length],
      }
    })
  }, [metadata.courses, state.completedChapters, state.language])

  useEffect(() => {
    const userId = state.user.id || ''
    const params = new URLSearchParams({
      userId,
      name: state.user.name || 'Learner',
      studyPoints: String(state.studyPoints || 0),
      streak: String(state.streak || 0),
      accuracy: String(accuracy),
      completedChapters: String(stats.completedChapterCount || 0),
      xp: String(state.xp || 0),
    })
    fetch(`${API_BASE}/api/dashboard/overview?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => setDashboardData(json))
      .catch(() => setDashboardData(null))
  }, [state.user.id, state.user.name, state.studyPoints, state.streak, state.xp, stats.completedChapterCount, accuracy])

  const findCourseById = (courseId) => metadata.courses.find((course) => course.id === courseId) || null

  const findCourseIdByText = (text) => {
    const normalized = String(text || '').toLowerCase()
    const match = metadata.courses.find((course) => {
      const candidates = [course.id, course.title.en, course.title.hi, course.title.hinglish]
      return candidates.some((candidate) => normalized.includes(String(candidate || '').toLowerCase()))
    })
    return match?.id || null
  }

  const openChapter = (courseId, chapterSlug) => {
    if (!courseId || !chapterSlug) return
    actions.selectChapter(courseId, chapterSlug)
    navigate(`/chapter/${courseId}/${chapterSlug}`)
  }

  const openCourse = (courseId) => {
    const course = findCourseById(courseId)
    if (!course) return
    const chapterSlug =
      course.id === activeCourse?.id
        ? activeChapterSlug
        : course.chapters[0]?.slug || activeChapterSlug
    openChapter(course.id, chapterSlug)
  }

  const openAssessments = (courseId) => {
    if (courseId) actions.selectCourse(courseId)
    navigate('/quizzes')
  }

  const openContinueLearning = () => {
    const courseId =
      findCourseIdByText(dashboardData?.continueLearning?.title) ||
      activeCourse?.id ||
      metadata.courses[0]?.id
    if (courseId) openCourse(courseId)
  }

  const startStrictMode = () => {
    if (!activeCourse || !activeChapterSlug) {
      navigate('/courses')
      return
    }
    if (!state.focusMode.sessionActive) {
      actions.startFocusMode(activeCourse.id, activeChapterSlug)
    }
    openChapter(activeCourse.id, activeChapterSlug)
  }

  const startChallenge = () => {
    actions.saveEditorCode(buildLoginFormStarter())
    navigate('/editor')
  }

  const handleTopMenuSelect = (menuItem) => {
    switch (String(menuItem || '').toLowerCase()) {
      case 'learn':
        openContinueLearning()
        break
      case 'practice':
        navigate('/exercises')
        break
      case 'assess':
        openAssessments(activeCourse?.id || metadata.courses[0]?.id)
        break
      case 'strict mode':
        startStrictMode()
        break
      case 'earn rewards':
        navigate('/projects')
        break
      default:
        navigate('/home')
    }
  }

  const handleAssessmentSelect = (assessment) => {
    const courseId = findCourseIdByText(assessment?.title) || activeCourse?.id || metadata.courses[0]?.id
    openAssessments(courseId)
  }

  const handleAchievementSelect = () => {
    navigate('/profile')
  }

  const statActions = {
    lessons: { onClick: () => navigate('/courses'), actionLabel: 'Open courses' },
    points: { onClick: () => navigate('/projects'), actionLabel: 'See rewards' },
    streak: { onClick: () => navigate('/profile'), actionLabel: 'View profile' },
    accuracy: { onClick: () => openAssessments(activeCourse?.id || metadata.courses[0]?.id), actionLabel: 'Take quiz' },
  }

  if (!dashboardData) {
    return (
      <section className="space-y-5 pb-20 md:pb-4">
        <TopNavbar
          title="Learn & Earn - Build Skills, Bright Your Future"
          menu={['Learn', 'Practice', 'Assess']}
          onMenuSelect={handleTopMenuSelect}
        />
        <GlassCard>
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading live dashboard data...</p>
        </GlassCard>
      </section>
    )
  }

  return (
    <section className="space-y-4 pb-16 md:pb-2">
      <TopNavbar
        title="Learn & Earn - Build Skills, Bright Your Future"
        menu={dashboardData.topMenu}
        onMenuSelect={handleTopMenuSelect}
      />

      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {dashboardData.profile.name}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Focused today, rewarded tomorrow. Keep your streak alive.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openContinueLearning}
            className="interactive-chip rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            Resume lesson
          </button>
          <button
            type="button"
            onClick={startStrictMode}
            className="interactive-strong rounded-xl bg-linear-to-r from-violet-500 to-blue-500 px-3 py-1.5 text-sm font-semibold text-white"
          >
            {state.focusMode.sessionActive ? 'Return to focus mode' : 'Start focus mode'}
          </button>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
            {dashboardData.stats.map((stat) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                delta={stat.delta}
                onClick={statActions[stat.id]?.onClick}
                actionLabel={statActions[stat.id]?.actionLabel}
              />
            ))}
          </div>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <GlassCard>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Continue Learning</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{activeCourse?.title[state.language] || dashboardData.continueLearning.title}</h3>
              <p className="mt-1 mb-2 text-xs text-slate-600 dark:text-slate-300">{dashboardData.continueLearning.subtitle}</p>
              <ProgressBar value={realCourses.find(c => c.id === activeCourse?.id)?.progress || 0} gradient="from-blue-500 to-violet-500" />
              <button
                type="button"
                onClick={openContinueLearning}
                className="interactive-strong mt-3 rounded-lg bg-linear-to-r from-violet-500 to-blue-500 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </GlassCard>

            <GlassCard>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Today&apos;s Challenge</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{dashboardData.challenge.title}</h3>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{dashboardData.challenge.subtitle}</p>
              <button
                type="button"
                onClick={startChallenge}
                className="interactive-strong mt-6 rounded-lg bg-linear-to-r from-orange-500 to-amber-400 px-3 py-1.5 text-sm font-semibold text-black"
              >
                Start Challenge
              </button>
            </GlassCard>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Courses</h3>
              <button
                type="button"
                onClick={() => navigate('/courses')}
                className="interactive-chip rounded-full border border-transparent px-3 py-1 text-sm font-semibold text-blue-600 dark:text-blue-300"
              >
                View all
              </button>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              {realCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  title={course.title}
                  progress={course.progress}
                  gradient={course.gradient}
                  description="Open this path and continue with the next available chapter."
                  onOpen={() => openCourse(course.id)}
                />
              ))}
            </div>
          </div>

          <BottomBanner onAction={() => navigate('/projects')} />
        </div>

        <RightRail
          assessments={dashboardData.upcomingAssessments}
          achievements={dashboardData.achievements}
          onAssessmentSelect={handleAssessmentSelect}
          onAchievementSelect={handleAchievementSelect}
        />
      </div>
    </section>
  )
}

function buildLoginFormStarter() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login Form Challenge</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #eef2ff, #dbeafe);
      }
      .card {
        width: min(420px, calc(100vw - 32px));
        padding: 24px;
        border-radius: 24px;
        background: white;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
      }
      h1 { margin-top: 0; }
      label { display: block; margin: 14px 0 6px; font-weight: 600; }
      input {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
      }
      button {
        width: 100%;
        margin-top: 18px;
        padding: 12px 14px;
        border: 0;
        border-radius: 12px;
        background: #2563eb;
        color: white;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <form class="card">
      <h1>Build a Login Form</h1>
      <p>Add validation, forgot-password text, and a responsive layout.</p>
      <label for="email">Email</label>
      <input id="email" type="email" placeholder="you@example.com" />
      <label for="password">Password</label>
      <input id="password" type="password" placeholder="Minimum 8 characters" />
      <button type="submit">Sign in</button>
    </form>
  </body>
</html>`
}
