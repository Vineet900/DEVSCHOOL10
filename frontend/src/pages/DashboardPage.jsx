import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Timer, Trophy } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'
import { API_BASE_URL } from '../lib/api'

const API_BASE = API_BASE_URL

export default function DashboardPage() {
  const { state, actions } = useApp()
  const language = state.language
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadPlan() {
      setLoading(true)
      try {
        const query = new URLSearchParams({
          level: state.learningLevel || 'beginner',
          language: state.language || 'en',
        })
        const response = await fetch(`${API_BASE}/api/daily-plan?${query.toString()}`)
        const plan = await response.json()
        actions.refreshDailyPlan(plan)
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [actions, state.learningLevel, state.language])

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-bold">{t(language, 'continueLearning')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {loading ? `${t(language, 'loading')}` : t(language, 'markChallenge')}
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        <Card title={t(language, 'chapterLabel')} value={state.dailyPlan.lesson} />
        <Card title={t(language, 'practice')} value={state.dailyPlan.exercise} />
        <Card title={t(language, 'chapterQuiz')} value={state.dailyPlan.quiz} />
        <Card title={t(language, 'projects')} value={state.dailyPlan.miniProject} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Flame} label={t(language, 'practiceStreak')} value={`${state.streak} ${t(language, 'days')}`} />
        <Stat icon={Trophy} label={t(language, 'skillPercentage')} value={`${stats.skillPercentage ?? 0}%`} />
        <Stat icon={Timer} label={t(language, 'studyHours')} value={`${state.studyHours} hrs`} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Trophy} label={t(language, 'myPoints')} value={`${state.studyPoints}`} />
        <Stat icon={Flame} label={t(language, 'xp')} value={`${state.xp}`} />
        <Stat icon={Timer} label={t(language, 'practiceStreak')} value={`${state.streak} ${t(language, 'days')}`} />
      </div>

      <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
        <h3 className="font-semibold">{t(language, 'continueLearning')}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <QuickButton to="/home" text={t(language, 'continueLearning')} />
          <QuickButton to="/practice" text={t(language, 'practice')} />
          <QuickButton to="/tutor" text={t(language, 'tutor')} />
          <QuickButton to="/stats" text={t(language, 'skillPercentage')} />
          <QuickButton to="/settings" text={t(language, 'settings')} />
        </div>
      </div>
    </section>
  )
}

function Card({ title, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </article>
  )
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-blue-600 p-4 text-white">
      <div className="flex items-center gap-2">
        <Icon size={16} />
        <p className="text-xs uppercase">{label}</p>
      </div>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}

function QuickButton({ to, text }) {
  return (
    <Link to={to} className="interactive-card rounded-xl border border-transparent bg-white px-4 py-3 text-center text-sm font-medium dark:bg-slate-900">
      {text}
    </Link>
  )
}
