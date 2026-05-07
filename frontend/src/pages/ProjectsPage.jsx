import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'

export default function ProjectsPage() {
  const { unlockedProjects, state, actions, metadata } = useApp()
  const language = state.language
  const allProjects = Object.values(metadata.projectsByLevel).flat()

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">{t(language, 'projects')}</h2>
      <p className="text-base text-slate-600 dark:text-slate-300">
        {t(language, 'projectsIntro')}
      </p>
      <div className="space-y-3">
        {allProjects.map((project) => {
          const unlocked = unlockedProjects.includes(project)
          const done = state.completedProjects.includes(project)
          return (
            <article
              key={project}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <div>
                <h3 className="font-semibold">{project}</h3>
                <p className="text-xs text-slate-500">{unlocked ? t(language, 'unlocked') : t(language, 'lockedByProgress')}</p>
              </div>
              <button
                disabled={!unlocked}
                onClick={() => actions.completeProject(project)}
                className="interactive-strong rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {done ? t(language, 'chapterCompleted') : t(language, 'complete')}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
