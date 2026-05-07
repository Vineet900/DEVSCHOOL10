import { supabase } from '../lib/supabase'

export let LESSONS = []
export let COURSES = []

const COURSE_TITLE = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JavaScript',
}

const COURSE_DESCRIPTION = {
  en: {
    html: 'Learn modern semantic HTML with practical structure and accessibility.',
    css: 'Master layout, responsive design, and scalable styling systems.',
    javascript: 'Build interactive web apps with core and advanced JavaScript.',
  },
  hi: {
    html: 'Modern semantic HTML ko practical structure aur accessibility ke saath sikhiye.',
    css: 'Layout, responsive design aur scalable styling system me mastery hasil kariye.',
    javascript: 'Core aur advanced JavaScript ke saath interactive web apps banaiye.',
  },
  hinglish: {
    html: 'Modern semantic HTML ko practical structure aur accessibility ke saath seekho.',
    css: 'Layout, responsive design, aur scalable styling system me strong bano.',
    javascript: 'Core plus advanced JavaScript use karke interactive web apps build karo.',
  },
}

export async function fetchContentFromDB() {
  if (!supabase) return

  try {
    const { data: lessons, error } = await supabase.from('lessons').select('*').order('chapter_number', { ascending: true })
    if (error) {
      console.error('Error fetching lessons:', error)
      return
    }

    // Map database columns to app format
    LESSONS = lessons.map(lesson => ({
      id: lesson.slug,
      slug: lesson.slug,
      title: lesson.title,
      category: lesson.course_id,
      chapterNumber: lesson.chapter_number,
      level: lesson.level || 'beginner',
      estimatedTime: lesson.estimated_time || '10 min',
      theory: typeof lesson.theory === 'string' ? JSON.parse(lesson.theory) : (lesson.theory || {}),
      examples: typeof lesson.examples === 'string' ? JSON.parse(lesson.examples) : (lesson.examples || []),
      exercises: typeof lesson.exercises === 'string' ? JSON.parse(lesson.exercises) : (lesson.exercises || []),
      quiz: typeof lesson.quiz === 'string' ? JSON.parse(lesson.quiz) : (lesson.quiz || []),
      summary: lesson.summary || ''
    })).sort((a, b) => {
      if (a.category === b.category) return a.chapterNumber - b.chapterNumber
      return a.category.localeCompare(b.category)
    })

    const grouped = LESSONS.reduce((acc, lesson) => {
      const key = lesson.category
      if (!acc[key]) acc[key] = []
      acc[key].push(lesson)
      return acc
    }, {})

    COURSES = Object.entries(grouped)
      .map(([id, chapters]) => ({
        id,
        slug: id,
        category: 'Core',
        title: { en: COURSE_TITLE[id] || id, hi: COURSE_TITLE[id] || id, hinglish: COURSE_TITLE[id] || id },
        description: {
          en: COURSE_DESCRIPTION.en[id] || '',
          hi: COURSE_DESCRIPTION.hi[id] || '',
          hinglish: COURSE_DESCRIPTION.hinglish[id] || '',
        },
        chapters: chapters.sort((a, b) => a.chapterNumber - b.chapterNumber),
      }))
      .sort((a, b) => a.title.en.localeCompare(b.title.en))

  } catch (err) {
    console.error('Failed to fetch content:', err)
  }
}

export const popularCourseIds = ['html', 'css', 'javascript']

export function getCourses() {
  return COURSES
}

export function getCourseById(courseId) {
  return COURSES.find((course) => course.id === courseId)
}

export function getLesson(courseId, lessonSlug) {
  return getCourseById(courseId)?.chapters.find((lesson) => lesson.slug === lessonSlug)
}

export function getAdjacentLessons(courseId, lessonSlug) {
  const course = getCourseById(courseId)
  if (!course) return { prev: null, next: null }
  const index = course.chapters.findIndex((lesson) => lesson.slug === lessonSlug)
  if (index === -1) return { prev: null, next: null }
  return {
    prev: course.chapters[index - 1] || null,
    next: course.chapters[index + 1] || null,
  }
}

function inferDifficulty(index, total) {
  if (total <= 1) return 'medium'
  const progress = index / (total - 1)
  if (progress < 0.34) return 'low'
  if (progress < 0.67) return 'medium'
  return 'high'
}

export function searchLessons(query, language = 'english') {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return LESSONS.filter((lesson) => {
    const text = [
      lesson.title,
      lesson.theory?.[language] || lesson.theory?.english || '',
      lesson.summary || '',
    ]
      .join(' ')
      .toLowerCase()
    return text.includes(q)
  }).map((lesson) => ({
    courseId: lesson.category,
    courseTitle: COURSE_TITLE[lesson.category] || lesson.category,
    chapterId: lesson.slug,
    chapterTitle: lesson.title,
  }))
}

export function getCourseQuizzes() {
  const quizzes = {}
  for (const course of COURSES) {
    quizzes[course.id] = course.chapters.flatMap((lesson, lessonIndex, lessons) =>
      (lesson.quiz || []).map((q, index) => ({
        id: `${lesson.id}-q${index + 1}`,
        question: { en: q.question, hi: q.question, hinglish: q.question },
        options: q.options,
        answer: q.answer,
        explanation: { en: q.explanation, hi: q.explanation, hinglish: q.explanation },
        difficulty: inferDifficulty(lessonIndex, lessons.length),
      })),
    )
  }
  return quizzes
}
