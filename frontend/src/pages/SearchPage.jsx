import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { searchLessons } from '../content/lessonStore'
import { t } from '../data/i18n'

export default function SearchPage() {
  const { state, actions } = useApp()
  const language = state.language
  const languageKey = state.language === 'hi' ? 'hindi' : state.language
  const results = searchLessons(state.searchQuery, languageKey)

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">{t(language, 'search')}</h2>
      <p className="text-base text-slate-600 dark:text-slate-300">{t(language, 'searchIntro')}</p>

      <input
        value={state.searchQuery}
        onChange={(event) => actions.setSearchQuery(event.target.value)}
        placeholder={t(language, 'searchLessonsPlaceholder')}
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
      />

      <div className="space-y-2">
        {results.length === 0 ? (
          <p className="text-sm text-slate-500">{t(language, 'noSearchResults')}</p>
        ) : (
          results.map((result) => (
            <Link
              key={`${result.courseId}-${result.chapterId}`}
              to={`/chapter/${result.courseId}/${result.chapterId}`}
              className="interactive-card block rounded-xl border border-transparent bg-slate-100 p-3 dark:bg-slate-800"
            >
              <p className="font-semibold">{result.chapterTitle}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">{result.courseTitle}</p>
            </Link>
          ))
        )}
      </div>
    </section>
  )
}
