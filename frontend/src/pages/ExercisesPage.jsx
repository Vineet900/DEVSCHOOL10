import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getLesson } from '../content/lessonStore'
import { t } from '../data/i18n'

export default function ExercisesPage() {
  const { state } = useApp()
  const language = state.language
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const currentLesson = useMemo(() => getLesson(state.selectedCourseId, state.selectedChapterId), [state.selectedCourseId, state.selectedChapterId])
  const exercises = currentLesson?.exercises || []

  const score = useMemo(() => {
    if (!submitted) return 0
    return exercises.reduce((count, exercise, index) => {
      const id = exercise.id ?? String(index)
      const userAnswer = String(answers[id] || '').trim().toLowerCase()
      const correctAnswer = String(exercise.answer || '').trim().toLowerCase()
      return correctAnswer && userAnswer.includes(correctAnswer) ? count + 1 : count
    }, 0)
  }, [answers, submitted, exercises])

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">{t(language, 'exercises')}</h2>
      <p className="text-base text-slate-600 dark:text-slate-300">
        {t(language, 'exercisesIntro')}
      </p>
      <p className="text-sm text-slate-500">{t(language, 'currentChapter')}: {currentLesson?.title || `${state.selectedCourseId} / ${state.selectedChapterId}`}</p>

      {exercises.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-6 text-center text-slate-500 dark:bg-slate-800/50">
          No exercises available for this chapter.
        </div>
      ) : (
        exercises.map((exercise, index) => {
          const id = exercise.id ?? String(index)
          const promptText = typeof exercise.prompt === 'string' 
            ? exercise.prompt 
            : (exercise.prompt?.[language] || exercise.prompt?.en || '')
          
          return (
            <article key={id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs uppercase text-slate-500">{t(language, 'practice')}</p>
              <p className="mt-1 font-medium">{promptText}</p>
              <input
                value={answers[id] || ''}
                onChange={(event) => setAnswers((prev) => ({ ...prev, [id]: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </article>
          )
        })
      )}

      {exercises.length > 0 && (
        <button onClick={() => setSubmitted(true)} className="interactive-strong rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
          {t(language, 'checkAnswers')}
        </button>
      )}

      {submitted && exercises.length > 0 ? (
        <p className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
          {t(language, 'solvedExercises')} {score}/{exercises.length} {t(language, 'exercises')}.
        </p>
      ) : null}
    </section>
  )
}
