import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Timer, Trophy, Zap, BookOpen, Layout } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'
import { courseAPI } from '../lib/api'

export default function DashboardPage() {
  const { state, profile } = useApp()
  const language = state.language
  const [dailyPlan, setDailyPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPlan() {
      try {
        const level = state.learningLevel || 'beginner'
        const { data: res } = await courseAPI.getDailyPlan(level, language)
        if (res.success) setDailyPlan(res.data)
      } catch (err) {
        console.error('Failed to load daily plan')
      } finally {
        setLoading(false)
      }
    }
    loadPlan()
  }, [state.learningLevel, language])

  return (
    <div className="space-y-10">
      <header>
        <div className="flex items-center gap-3 mb-2">
           <Zap size={18} className="text-brand-cyan" />
           <span className="text-[10px] font-black text-brand-cyan uppercase tracking-widest">Active Roadmap</span>
        </div>
        <h2 className="text-4xl font-black text-white">{t(language, 'continueLearning')}</h2>
      </header>

      {/* Daily Plan Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <PlanCard title="Current Target" value={dailyPlan?.lesson || '...'} icon={<BookOpen size={18}/>} />
        <PlanCard title="Drill" value={dailyPlan?.exercise || '...'} icon={<Layout size={18}/>} />
        <PlanCard title="Assessment" value={dailyPlan?.quiz || '...'} icon={<Trophy size={18}/>} />
        <PlanCard title="Mini Project" value={dailyPlan?.miniProject || '...'} icon={<Zap size={18}/>} />
      </div>

      {/* Primary Stats */}
      <div className="grid gap-6 sm:grid-cols-3">
        <Stat icon={Flame} label="XP Points" value={state.xp || 0} color="brand-cyan" />
        <Stat icon={Trophy} label="Study Points" value={state.studyPoints || 0} color="brand-purple" />
        <Stat icon={Timer} label="Practice Streak" value={`${state.streak || 0} days`} color="brand-blue" />
      </div>

      {/* Action Hub */}
      <div className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
        <h3 className="text-xl font-black mb-8 flex items-center gap-3">
          <Layout size={24} className="text-brand-cyan" /> Navigation Hub
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickButton to="/courses" text="Roadmaps" />
          <QuickButton to="/quizzes" text="Assessments" />
          <QuickButton to="/practice" text="Sandboxes" />
          <QuickButton to="/profile" text="My Profile" />
        </div>
      </div>
    </div>
  )
}

function PlanCard({ title, value, icon }) {
  return (
    <div className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
      <div className="flex items-center gap-3 mb-4 text-white/30">
        {icon}
        <p className="text-[10px] font-black uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-sm font-bold text-white/80 leading-relaxed">{value}</p>
    </div>
  )
}

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card p-8 rounded-[2rem] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent group">
      <div className={`w-12 h-12 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color} mb-4 transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  )
}

function QuickButton({ to, text }) {
  return (
    <Link to={to} className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-center text-sm font-black text-white/60 hover:text-white hover:bg-white/10 hover:border-brand-cyan/30 transition-all">
      {text}
    </Link>
  )
}
