export default function ResultScreen({
  correctCount,
  deductions,
  onRestart,
  onToggleDetailedResult,
  score,
  showDetailedResult,
  subject,
  totalQuestions,
  violations,
  wrongCount,
}) {
  const toggleLabel = showDetailedResult ? 'Hide Detailed Result' : 'View Detailed Result'

  return (
    <section className="space-y-4">
      <article className="glass-card rounded-[2rem] p-5 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
              {subject} Assessment
            </p>
            <h3 className="mt-2 text-3xl font-bold">Result</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Your answers are now fully visible. Review every question below if needed.
            </p>
          </div>

          <div className="rounded-[2rem] bg-gradient-to-br from-blue-600 to-cyan-500 px-6 py-5 text-white shadow-lg">
            <p className="text-sm uppercase tracking-[0.25em] text-white/80">Score</p>
            <p className="mt-2 text-4xl font-bold">{score}%</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Subject</p>
            <p className="mt-2 text-xl font-semibold">{subject}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/85 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Total Questions</p>
            <p className="mt-2 text-xl font-semibold">{totalQuestions}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 dark:border-emerald-800 dark:bg-emerald-950/40">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Correct Answers</p>
            <p className="mt-2 text-xl font-semibold text-emerald-700 dark:text-emerald-200">{correctCount}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-4 dark:border-rose-800 dark:bg-rose-950/40">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-700 dark:text-rose-300">Wrong Answers</p>
            <p className="mt-2 text-xl font-semibold text-rose-700 dark:text-rose-200">{wrongCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-4 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Violations / Deductions</p>
            <p className="mt-2 text-xl font-semibold text-amber-700 dark:text-amber-200">
              {violations} / {deductions}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onToggleDetailedResult}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
          >
            {toggleLabel}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold dark:border-slate-600"
          >
            Restart Assessment
          </button>
        </div>
      </article>
    </section>
  )
}
