import cors from 'cors'
import express from 'express'
import { corsOptions } from './config/cors.js'
import { env } from './config/env.js'
import { adminSupabase } from './config/supabase.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { notFound } from './middlewares/notFound.js'
import { buildHealthPayload } from './models/healthModel.js'
import { buildDashboardOverview } from './services/dashboardService.js'
import { getCourseIds, getQuizCount, getRandomQuiz, planForToday } from './services/learningService.js'
import { getTutorAnswer } from './services/tutorService.js'
import userRoutes from './routes/userRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

const app = express()

app.use(cors(corsOptions))
app.use(express.json())

app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'DevSchool backend API' })
})

app.get('/api/health', (_req, res) => {
  res.json(buildHealthPayload())
})

app.get('/api/test', (_req, res) => {
  res.json(buildHealthPayload())
})

app.get('/api/daily-plan', (req, res) => {
  const level = String(req.query.level || 'beginner')
  const language = String(req.query.language || 'en').toLowerCase()
  const focus = String(req.query.focus || '')
  res.json(planForToday({ level, language, focus }))
})

app.get('/api/quiz/random', (req, res) => {
  const courseId = String(req.query.courseId || 'html').toLowerCase()
  const count = Number(req.query.count || 8)
  const questions = getRandomQuiz({ courseId, count })
  res.json({
    courseId,
    count: questions.length,
    totalAvailable: getQuizCount(courseId),
    questions,
  })
})

app.post('/api/quiz/submit', (req, res) => {
  const score = Number(req.body?.score || 0)
  res.json({
    status: score >= 60 ? 'pass' : 'retry',
    feedback: score >= 60 ? 'Great consistency. Move to the next lesson.' : 'Review basics and retry quiz.',
  })
})

app.get('/api/dashboard/overview', async (req, res, next) => {
  try {
    const userId = String(req.query.userId || '').trim()
    const name = String(req.query.name || 'Learner').trim()
    const studyPoints = Number(req.query.studyPoints || 0)
    const streak = Number(req.query.streak || 0)
    const accuracy = Number(req.query.accuracy || 0)
    const completedChapters = Number(req.query.completedChapters || 0)
    const xp = Number(req.query.xp || 0)
    const courseIds = getCourseIds()

    const fallback = buildDashboardOverview({
      name,
      studyPoints,
      streak,
      accuracy,
      completedChapters,
      xp,
      courseIds,
    })

    if (!adminSupabase || !userId) {
      return res.json(fallback)
    }

    const { data, error } = await adminSupabase
      .from(env.dashboardTable)
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) {
      return res.json(fallback)
    }

    return res.json(
      buildDashboardOverview({
        name: data.name || fallback.profile.name,
        studyPoints: Number(data.study_points ?? studyPoints),
        streak: Number(data.streak ?? streak),
        accuracy: Number(data.accuracy ?? accuracy),
        completedChapters: Number(data.completed_chapters ?? completedChapters),
        xp: Number(data.xp ?? xp),
        courseIds,
      }),
    )
  } catch (error) {
    next(error)
  }
})

app.post('/api/dashboard/overview/sync', async (req, res, next) => {
  try {
    const userId = String(req.body?.userId || '').trim()
    if (!adminSupabase || !userId) {
      return res.json({ ok: false, persisted: false, reason: 'missing_db_or_user' })
    }

    const payload = {
      user_id: userId,
      name: String(req.body?.name || 'Learner'),
      study_points: Number(req.body?.studyPoints || 0),
      streak: Number(req.body?.streak || 0),
      accuracy: Number(req.body?.accuracy || 0),
      completed_chapters: Number(req.body?.completedChapters || 0),
      xp: Number(req.body?.xp || 0),
      updated_at: new Date().toISOString(),
    }

    const { error } = await adminSupabase.from(env.dashboardTable).upsert(payload, { onConflict: 'user_id' })
    if (error) {
      return res.status(500).json({ ok: false, persisted: false, error: error.message })
    }

    return res.json({ ok: true, persisted: true })
  } catch (error) {
    next(error)
  }
})

app.post('/api/tutor', async (req, res, next) => {
  try {
    const question = String(req.body?.question || '').trim()
    const language = String(req.body?.language || 'en').toLowerCase()
    const level = String(req.body?.level || 'beginner').toLowerCase()

    if (!question) {
      return res.status(400).json({ answer: 'Please ask a coding question.' })
    }

    const answer = await getTutorAnswer({ question, language, level })
    return res.json({ answer })
  } catch (error) {
    return res.status(500).json({
      answer: 'Tutor API is temporarily unavailable. Please try again.',
      error: error.message,
    })
  }
})

app.use('/api/user', userRoutes)
app.use('/api/auth', userRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
