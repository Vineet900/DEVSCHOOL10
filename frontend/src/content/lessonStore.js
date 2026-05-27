import { courseAPI } from '../lib/api'

export let LESSONS = []
export let COURSES = []

// ─── Category Detection ───────────────────────────────────────────────────────

const COURSE_CATEGORIES = {
  'html': 'Frontend', 'css': 'Frontend', 'javascript': 'Frontend',
  'typescript': 'Frontend', 'react': 'Frontend', 'nextjs': 'Frontend',
  'angular': 'Frontend', 'vuejs': 'Frontend', 'svelte': 'Frontend',
  'redux': 'Frontend', 'zustand': 'Frontend', 'shadcn': 'Frontend',
  'threejs': 'Frontend', 'gsap': 'Frontend', 'framer': 'Frontend',
  'nodejs': 'Backend', 'express': 'Backend', 'postgresql': 'Backend',
  'mysql': 'Backend', 'python': 'Backend', 'php': 'Backend',
  'mongodb': 'Backend', 'redis': 'Backend', 'firebase': 'Backend',
  'prisma': 'Backend', 'supabase': 'Backend', 'sqlite': 'Backend',
  'backend': 'Backend', 'enterprise': 'Backend', 'database': 'Backend',
  'git': 'DevOps', 'github': 'DevOps', 'aws': 'DevOps',
  'devops': 'DevOps', 'docker': 'DevOps', 'kubernetes': 'DevOps',
  'terraform': 'DevOps', 'nginx': 'DevOps', 'linux': 'DevOps',
  'ci-cd': 'DevOps', 'jenkins': 'DevOps', 'ansible': 'DevOps',
  'azure': 'DevOps', 'google-cloud': 'DevOps', 'cloud': 'DevOps',
  'dsa': 'CS Fundamentals', 'java': 'CS Fundamentals',
  'system-design': 'CS Fundamentals', 'competitive': 'CS Fundamentals',
  'programming': 'CS Fundamentals', 'c': 'CS Fundamentals',
  'cpp': 'CS Fundamentals', 'go': 'CS Fundamentals',
  'rust': 'CS Fundamentals', 'kotlin': 'CS Fundamentals',
  'swift': 'CS Fundamentals', 'ruby': 'CS Fundamentals',
  'mobile': 'Mobile', 'flutter': 'Mobile', 'react-native': 'Mobile',
  'android': 'Mobile', 'ios': 'Mobile',
  'ai': 'AI & Data', 'cybersecurity': 'AI & Data', 'data': 'AI & Data',
}

function getCourseCategory(slug) {
  const cleanSlug = (slug || '').toLowerCase()
  // Check exact match first
  if (COURSE_CATEGORIES[cleanSlug]) return COURSE_CATEGORIES[cleanSlug]
  // Check partial match
  for (const [key, cat] of Object.entries(COURSE_CATEGORIES)) {
    if (cleanSlug.includes(key)) return cat
  }
  return 'Other'
}

/**
 * Normalize courses from DB API (sections → chapters flat array).
 * Backend returns: courses[].sections[].lessons[]
 * Frontend needs: courses[].chapters[] (flat array of all lessons)
 *
 * PERFORMANCE NOTE: The catalog endpoint no longer returns lesson_data
 * (heavy AI-generated content). It is lazy-loaded when the user opens
 * a specific chapter. Chapters are still created here with metadata only.
 */
