function optionLabel(index) {
  return String.fromCharCode(65 + index)
}

function renderAnswerText(question, answerIndex) {
  if (answerIndex === null || answerIndex === undefined || answerIndex < 0 || answerIndex >= question.options.length) {
    return 'Not answered'
  }

  return `${optionLabel(answerIndex)}. ${question.options[answerIndex]}`
}

export default function AnswerReview({ questions, userAnswers }) {
  const userAnswerMap = new Map(userAnswers.map((entry) => [entry.questionId, entry]))

  return (
    <section className="space-y-4">
      <article className="glass-card rounded-[2rem] p-5 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">Detailed Result</p>
            <h3 className="mt-2 text-2xl font-bold">Answer Sheet</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{questions.length} questions reviewed</p>
        </div>

        <div className="mt-6 space-y-4">
          {questions.map((question, index) => {
            const userAnswer = userAnswerMap.get(question.id)
            const selectedOption = userAnswer?.selectedOption ?? null
            const isCorrect = selectedOption === question.answer
            const statusMark = isCorrect ? '\u2714 Correct' : '\u2718 Wrong'
            const statusClass = isCorrect
              ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30'
              : 'border-rose-200 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/30'

            return (
              <article key={question.id} className={`rounded-3xl border p-4 md:p-5 ${statusClass}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                      {index + 1} / {questions.length}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold">{question.question}</h4>
                  </div>
                  <span className="rounded-full border border-current px-3 py-1 text-sm font-semibold">{statusMark}</span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Your Answer</p>
                    <p className="mt-2 text-sm font-medium">{renderAnswerText(question, selectedOption)}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Correct Answer</p>
                    <p className="mt-2 text-sm font-medium">{renderAnswerText(question, question.answer)}</p>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </article>
    </section>
  )
}
