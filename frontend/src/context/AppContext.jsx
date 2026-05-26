/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react'
import { getCourseQuizzes, getCourses, fetchContentFromDB } from '../content/lessonStore'
import { t } from '../data/i18n'
import { isSupabaseConfigured, supabase, customMockStorage, SUPABASE_STORAGE_KEY } from '../lib/supabase'
import { userAPI, authAPI, quizAPI, roadmapAPI } from '../lib/api'
import {
  clampNumber,
  DAILY_GOAL_LIMITS,
  deriveFallbackUsername,
  FOCUS_DURATION_LIMITS,
  getProfileOwnerKey,
  isUsernameAvailable,
  releaseUsername,
  reserveUsername,
  resolveThemePreference,
  sanitizeProfileInput,
} from '../utils/profileSettings'

const AppContext = createContext(null)

const STORAGE_KEY_LEGACY = 'devschool-state'
// We will call getCourses() dynamically since it loads from DB
const categories = {
  en: ['Core'],
  hi: ['Core'],
  hinglish: ['Core'],
}
const learningLevels = ['beginner', 'intermediate', 'advanced', 'expert']
const projectsByLevel = {
  beginner: ['Resume page', 'Portfolio'],
  intermediate: ['Todo app', 'Calculator'],
  advanced: ['Ecommerce', 'Blog', 'Chat app'],
}
const dailyChallenge = {
  en: { title: 'Daily Challenge', description: 'Finish one chapter and solve one exercise.' },
  hi: { title: 'Daily Challenge', description: 'Ek chapter complete karo aur ek exercise solve karo.' },
  hinglish: { title: 'Daily Challenge', description: 'Ek chapter complete karo aur ek exercise solve karo.' },
}
const defaultFocusDurationMinutes = 25
const defaultFocusDurationSeconds = defaultFocusDurationMinutes * 60
const defaultAssessmentDurationSeconds = 15 * 60

const guestUserShape = () => ({
  name: 'Learner',
  loggedIn: false,
  email: null,
  phone: null,
  id: null,
  username: 'learner',
  avatar: '',
  bio: '',
})

function createDefaultState() {
  return {
    user: guestUserShape(),
    profileAvatar: '',
    profileName: '',
    username: '',
    profileEmail: '',
    profilePhone: '',
    profileBio: '',
    profileLocation: '',
    profilePortfolio: '',
    profileTechStack: [],
    profileLearningGoals: [],
    themePreference: 'system',
    darkMode: false,
    language: 'en',
    learningLevel: 'beginner',
    fontScale: 100,
    dailyGoal: 2,
    strictMode: false,
    focusDurationMinutes: defaultFocusDurationMinutes,
    profileVisible: true,
    streak: 1,
    studyHours: 0,
    studyTimeMinutes: 0,
    lastActiveDate: '',
    completedChapters: {},
    quizScores: {},
    completedProjects: [],
    selectedCourseId: 'html',
    selectedChapterId: '',
    searchQuery: '',
    editorCode: `<!doctype html>
<html>
  <head>
    <style>
      body { font-family: sans-serif; padding: 20px; }
      h1 { color: #2563eb; }
    </style>
  </head>
  <body>
    <h1>Welcome to DevSchool</h1>
    <p>Write code, run, and learn.</p>
    <script>
      console.log('DevSchool editor running')
    </script>
  </body>
</html>`,
    remindersEnabled: false,
    dailyChallenge: dailyChallenge.en,
    studyPoints: 0,
    pointsHistory: [],
    xp: 0,
    focusMode: {
      sessionActive: false,
      courseId: null,
      chapterId: null,
      violations: 0,
      timerEndsAt: null,
      timerRemaining: defaultFocusDurationSeconds,
      status: 'idle',
    },
    assessmentMode: {
      active: false,
      courseId: null,
      startedAt: null,
      timerEndsAt: null,
      timerRemaining: defaultAssessmentDurationSeconds,
      violations: 0,
      deductions: 0,
      score: 0,
      submitted: false,
      failed: false,
    },
  }
}

const defaultState = createDefaultState()

function persistenceKey(sessionUserId) {
  return sessionUserId ? `devschool-state-${sessionUserId}` : STORAGE_KEY_LEGACY
}

function normalizePointsHistory(history, studyPoints) {
  const safeHistory = Array.isArray(history)
    ? history
        .map((entry) => ({
          amount: Number(entry?.amount || 0),
          source: String(entry?.source || 'progress'),
          timestamp: Number(entry?.timestamp || 0),
        }))
        .filter((entry) => Number.isFinite(entry.amount) && Number.isFinite(entry.timestamp) && entry.timestamp > 0)
        .slice(-120)
    : []

  if (safeHistory.length > 0) return safeHistory
  if (studyPoints > 0) {
    return [{ amount: studyPoints, source: 'migrated-balance', timestamp: Date.now() }]
  }
  return []
}

