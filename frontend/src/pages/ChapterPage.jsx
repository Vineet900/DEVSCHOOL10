import { useEffect, useState, useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  CheckCircle2, 
  Menu, 
  PanelRightClose, 
  PanelRightOpen, 
  Search,
  BookOpen,
  Zap,
  Target,
  ChevronRight,
  Clock,
  Layout,
  Star,
  Play,
  Lock,
  Compass,
  Lightbulb,
  AlertTriangle,
  Rocket,
  Shield,
  Layers,
  Terminal,
  Trophy,
  FolderGit,
  FileText,
  Globe,
  Cpu,
  Database,
  Cloud,
  Code2,
  TerminalSquare,
  BrainCircuit,
  Binary
} from 'lucide-react'
import toast from 'react-hot-toast'
import CourseLogo from '../components/CourseLogo'
import { useApp } from '../context/AppContext'
import { getAdjacentLessons, getCourseById, getLesson, loadLessonContent, COURSES } from '../content/lessonStore'
import { t } from '../data/i18n'
import { courseAPI, teacherAPI, progressAPI } from '../lib/api'

const getCourseMeta = (slug) => {
  const s = (slug || '').toLowerCase()
  if (s.includes('html')) return { icon: Globe, color: 'text-orange-500', bg: 'bg-orange-500/10' }
  if (s.includes('css')) return { icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' }
  if (s.includes('javascript') || s.includes('js')) return { icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' }
  if (s.includes('react')) return { icon: Cpu, color: 'text-cyan-400', bg: 'bg-cyan-400/10' }
  if (s.includes('node')) return { icon: Code2, color: 'text-green-500', bg: 'bg-green-500/10' }
  if (s.includes('postgres') || s.includes('sql') || s.includes('database')) return { icon: Database, color: 'text-blue-600', bg: 'bg-blue-600/10' }
  if (s.includes('aws') || s.includes('cloud')) return { icon: Cloud, color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
  if (s.includes('python')) return { icon: TerminalSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' }
  if (s.includes('java')) return { icon: Binary, color: 'text-red-500', bg: 'bg-red-500/10' }
  if (s.includes('dsa') || s.includes('algorithm')) return { icon: BrainCircuit, color: 'text-purple-500', bg: 'bg-purple-500/10' }
  return { icon: BookOpen, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' }
}

function MarkCompleteButton({ onComplete, isDone, isMarkingComplete, chapterSlug }) {
  const [cooldown, setCooldown] = useState(() => (isDone ? 0 : 10))

  useEffect(() => {
    setCooldown(isDone ? 0 : 10)
  }, [chapterSlug, isDone])

  useEffect(() => {
    if (cooldown <= 0) return undefined
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  return (
    <button 
      onClick={onComplete}
      disabled={isDone || isMarkingComplete || cooldown > 0}
      className={`px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-2xl flex items-center gap-2 ${
        isDone 
          ? 'bg-slate-100 dark:bg-white/5 text-brand-cyan border border-brand-cyan/30 cursor-default' 
          : cooldown > 0
            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 shadow-none'
            : isMarkingComplete
              ? 'bg-brand-cyan/50 text-bg-deep cursor-wait'
              : 'bg-brand-cyan text-bg-deep hover:scale-105 active:scale-95 shadow-brand-cyan/20 cursor-pointer animate-pulse'
      }`}
    >
      {isDone ? (
        <>✓ Chapter Completed</>
      ) : cooldown > 0 ? (
        <>
          <Lock size={18} className="animate-bounce" />
          Study to Unlock ({cooldown}s)
        </>
      ) : isMarkingComplete ? (
        'Saving...'
      ) : (
        'Mark as Complete'
      )}
    </button>
  )
}


export default function ChapterPage() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const { courseId, chapterId } = useParams()
  const course = getCourseById(courseId)
  const dbLesson = getLesson(courseId, chapterId)
  const adjacent = getAdjacentLessons(courseId, chapterId)
  const language = state.language
  const [query, setQuery] = useState('')
  const [isPanelMinimized, setIsPanelMinimized] = useState(false)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const focusActive = state.focusMode?.sessionActive

  useEffect(() => {
    if (!focusActive) return undefined
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') actions.registerFocusViolation()
    }
    const onBlur = () => actions.registerFocusViolation()
    window.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
    }
  }, [focusActive, actions])

  useEffect(() => {
    if (!course || !dbLesson) return
    if (state.selectedCourseId === course?.id && state.selectedChapterId === dbLesson?.slug) return
    actions.selectChapter(course.id, dbLesson.slug)
  }, [actions, course, dbLesson, state.selectedCourseId, state.selectedChapterId])

  const courseMeta = useMemo(() => getCourseMeta(course?.slug), [course?.slug])
  const Icon = courseMeta.icon

  const [localLesson, setLocalLesson] = useState(dbLesson)
  const [isEnhancing, setIsEnhancing] = useState(false)

  // Update localLesson if chapterId/dbLesson changes
  useEffect(() => {
    setLocalLesson(dbLesson)
    // Lazy-load full lesson_data (theory, examples, etc.) from backend
    if (course && dbLesson && !dbLesson._contentLoaded) {
      loadLessonContent(courseId, chapterId).then((enriched) => {
        if (enriched) setLocalLesson(enriched)
      })
    }
  }, [dbLesson, course, courseId, chapterId])

  const allChapters = useMemo(() => {
    if (!course || !dbLesson) return []
    const sectionId = dbLesson.sectionId
    if (!sectionId) return course.chapters || []
    return (course.chapters || []).filter(ch => ch.sectionId === sectionId)
  }, [course, dbLesson])

  // --- EARLY RETURNS AFTER ALL HOOKS ---
  if (!course || !dbLesson) return <Navigate to="/courses" replace />

  const lesson = localLesson || dbLesson

  // Use slug-based key to match AppContext's completedChapters store
  const doneKey = `${course.id}:${lesson.slug}`
  const isDone = Boolean(state.completedChapters?.[doneKey])

  // Strict Learning: Check if previous lesson is completed
  const prevDoneKey = adjacent.prev ? `${course.id}:${adjacent.prev.slug}` : null
  const isLocked = Boolean(prevDoneKey) && adjacent.prev && !state.completedChapters?.[prevDoneKey]

  if (isLocked) {
    toast.error('Complete the previous chapter first!', { id: 'locked-chapter' })
    return <Navigate to={`/chapter/${courseId}/${adjacent.prev.slug}`} replace />
  }

  const handleAIEnhance = async () => {
    if (isEnhancing) return
    setIsEnhancing(true)
    const loadToast = toast.loading('⚡ Generating comprehensive textbook chapters via Gemini AI...', {
      style: { background: '#0d1117', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }
    })
    
    try {
      const responseObj = await teacherAPI.enhanceLesson(dbLesson.id)
      const data = responseObj?.data
      if (data?.success && data?.data?.lesson) {
        const updatedLesson = data.data.lesson
        const courseInStore = getCourseById(course.id)
        if (courseInStore) {
          const lessonIndex = courseInStore.chapters.findIndex(l => l.id === dbLesson.id)
          if (lessonIndex !== -1) {
            const fullLessonData = {
              ...updatedLesson,
              ...((updatedLesson.lesson_data && typeof updatedLesson.lesson_data === 'object') ? updatedLesson.lesson_data : {}),
              sectionTitle: courseInStore.chapters[lessonIndex].sectionTitle,
              sectionId: courseInStore.chapters[lessonIndex].sectionId,
              estimatedTime: updatedLesson.lesson_data?.estimatedTime || courseInStore.chapters[lessonIndex].estimatedTime,
            }
            courseInStore.chapters[lessonIndex] = fullLessonData
            setLocalLesson(fullLessonData)
            toast.success('Chapter enhanced successfully with Gemini AI! 🎉', { id: loadToast })
          } else {
            toast.error('Failed to find lesson index in client store.', { id: loadToast })
          }
        } else {
          toast.error('Failed to find course in client store.', { id: loadToast })
        }
      } else {
        toast.error(data?.message || 'Failed to enhance lesson content.', { id: loadToast })
      }
    } catch (err) {
      console.error('Enhance API error:', err)
      const errMessage = err.response?.data?.message || err.message || 'Failed to connect to AI server.'
      toast.error(errMessage, { id: loadToast })
    } finally {
      setIsEnhancing(false)
    }
  }

  const theoryKey = language === 'hi' ? 'hindi' : language
  const chapterOverview = lesson.chapterOverview || lesson.content || ''
  
  // Parse theory - can be string (legacy) or array (rich structured content)
  const isTheoryArray = Array.isArray(lesson.theory)
  const legacyTheory = typeof lesson.theory === 'string' ? lesson.theory : (lesson.theory?.[theoryKey] || lesson.theory?.english || '')

  const total = allChapters.length
  const completed = allChapters.filter((item) => state.completedChapters?.[`${course.id}:${item.slug}`]).length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0

  const filteredChapters = allChapters.filter((item) => {
    const text = `${item.chapterNumber || ''}. ${item.title}`.toLowerCase()
    return text.includes(query.trim().toLowerCase())
  })

  const handleMarkComplete = async () => {
    if (isDone || isMarkingComplete) return
    setIsMarkingComplete(true)

    // 1. Update local state immediately for instant feedback
    actions.completeChapter(course.id, lesson.slug)

    // 2. Check if lesson has a valid UUID before trying backend sync
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lesson.id)
    
    if (isValidUUID) {
      try {
        await progressAPI.updateProgress(lesson.id, true)
        toast.success(`+${lesson.xp_reward || 100} XP earned! Chapter complete 🎉`, {
          icon: '⚡',
          style: { background: '#0d1117', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }
        })
      } catch (err) {
        console.error('Failed to sync progress to server:', err)
        toast.success(`Chapter marked complete!`, {
          icon: '✓',
          style: { background: '#0d1117', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }
        })
      }
    } else {
      toast.success(`Chapter complete! +${lesson.xp_reward || 100} XP`, {
        icon: '⚡',
        style: { background: '#0d1117', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.2)' }
      })
    }

    // 3. Auto navigate to next chapter after a short delay
    if (adjacent.next) {
      setTimeout(() => navigate(`/chapter/${courseId}/${adjacent.next.slug}`), 1200)
    }

    setIsMarkingComplete(false)
  }

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      {/* Sidebar for Chapters */}
      <motion.aside 
        initial={false}
        animate={{ width: isPanelMinimized ? 80 : 320 }}
        className="hidden md:flex flex-col border-r border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-bg-deep/50 backdrop-blur-xl relative z-20"
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            {!isPanelMinimized && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em] mb-1">{dbLesson.sectionTitle || 'Roadmap'}</p>
                <h2 className="text-lg font-black text-slate-800 dark:text-white truncate max-w-[180px]">
                  {typeof course.title === 'object' ? (course.title[language] || course.title.en || course.title) : course.title}
                </h2>
              </motion.div>
            )}
            <button 
              onClick={() => setIsPanelMinimized(!isPanelMinimized)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-white/40 hover:text-brand-cyan dark:hover:text-brand-cyan transition-all cursor-pointer"
            >
              {isPanelMinimized ? <PanelRightOpen size={20} /> : <PanelRightClose size={20} />}
            </button>
          </div>

          {!isPanelMinimized && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0">
              {/* Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-[10px] font-bold mb-2">
                  <span className="text-slate-400 dark:text-white/40 uppercase tracking-widest">Progress</span>
                  <span className="text-brand-cyan">{progressPercent}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-cyan transition-all" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-6">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" />
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find chapter..."
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-white focus:outline-none focus:border-brand-cyan/30 transition-all shadow-inner"
                />
              </div>

              {/* Chapters List */}
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-10">
                {filteredChapters.map((item) => {
                  const done = Boolean(state.completedChapters?.[`${course.id}:${item.slug}`])
                  const active = item.slug === lesson.slug
                  return (
                    <Link 
                      key={item.slug}
                      to={`/chapter/${course.id}/${item.slug}`}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${active ? 'bg-brand-cyan text-bg-deep font-bold shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white'}`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${active ? 'bg-bg-deep/20' : 'bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-white/60'}`}>
                        {item.chapterNumber}
                      </div>
                      <span className="text-sm truncate flex-1">{item.title}</span>
                      {done && <CheckCircle2 size={14} className={active ? 'text-bg-deep' : 'text-brand-cyan'} />}
                    </Link>
                  )
                })}
              </div>
            </motion.div>
          )}

          {isPanelMinimized && (
            <div className="flex flex-col items-center gap-4">
              {allChapters.slice(0, 10).map((item) => (
                <Link 
                  key={item.slug}
                  to={`/chapter/${course.id}/${item.slug}`}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${item.slug === lesson.slug ? 'bg-brand-cyan text-bg-deep' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 hover:text-brand-cyan'}`}
                >
                  <span className="text-xs font-black">{item.chapterNumber}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-slate-50/20 dark:bg-bg-deep relative">
        {/* Glow behind content */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-brand-cyan/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 py-12 lg:py-20 relative z-10">
          {/* ABSOLUTELY BHAYANKER (Badass) Hero Box */}
          <div className="relative glass-card rounded-[3rem] border border-slate-200/60 dark:border-white/10 p-8 md:p-12 mb-16 overflow-hidden bg-gradient-to-br from-slate-100/50 via-white to-slate-50 dark:from-slate-900/60 dark:via-bg-deep dark:to-slate-900/40 shadow-2xl">
            {/* Glowing background meshes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 blur-[100px] pointer-events-none -mr-20 -mt-20"></div>
            <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-brand-cyan/5 blur-[80px] pointer-events-none"></div>

            {/* Back button and quick badges */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-3">
                <Link 
                  to="/courses" 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/60 font-bold transition-all border border-slate-200 dark:border-white/5 shadow-sm cursor-pointer"
                >
                  <ArrowLeft size={16} /> Back to Modules
                </Link>
                
                <button
                  onClick={handleAIEnhance}
                  disabled={isEnhancing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-cyan to-brand-purple hover:from-brand-cyan hover:to-brand-cyan text-slate-900 dark:text-white font-bold transition-all shadow-md hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] cursor-pointer text-sm animate-pulse disabled:opacity-50 disabled:cursor-wait"
                >
                  <Zap size={14} className={isEnhancing ? 'animate-spin' : ''} />
                  {isEnhancing ? 'Generating...' : '⚡ AI-Enhance Chapter'}
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {lesson.difficulty && (
                  <span className="px-3.5 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-[0.15em] shadow-sm">
                    {lesson.difficulty}
                  </span>
                )}
                {lesson.estimatedTime && (
                  <span className="px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-white/40 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 shadow-sm">
                    <Clock size={12} /> {lesson.estimatedTime} read
                  </span>
                )}
                <span className="px-3.5 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-purple text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 shadow-sm">
                  <Star size={12} className="animate-spin-slow" /> +{lesson.xp_reward || 100} XP
                </span>
                {isDone && (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={12} /> Completed
                  </span>
                )}
              </div>
            </div>

            {/* Chapter title and floating icon */}
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8 items-start mb-8">
              <div className="lg:col-span-3 space-y-4">
                <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] flex items-center gap-2">
                  <Zap size={14} className="animate-pulse" /> Mission Briefing
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                  {typeof lesson.title === 'object' ? (lesson.title[language] || lesson.title.en || lesson.title) : lesson.title}
                </h1>
                <p className="text-slate-600 dark:text-white/70 text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
                  {chapterOverview}
                </p>
              </div>

              {/* Badass floating logo banner block */}
              <div className="hidden lg:flex justify-end relative">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 backdrop-blur-md flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-2xl animate-float relative group">
                  <div className="absolute inset-0 bg-brand-cyan/10 rounded-3xl blur-xl group-hover:bg-brand-cyan/25 transition-all"></div>
                  <Icon size={54} className={`${courseMeta.color} relative z-10`} />
                </div>
              </div>
            </div>

            {/* Why This Matters glowing callout & Objectives Grid */}
            {(lesson.whyThisMatters || (lesson.learningObjectives && lesson.learningObjectives.length > 0)) && (
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-8 mt-10 pt-8 border-t border-slate-200/50 dark:border-white/5">
                
                {lesson.whyThisMatters && (
                  <div className="md:col-span-3 bg-gradient-to-br from-brand-cyan/10 to-brand-purple/5 dark:from-brand-cyan/5 dark:to-transparent border border-brand-cyan/20 rounded-[2rem] p-6 flex gap-4 shadow-inner">
                    <div className="p-3 rounded-2xl bg-brand-cyan/10 text-brand-cyan shrink-0 h-fit mt-0.5">
                      <Target size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[0.15em] mb-2">The Mission & Value</h4>
                      <p className="text-sm text-slate-500 dark:text-white/50 leading-relaxed font-medium">
                        {lesson.whyThisMatters}
                      </p>
                    </div>
                  </div>
                )}

                {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Compass size={14} className="text-brand-purple" /> Action Objectives
                    </h4>
                    <ul className="space-y-3">
                      {lesson.learningObjectives.map((obj, i) => (
                        <li key={i} className="flex gap-2.5 text-xs font-semibold text-slate-600 dark:text-white/70 leading-relaxed">
                          <CheckCircle2 size={14} className="text-brand-cyan mt-0.5 shrink-0" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* Theory Section */}
          <section className="space-y-12 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">The Core Theory</h3>
            </div>

            {isTheoryArray ? (
              lesson.theory.map((item, idx) => (
                <div key={idx} className="glass-card p-8 md:p-12 rounded-[2.5rem] border-slate-100 dark:border-white/5 space-y-8 relative overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cyan/5 blur-[80px] -mr-16 -mt-16 rounded-full pointer-events-none"></div>
                  
                  {/* Topic Title */}
                  <div className="flex items-center gap-4 border-b border-slate-100 dark:border-white/5 pb-6">
                    <span className="text-4xl font-black text-brand-cyan/20">0{idx + 1}</span>
                    <h4 className="text-2xl font-black text-slate-800 dark:text-white">{item.topic}</h4>
                  </div>

                  {/* Deep Explanation */}
                  <div className="prose prose-brand-cyan max-w-none text-slate-700 dark:text-white/80">
                    <p className="text-lg leading-relaxed whitespace-pre-wrap">{item.deepExplanation}</p>
                  </div>

                  {/* Beginner Analogy */}
                  {item.beginnerAnalogy && (
                    <div className="bg-slate-100/50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 flex gap-4 items-start shadow-inner">
                      <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-500 shrink-0">
                        <Lightbulb size={22} className="animate-bounce" />
                      </div>
                      <div>
                        <h5 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">Beginner analogy</h5>
                        <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed italic">"{item.beginnerAnalogy}"</p>
                      </div>
                    </div>
                  )}

                  {/* Grid for Real-world & Industry Usage */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {item.realWorldUsage && (
                      <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
                        <h5 className="text-xs font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-3">Real-World Application</h5>
                        <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{item.realWorldUsage}</p>
                      </div>
                    )}
                    {item.industryUsage && (
                      <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-6 border border-slate-100 dark:border-white/5 shadow-sm">
                        <h5 className="text-xs font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-3">Industry Standard</h5>
                        <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed">{item.industryUsage}</p>
                      </div>
                    )}
                  </div>

                  {/* Best Practices & Common Mistakes Split Grid */}
                  {((item.bestPractices && item.bestPractices.length > 0) || (item.commonMistakes && item.commonMistakes.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-white/5">
                      {item.bestPractices && item.bestPractices.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="text-sm font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-wider flex items-center gap-2">
                            <CheckCircle2 size={16} /> Best Practices
                          </h5>
                          <ul className="space-y-2">
                            {item.bestPractices.map((bp, i) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                                <span className="text-emerald-500 shrink-0">✓</span> {bp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {item.commonMistakes && item.commonMistakes.length > 0 && (
                        <div className="space-y-4">
                          <h5 className="text-sm font-black text-rose-600 dark:text-rose-500 uppercase tracking-wider flex items-center gap-2">
                            <AlertTriangle size={16} /> Common Mistakes
                          </h5>
                          <ul className="space-y-2">
                            {item.commonMistakes.map((cm, i) => (
                              <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                                <span className="text-rose-500 shrink-0">✗</span> {cm}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Technical Deep Dive Tips */}
                  {((item.optimizationTips && item.optimizationTips.length > 0) || 
                    (item.securityTips && item.securityTips.length > 0) || 
                    (item.architectureNotes && item.architectureNotes.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100 dark:border-white/5">
                      {item.optimizationTips && item.optimizationTips.length > 0 && (
                        <div className="bg-blue-50/50 dark:bg-blue-500/5 rounded-2xl p-5 border border-blue-100 dark:border-blue-500/10 space-y-2">
                          <h6 className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
                            <Rocket size={14} /> Optimization
                          </h6>
                          <ul className="space-y-1.5">
                            {item.optimizationTips.map((tip, i) => (
                              <li key={i} className="text-xs text-slate-600 dark:text-blue-200/70 leading-relaxed">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.securityTips && item.securityTips.length > 0 && (
                        <div className="bg-red-50/50 dark:bg-red-500/5 rounded-2xl p-5 border border-red-100 dark:border-red-500/10 space-y-2">
                          <h6 className="text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-2">
                            <Shield size={14} /> Security Guard
                          </h6>
                          <ul className="space-y-1.5">
                            {item.securityTips.map((tip, i) => (
                              <li key={i} className="text-xs text-slate-600 dark:text-red-200/70 leading-relaxed">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.architectureNotes && item.architectureNotes.length > 0 && (
                        <div className="bg-purple-50/50 dark:bg-purple-500/5 rounded-2xl p-5 border border-purple-100 dark:border-purple-500/10 space-y-2">
                          <h6 className="text-xs font-black text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers size={14} /> Architecture
                          </h6>
                          <ul className="space-y-1.5">
                            {item.architectureNotes.map((tip, i) => (
                              <li key={i} className="text-xs text-slate-600 dark:text-purple-200/70 leading-relaxed">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))
            ) : (
              <div className="glass-card p-8 md:p-12 rounded-[2.5rem] border-slate-100 dark:border-white/5 shadow-md">
                <div className="prose prose-brand-cyan max-w-none text-slate-700 dark:text-white/80">
                  <p className="text-lg leading-relaxed whitespace-pre-wrap">
                    {legacyTheory || 'Content coming soon...'}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Live Examples */}
          {lesson.examples && lesson.examples.length > 0 && (
            <div className="space-y-8 mb-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                  <Play size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">Live Examples</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                {lesson.examples.map((example, i) => (
                  <div key={i} className="glass-card rounded-[2rem] border-slate-100 dark:border-white/5 overflow-hidden shadow-lg">
                    {/* Header */}
                    <div className="bg-slate-50 dark:bg-white/5 px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-700 dark:text-white/80">{example.title}</span>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      </div>
                    </div>

                    {/* Code Terminal */}
                    <div className="p-6 bg-[#0d1117] font-mono text-sm text-sky-400 overflow-x-auto relative">
                      <span className="absolute top-2 right-4 text-[10px] text-white/20 uppercase font-black tracking-widest pointer-events-none">Code</span>
                      <pre className="no-scrollbar">
                        <code>{example.code}</code>
                      </pre>
                    </div>

                    {/* Simulated Output Terminal */}
                    {example.expectedOutput && (
                      <div className="border-t border-slate-900 bg-[#07090e] p-5 font-mono text-xs text-emerald-400 relative">
                        <span className="absolute top-2 right-4 text-[10px] text-white/20 uppercase font-black tracking-widest pointer-events-none">Console Output</span>
                        <div className="flex items-center gap-2 mb-2 text-white/30 text-[10px] select-none uppercase font-bold tracking-widest">
                          <Terminal size={12} /> Execution Result
                        </div>
                        <pre className="whitespace-pre-wrap">{example.expectedOutput}</pre>
                      </div>
                    )}

                    {/* Explanations */}
                    {((example.lineByLineExplanation && example.lineByLineExplanation.length > 0) || example.realWorldExplanation) && (
                      <div className="p-8 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5 space-y-6">
                        {example.lineByLineExplanation && example.lineByLineExplanation.length > 0 && (
                          <div className="space-y-3">
                            <h6 className="text-xs font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Line-by-Line Breakdown</h6>
                            <ul className="space-y-2">
                              {example.lineByLineExplanation.map((lbl, idx) => (
                                <li key={idx} className="text-sm text-slate-600 dark:text-white/60 leading-relaxed flex gap-3">
                                  <span className="font-bold text-brand-cyan select-none">0{idx + 1}.</span>
                                  <span>{lbl}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {example.realWorldExplanation && (
                          <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                            <h6 className="text-xs font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-2">Production Context</h6>
                            <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed italic">
                              {example.realWorldExplanation}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hands-on Practice Section */}
          {((lesson.miniProjects && lesson.miniProjects.length > 0) || 
            (lesson.practiceProblems && (
              (lesson.practiceProblems.easy && lesson.practiceProblems.easy.length > 0) ||
              (lesson.practiceProblems.medium && lesson.practiceProblems.medium.length > 0) ||
              (lesson.practiceProblems.hard && lesson.practiceProblems.hard.length > 0)
            ))) && (
            <section className="space-y-8 mb-16 pt-8 border-t border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                  <Trophy size={20} />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest">Hands-On Training</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Mini Projects */}
                {lesson.miniProjects && lesson.miniProjects.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">Guided Projects</h4>
                    {lesson.miniProjects.map((proj, pIdx) => (
                      <div key={pIdx} className="glass-card p-8 rounded-[2rem] border-slate-100 dark:border-white/5 bg-gradient-to-br from-brand-purple/5 to-transparent relative overflow-hidden group shadow-sm">
                        <FolderGit size={60} className="absolute right-4 bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
                        <span className="px-3 py-1 rounded-full bg-brand-purple/10 text-brand-purple text-[9px] font-black uppercase tracking-wider border border-brand-purple/20">Mini Project</span>
                        <h5 className="text-xl font-black text-slate-800 dark:text-white mt-4 mb-2">{proj.title}</h5>
                        <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed mb-6">{proj.description}</p>
                        
                        {proj.features && proj.features.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">Key Deliverables:</span>
                            <ul className="grid grid-cols-1 gap-1.5">
                              {proj.features.map((feat, fIdx) => (
                                <li key={fIdx} className="text-xs text-slate-600 dark:text-white/70 flex gap-2 items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-brand-purple shrink-0"></span>
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Practice Problems */}
                {lesson.practiceProblems && (
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">Coding Challenges</h4>
                    <div className="glass-card p-8 rounded-[2rem] border-slate-100 dark:border-white/5 space-y-6 shadow-sm">
                      
                      {lesson.practiceProblems.easy && lesson.practiceProblems.easy.length > 0 && (
                        <div className="space-y-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">Easy</span>
                          <ul className="space-y-1.5">
                            {lesson.practiceProblems.easy.map((prob, idx) => (
                              <li key={idx} className="text-sm text-slate-600 dark:text-white/70 leading-relaxed flex gap-2">
                                <span className="text-emerald-500 select-none">•</span> <span>{prob}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lesson.practiceProblems.medium && lesson.practiceProblems.medium.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                          <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 text-[9px] font-black uppercase tracking-wider border border-yellow-500/20">Medium</span>
                          <ul className="space-y-1.5">
                            {lesson.practiceProblems.medium.map((prob, idx) => (
                              <li key={idx} className="text-sm text-slate-600 dark:text-white/70 leading-relaxed flex gap-2">
                                <span className="text-yellow-500 select-none">•</span> <span>{prob}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {lesson.practiceProblems.hard && lesson.practiceProblems.hard.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-500 text-[9px] font-black uppercase tracking-wider border border-rose-500/20">Hard</span>
                          <ul className="space-y-1.5">
                            {lesson.practiceProblems.hard.map((prob, idx) => (
                              <li key={idx} className="text-sm text-slate-600 dark:text-white/70 leading-relaxed flex gap-2">
                                <span className="text-rose-500 select-none">•</span> <span>{prob}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Chapter Summary & Revision Notes */}
          {((lesson.revisionNotes && lesson.revisionNotes.length > 0) || lesson.chapterSummary) && (
            <section className="glass-card p-8 md:p-12 rounded-[2.5rem] border-slate-100 dark:border-white/5 bg-gradient-to-br from-brand-cyan/5 via-transparent to-brand-purple/5 relative overflow-hidden mb-12 shadow-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {lesson.revisionNotes && lesson.revisionNotes.length > 0 && (
                  <div className="md:col-span-2 space-y-4">
                    <h4 className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                      <FileText size={16} className="text-brand-cyan" /> Quick Revision Notes
                    </h4>
                    <ul className="space-y-2">
                      {lesson.revisionNotes.map((note, idx) => (
                        <li key={idx} className="flex gap-3 text-sm text-slate-600 dark:text-white/70 leading-relaxed">
                          <span className="text-brand-cyan select-none font-bold">✓</span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {lesson.chapterSummary && (
                  <div className="space-y-4 md:border-l md:border-slate-100 md:dark:border-white/5 md:pl-8">
                    <h4 className="text-xs font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Zap size={16} className="text-brand-purple" /> Summary
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed italic">
                      "{lesson.chapterSummary}"
                    </p>
                  </div>
                )}

              </div>
            </section>
          )}

          {/* Navigation Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-4">
              {adjacent.prev && (
                <Link 
                  to={`/chapter/${course.id}/${adjacent.prev.slug}`}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold transition-all shadow-sm border border-slate-200 dark:border-transparent"
                >
                  <ArrowLeft size={18} /> Previous
                </Link>
              )}
            </div>
            
            <MarkCompleteButton 
              onComplete={handleMarkComplete}
              isDone={isDone}
              isMarkingComplete={isMarkingComplete}
              chapterSlug={lesson.slug}
            />

            <div className="flex items-center gap-4">
              {adjacent.next && (
                <Link 
                  to={`/chapter/${course.id}/${adjacent.next.slug}`}
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-brand-cyan/10 hover:bg-brand-cyan/20 text-brand-cyan font-bold transition-all"
                >
                  Next Chapter <ChevronRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
