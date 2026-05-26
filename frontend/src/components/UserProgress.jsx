import { motion } from 'framer-motion'
import { 
  Flame, 
  Zap, 
  Target, 
  Trophy, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Link } from 'react-router-dom'

export default function UserProgress() {
  const { state, metadata } = useApp()
  
  const level = Math.max(1, Math.floor((state.xp || 0) / 120) + 1)
  const xpInLevel = (state.xp || 0) % 120
  const progressToNextLevel = (xpInLevel / 120) * 100

  // Calculate dynamic rank: higher XP gives a better rank (lower rank number)
  const rank = state.xp > 0 ? `#${Math.max(1, 1000 - Math.floor(state.xp / 10))} Global` : 'Unranked'

  // Calculate completed courses count to award badges
  const completedCoursesCount = (metadata?.courses || []).filter(course => {
    const lessons = course.chapters || []
    if (lessons.length === 0) return false
    return lessons.every(l => state.completedChapters[`${course.id}:${l.slug}`] === true)
  }).length

  // Badges = completed courses + streak milestone + XP milestone
  const badgesCount = completedCoursesCount + (state.streak >= 5 ? 1 : 0) + (state.xp >= 500 ? 1 : 0)

  // Retrieve last studied course and lesson
  const lastCourseId = state.selectedCourseId || 'html'
  const lastCourse = (metadata?.courses || []).find(c => c.id === lastCourseId || c.slug === lastCourseId)
  const lastChapterId = state.selectedChapterId || (lastCourse?.chapters?.[0]?.slug || '')
  
  const lastChapter = lastCourse?.chapters?.find(ch => ch.slug === lastChapterId)
  
  const lastChapterTitle = lastChapter?.title || 'Introduction'
  const lastCourseTitle = lastCourse?.title || 'HTML5'

  const stats = [
    { label: 'Daily Streak', value: `${state.streak || 1} Days`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'Total XP', value: state.xp || 0, icon: Zap, color: 'text-brand-purple', bg: 'bg-brand-purple/10' },
    { label: 'Modules Done', value: Object.keys(state.completedChapters || {}).length, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Study Hours', value: `${state.studyHours || 0}h`, icon: Clock, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-1 glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden bg-mesh"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-cyan to-brand-purple p-1 shadow-2xl">
                <div className="w-full h-full rounded-[1.2rem] bg-bg-deep overflow-hidden flex items-center justify-center">
                  {state.user.avatar ? (
                    <img src={state.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{(state.user.name || 'L').slice(0, 1).toUpperCase()}</span>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{state.user.name}</h3>
                <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Lvl {level} Developer</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-3">
                  <span className="text-white/40 uppercase tracking-widest">Next Level</span>
                  <span className="text-brand-cyan">{120 - xpInLevel} XP to go</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressToNextLevel}%` }}
                    className="h-full bg-gradient-to-r from-brand-cyan to-brand-blue rounded-full"
                  ></motion.div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Rank</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{rank}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Badges</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{badgesCount} Earned</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 rounded-3xl border-white/5 flex flex-col items-center justify-center text-center group hover:border-white/20 transition-all"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">{stat.value}</h4>
            </motion.div>
          ))}
          
          {/* Recent Activity / Continue Learning */}
          <Link 
            to={`/chapter/${lastCourseId}/${lastChapterId}`}
            className="col-span-2 md:col-span-4 glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.04] border border-white/5 transition-all group cursor-pointer w-full text-left"
          >
            <div className="flex items-center gap-6 text-center md:text-left">
              <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                <TrendingUp size={32} />
              </div>
              <div>
                <h4 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Continue Learning</h4>
                <p className="text-sm text-white/40">You were last studying: <span className="text-white/70 font-bold">{lastCourseTitle} - {lastChapterTitle}</span></p>
              </div>
            </div>
            <div className="px-6 py-3 rounded-xl bg-brand-cyan text-bg-deep font-bold flex items-center gap-2 group-hover:px-8 transition-all">
              Resume <ChevronRight size={18} />
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