function normalizePersistedState(parsed) {
  const base = createDefaultState()
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return base

  const themePreference =
    parsed.themePreference === 'light' || parsed.themePreference === 'dark' || parsed.themePreference === 'system'
      ? parsed.themePreference
      : parsed.darkMode
        ? 'dark'
        : 'light'

  const language = categories[parsed.language] ? parsed.language : base.language
  const dailyGoal = clampNumber(parsed.dailyGoal, DAILY_GOAL_LIMITS.min, DAILY_GOAL_LIMITS.max, base.dailyGoal)
  const focusDurationMinutes = clampNumber(
    parsed.focusDurationMinutes,
    FOCUS_DURATION_LIMITS.min,
    FOCUS_DURATION_LIMITS.max,
    base.focusDurationMinutes,
  )
  const studyPoints = Math.max(0, Number(parsed.studyPoints || 0))
  const xp = Math.max(0, Number(parsed.xp || 0))

  const next = {
    ...base,
    ...parsed,
    profileAvatar: String(parsed.profileAvatar || ''),
    profileName: String(parsed.profileName || ''),
    username: sanitizeProfileInput({ username: parsed.username }).username,
    profileEmail: String(parsed.profileEmail || '').trim().toLowerCase(),
    profilePhone: String(parsed.profilePhone || '').trim(),
    profileBio: String(parsed.profileBio || '').trim().slice(0, 240),
    profileLocation: String(parsed.profileLocation || '').trim(),
    profilePortfolio: String(parsed.profilePortfolio || '').trim(),
    profileTechStack: Array.isArray(parsed.profileTechStack) ? parsed.profileTechStack : [],
    profileLearningGoals: Array.isArray(parsed.profileLearningGoals) ? parsed.profileLearningGoals : [],
    themePreference,
    darkMode: resolveThemePreference(themePreference, false),
    language,
    learningLevel: learningLevels.includes(parsed.learningLevel) ? parsed.learningLevel : base.learningLevel,
    fontScale: clampNumber(parsed.fontScale, 90, 120, base.fontScale),
    dailyGoal,
    strictMode: Boolean(parsed.strictMode),
    focusDurationMinutes,
    profileVisible: parsed.profileVisible !== false,
    streak: Math.max(0, Number(parsed.streak ?? base.streak)),
    studyHours: Math.max(0, Number(parsed.studyHours || 0)),
    studyTimeMinutes: Math.max(0, Number(parsed.studyTimeMinutes || 0)),
    lastActiveDate: String(parsed.lastActiveDate || ''),
    completedChapters:
      parsed.completedChapters && typeof parsed.completedChapters === 'object' && !Array.isArray(parsed.completedChapters)
        ? parsed.completedChapters
        : {},
    quizScores:
      parsed.quizScores && typeof parsed.quizScores === 'object' && !Array.isArray(parsed.quizScores) ? parsed.quizScores : {},
    completedProjects: Array.isArray(parsed.completedProjects) ? parsed.completedProjects : [],
    remindersEnabled: Boolean(parsed.remindersEnabled),
    dailyChallenge: dailyChallenge[language] || dailyChallenge.en,
    studyPoints,
    pointsHistory: normalizePointsHistory(parsed.pointsHistory, studyPoints),
    xp,
    focusMode: {
      ...base.focusMode,
      ...(parsed.focusMode && typeof parsed.focusMode === 'object' ? parsed.focusMode : {}),
      timerRemaining: Number.isFinite(Number(parsed.focusMode?.timerRemaining))
        ? Number(parsed.focusMode.timerRemaining)
        : focusDurationMinutes * 60,
    },
    assessmentMode: {
      ...base.assessmentMode,
      ...(parsed.assessmentMode && typeof parsed.assessmentMode === 'object' ? parsed.assessmentMode : {}),
      timerRemaining: Number.isFinite(Number(parsed.assessmentMode?.timerRemaining))
        ? Number(parsed.assessmentMode.timerRemaining)
        : base.assessmentMode.timerRemaining,
    },
  }

  delete next.user
  return next
}

function loadPersistedLearningState(storageKey) {
  try {
    const value = localStorage.getItem(storageKey)
    if (!value) return createDefaultState()
    return normalizePersistedState(JSON.parse(value))
  } catch {
    return createDefaultState()
  }
}

function deriveUser(session, guestLogin) {
  if (session?.user) {
    const user = session.user
    const meta = user.user_metadata || {}
    const phone = user.phone ?? null
    const fromEmail = user.email?.split('@')[0]
    const nameGuess = meta.full_name || meta.name || fromEmail || (phone ? `***${String(phone).slice(-4)}` : null)
    const name = String(nameGuess || 'Learner')
    const email = user.email ?? null
    return {
      loggedIn: true,
      email,
      phone,
      id: user.id ?? null,
      name,
      username: deriveFallbackUsername({ name, email }),
      avatar: '',
      bio: '',
    }
  }

  if (guestLogin) {
    const name = guestLogin.name || 'Learner'
    return {
      loggedIn: true,
      email: null,
      phone: null,
      id: null,
      name,
      username: deriveFallbackUsername({ name }),
      avatar: '',
      bio: '',
    }
  }

  return guestUserShape()
}

function buildDisplayUser(baseUser, stateSlice) {
  const name = stateSlice.profileName.trim() || baseUser.name || 'Learner'
  const email = stateSlice.profileEmail.trim() || baseUser.email || null
  const phone = stateSlice.profilePhone.trim() || baseUser.phone || null
  const username = stateSlice.username || deriveFallbackUsername({ name, email })

  return {
    ...baseUser,
    name,
    email,
    phone,
    username,
    avatar: stateSlice.profileAvatar || '',
    bio: stateSlice.profileBio || '',
    location: stateSlice.profileLocation || '',
    portfolio: stateSlice.profilePortfolio || '',
    techStack: stateSlice.profileTechStack || [],
    learningGoals: stateSlice.profileLearningGoals || [],
  }
}

function serializeForStorage(stateSlice) {
  const payload = { ...stateSlice }
  delete payload.user
  return JSON.stringify(payload)
}

function isLoggedIn(session, guestLogin) {
  return Boolean((isSupabaseConfigured && session?.user) || (!isSupabaseConfigured && guestLogin))
}

