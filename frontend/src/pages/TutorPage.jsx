import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'
import { API_BASE_URL } from '../lib/api'

const API_BASE = API_BASE_URL

export default function TutorPage() {
  const { state } = useApp()
  const language = state.language
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(t(language, 'tutorIntro'))
  const [loading, setLoading] = useState(false)

  const ask = async () => {
    if (!question.trim()) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/tutor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          language: state.language,
          level: state.learningLevel,
        }),
      })
      const data = await response.json()
      setAnswer(data.answer)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold">{t(language, 'tutor')}</h2>
      <p className="text-base text-slate-600 dark:text-slate-300">{t(language, 'tutorIntro')}</p>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder={t(language, 'tutorPlaceholder')}
        className="w-full rounded-2xl border border-slate-300 p-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
      />
      <button
        onClick={ask}
        className="interactive-strong rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white"
      >
        {loading ? t(language, 'thinking') : t(language, 'askTutor')}
      </button>
      <div className="rounded-2xl bg-slate-100 p-4 text-sm dark:bg-slate-800">{answer}</div>
    </section>
  )
}
