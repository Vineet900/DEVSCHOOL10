import { Link } from 'react-router-dom'
import CourseLogo from '../components/CourseLogo'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'

export default function CoursesPage() {
  const { metadata, state } = useApp()
  const language = state.language
  const categoryList = metadata.categories[language] || metadata.categories.en

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">{t(language, 'courses')}</h2>
      <p className="text-base text-slate-600 dark:text-slate-300">{t(language, 'coursesIntro')}</p>

      <div className="space-y-3">
        {categoryList.map((category) => (
          <article key={category} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
            <h3 className="text-xl font-semibold">{category}</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {metadata.courses
                .filter((course) => course.category === category)
                .map((course) => (
                  <Link
                    key={course.id}
                    to={`/chapter/${course.id}/${course.chapters[0].slug}`}
                    className="interactive-card rounded-xl border border-transparent bg-slate-100 p-3 dark:bg-slate-800"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{course.title[language]}</p>
                      <CourseLogo courseId={course.id} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{course.chapters.length} {t(language, 'chaptersCount')}</p>
                  </Link>
                ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