function applyPointDelta(prevState, requestedAmount, source) {
  const amount = Number(requestedAmount || 0)
  if (!amount) {
    return { studyPoints: prevState.studyPoints, pointsHistory: prevState.pointsHistory }
  }

  const nextStudyPoints = Math.max(0, prevState.studyPoints + amount)
  const actualDelta = nextStudyPoints - prevState.studyPoints
  if (!actualDelta) {
    return { studyPoints: prevState.studyPoints, pointsHistory: prevState.pointsHistory }
  }

  return {
    studyPoints: nextStudyPoints,
    pointsHistory: [
      ...prevState.pointsHistory,
      {
        amount: actualDelta,
        source,
        timestamp: Date.now(),
      },
    ].slice(-120),
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => loadPersistedLearningState(STORAGE_KEY_LEGACY))
  const [session, setSession] = useState(null)
  const [guestLogin, setGuestLogin] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const persistIdentityRef = useRef(null)
  const [notice, setNotice] = useState(null)
  const [profile, setProfile] = useState(null)
  const [dbError, setDbError] = useState(null)
  const [customRoadmaps, setCustomRoadmaps] = useState([])

  const courses = useMemo(() => contentReady ? getCourses() : [], [contentReady])
  const courseQuizzes = useMemo(() => contentReady ? getCourseQuizzes() : {}, [contentReady])

  useEffect(() => {
    let cancelled = false

    async function boot() {
      const contentRes = await fetchContentFromDB()
      if (contentRes?.error) {
        if (!cancelled) setDbError(contentRes.error)
      }
      if (!cancelled) {
        setContentReady(true)
        // Set the initial selected chapter now that content is loaded
        setState(prev => {
          if (!prev.selectedChapterId) {
            const firstCourse = getCourses()[0]
            if (firstCourse) {
              return { ...prev, selectedCourseId: firstCourse.id, selectedChapterId: firstCourse.chapters[0]?.slug || '' }
            }
          }
          return prev
        })
      }

      if (!supabase) {
        if (!cancelled) setAuthReady(true)
        return
      }

      // Manually restore session from customMockStorage
      try {
        const storedToken = customMockStorage.getItem(SUPABASE_STORAGE_KEY)
        if (storedToken) {
          const parsedSession = JSON.parse(storedToken)
          if (parsedSession?.access_token && parsedSession?.refresh_token) {
            const { data: setSessionData, error: setSessionErr } = await supabase.auth.setSession(parsedSession)
            if (setSessionErr) {
              console.warn('Manual setSession error:', setSessionErr.message)
            } else if (setSessionData?.session && !cancelled) {
              setSession(setSessionData.session)
            }
          }
        }
      } catch (err) {
        console.warn('Failed to restore session from storage:', err)
      }

      const { data } = await supabase.auth.getSession()
      if (!cancelled) {
        if (data.session) {
          setSession(data.session)
        }
        setAuthReady(true)
      }
    }

    boot()
    const sub =
      supabase?.auth?.onAuthStateChange((_event, nextSession) => {
        if (nextSession) {
          customMockStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(nextSession))
        } else {
          customMockStorage.removeItem(SUPABASE_STORAGE_KEY)
        }
        setSession(nextSession)
      }) ?? null

    return () => {
      cancelled = true
      sub?.data?.subscription?.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const sessionId = session?.user?.id ?? null;
    if (!sessionId) return null;
    try {
      const { data } = await userAPI.getProfile();
      const profileData = data?.data?.profile;
      if (profileData) {
        setProfile(profileData);
        let parsedBio = { text: '', location: '', portfolio: '', techStack: [], learningGoals: [] };
        try {
          if (profileData.bio && profileData.bio.trim().startsWith('{')) {
            const json = JSON.parse(profileData.bio);
            parsedBio.text = json.bio || '';
            parsedBio.location = json.location || '';
            parsedBio.portfolio = json.portfolio || '';
            parsedBio.techStack = Array.isArray(json.techStack) ? json.techStack : [];
            parsedBio.learningGoals = Array.isArray(json.learningGoals) ? json.learningGoals : [];
          } else {
            parsedBio.text = profileData.bio || '';
          }
        } catch (e) {
          parsedBio.text = profileData.bio || '';
        }

        setState((prev) => ({
          ...prev,
          xp: Math.max(prev.xp || 0, profileData.xp || 0),
          studyPoints: Math.max(prev.studyPoints || 0, profileData.study_points || 0),
          streak: Math.max(prev.streak || 0, profileData.streak || 0),
          studyHours: Math.max(prev.studyHours || 0, profileData.study_hours || 0),
          studyTimeMinutes: Math.max(prev.studyTimeMinutes || 0, profileData.study_time_minutes || 0),
          lastActiveDate: profileData.last_active_date || prev.lastActiveDate,
          completedChapters: (profileData.progress && Object.keys(profileData.progress).length > 0)
            ? { ...prev.completedChapters, ...profileData.progress }
            : prev.completedChapters,
          quizScores: (profileData.quiz_scores && Object.keys(profileData.quiz_scores).length > 0)
            ? { ...prev.quizScores, ...profileData.quiz_scores }
            : prev.quizScores,
          profileName: profileData.full_name || prev.profileName,
          profileBio: parsedBio.text,
          profileLocation: parsedBio.location,
          profilePortfolio: parsedBio.portfolio,
          profileTechStack: parsedBio.techStack,
          profileLearningGoals: parsedBio.learningGoals,
          profileAvatar: profileData.avatar_url || prev.profileAvatar,
          username: profileData.username || prev.username,
        }));
        return profileData;
      }
    } catch (err) {
      console.error('Failed to sync db stats:', err);
    }
    return null;
  }, [session]);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage keyed by auth identity; must run before persist effect */
  useLayoutEffect(() => {
    if (!authReady) return

    const loggedIn = isLoggedIn(session, guestLogin)
    const sessionId = session?.user?.id ?? null
    const identity = loggedIn && sessionId ? `sid:${sessionId}` : loggedIn && guestLogin ? 'guest' : 'out'
    const previousIdentity = persistIdentityRef.current

    if (identity === previousIdentity) return
    persistIdentityRef.current = identity

    if (!loggedIn) {
      setState(loadPersistedLearningState(STORAGE_KEY_LEGACY))
      setProfile(null)
      return
    }

    const key = sessionId ? persistenceKey(sessionId) : STORAGE_KEY_LEGACY
    const localState = loadPersistedLearningState(key)
    setState(localState)

    if (sessionId) {
      refreshProfile();

      roadmapAPI.getUserRoadmaps().then(({ data }) => {
        if (data?.success) {
          setCustomRoadmaps(data.data || [])
        }
      }).catch(err => {
        console.warn('Failed to fetch custom roadmaps:', err)
      })
    } else {
      setProfile(null)
      setCustomRoadmaps([])
    }
  }, [authReady, session, guestLogin, refreshProfile])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const syncTheme = (prefersDark) => {
      setState((prev) => {
        const darkMode = resolveThemePreference(prev.themePreference, prefersDark)
        return prev.darkMode === darkMode ? prev : { ...prev, darkMode }
      })
    }

    syncTheme(mediaQuery.matches)

    if (state.themePreference !== 'system') return

    const handleThemeChange = (event) => syncTheme(event.matches)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleThemeChange)
      return () => mediaQuery.removeEventListener('change', handleThemeChange)
    }

    mediaQuery.addListener(handleThemeChange)
    return () => mediaQuery.removeListener(handleThemeChange)
  }, [state.themePreference])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.darkMode)
    document.documentElement.classList.toggle('light', !state.darkMode)
    document.documentElement.style.fontSize = `${state.fontScale}%`
  }, [state.darkMode, state.fontScale])

  useEffect(() => {
    if (!authReady) return
    const loggedIn = isLoggedIn(session, guestLogin)
    if (!loggedIn) return
    const key = session?.user?.id ? persistenceKey(session.user.id) : STORAGE_KEY_LEGACY
    localStorage.setItem(key, serializeForStorage(state))
  }, [state, authReady, session, guestLogin])

  // Automatic Stats Sync to Supabase

  useEffect(() => {
    if (!authReady || !session?.user?.id || !profile) return

    const syncTimeout = setTimeout(async () => {
      try {
        const statsToSync = {
          xp: state.xp,
          studyPoints: state.studyPoints,
          streak: state.streak,
          studyHours: state.studyHours,
          studyTimeMinutes: state.studyTimeMinutes,
          lastActiveDate: state.lastActiveDate,
          accuracy: state.assessmentMode.score || 0, // Simplified accuracy mapping
          progress: state.completedChapters,
          quizScores: state.quizScores,
        }
        await userAPI.syncStats(statsToSync)
      } catch (error) {
        console.error('Failed to sync stats to server:', error)
      }
    }, 5000) // Sync 5 seconds after last change to prevent spamming

    return () => clearTimeout(syncTimeout)
  }, [state.xp, state.studyPoints, state.streak, state.completedChapters, state.quizScores, authReady, session, profile])

  // Active Study Time Tracking: Increments studyTimeMinutes every 1 minute of visible activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setState((prev) => {
          const nextMinutes = (prev.studyTimeMinutes || 0) + 1
          const nextStudyHours = Math.floor(nextMinutes / 60)
          return {
            ...prev,
            studyTimeMinutes: nextMinutes,
            studyHours: nextStudyHours,
          }
        })
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!state.remindersEnabled || !('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const timer = setInterval(() => {
      new Notification('DevSchool Pro Reminder', { body: 'Time to study and complete your coding goal.' })
    }, 1000 * 60 * 60 * 4)

    return () => clearInterval(timer)
  }, [state.remindersEnabled])

  useEffect(() => {
    const timer = setInterval(() => {
      setState((prev) => {
        const next = { ...prev }
        let changed = false
        const now = Date.now()

        if (prev.focusMode.sessionActive && prev.focusMode.timerEndsAt) {
          const remaining = Math.max(0, Math.ceil((prev.focusMode.timerEndsAt - now) / 1000))
          if (remaining !== prev.focusMode.timerRemaining) {
            next.focusMode = { ...prev.focusMode, timerRemaining: remaining }
            changed = true
          }

          if (remaining === 0) {
            const rewardUpdate = applyPointDelta(prev, 10, 'focus-complete')
            next.focusMode = {
              ...prev.focusMode,
              sessionActive: false,
              timerRemaining: 0,
              status: 'completed',
            }
            next.studyPoints = rewardUpdate.studyPoints
            next.pointsHistory = rewardUpdate.pointsHistory
            next.xp = prev.xp + 20
            
            // Calculate next streak based on local calendar days
            const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
            let nextStreak = prev.streak
            if (!prev.lastActiveDate) {
              nextStreak = 1
            } else if (prev.lastActiveDate !== todayStr) {
              const prevDate = new Date(prev.lastActiveDate + 'T00:00:00')
              const currDate = new Date(todayStr + 'T00:00:00')
              const diffTime = currDate - prevDate
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
              
              if (diffDays === 1) {
                nextStreak = prev.streak + 1
              } else if (diffDays > 1) {
                nextStreak = 1
              }
            }
            next.streak = nextStreak
            next.lastActiveDate = todayStr
            
            // Credit actual focus session minutes to active study time
            next.studyTimeMinutes = (prev.studyTimeMinutes || 0) + focusDurationMinutes
            next.studyHours = Math.floor(next.studyTimeMinutes / 60)
            
            changed = true
            setNotice({ type: 'success', message: 'Focus session completed. +10 points and +20 XP.' })
          }
        }

        if (prev.assessmentMode.active && prev.assessmentMode.timerEndsAt) {
          const remaining = Math.max(0, Math.ceil((prev.assessmentMode.timerEndsAt - now) / 1000))
          if (remaining !== prev.assessmentMode.timerRemaining) {
            next.assessmentMode = { ...prev.assessmentMode, timerRemaining: remaining }
            changed = true
          }

          if (remaining === 0) {
            const netScore = Math.max(0, prev.assessmentMode.score - prev.assessmentMode.deductions)
            next.assessmentMode = {
              ...prev.assessmentMode,
              active: false,
              submitted: true,
              timerRemaining: 0,
              timerEndsAt: null,
              score: netScore,
            }
            changed = true
            setNotice({ type: 'warning', message: 'Assessment auto-submitted due to timeout.' })
          }
        }

        return changed ? next : prev
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const onBeforeUnload = () => {
      const prev = state
      let changed = false
      const next = { ...prev }

      if (prev.focusMode.sessionActive) {
        const penaltyUpdate = applyPointDelta(prev, -5, 'focus-abandon')
        next.focusMode = {
          ...prev.focusMode,
          sessionActive: false,
          status: 'failed',
          timerEndsAt: null,
        }
        next.studyPoints = penaltyUpdate.studyPoints
        next.pointsHistory = penaltyUpdate.pointsHistory
        changed = true
      }

      if (prev.assessmentMode.active) {
        next.assessmentMode = {
          ...prev.assessmentMode,
          active: false,
          failed: true,
          submitted: true,
          timerEndsAt: null,
        }
        changed = true
      }

      if (changed) {
        const key = session?.user?.id ? persistenceKey(session.user.id) : STORAGE_KEY_LEGACY
        localStorage.setItem(key, serializeForStorage(next))
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [state, session])

  const targetIdentity = useMemo(() => {
    const baseUser = deriveUser(session, guestLogin)
    const sessionId = session?.user?.id ?? null
    return baseUser.loggedIn && sessionId ? `sid:${sessionId}` : baseUser.loggedIn && guestLogin ? 'guest' : 'out'
  }, [session, guestLogin])

  const isStateSynced = persistIdentityRef.current === targetIdentity

  const resolvedUser = useMemo(() => {
    const baseUser = deriveUser(session, guestLogin)
    const userObj = buildDisplayUser({
      ...baseUser,
      loggedIn: baseUser.loggedIn && isStateSynced
    }, state)
    if (profile) {
      userObj.is_premium = profile.is_premium || false
      userObj.role = profile.role || 'STUDENT'
    }
    return userObj
  }, [state, session, guestLogin, isStateSynced, profile])

  const actions = useMemo(
    () => ({
      async refreshProfile() {
        return refreshProfile();
      },
      async signIn(email, password) {
        try {
          const res = await authAPI.login(email, password)
          if (res.data?.success && res.data?.data?.session) {
            const { session } = res.data.data
            const { error } = await supabase.auth.setSession(session)
            if (error) throw error
            return { data: res.data.data }
          } else {
            return { error: res.data?.message || 'Login failed' }
          }
        } catch (err) {
          console.error('Sign-in error:', err)
          return { error: err.response?.data?.message || err.message || 'Login failed' }
        }
      },
      async signUp(signupData) {
        try {
          const res = await authAPI.register(signupData)
          if (res.data?.success) {
            const signupResult = res.data.data
            if (signupResult?.session) {
              const { error } = await supabase.auth.setSession(signupResult.session)
              if (error) throw error
            }
            return { data: signupResult }
          } else {
            return { error: res.data?.message || 'Registration failed' }
          }
        } catch (err) {
          console.error('Sign-up error:', err)
          return { error: err.response?.data?.message || err.message || 'Registration failed' }
        }
      },
      async verifyOTP(email, otp) {
        try {
          const res = await authAPI.verify(email, otp)
          if (res.data?.success && res.data?.data?.session) {
            const { session } = res.data.data
            const { error } = await supabase.auth.setSession(session)
            if (error) throw error
            return { data: res.data.data }
          } else {
            return { error: res.data?.message || 'Verification failed' }
          }
        } catch (err) {
          console.error('Verification error:', err)
          return { error: err.response?.data?.message || err.message || 'Verification failed' }
        }
      },
      async resetPassword(email) {
        if (!supabase) return { error: new Error('Supabase is not configured.') }
        return supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        })
      },
      async signInWithGoogle() {
        if (!supabase) return { error: new Error('Supabase is not configured.') }
        return supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: `${window.location.origin}/login` },
        })
      },
      async sendPhoneOtp(phone, metadata) {
        if (!supabase) return { error: new Error('Supabase is not configured.') }
        const trimmed = String(phone || '').trim()
        const name = String(metadata?.fullName || '').trim()
        return supabase.auth.signInWithOtp({
          phone: trimmed,
          options: name ? { data: { full_name: name } } : undefined,
        })
      },
      async verifyPhoneOtp(phone, token) {
        if (!supabase) return { error: new Error('Supabase is not configured.') }
        return supabase.auth.verifyOtp({
          phone: String(phone || '').trim(),
          token: String(token || '').trim(),
          type: 'sms',
        })
      },
      guestLogin(displayName) {
        if (isSupabaseConfigured) return
        setGuestLogin({ name: displayName.trim() || 'Learner' })
      },
      async logout() {
        if (supabase) await supabase.auth.signOut()
        setGuestLogin(null)
        setCustomRoadmaps([])
        persistIdentityRef.current = null
        setState(loadPersistedLearningState(STORAGE_KEY_LEGACY))
      },
      toggleDarkMode() {
        setState((prev) => {
          const nextTheme = prev.darkMode ? 'light' : 'dark'
          return { ...prev, themePreference: nextTheme, darkMode: nextTheme === 'dark' }
        })
      },
      setThemePreference(themePreference) {
        const nextTheme = themePreference === 'light' || themePreference === 'dark' || themePreference === 'system' ? themePreference : 'system'
        const systemPrefersDark =
          typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-color-scheme: dark)').matches
            : false

        setState((prev) => ({
          ...prev,
          themePreference: nextTheme,
          darkMode: resolveThemePreference(nextTheme, systemPrefersDark),
        }))
      },
      setLanguage(language) {
        const nextLanguage = categories[language] ? language : 'en'
        setState((prev) => ({
          ...prev,
          language: nextLanguage,
          dailyChallenge: dailyChallenge[nextLanguage] || dailyChallenge.en,
        }))
      },
      setLearningLevel(learningLevel) {
        const nextLevel = learningLevels.includes(learningLevel) ? learningLevel : defaultState.learningLevel
        setState((prev) => ({ ...prev, learningLevel: nextLevel }))
      },
      setFontScale(fontScale) {
        setState((prev) => ({ ...prev, fontScale: clampNumber(fontScale, 90, 120, prev.fontScale) }))
      },
      setDailyGoal(dailyGoal) {
        setState((prev) => ({
          ...prev,
          dailyGoal: clampNumber(dailyGoal, DAILY_GOAL_LIMITS.min, DAILY_GOAL_LIMITS.max, prev.dailyGoal),
        }))
      },
      setStrictMode(strictMode) {
        setState((prev) => ({ ...prev, strictMode: Boolean(strictMode) }))
      },
      setFocusDurationMinutes(focusDurationMinutes) {
        const nextMinutes = clampNumber(
          focusDurationMinutes,
          FOCUS_DURATION_LIMITS.min,
          FOCUS_DURATION_LIMITS.max,
          state.focusDurationMinutes,
        )

        setState((prev) => ({
          ...prev,
          focusDurationMinutes: nextMinutes,
          focusMode:
            prev.focusMode.sessionActive || prev.focusMode.status === 'active'
              ? prev.focusMode
              : { ...prev.focusMode, timerRemaining: nextMinutes * 60 },
        }))
      },
      setProfileVisibility(profileVisible) {
        setState((prev) => ({ ...prev, profileVisible: Boolean(profileVisible) }))
      },
      saveAccountProfile(profile) {
        const sanitized = sanitizeProfileInput(profile)
        const errors = {}

        if (!sanitized.name) errors.name = 'Name is required.'
        if (!sanitized.username) errors.username = 'Username is required.'

        const ownerKey = getProfileOwnerKey(resolvedUser)
        if (sanitized.username && !isUsernameAvailable(sanitized.username, ownerKey)) {
          errors.username = 'That username is already taken on this device.'
        }

        if (Object.keys(errors).length > 0) {
          return {
            ok: false,
            message: 'Please review the profile form and try again.',
            errors,
          }
        }

        reserveUsername(sanitized.username, ownerKey, state.username)
        setState((prev) => ({
          ...prev,
          profileName: sanitized.name,
          username: sanitized.username,
          profileEmail: sanitized.email,
          profilePhone: sanitized.phone,
          profileBio: sanitized.bio,
          profileLocation: sanitized.location || '',
          profilePortfolio: sanitized.portfolio || '',
          profileTechStack: sanitized.techStack || [],
          profileLearningGoals: sanitized.learningGoals || [],
          profileAvatar: sanitized.avatar || prev.profileAvatar,
        }))

        return { ok: true, profile: sanitized }
      },
      async changePassword(currentPassword, newPassword) {
        if (!String(currentPassword || '').trim()) {
          return { ok: false, message: 'Current password is required.' }
        }

        if (String(newPassword || '').length < 8) {
          return { ok: false, message: 'Password must be at least 8 characters.' }
        }

        if (!supabase || !session?.user) {
          return {
            ok: false,
            placeholder: true,
            message: 'Password changes require a connected authentication backend.',
          }
        }

        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) {
          return { ok: false, message: error.message }
        }

        return { ok: true }
      },
      selectCourse(courseId) {
        const fallbackCourse = courses[0]
        const pickedCourse = courses.find((course) => course.id === courseId) || fallbackCourse
        setState((prev) => ({
          ...prev,
          selectedCourseId: pickedCourse.id,
          selectedChapterId: pickedCourse.chapters[0]?.slug || '',
        }))
      },
      selectChapter(courseId, chapterId) {
        setState((prev) => ({
          ...prev,
          selectedCourseId: courseId,
          selectedChapterId: chapterId,
        }))
      },
      completeChapter(courseId, chapterId) {
        setState((prev) => {
          const key = `${courseId}:${chapterId}`
          if (prev.completedChapters[key]) return prev
          const nextCompletedChapters = { ...prev.completedChapters, [key]: true }
          const nextXp = prev.xp + 50 // Award 50 XP per completed chapter
          
          // Calculate streak based on local timezone calendar days
          const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
          let nextStreak = prev.streak
          if (!prev.lastActiveDate) {
            nextStreak = 1
          } else if (prev.lastActiveDate !== todayStr) {
            const prevDate = new Date(prev.lastActiveDate + 'T00:00:00')
            const currDate = new Date(todayStr + 'T00:00:00')
            const diffTime = currDate - prevDate
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
            
            if (diffDays === 1) {
              nextStreak = prev.streak + 1
            } else if (diffDays > 1) {
              nextStreak = 1
            }
          }

          // Immediately persist to backend (non-blocking) after state updates
          if (authReady && session?.user?.id && profile) {
            setTimeout(() => {
              userAPI.syncStats({
                xp: nextXp,
                studyPoints: prev.studyPoints,
                streak: nextStreak,
                studyHours: prev.studyHours,
                studyTimeMinutes: prev.studyTimeMinutes,
                lastActiveDate: todayStr,
                progress: nextCompletedChapters,
                quizScores: prev.quizScores,
              }).catch(err => console.warn('Chapter completion sync failed:', err))
            }, 0)
          }

          return {
            ...prev,
            completedChapters: nextCompletedChapters,
            xp: nextXp,
            streak: nextStreak,
            lastActiveDate: todayStr
          }
        })
      },
      saveEditorCode(editorCode) {
        setState((prev) => ({ ...prev, editorCode }))
      },
      resetEditorCode() {
        setState((prev) => ({ ...prev, editorCode: defaultState.editorCode }))
      },
      setSearchQuery(searchQuery) {
        setState((prev) => ({ ...prev, searchQuery }))
      },
      submitQuiz(courseId, score) {
        setState((prev) => {
          const rewardUpdate = score >= 60 ? applyPointDelta(prev, 5, 'quiz-pass') : null
          const nextXp = score >= 60 ? prev.xp + 10 : prev.xp
          const nextQuizScores = { ...prev.quizScores, [courseId]: score }
          const nextStudyPoints = rewardUpdate ? rewardUpdate.studyPoints : prev.studyPoints

          // Sync quiz result to backend immediately
          if (authReady && session?.user?.id && profile) {
            setTimeout(() => {
              userAPI.syncStats({
                xp: nextXp,
                studyPoints: nextStudyPoints,
                streak: prev.streak,
                quizScores: nextQuizScores,
              }).catch(err => console.warn('Quiz sync failed:', err))
            }, 0)
          }

          return {
            ...prev,
            quizScores: nextQuizScores,
            studyPoints: nextStudyPoints,
            pointsHistory: rewardUpdate ? rewardUpdate.pointsHistory : prev.pointsHistory,
            xp: nextXp,
          }
        })
      },
      startFocusMode(courseId, chapterId, durationSeconds = state.focusDurationMinutes * 60) {
        const endsAt = Date.now() + durationSeconds * 1000
        setState((prev) => ({
          ...prev,
          focusMode: {
            sessionActive: true,
            courseId,
            chapterId,
            violations: 0,
            timerEndsAt: endsAt,
            timerRemaining: durationSeconds,
            status: 'active',
          },
        }))
        setNotice({ type: 'info', message: 'Focus Mode Active. Stay on this lesson.' })
      },
      registerFocusViolation() {
        setState((prev) => {
          if (!prev.focusMode.sessionActive) return prev
          const violations = prev.focusMode.violations + 1

          if (violations >= 3) {
            const penaltyUpdate = applyPointDelta(prev, -10, 'focus-failed')
            setNotice({ type: 'error', message: 'Focus session failed after 3 violations.' })
            return {
              ...prev,
              studyPoints: penaltyUpdate.studyPoints,
              pointsHistory: penaltyUpdate.pointsHistory,
              focusMode: {
                ...prev.focusMode,
                sessionActive: false,
                status: 'failed',
                violations,
                timerEndsAt: null,
              },
            }
          }

          if (violations === 2) {
            const penaltyUpdate = applyPointDelta(prev, -5, 'focus-warning')
            setNotice({ type: 'warning', message: 'Second violation. 5 points deducted.' })
            return {
              ...prev,
              studyPoints: penaltyUpdate.studyPoints,
              pointsHistory: penaltyUpdate.pointsHistory,
              focusMode: { ...prev.focusMode, violations },
            }
          }

          setNotice({ type: 'warning', message: 'Warning: keep the app focused.' })
          return {
            ...prev,
            focusMode: { ...prev.focusMode, violations },
          }
        })
      },
      cancelFocusMode(penalty = true) {
        setState((prev) => {
          if (!prev.focusMode.sessionActive) return prev
          const penaltyUpdate = penalty ? applyPointDelta(prev, -5, 'focus-cancelled') : null
          return {
            ...prev,
            studyPoints: penaltyUpdate ? penaltyUpdate.studyPoints : prev.studyPoints,
            pointsHistory: penaltyUpdate ? penaltyUpdate.pointsHistory : prev.pointsHistory,
            focusMode: {
              ...prev.focusMode,
              sessionActive: false,
              status: 'failed',
              timerEndsAt: null,
            },
          }
        })
      },
      startAssessment(courseId, durationSeconds = defaultAssessmentDurationSeconds) {
        const endsAt = Date.now() + durationSeconds * 1000
        setState((prev) => ({
          ...prev,
          assessmentMode: {
            active: true,
            courseId,
            startedAt: Date.now(),
            timerEndsAt: endsAt,
            timerRemaining: durationSeconds,
            violations: 0,
            deductions: 0,
            score: 0,
            submitted: false,
            failed: false,
          },
        }))
      },
      updateAssessmentScore(rawScore) {
        setState((prev) => {
          if (!prev.assessmentMode.active) return prev
          const score = Math.max(0, Math.round(Number(rawScore || 0)))
          if (score === prev.assessmentMode.score) return prev
          return {
            ...prev,
            assessmentMode: {
              ...prev.assessmentMode,
              score,
            },
          }
        })
      },
      registerAssessmentViolation(reason = 'default') {
        setState((prev) => {
          if (!prev.assessmentMode.active) return prev
          const violations = prev.assessmentMode.violations + 1

          if (violations >= 3) {
            const netScore = Math.max(0, prev.assessmentMode.score - prev.assessmentMode.deductions)
            setNotice({ type: 'error', message: 'Assessment auto-submitted after 3 violations.' })
            return {
              ...prev,
              assessmentMode: {
                ...prev.assessmentMode,
                active: false,
                submitted: true,
                failed: true,
                violations,
                timerEndsAt: null,
                score: netScore,
              },
            }
          }

          if (violations === 2) {
            setNotice({
              type: 'warning',
              message:
                reason === 'navigation'
                  ? t(state.language, 'assessmentNavLockedDeductionNotice')
                  : 'Second assessment violation. 5 marks deducted.',
            })
            return {
              ...prev,
              assessmentMode: {
                ...prev.assessmentMode,
                violations,
                deductions: prev.assessmentMode.deductions + 5,
              },
            }
          }

          setNotice({
            type: 'warning',
            message:
              reason === 'navigation'
                ? t(state.language, 'assessmentNavLockedNotice')
                : 'Assessment warning: stay in fullscreen and focused.',
          })
          return {
            ...prev,
            assessmentMode: { ...prev.assessmentMode, violations },
          }
        })
      },
      quitAssessment(penaltyPoints = 5) {
        const absolutePenalty = Math.abs(Number(penaltyPoints || 0))
        setState((prev) => {
          if (!prev.assessmentMode.active) return prev
          const penaltyUpdate = absolutePenalty ? applyPointDelta(prev, -absolutePenalty, 'assessment-quit') : null
          const netScore = Math.max(0, prev.assessmentMode.score - prev.assessmentMode.deductions)
          return {
            ...prev,
            studyPoints: penaltyUpdate ? penaltyUpdate.studyPoints : prev.studyPoints,
            pointsHistory: penaltyUpdate ? penaltyUpdate.pointsHistory : prev.pointsHistory,
            assessmentMode: {
              ...prev.assessmentMode,
              active: false,
              submitted: true,
              failed: true,
              timerEndsAt: null,
              score: netScore,
            },
          }
        })
        setNotice({
          type: 'warning',
          message: t(state.language, 'assessmentQuitPenaltyNotice'),
        })
      },
      async submitAssessment(quizId, answers, timeTaken, violations) {
        try {
          if (isSupabaseConfigured) {
            const res = await quizAPI.submitAttempt(quizId, {
              answers,
              time_taken_seconds: timeTaken,
              violations,
            })
            if (res.data?.success) {
              const { score, passed } = res.data.data
              setState((prev) => {
                const net = Math.max(0, score - prev.assessmentMode.deductions)
                const rewardUpdate = passed ? applyPointDelta(prev, 5, 'assessment-pass') : null
                return {
                  ...prev,
                  quizScores: { ...prev.quizScores, [quizId]: net },
                  assessmentMode: {
                    ...prev.assessmentMode,
                    active: false,
                    score: net,
                    submitted: true,
                    timerEndsAt: null,
                  },
                  xp: passed ? prev.xp + (res.data.data.attempt?.xp_reward || 100) : prev.xp,
                  studyPoints: rewardUpdate ? rewardUpdate.studyPoints : prev.studyPoints,
                  pointsHistory: rewardUpdate ? rewardUpdate.pointsHistory : prev.pointsHistory,
                }
              })
              return { success: true, score }
            }
          }
        } catch (err) {
          console.error('Failed to submit assessment to backend:', err)
        }

        // Local fallback calculation for guest mode
        const questions = courseQuizzes[quizId] || []
        let correctCount = 0
        questions.forEach((q, idx) => {
          if (answers[idx] === q.answer) correctCount++
        })
        const calculatedScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

        setState((prev) => {
          const net = Math.max(0, calculatedScore - prev.assessmentMode.deductions)
          const passed = net >= 60
          const rewardUpdate = passed ? applyPointDelta(prev, 5, 'assessment-pass') : null
          return {
            ...prev,
            quizScores: { ...prev.quizScores, [quizId]: net },
            assessmentMode: {
              ...prev.assessmentMode,
              active: false,
              score: net,
              submitted: true,
              timerEndsAt: null,
            },
            xp: passed ? prev.xp + 10 : prev.xp,
            studyPoints: rewardUpdate ? rewardUpdate.studyPoints : prev.studyPoints,
            pointsHistory: rewardUpdate ? rewardUpdate.pointsHistory : prev.pointsHistory,
          }
        })
      },
      clearAssessment() {
        setState((prev) => ({
          ...prev,
          assessmentMode: { ...defaultState.assessmentMode },
        }))
      },
      setProfileAvatar(avatar) {
        setState((prev) => ({ ...prev, profileAvatar: avatar || '' }))
      },
      completeProject(projectName) {
        setState((prev) => {
          if (prev.completedProjects.includes(projectName)) return prev
          return {
            ...prev,
            completedProjects: [...prev.completedProjects, projectName],
          }
        })
      },
      markMissedDay() {
        setState((prev) => ({
          ...prev,
          streak: Math.max(0, prev.streak - 1),
        }))
      },
      claimDailyChallenge() {
        setState((prev) => ({ ...prev, streak: prev.streak + 1 }))
      },
      async convertXPToRP(amount) {
        try {
          if (state.xp < amount) {
            return { success: false, error: 'Insufficient XP' }
          }
          
          if (isSupabaseConfigured && session?.user?.id) {
            const res = await userAPI.convertXP(amount)
            if (!res.data?.success) {
              throw new Error(res.data?.message || 'Conversion failed')
            }
          }

          setState((prev) => ({
            ...prev,
            xp: Math.max(0, prev.xp - amount),
            studyPoints: prev.studyPoints + (amount / 100)
          }))

          return { success: true }
        } catch (err) {
          console.error('Failed to convert XP:', err)
          return { success: false, error: err.message || 'Conversion failed' }
        }
      },
      setRemindersEnabled(enabled) {
        setState((prev) => ({ ...prev, remindersEnabled: Boolean(enabled) }))
      },
      resetProgress() {
        setState((prev) => ({
          ...prev,
          streak: 1,
          studyHours: 0,
          completedChapters: {},
          quizScores: {},
          completedProjects: [],
          selectedCourseId: defaultState.selectedCourseId,
          selectedChapterId: defaultState.selectedChapterId,
          searchQuery: '',
          studyPoints: 0,
          pointsHistory: [],
          xp: 0,
          focusMode: {
            ...defaultState.focusMode,
            timerRemaining: prev.focusDurationMinutes * 60,
          },
          assessmentMode: { ...defaultState.assessmentMode },
        }))
        setNotice({ type: 'warning', message: 'Learning progress has been reset on this device.' })
      },
      async deleteAccountData() {
        const ownerKey = getProfileOwnerKey(resolvedUser)
        releaseUsername(state.username, ownerKey)
        localStorage.removeItem(STORAGE_KEY_LEGACY)
        if (session?.user?.id) {
          localStorage.removeItem(persistenceKey(session.user.id))
        }
        if (supabase) await supabase.auth.signOut()
        setGuestLogin(null)
        persistIdentityRef.current = null
        setState(loadPersistedLearningState(STORAGE_KEY_LEGACY))
        setNotice({ type: 'warning', message: 'Local account data removed from this device.' })
      },
      clearNotice() {
        setNotice(null)
      },
      async fetchCustomRoadmaps() {
        try {
          if (!session?.user?.id) return
          const { data } = await roadmapAPI.getUserRoadmaps()
          if (data?.success) {
            setCustomRoadmaps(data.data || [])
          }
        } catch (err) {
          console.error('Failed to fetch custom roadmaps:', err)
        }
      },
      async createCustomRoadmap(roadmap) {
        try {
          const { data } = await roadmapAPI.createUserRoadmap(roadmap)
          if (data?.success) {
            setCustomRoadmaps(prev => [...prev, data.data])
            return { success: true, data: data.data }
          }
          return { success: false, error: 'Failed to create roadmap' }
        } catch (err) {
          console.error('Failed to create custom roadmap:', err)
          return { success: false, error: err.response?.data?.message || err.message }
        }
      },
      async updateCustomRoadmap(id, roadmap) {
        try {
          const { data } = await roadmapAPI.updateUserRoadmap(id, roadmap)
          if (data?.success) {
            setCustomRoadmaps(prev => prev.map(r => r.id === id ? data.data : r))
            return { success: true, data: data.data }
          }
          return { success: false, error: 'Failed to update roadmap' }
        } catch (err) {
          console.error('Failed to update custom roadmap:', err)
          return { success: false, error: err.response?.data?.message || err.message }
        }
      },
      async deleteCustomRoadmap(id) {
        try {
          const { data } = await roadmapAPI.deleteUserRoadmap(id)
          if (data?.success) {
            setCustomRoadmaps(prev => prev.filter(r => r.id !== id))
            return { success: true }
          }
          return { success: false, error: 'Failed to delete roadmap' }
        } catch (err) {
          console.error('Failed to delete custom roadmap:', err)
          return { success: false, error: err.response?.data?.message || err.message }
        }
      },
    }),
    [resolvedUser, session, state.focusDurationMinutes, state.language, state.username, courseQuizzes, state.xp, refreshProfile],
  )

  const totalChapters = courses.reduce((sum, course) => sum + course.chapters.length, 0) || 1
  const completedChapterCount = Object.keys(state.completedChapters).length
  const skillPercentage = Math.round((completedChapterCount / totalChapters) * 100) || 0
  const quizAverage =
    Object.values(state.quizScores).length > 0
      ? Math.round(Object.values(state.quizScores).reduce((accumulator, value) => accumulator + value, 0) / Object.values(state.quizScores).length)
      : 0

  const flatProjects = Object.values(projectsByLevel).flat()
  const unlockedCount = Math.max(1, Math.ceil((skillPercentage / 100) * flatProjects.length))
  const unlockedProjects = flatProjects.slice(0, unlockedCount)

  const displayState = useMemo(() => ({ ...state, user: resolvedUser }), [state, resolvedUser])

  return (
    <AppContext.Provider
      value={{
        authReady: authReady && isStateSynced,
        contentReady,
        state: displayState,
        actions,
        unlockedProjects,
        stats: { totalChapters, completedChapterCount, skillPercentage, quizAverage },
        metadata: { categories, courses, courseQuizzes, projectsByLevel, learningLevels },
        notice,
        dbError,
        assessmentMode: {
          isActive: displayState.assessmentMode?.active || false,
          timerRemaining: displayState.assessmentMode?.timerRemaining || 0,
          violations: displayState.assessmentMode?.violations || 0,
          deductions: displayState.assessmentMode?.deductions || 0,
        },
        user: displayState.user.loggedIn ? displayState.user : null,
        profile,
        customRoadmaps,
        loading: !authReady || !contentReady
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used inside AppProvider')
  }
  return context
}
