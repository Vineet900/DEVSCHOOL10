import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  Trophy, 
  Star, 
  Clock, 
  Layout, 
  Server, 
  Cpu, 
  Zap,
  ArrowRight
} from 'lucide-react'

import { useApp } from '../context/AppContext'
import { Database, Plus, Sparkles } from 'lucide-react'

const iconMap = {
  Layout: Layout,
  Server: Server,
  Cpu: Cpu,
  Zap: Zap
}

export default function RoadmapSection({ roadmaps }) {
  const { dbError, contentReady } = useApp()

  return (
    <div id="roadmaps" className="py-24 max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">
            Learning <span className="text-brand-cyan">Paths</span>
          </h2>
          <p className="text-white/40 max-w-2xl text-lg">
            Structured roadmaps to guide you from beginner to expert. Unlock milestones, earn XP, and track your progress visually.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Data Source Badge */}
          {dbError ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
              <Database size={14} />
              <span>📦 Static Fallback (DB Offline)</span>
            </div>
          ) : contentReady ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <Database size={14} className="animate-pulse" />
              <span>📡 Supabase Live DB</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
              <Database size={14} />
              <span>⌛ Connecting...</span>
            </div>
          )}

          {/* Builder Link */}
          <Link 
            to="/roadmap/builder" 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-cyan to-brand-blue text-bg-deep text-xs font-black uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
          >
            <Plus size={16} />
            <span>Build Custom Path</span>
          </Link>
        </div>
      </div>

      <div className="space-y-32">
        {roadmaps.length === 0 ? (
          <div className="py-20 text-center text-white/30 text-lg font-bold">
            No roadmaps available. Add some courses to view paths.
          </div>
        ) : (
          roadmaps.map((roadmap, rIdx) => (
            <RoadmapPath key={roadmap.id} roadmap={roadmap} index={rIdx} />
          ))
        )}
      </div>
    </div>
  )
}

function RoadmapPath({ roadmap, index }) {
  const Icon = iconMap[roadmap.icon] || Layout
  
  return (
    <div className="relative">
      {/* Path Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 relative z-10">
        <div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold mb-4 tracking-widest uppercase`}>
            {roadmap.category}
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-cyan to-brand-blue flex items-center justify-center shadow-lg shadow-brand-cyan/20">
              <Icon size={24} className="text-bg-deep" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white">{roadmap.title}</h3>
          </div>
          <p className="text-white/50 max-w-xl">{roadmap.description}</p>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Duration</p>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <Clock size={16} className="text-brand-cyan" />
              {roadmap.duration}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1">Rewards</p>
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold">
              <Star size={16} className="text-brand-purple" />
              {roadmap.xp} XP
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Timeline for Desktop, Vertical for Mobile */}
      <div className="relative">
        {/* Background Connection Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/5 -translate-y-1/2 hidden md:block rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple opacity-30"
          ></motion.div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-8 md:gap-4 relative z-10 overflow-x-auto pb-8 no-scrollbar">
          {roadmap.steps.map((step, sIdx) => (
            <RoadmapStep key={step.id} step={step} roadmapId={roadmap.id} isFirst={sIdx === 0} isLast={sIdx === roadmap.steps.length - 1} />
          ))}

          {/* Final Milestone */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 rounded-3xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center group cursor-pointer transition-all hover:border-brand-purple/50 hover:bg-brand-purple/10"
            >
              <Trophy size={32} className="text-white/20 group-hover:text-brand-purple transition-colors" />
            </motion.div>
            <div className="mt-4 text-center">
              <p className="text-xs font-bold text-white/30 uppercase tracking-widest">Milestone</p>
              <p className="text-sm font-bold text-white/60">Certificate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoadmapStep({ step, roadmapId, isFirst, isLast }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="flex-shrink-0 w-full md:w-64"
    >
      <div className="relative flex flex-col items-center">
        {/* Connection Dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-bg-deep border-2 border-white/20 hidden md:block z-20">
          {!step.isLocked && <div className="absolute inset-0.5 rounded-full bg-brand-cyan animate-pulse"></div>}
        </div>

        {/* Card */}
        <div className={`w-full glass-card p-6 rounded-3xl border-slate-200 dark:border-white/10 group transition-all duration-500 hover:-translate-y-2 relative overflow-hidden ${step.isLocked ? 'opacity-50' : 'hover:border-brand-cyan/40 hover:shadow-[0_0_30px_rgba(34,211,238,0.1)]'}`}>
          {/* Locked Overlay */}
          {step.isLocked && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-deep/40 backdrop-blur-[2px]">
              <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-white/40">
                <Lock size={18} />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.isLocked ? 'bg-slate-100 dark:bg-white/5' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
              <Zap size={20} />
            </div>
            {!step.isLocked && step.progress === 100 && <CheckCircle2 size={20} className="text-green-500" />}
            {!step.isLocked && step.progress > 0 && step.progress < 100 && (
               <div className="text-[10px] font-black text-brand-cyan">{step.progress}%</div>
            )}
          </div>

          <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-cyan transition-colors line-clamp-1">{step.title}</h4>
          <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed line-clamp-2 mb-6">{step.description}</p>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <Star size={12} className="text-brand-purple" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-white/60">{step.xp} XP</span>
            </div>
            
            {!step.isLocked ? (
              <Link to={step.courseUrl || `/courses`} className="text-[10px] font-black text-brand-cyan uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                Learn <ArrowRight size={12} />
              </Link>
            ) : (
              <span className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest">Locked</span>
            )}
          </div>

          {/* Progress bar at bottom */}
          {!step.isLocked && step.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-white/5">
              <div className="h-full bg-brand-cyan" style={{ width: `${step.progress}%` }}></div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
