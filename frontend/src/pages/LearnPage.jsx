import { lessons, roadmap } from '../data/content'
import { useApp } from '../context/AppContext'

export default function LearnPage() {
  const { state, actions } = useApp()

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Step-by-Step Learning Roadmap</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {roadmap.map((step, index) => (
            <span
              key={step}
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold dark:bg-slate-800"
            >
              {index + 1}. {step}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => {
          const done = state.completedLessons.includes(lesson.id)
          return (
            <article key={lesson.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{lesson.title}</h3>
                <span className="text-xs text-slate-500">{lesson.level}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{lesson.explanation}</p>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-800">
                <code>{lesson.code}</code>
              </pre>
              <p className="mt-3 text-sm">
                <strong>Practice:</strong> {lesson.practiceTask}
              </p>
              <p className="mt-2 text-sm">
                <strong>Summary:</strong> {lesson.summary}
              </p>
              <button
                onClick={() => actions.completeLesson(lesson.id)}
                className="interactive-strong mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                {done ? 'Completed' : 'Mark as Done'}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
