import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import {
  BookOpen, 
  Clock, 
  Search, 
  Zap, 
  Code2, 
  Database, 
  Cloud, 
  GitBranch, 
  Globe, 
  Layers, 
  Cpu,
  ArrowRight,
  ArrowLeft,
  Target,
  Plus,
  Trash2,
  Edit,
  TerminalSquare,
  Smartphone,
  BrainCircuit,
  Binary
} from 'lucide-react'
import { CardSkeleton } from '../components/Skeleton'
import toast from 'react-hot-toast'

// Map courses to icons and colors
const COURSE_ICONS = {
  html:       { icon: Globe,    color: 'text-orange-500', bg: 'bg-orange-500/10' },
  css:        { icon: Layers,   color: 'text-blue-500', bg: 'bg-blue-500/10' },
  javascript: { icon: Zap,      color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  react:      { icon: Cpu,      color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  nodejs:     { icon: Code2,    color: 'text-green-500', bg: 'bg-green-500/10'  },
  postgresql: { icon: Database, color: 'text-blue-600', bg: 'bg-blue-600/10'  },
  aws:        { icon: Cloud,    color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  python:     { icon: TerminalSquare, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  java:       { icon: Binary,   color: 'text-red-500', bg: 'bg-red-500/10' },
  dsa:        { icon: BrainCircuit, color: 'text-purple-500', bg: 'bg-purple-500/10' },
}

// Attractive category metadata
const CATEGORY_META = {
  'Frontend': { 
    icon: Globe, 
    color: 'text-cyan-400', 
    bg: 'bg-cyan-400/10', 
    border: 'border-cyan-400/20', 
    gradient: 'from-cyan-500/20 to-blue-500/5',
    desc: 'Master UI, React, HTML, CSS & Client-side logic.'
  },
  'Backend': { 
    icon: Database, 
    color: 'text-green-400', 
    bg: 'bg-green-400/10', 
    border: 'border-green-400/20',
    gradient: 'from-green-500/20 to-emerald-500/5',
    desc: 'Build robust APIs, Databases, Node.js & Python.'
  },
  'DevOps': { 
    icon: Cloud, 
    color: 'text-yellow-400', 
    bg: 'bg-yellow-400/10', 
    border: 'border-yellow-400/20',
    gradient: 'from-yellow-500/20 to-orange-500/5',
    desc: 'Automate deployments, AWS, Docker & CI/CD.'
  },
  'Mobile': { 
    icon: Smartphone, 
    color: 'text-purple-400', 
    bg: 'bg-purple-400/10', 
    border: 'border-purple-400/20',
    gradient: 'from-purple-500/20 to-pink-500/5',
    desc: 'Create iOS and Android apps using React Native & Flutter.'
  },
  'CS Fundamentals': { 
    icon: Binary, 
    color: 'text-red-400', 
    bg: 'bg-red-400/10', 
    border: 'border-red-400/20',
    gradient: 'from-red-500/20 to-orange-500/5',
    desc: 'Data Structures, Algorithms & System Design.'
  },
  'AI & Data': { 
    icon: BrainCircuit, 
    color: 'text-indigo-400', 
    bg: 'bg-indigo-400/10', 
    border: 'border-indigo-400/20',
    gradient: 'from-indigo-500/20 to-purple-500/5',
    desc: 'Machine Learning, AI Engineering, Data Science.'
  },
  'Custom': { 
    icon: Plus, 
    color: 'text-brand-cyan', 
    bg: 'bg-brand-cyan/10', 
    border: 'border-brand-cyan/20',
    gradient: 'from-brand-cyan/20 to-blue-500/5',
    desc: 'Your personalized roadmaps and custom paths.'
  },
  'Other': { 
    icon: Layers, 
    color: 'text-slate-400', 
    bg: 'bg-slate-400/10', 
    border: 'border-slate-400/20',
    gradient: 'from-slate-500/20 to-slate-800/5',
    desc: 'Miscellaneous courses and tools.'
  }
}

export default function CoursesPage() {
  const navigate = useNavigate()
  const { state, metadata, customRoadmaps = [], actions, loading, dbError } = useApp()
  const courses = metadata?.courses || []
  const userProgress = state?.completedChapters || {}
  
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)

  // Auto scroll to top on category or course change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedCategory, selectedCourse])

  // Get all unique categories dynamically from the loaded courses
  const availableCategories = useMemo(() => {
    const cats = new Set()
    courses.forEach(c => {
      if (c.category) cats.add(c.category)
    })
    if (customRoadmaps.length > 0) cats.add('Custom')
    return Array.from(cats).sort()
  }, [courses, customRoadmaps])

  // Filter courses when a category is selected (Level 2)
  const categoryCourses = useMemo(() => {
    if (!selectedCategory) return []
    
    if (selectedCategory === 'Custom') {
      return customRoadmaps.filter(r => {
        const title = r.title || ''
        return !search || title.toLowerCase().includes(search.toLowerCase())
      })
    }

    return courses.filter(c => {
      const matchSearch = !search || (c.title && c.title.toLowerCase().includes(search.toLowerCase()))
      return c.category === selectedCategory && matchSearch
    })
  }, [courses, customRoadmaps, search, selectedCategory])

  // Group chapters by section dynamically for the selected course bundle (Level 3)
  const courseSections = useMemo(() => {
    if (!selectedCourse) return []
    
    const sectionsMap = new Map()
    selectedCourse.chapters.forEach((lesson) => {
      const sId = lesson.sectionId || lesson.sectionTitle || 'general'
      const sTitle = lesson.sectionTitle || 'General'
      
      if (!sectionsMap.has(sId)) {
        sectionsMap.set(sId, {
          id: sId,
          title: sTitle,
          lessons: []
        })
      }
      
      sectionsMap.get(sId).lessons.push(lesson)
    })
    
    return Array.from(sectionsMap.values()).filter(section => {
      const matchSearch = !search || section.title.toLowerCase().includes(search.toLowerCase())
      return matchSearch
    })
  }, [selectedCourse, search])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
      <header className="mb-16 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-[0.3em] mb-6"
        >
          <Target size={14} /> Catalog
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.h1 
              key="title-main"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6"
            >
              Explore <span className="text-brand-cyan">Roadmaps</span>
            </motion.h1>
          ) : (
            <motion.div
              key="title-category"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center"
            >
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                {selectedCourse ? (
                  <>
                    <span className="text-brand-cyan">{selectedCourse.title?.en || selectedCourse.title}</span> Modules
                  </>
                ) : (
                  <>
                    {selectedCategory} <span className="text-brand-cyan">Courses</span>
                  </>
                )}
              </h1>
              <button 
                onClick={() => { 
                  if (selectedCourse) {
                    setSelectedCourse(null)
                  } else {
                    setSelectedCategory(null)
                    setSearch('')
                  }
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold transition-all border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-lg cursor-pointer"
              >
                <ArrowLeft size={18} />
                {selectedCourse ? `Back to ${selectedCategory}` : 'Back to Categories'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Level 1: Categories View */}
      <AnimatePresence mode="wait">
        {!selectedCategory && (
          <motion.div 
            key="categories-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {availableCategories.map(cat => {
              const meta = CATEGORY_META[cat] || CATEGORY_META['Other']
              const Icon = meta.icon
              const count = cat === 'Custom' ? customRoadmaps.length : courses.filter(c => c.category === cat).length
              
              return (
                <motion.div
                  key={cat}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer rounded-[2.5rem] p-8 border ${meta.border} bg-gradient-to-br ${meta.gradient} backdrop-blur-xl relative overflow-hidden group shadow-lg`}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-12">
                    <Icon size={120} className={meta.color} />
                  </div>
                  
                  <div className={`w-16 h-16 rounded-2xl ${meta.bg} flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.05)] group-hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all`}>
                    <Icon size={32} className={meta.color} />
                  </div>
                  
                  <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight">{cat}</h3>
                  <p className="text-slate-600 dark:text-white/60 mb-8 max-w-[200px] leading-relaxed text-sm">
                    {meta.desc}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="px-4 py-2 rounded-full bg-slate-100/50 dark:bg-bg-deep/50 text-slate-700 dark:text-white/80 text-xs font-black uppercase tracking-wider border border-slate-200/50 dark:border-white/5">
                      {count} Courses
                    </span>
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white group-hover:bg-brand-cyan group-hover:text-bg-deep transition-all shadow-sm">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* Level 2: Course Bundle View */}
        {selectedCategory && !selectedCourse && (
          <motion.div
            key="courses-grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-10 relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={20} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search in ${selectedCategory}...`} 
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-14 pr-6 py-4 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:ring-1 focus:ring-brand-cyan/50 transition-all text-lg outline-none shadow-md focus:shadow-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {selectedCategory === 'Custom' && (
                <motion.div
                  layout
                  className="glass-card rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-white/10 p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-brand-cyan/50 hover:bg-brand-cyan/5 transition-all min-h-[350px]"
                  onClick={() => navigate('/roadmap/builder')}
                >
                  <div className="w-16 h-16 rounded-2xl bg-brand-cyan/10 flex items-center justify-center group-hover:scale-110 transition-transform mb-6 text-brand-cyan">
                    <Plus size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Create Custom Path</h3>
                  <p className="text-sm text-slate-500 dark:text-white/40 mb-6 max-w-[240px]">
                    Design your own roadmap by dragging and dropping courses to fit your personal goals.
                  </p>
                  <button className="px-5 py-3 rounded-2xl bg-brand-cyan text-bg-deep font-black flex items-center gap-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all text-sm uppercase tracking-wider cursor-pointer">
                    Launch Builder
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {categoryCourses.map((item) => (
                selectedCategory === 'Custom' ? (
                  <CustomRoadmapCard 
                    key={item.id} 
                    roadmap={item} 
                    userProgress={userProgress} 
                    dbCourses={courses}
                    actions={actions}
                  />
                ) : (
                  <CourseCard 
                    key={item.id} 
                    course={item} 
                    userProgress={userProgress} 
                    onSelect={setSelectedCourse}
                  />
                )
              ))}
            </div>

            {categoryCourses.length === 0 && selectedCategory !== 'Custom' && (
              <div className="text-center py-20 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2.5rem] max-w-2xl mx-auto mt-8 shadow-sm">
                <p className="text-slate-700 dark:text-white/60 mb-2 font-extrabold text-lg">No Roadmaps Found</p>
                <p className="text-sm text-slate-400 dark:text-white/30 max-w-sm mx-auto">
                  Try adjusting your search query.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Level 3: Section/Language Card View */}
        {selectedCourse && (
          <motion.div
            key="sections-grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="mb-10 relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20" size={20} />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search modules in ${selectedCourse.title?.en || selectedCourse.title}...`} 
                className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-14 pr-6 py-4 text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:ring-1 focus:ring-brand-cyan/50 transition-all text-lg outline-none shadow-md focus:shadow-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courseSections.map((sec) => (
                <SectionCard 
                  key={sec.id} 
                  section={sec} 
                  course={selectedCourse} 
                  userProgress={userProgress} 
                />
              ))}
            </div>

            {courseSections.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-[2.5rem] max-w-2xl mx-auto mt-8 shadow-sm">
                <p className="text-slate-700 dark:text-white/60 mb-2 font-extrabold text-lg">No Modules Found</p>
                <p className="text-sm text-slate-400 dark:text-white/30 max-w-sm mx-auto">
                  Try adjusting your search query.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CourseCard({ course, userProgress, onSelect }) {
  const meta = COURSE_ICONS[course.slug] || { icon: BookOpen, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' }
  const Icon = meta.icon
  const lessons = course.chapters || []
  const total = lessons.length
  const done = lessons.filter(l => {
    const key = `${course.id}:${l.slug}`
    return userProgress[key] === true
  }).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onSelect(course)}
      className="glass-card rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden group flex flex-col h-full hover:shadow-[0_0_40px_rgba(34,211,238,0.1)] transition-all duration-500 cursor-pointer"
    >
      {course.thumbnail_url ? (
        <div className="relative h-44 bg-slate-900 overflow-hidden border-b border-slate-100 dark:border-white/5">
          <img 
            src={course.thumbnail_url} 
            alt={course.title?.en || course.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg-deep/90 via-bg-deep/20 to-transparent"></div>
          
          <div className="absolute bottom-3 left-6">
            <div className={`w-12 h-12 rounded-2xl ${meta.bg} backdrop-blur-md flex items-center justify-center border border-slate-100 dark:border-white/10 shadow-lg group-hover:scale-110 transition-transform`}>
              <Icon size={22} className={meta.color} />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-brand-cyan/10 to-transparent overflow-hidden border-b border-slate-100 dark:border-white/5 flex items-center px-8">
           <div className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
              <Icon size={28} className={meta.color} />
            </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col h-full p-8">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-brand-cyan transition-colors">{course.title?.en || course.title}</h3>
        <p className="text-sm text-slate-500 dark:text-white/50 mb-8 line-clamp-2 leading-relaxed">{course.description?.en || course.description || 'Master this technology with our hands-on interactive roadmap.'}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
              <BookOpen size={12} /> Chapters
            </p>
            <div className="text-sm font-bold text-slate-800 dark:text-white/80">{total} Lessons</div>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Target size={12} /> Level
            </p>
            <div className="text-sm font-bold text-slate-800 dark:text-white/80 uppercase">{course.difficulty || 'All Levels'}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold mb-3">
            <span className="text-slate-400 dark:text-white/40 uppercase tracking-widest">Progress</span>
            <span className="text-brand-cyan">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-brand-cyan to-blue-500 rounded-full"
            />
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onSelect(course); }}
          className="w-full mt-auto py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-black flex items-center justify-center gap-2 hover:bg-brand-cyan hover:text-slate-900 hover:border-brand-cyan transition-all shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] tracking-wide uppercase text-sm cursor-pointer"
        >
          {progress > 0 ? 'Continue Bundle' : 'Start Bundle'}
          <ArrowRight size={18} />
        </button>
      </div>
    </motion.div>
  )
}

function CustomRoadmapCard({ roadmap, userProgress, dbCourses, actions }) {
  const navigate = useNavigate()
  const meta = { icon: BookOpen, color: 'text-brand-purple', bg: 'bg-brand-purple/10' }
  const Icon = meta.icon
  const steps = roadmap.steps || []
  const total = steps.length

  let doneCount = 0
  steps.forEach(step => {
    const targetId = step.courseId || step.id
    const course = dbCourses.find(c => c.id === targetId || c.slug === targetId)
    if (course) {
      const lessons = course.chapters || []
      const courseCompleted = lessons.length > 0 && lessons.every(l => {
        const key = `${course.id}:${l.slug}`
        return userProgress[key] === true
      })
      if (courseCompleted) doneCount++
    }
  })
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0

  const firstStep = steps[0]
  const firstCourse = firstStep ? dbCourses.find(c => c.id === firstStep.courseId || c.slug === firstStep.courseId) : null
  const linkUrl = firstCourse && firstCourse.chapters?.[0] 
    ? `/chapter/${firstCourse.slug}/${firstCourse.chapters[0].slug}`
    : `/home`

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 relative overflow-hidden group flex flex-col h-full hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] transition-all duration-500"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-purple/20 blur-[50px] -mr-10 -mt-10 rounded-full pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
            <Icon size={28} className={meta.color} />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation(); navigate(`/roadmap/builder?edit=${roadmap.id}`)
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 hover:text-slate-800 hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault(); e.stopPropagation();
                if (window.confirm('Delete this custom roadmap?')) {
                  const res = await actions.deleteCustomRoadmap(roadmap.id)
                  if (res?.success) toast.success('Roadmap deleted!')
                  else toast.error(res?.error || 'Failed to delete')
                }
              }}
              className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-brand-purple transition-colors">{roadmap.title}</h3>
        <p className="text-sm text-slate-500 dark:text-white/50 mb-8 line-clamp-2 leading-relaxed">{roadmap.description || 'Custom learning path.'}</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">Steps</p>
            <div className="text-sm font-bold text-slate-800 dark:text-white/80">{total} Milestone{total !== 1 ? 's' : ''}</div>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1">Type</p>
            <div className="text-sm font-bold text-slate-800 dark:text-white/80 uppercase">Custom Path</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold mb-3">
            <span className="text-slate-400 dark:text-white/40 uppercase tracking-widest">Progress</span>
            <span className="text-brand-purple">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-brand-purple to-pink-500 rounded-full"
            />
          </div>
        </div>

        <Link 
          to={linkUrl}
          className="w-full mt-auto py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-black flex items-center justify-center gap-2 hover:bg-brand-purple hover:text-white hover:border-brand-purple transition-all shadow-lg hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] tracking-wide uppercase text-sm"
        >
          {progress > 0 ? 'Continue Path' : 'Start Path'}
          <ArrowRight size={18} />
        </Link>
      </div>
    </motion.div>
  )
}

const getSectionMeta = (title) => {
  const t = title.toLowerCase()
  if (t.includes('html')) return { icon: Globe, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-orange-500/20 to-red-500/5' }
  if (t.includes('css')) return { icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/20 to-indigo-500/5' }
  if (t.includes('javascript') || t.includes('js')) return { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', gradient: 'from-yellow-500/20 to-amber-500/5' }
  if (t.includes('react')) return { icon: Cpu, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', gradient: 'from-cyan-500/20 to-blue-500/5' }
  if (t.includes('node') || t.includes('express')) return { icon: Code2, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', gradient: 'from-green-500/20 to-emerald-500/5' }
  if (t.includes('sql') || t.includes('postgres') || t.includes('database') || t.includes('db')) return { icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', gradient: 'from-indigo-500/20 to-purple-500/5' }
  if (t.includes('aws') || t.includes('cloud') || t.includes('docker') || t.includes('devops') || t.includes('kubernetes')) return { icon: Cloud, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', gradient: 'from-yellow-500/20 to-orange-500/5' }
  if (t.includes('python')) return { icon: TerminalSquare, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/20 to-cyan-500/5' }
  if (t.includes('java')) return { icon: Binary, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', gradient: 'from-red-500/20 to-orange-500/5' }
  if (t.includes('dsa') || t.includes('algorithm') || t.includes('data structure')) return { icon: BrainCircuit, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', gradient: 'from-purple-500/20 to-pink-500/5' }
  
  return { icon: BookOpen, color: 'text-brand-cyan', bg: 'bg-brand-cyan/10', border: 'border-brand-cyan/20', gradient: 'from-brand-cyan/20 to-blue-500/5' }
}

const getFirstUncompletedLessonSlug = (lessons, courseId, progressState) => {
  const uncompleted = lessons.find(l => {
    const key = `${courseId}:${l.slug}`
    return progressState[key] !== true
  })
  return uncompleted ? uncompleted.slug : lessons[0]?.slug
}

function SectionCard({ section, course, userProgress }) {
  const meta = getSectionMeta(section.title)
  const Icon = meta.icon
  const total = section.lessons.length
  const done = section.lessons.filter(l => {
    const key = `${course.id}:${l.slug}`
    return userProgress[key] === true
  }).length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  
  const targetSlug = getFirstUncompletedLessonSlug(section.lessons, course.id, userProgress)
  const linkUrl = `/chapter/${course.slug}/${targetSlug}`
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2.5rem] border border-slate-100 dark:border-white/5 overflow-hidden group flex flex-col h-full hover:shadow-[0_0_40px_rgba(34,211,238,0.1)] transition-all duration-500"
    >
      <div className={`relative h-32 bg-gradient-to-br ${meta.gradient} overflow-hidden border-b border-slate-100 dark:border-white/5 flex items-center px-8`}>
         <div className={`w-14 h-14 rounded-2xl ${meta.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
            <Icon size={28} className={meta.color} />
          </div>
      </div>

      <div className="relative z-10 flex flex-col h-full p-8">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3 group-hover:text-brand-cyan transition-colors">{section.title}</h3>
        <p className="text-sm text-slate-500 dark:text-white/50 mb-8 leading-relaxed">
          Dive deep into {section.title} with {total} interactive, hands-on chapters.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
              <BookOpen size={12} /> Lessons
            </p>
            <div className="text-sm font-bold text-slate-800 dark:text-white/80">{total} chapters</div>
          </div>
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Target size={12} /> Status
            </p>
            <div className="text-sm font-bold text-slate-800 dark:text-white/80 uppercase">
              {progress === 100 ? 'Completed' : progress > 0 ? 'In Progress' : 'Not Started'}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold mb-3">
            <span className="text-slate-400 dark:text-white/40 uppercase tracking-widest">Progress</span>
            <span className="text-brand-cyan">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-brand-cyan to-blue-500 rounded-full"
            />
          </div>
        </div>

        <Link 
          to={linkUrl}
          className="w-full mt-auto py-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-black flex items-center justify-center gap-2 hover:bg-brand-cyan hover:text-slate-900 hover:border-brand-cyan transition-all shadow-lg hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] tracking-wide uppercase text-sm"
        >
          {progress === 100 ? 'Review lessons' : progress > 0 ? 'Continue learning' : 'Start learning'}
          <ArrowRight size={18} />
        </Link>
      </div>
    </motion.div>
  )
}
