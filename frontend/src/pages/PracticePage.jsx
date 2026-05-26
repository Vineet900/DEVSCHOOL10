import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Trophy, 
  Target, 
  ArrowRight, 
  CheckCircle2, 
  Lightbulb,
  Sparkles,
  Zap,
  BookOpen
} from 'lucide-react'
import CodeRunner from '../components/CodeRunner'
import { useApp } from '../context/AppContext'
import { getLesson } from '../content/lessonStore'

export default function PracticePage() {
  const { state, actions } = useApp()
  const [activeTaskIndex, setActiveTaskIndex] = useState(0)
  const [completedTasks, setCompletedTasks] = useState([])
  const [showReward, setShowReward] = useState(false)

  const currentLesson = useMemo(() => 
    getLesson(state.selectedCourseId, state.selectedChapterId), 
    [state.selectedCourseId, state.selectedChapterId]
  )

  const tasks = useMemo(() => {
    const rawExercises = currentLesson?.exercises;
    if (Array.isArray(rawExercises) && rawExercises.length > 0) {
      return rawExercises;
    }
    return [
      {
        id: 'ex1',
        prompt: 'Change the background color of the body to a deep dark blue (#050816) and make the text white.',
        hint: 'Use the style tag in the head section.',
        xp: 50,
        initialCode: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        background: #ffffff;
        color: #000000;
        font-family: sans-serif;
        padding: 40px;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <h1>Welcome to DevSchool Pro!</h1>
    <p>Let's style this sandbox workspace.</p>
  </body>
</html>`
      },
      {
        id: 'ex2',
        prompt: 'Add an <h1> tag with the text "Mastering Frontend" and apply a neon cyan shadow.',
        hint: 'text-shadow: 0 0 20px #22d3ee;',
        xp: 100,
        initialCode: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        background: #050816;
        color: #ffffff;
        font-family: sans-serif;
        padding: 40px;
        text-align: center;
      }
      h1 {
        /* Add text-shadow here */
      }
    </style>
  </head>
  <body>
    <!-- Add your h1 heading here -->
  </body>
</html>`
      }
    ]
  }, [currentLesson])

  const handleTaskComplete = () => {
    if (!completedTasks.includes(activeTaskIndex)) {
      const newCompleted = [...completedTasks, activeTaskIndex]
      setCompletedTasks(newCompleted)
      
      if (newCompleted.length === tasks.length) {
        setShowReward(true)
        // actions.addXP(200) // Assuming this exists or similar
      } else {
        setActiveTaskIndex(prev => Math.min(prev + 1, tasks.length - 1))
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg-deep pt-24 pb-12 px-4 md:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-brand-cyan/5 blur-[120px]"></div>
        <div className="absolute bottom-[10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-brand-purple/5 blur-[120px]"></div>
      </div>

      <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-8 relative z-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-[0.2em] mb-4 w-fit">
              <Sparkles size={14} /> Practice Mode
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">Coding <span className="text-brand-cyan">Playground</span></h1>
          </div>

          <div className="flex items-center gap-6 bg-white/5 border border-white/5 p-4 rounded-3xl">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">Progress</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{completedTasks.length} / {tasks.length} Tasks</p>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">XP Reward</p>
              <p className="text-sm font-black text-brand-purple">+{tasks.reduce((s, t) => s + (t.xp || 0), 0)} XP</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
          {/* Tasks Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-12">
            <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-mesh relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                    <Target size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest">Active Task</h3>
                </div>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTaskIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <p className="text-lg text-slate-700 dark:text-white/70 leading-relaxed font-medium">
                      {(() => {
                        const tObj = tasks[activeTaskIndex];
                        if (!tObj) return 'Start coding to complete this task.';
                        const pVal = tObj.prompt || tObj.question;
                        if (typeof pVal === 'string') return pVal;
                        if (typeof pVal === 'object' && pVal) return pVal.en || pVal.hi || pVal.hinglish || 'Start coding to complete this task.';
                        return 'Start coding to complete this task.';
                      })()}
                    </p>
                    
                    <div className="p-4 rounded-2xl bg-brand-cyan/5 border border-brand-cyan/10 flex gap-3">
                      <Lightbulb size={18} className="text-brand-cyan flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-brand-cyan/70 leading-relaxed italic">
                        {(() => {
                          const tObj = tasks[activeTaskIndex];
                          if (!tObj) return 'Check the documentation if you get stuck!';
                          const hVal = tObj.hint || tObj.explanation;
                          if (typeof hVal === 'string') return hVal;
                          if (typeof hVal === 'object' && hVal) return hVal.en || hVal.hi || hVal.hinglish || 'Check the documentation if you get stuck!';
                          return 'Check the documentation if you get stuck!';
                        })()}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
              {tasks.map((task, i) => {
                const isCompleted = completedTasks.includes(i)
                const isActive = activeTaskIndex === i
                return (
                  <motion.div
                    key={i}
                    onClick={() => setActiveTaskIndex(i)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                      isActive 
                      ? 'bg-brand-cyan/10 border-brand-cyan/30 text-slate-900 dark:text-white font-bold' 
                      : isCompleted 
                        ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/40' 
                        : 'bg-transparent border-transparent text-slate-400 dark:text-white/20 hover:text-slate-700 dark:hover:text-white/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                      isActive ? 'bg-brand-cyan text-bg-deep' : 'bg-slate-100 dark:bg-white/5'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={16} /> : i + 1}
                    </div>
                    <span className="text-sm font-bold truncate flex-1">
                      {(() => {
                        const pVal = task.prompt || task.question;
                        let text = 'Untitled Task';
                        if (typeof pVal === 'string') text = pVal;
                        else if (typeof pVal === 'object' && pVal) text = pVal.en || pVal.hi || pVal.hinglish || 'Untitled Task';
                        return text.slice(0, 40) + (text.length > 40 ? '...' : '');
                      })()}
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse"></div>}
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Code Runner Area */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
            <CodeRunner 
              key={activeTaskIndex}
              initialCode={tasks[activeTaskIndex]?.initialCode || `<!-- Write your HTML/CSS/JS code here -->`}
              onRun={handleTaskComplete}
            />
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      <AnimatePresence>
        {showReward && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-bg-deep/80 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full glass-card p-12 rounded-[3rem] border-white/10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple"></div>
              <div className="w-24 h-24 rounded-full bg-brand-cyan/10 flex items-center justify-center mx-auto mb-8 text-brand-cyan">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Practice Complete!</h2>
              <p className="text-slate-500 dark:text-white/40 mb-8">You've successfully solved all practice tasks for this roadmap milestone.</p>
              
              <div className="flex items-center justify-center gap-4 mb-10">
                <div className="bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mb-1">Earned</p>
                  <p className="text-lg font-black text-brand-purple">+{tasks.reduce((s, t) => s + (t.xp || 0), 0)} XP</p>
                </div>
              </div>

              <button 
                onClick={() => setShowReward(false)}
                className="w-full py-4 rounded-2xl bg-brand-cyan text-bg-deep font-black text-lg hover:scale-105 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)]"
              >
                Continue Path
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
