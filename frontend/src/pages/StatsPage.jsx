import { useApp } from '../context/AppContext'

export default function StatsPage() {
  const { state } = useApp()

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Stats</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat title="Study Hours" value={`${state.studyHours} hrs`} />
        <Stat title="Weekly Streak" value={`${state.streak} days`} />
        <Stat title="Completed Lessons" value={`${state.completedLessons.length}`} />
      </div>
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="font-semibold">Discipline Health</h3>
        <p className="mt-2 text-sm">
          Warnings: <strong>{state.warningCount}</strong>. Stay consistent to protect your streak.
        </p>
      </article>
    </section>
  )
}

function Stat({ title, value }) {
  return (
    <article className="rounded-2xl bg-blue-600 p-4 text-white">
      <p className="text-xs uppercase">{title}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </article>
  )
}