function normalizeDBCourses(coursesData) {
  return coursesData.map(course => {
    const sections = course.sections || []
    const chapters = sections.flatMap(section =>
      (section.lessons || []).map(lesson => ({
        // Core fields (always present from catalog)
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug || lesson.id,
        content: lesson.content || '',
        sort_order: lesson.sort_order ?? 0,
        chapter_number: lesson.chapter_number ?? lesson.sort_order ?? 0,
        xp_reward: lesson.xp_reward ?? 10,
        duration: lesson.duration ?? 0,
        video_url: lesson.video_url || null,

        // lesson_data is lazy-loaded — spread it if already present
        ...((lesson.lesson_data && typeof lesson.lesson_data === 'object') ? lesson.lesson_data : {}),

        // Metadata for UI
        sectionTitle: section.title,
        sectionId: section.id,
        courseId: course.id,
        category: getCourseCategory(course.slug || course.id),
        estimatedTime: lesson.lesson_data?.estimatedTime || 
          (lesson.duration ? `${Math.ceil(lesson.duration / 60)} min` : '10 min'),
        
        // Flag: content not yet loaded
        _contentLoaded: !!(lesson.lesson_data),
      }))
    )

    return {
      id: course.id,
      title: course.title,
      description: course.description || '',
      slug: course.slug || course.id,
      thumbnail: course.thumbnail || null,
      category: getCourseCategory(course.slug || course.id),
      created_at: course.created_at,
      chapters,
      totalLessons: chapters.length,
    }
  })
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

/**
 * Initialize content: fetches from backend API
 */
export async function fetchContentFromDB() {
  try {
    const { data: response } = await courseAPI.getCourses()
    const coursesData = response?.data

    const hasLessons = Array.isArray(coursesData) &&
      coursesData.length > 0 &&
      coursesData.some(c => 
        ((c.sections || []).some(s => (s.lessons || []).length > 0))
      )

    if (hasLessons) {
      const normalized = normalizeDBCourses(coursesData)
      // Sort by title
      COURSES = normalized.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else {
      console.info('[lessonStore] DB has no lessons.')
      COURSES = []
    }

    // Build flat LESSONS array for search / quiz usage
    LESSONS = COURSES.flatMap(course =>
      (course.chapters || []).map(lesson => ({
        ...lesson,
        courseId: course.id,
      }))
    )

    return { LESSONS, COURSES, error: null }
  } catch (err) {
    console.error('Failed to sync content from API:', err)
    COURSES = []
    LESSONS = []
    const errorMsg = err.response?.data?.message || err.message || 'Failed to connect to database'
    return { LESSONS, COURSES, error: errorMsg }
  }
}

export function getCourses() {
  return COURSES
}

export function getCourseById(courseId) {
  return COURSES.find((course) => course.id === courseId || course.slug === courseId)
}

export function getLesson(courseId, lessonSlug) {
  const course = getCourseById(courseId)
  return course?.chapters.find((lesson) => lesson.slug === lessonSlug || lesson.id === lessonSlug)
}

/**
 * Lazy-load full lesson content (theory, examples, etc.) from backend.
 * Called when user navigates to a specific chapter.
 * Returns the enriched lesson object after merging lesson_data into the store.
 */
export async function loadLessonContent(courseId, lessonSlug) {
  const course = getCourseById(courseId)
  if (!course) return null

  const lessonIndex = course.chapters.findIndex(
    (l) => l.slug === lessonSlug || l.id === lessonSlug
  )
  if (lessonIndex === -1) return null

  const lesson = course.chapters[lessonIndex]

  // Already loaded — return cached
  if (lesson._contentLoaded) return lesson

  try {
    const { data: response } = await courseAPI.getLesson(lesson.id)
    const fullLesson = response?.data

    if (fullLesson?.lesson_data && typeof fullLesson.lesson_data === 'object') {
      // Merge lesson_data into existing chapter in-place
      const enriched = {
        ...lesson,
        content: fullLesson.content || lesson.content,
        ...fullLesson.lesson_data,
        estimatedTime: fullLesson.lesson_data.estimatedTime || lesson.estimatedTime,
        _contentLoaded: true,
      }
      course.chapters[lessonIndex] = enriched
      return enriched
    }
  } catch (err) {
    console.warn('[lessonStore] Failed to lazy-load lesson content:', err)
  }

  return lesson
}

export function getAdjacentLessons(courseId, lessonSlug) {
  const course = getCourseById(courseId)
  if (!course) return { prev: null, next: null }
  const index = course.chapters.findIndex((lesson) => lesson.slug === lessonSlug || lesson.id === lessonSlug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: course.chapters[index - 1] || null,
    next: course.chapters[index + 1] || null,
  }
}

export function searchLessons(query, language = 'en') {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return LESSONS.filter((lesson) => {
    const text = [
      lesson.title,
      lesson.content || '',
      lesson.summary || '',
      lesson.sectionTitle || '',
    ]
      .join(' ')
      .toLowerCase()
    return text.includes(q)
  }).map((lesson) => ({
    courseId: lesson.courseId,
    chapterId: lesson.slug || lesson.id,
    chapterTitle: lesson.title,
    sectionTitle: lesson.sectionTitle,
  }))
}

export function getCourseQuizzes() {
  const quizzes = {}
  for (const course of COURSES) {
    quizzes[course.id] = (course.chapters || []).flatMap((lesson, lessonIndex) => {
      // quiz can come from lesson_data.interviewQuestions
      const interviewQs = lesson.interviewQuestions || []
      return interviewQs.map((q, index) => ({
        id: `${lesson.id || lesson.slug}-q${index + 1}`,
        question: typeof q === 'string'
          ? { en: q, hi: q, hinglish: q }
          : typeof q.question === 'object' ? q.question : { en: q.question || q, hi: q.question || q, hinglish: q.question || q },
        options: q.options || [],
        answer: typeof q.answer === 'number' ? q.answer : 0,
        explanation: q.explanation
          ? (typeof q.explanation === 'object' ? q.explanation : { en: q.explanation, hi: q.explanation, hinglish: q.explanation })
          : { en: '', hi: '', hinglish: '' },
        difficulty: lesson.difficulty || 'medium',
      }))
    })
  }
  return quizzes
}
