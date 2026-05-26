import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Compass, 
  BookOpen, 
  Sparkles, 
  Award,
  ChevronRight,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Layers,
  Star,
  GripVertical,
  Flame
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import toast from 'react-hot-toast'

// Map of core courses per category tab
const CORE_COURSES = {
  'Frontend': ['html', 'css', 'javascript', 'react'],
  'Backend': ['nodejs', 'express', 'postgresql'],
  'DevOps': ['git', 'github'],
  'Full Stack': ['dsa', 'java']
}

export default function RoadmapBuilderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { metadata, customRoadmaps, actions, loading } = useApp()
  const dbCourses = metadata?.courses || []

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Custom')
  const [level, setLevel] = useState('Beginner to Advanced')
  const [duration, setDuration] = useState('3 Months')
  const [icon, setIcon] = useState('Layout')
  
  // Steps State
  const [steps, setSteps] = useState([
    { id: 'step-1', title: 'HTML5 basics', description: 'Web page markup fundamentals.', xp: 100, courseId: 'html' }
  ])

  // Palette State
  const [activePaletteTab, setActivePaletteTab] = useState('Frontend')

  // Drag and Drop States
  const [isDragging, setIsDragging] = useState(false)
  const [draggedOverIndex, setDraggedOverIndex] = useState(null)
  const [isDraggingBottom, setIsDraggingBottom] = useState(false)

  // Editing existing roadmap state
  const [editingId, setEditingId] = useState(null)

  const icons = ['Layout', 'Server', 'Cpu', 'Zap']

  // Parse edit param from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const editId = params.get('edit')
    if (editId && customRoadmaps.length > 0) {
      const roadmapToEdit = customRoadmaps.find(r => r.id === editId)
      if (roadmapToEdit) {
        startEditing(roadmapToEdit)
      }
    }
  }, [location.search, customRoadmaps])

  // Filter courses for active tab
  const currentTabCourses = useMemo(() => {
    return dbCourses.filter(c => c.category === activePaletteTab)
  }, [dbCourses, activePaletteTab])

  // Group current tab courses into core and elective
  const coreCourses = useMemo(() => {
    const coreList = CORE_COURSES[activePaletteTab] || []
    return currentTabCourses.filter(c => coreList.includes((c.slug || c.id || '').toLowerCase()))
  }, [currentTabCourses, activePaletteTab])

  const electiveCourses = useMemo(() => {
    const coreList = CORE_COURSES[activePaletteTab] || []
    return currentTabCourses.filter(c => !coreList.includes((c.slug || c.id || '').toLowerCase()))
  }, [currentTabCourses, activePaletteTab])

  // Handle load for editing
  const startEditing = (roadmap) => {
    setEditingId(roadmap.id)
    setTitle(roadmap.title || '')
    setDescription(roadmap.description || '')
    setCategory(roadmap.category || 'Custom')
    setLevel(roadmap.level || 'Beginner to Advanced')
    setDuration(roadmap.duration || '3 Months')
    setIcon(roadmap.icon || 'Layout')
    setSteps(roadmap.steps || [])
    window.scrollTo({ top: 0, behavior: 'smooth' })
    toast.success(`Loaded "${roadmap.title}" for editing`)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setSteps([{ id: 'step-1', title: 'HTML5 basics', description: 'Web page markup fundamentals.', xp: 100, courseId: 'html' }])
    navigate('/roadmap/builder') // Clear edit param
  }

  // Steps Actions
  const addCustomStep = () => {
    const newId = `step-${Date.now()}`
    setSteps([
      ...steps,
      { id: newId, title: 'New Step', description: 'Describe what to learn.', xp: 100, courseId: '' }
    ])
  }

  const removeStep = (id) => {
    if (steps.length <= 1) {
      toast.error('Your roadmap must have at least one step!')
      return
    }
    setSteps(steps.filter(s => s.id !== id))
  }

  const updateStepField = (id, field, value) => {
    setSteps(steps.map(s => {
      if (s.id === id) {
        let updated = { ...s, [field]: value }
        // If courseId is selected, auto-populate title & description if they are empty
        if (field === 'courseId' && value) {
          const course = dbCourses.find(c => c.id === value || c.slug === value)
          if (course) {
            if (!s.title || s.title === 'New Step') updated.title = course.title?.en || course.title
            if (!s.description || s.description === 'Describe what to learn.') updated.description = course.description?.en || course.description || ''
          }
        }
        return updated
      }
      return s
    }))
  }

  // Shift Step Order
  const moveStep = (index, direction) => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === steps.length - 1) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp
    setSteps(updated)
  }

  // Drag and Drop Logic
  const handleDragStart = (e, course) => {
    e.dataTransfer.setData('text/plain', course.slug || course.id)
    e.dataTransfer.effectAllowed = 'copy'
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setDraggedOverIndex(null)
    setIsDraggingBottom(false)
  }

  const handleDragOverNode = (e, index) => {
    e.preventDefault()
    setDraggedOverIndex(index)
  }

  const handleDropNode = (e, index) => {
    e.preventDefault()
    setDraggedOverIndex(null)
    setIsDragging(false)
    const courseId = e.dataTransfer.getData('text/plain')
    if (courseId) {
      insertCourseAt(courseId, index)
    }
  }

  const handleDragOverBottom = (e) => {
    e.preventDefault()
    setIsDraggingBottom(true)
  }

  const handleDropBottom = (e) => {
    e.preventDefault()
    setIsDraggingBottom(false)
    setIsDragging(false)
    const courseId = e.dataTransfer.getData('text/plain')
    if (courseId) {
      insertCourseAt(courseId, steps.length)
    }
  }

  const insertCourseAt = (courseId, index) => {
    const course = dbCourses.find(c => c.id === courseId || c.slug === courseId)
    if (!course) return
    const newId = `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const lessonCount = course.chapters?.length || 0
    const stepXP = lessonCount * 50 || 100
    const newStep = {
      id: newId,
      title: course.title?.en || course.title,
      description: course.description?.en || course.description || '',
      xp: stepXP,
      courseId: course.slug || course.id
    }
    const updated = [...steps]
    updated.splice(index, 0, newStep)
    setSteps(updated)
    toast.success(`Added ${course.title?.en || course.title} to roadmap!`)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Please provide a roadmap title!')
      return
    }

    const invalidSteps = steps.filter(s => !s.title.trim())
    if (invalidSteps.length > 0) {
      toast.error('All steps must have a title!')
      return
    }

    const calculatedSteps = steps.map(s => {
      let stepXP = 100
      if (s.courseId) {
        const course = dbCourses.find(c => c.id === s.courseId || c.slug === s.courseId)
        if (course) {
          const lessons = course.chapters || []
          stepXP = lessons.length * 50
          if (stepXP === 0) stepXP = 100 // fallback
        }
      }
      return {
        id: s.id,
        title: s.title,
        description: s.description || '',
        xp: stepXP,
        courseId: s.courseId || null
      }
    })

    const totalXP = calculatedSteps.reduce((sum, s) => sum + s.xp, 0)

    const payload = {
      title,
      description,
      category,
      level,
      duration,
      icon,
      xp: totalXP,
      steps: calculatedSteps
    }

    let res
    if (editingId) {
      res = await actions.updateCustomRoadmap(editingId, payload)
    } else {
      res = await actions.createCustomRoadmap(payload)
    }

    if (res?.success) {
      toast.success(editingId ? 'Roadmap updated successfully!' : 'Roadmap saved to Supabase!')
      cancelEditing()
    } else {
      toast.error(res?.error || 'Failed to save roadmap')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this custom roadmap?')) {
      const res = await actions.deleteCustomRoadmap(id)
      if (res?.success) {
        toast.success('Roadmap deleted from Supabase!')
        if (editingId === id) cancelEditing()
      } else {
        toast.error(res?.error || 'Failed to delete')
      }
    }
  }

  return (
    <div className="min-h-screen bg-bg-page text-slate-900 dark:text-white pt-24 pb-16 px-4 md:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/courses')} 
            className="flex items-center gap-2 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white mb-4 text-sm font-semibold transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Courses
          </button>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Roadmap <span className="text-brand-cyan">Builder</span>
            <Sparkles className="text-brand-purple animate-pulse" size={28} />
          </h1>
          <p className="text-slate-500 dark:text-white/40 mt-2 text-sm md:text-base max-w-xl">
            Design your private roadmap. Drag courses from the left palette and drop them into your path.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Course Palette & My Roadmaps (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Palette Card */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex flex-col">
            <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/5 pb-4 mb-4 flex items-center gap-2">
              <Layers size={20} className="text-brand-cyan" />
              Course Palette
            </h2>

            {/* Category Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-3 mb-4 border-b border-slate-100 dark:border-white/5">
              {['Frontend', 'Backend', 'Full Stack', 'DevOps'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActivePaletteTab(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all whitespace-nowrap ${
                    activePaletteTab === cat
                      ? 'bg-brand-cyan text-bg-deep shadow-md'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Courses List */}
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
              
              {/* Core Section */}
              {coreCourses.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase text-amber-500 dark:text-amber-400 mb-3 flex items-center gap-1">
                    <Flame size={14} className="animate-bounce" />
                    Core / Minimum Required
                  </h3>
                  <div className="space-y-3">
                    {coreCourses.map(course => (
                      <div
                        key={course.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, course)}
                        onDragEnd={handleDragEnd}
                        className="p-3 bg-gradient-to-br from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10 dark:from-amber-500/10 dark:to-orange-500/5 rounded-2xl border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-between gap-3 group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical size={16} className="text-slate-300 dark:text-white/20 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-black text-xs text-slate-800 dark:text-white truncate">
                              {course.title?.en || course.title}
                            </p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400/80 font-bold uppercase tracking-wider">
                              Core Course
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => insertCourseAt(course.id, steps.length)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white dark:hover:text-bg-deep transition-all shrink-0"
                          title="Add to Roadmap"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Elective Section */}
              {electiveCourses.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 dark:text-white/30 mb-3 flex items-center gap-1">
                    <Star size={14} />
                    Elective / Optional
                  </h3>
                  <div className="space-y-3">
                    {electiveCourses.map(course => (
                      <div
                        key={course.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, course)}
                        onDragEnd={handleDragEnd}
                        className="p-3 bg-slate-50/50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-brand-cyan/30 transition-all flex items-center justify-between gap-3 group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <GripVertical size={16} className="text-slate-300 dark:text-white/20 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-800 dark:text-white truncate">
                              {course.title?.en || course.title}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-white/40 font-bold uppercase">
                              {course.difficulty || 'Intermediate'}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => insertCourseAt(course.id, steps.length)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-brand-cyan dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-white dark:hover:text-bg-deep transition-all shrink-0"
                          title="Add to Roadmap"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTabCourses.length === 0 && (
                <div className="py-8 text-center text-slate-400 dark:text-white/30 text-xs font-bold flex flex-col items-center justify-center gap-2">
                  <AlertCircle size={20} />
                  No courses in this category.
                </div>
              )}
            </div>
          </div>

          {/* User's Roadmaps List */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10">
            <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/5 pb-4 mb-4 flex items-center gap-2">
              <Compass size={20} className="text-brand-cyan" />
              My Roadmaps
            </h2>
            
            {customRoadmaps.length === 0 ? (
              <div className="py-8 text-center text-slate-400 dark:text-white/30 text-sm font-bold flex flex-col items-center justify-center gap-2">
                <AlertCircle size={24} className="text-slate-300 dark:text-white/20" />
                No custom roadmaps yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {customRoadmaps.map((rm) => (
                  <div key={rm.id} className="p-4 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-brand-cyan/30 transition-all flex items-center justify-between gap-3 group">
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-slate-800 dark:text-white group-hover:text-brand-cyan transition-colors">{rm.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-white/40 font-semibold">{rm.steps?.length || 0} steps • {rm.xp || 0} XP</p>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(rm)}
                        className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 dark:bg-white/5 dark:text-white/70 hover:text-slate-900 dark:hover:text-white dark:border-white/10 transition-colors"
                        title="Edit Roadmap"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(rm.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                        title="Delete Roadmap"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings + Visual Tree Steps Builder (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Settings Form */}
          <form onSubmit={handleSave} className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 space-y-6">
            <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-white/5 pb-4">
              {editingId ? 'Edit Roadmap Details' : 'Roadmap Details'}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/50">Roadmap Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. My NextJS Mastery Path"
                  className="w-full bg-slate-50 dark:bg-[#0a0f29] border border-slate-200 dark:border-white/10 focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan outline-none rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/50">Level</label>
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-[#0a0f29] border border-slate-200 dark:border-white/10 focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan outline-none rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Beginner to Advanced">Beginner to Advanced</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/50">Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Brief summary of what this path covers..."
                rows={2}
                className="w-full bg-slate-50 dark:bg-[#0a0f29] border border-slate-200 dark:border-white/10 focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan outline-none rounded-xl p-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/50">Category</label>
                <input 
                  type="text" 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-[#0a0f29] border border-slate-200 dark:border-white/10 focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan outline-none rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/50">Duration</label>
                <input 
                  type="text" 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)} 
                  placeholder="e.g. 3 Months"
                  className="w-full bg-slate-50 dark:bg-[#0a0f29] border border-slate-200 dark:border-white/10 focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan outline-none rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-white/50">Icon Style</label>
                <select 
                  value={icon} 
                  onChange={(e) => setIcon(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-[#0a0f29] border border-slate-200 dark:border-white/10 focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan outline-none rounded-xl p-3 text-sm text-slate-900 dark:text-white font-bold"
                >
                  {icons.map(ic => (
                    <option key={ic} value={ic}>{ic}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex gap-3">
              <button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-brand-cyan to-brand-blue text-bg-deep font-black p-3.5 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:opacity-90 active:scale-95 transition-all text-sm uppercase tracking-wider"
              >
                <Save size={18} />
                {editingId ? 'Update Roadmap' : 'Save Roadmap'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={cancelEditing}
                  className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white font-bold rounded-xl transition-all text-sm"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Visual Steps Tree */}
          <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/10 min-h-[500px] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">Roadmap Steps</h2>
                <p className="text-xs text-slate-500 dark:text-white/40 font-bold">Steps will be completed sequentially. Drag courses into the tree to insert or append.</p>
              </div>
              <button 
                type="button" 
                onClick={addCustomStep}
                className="bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-black px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-brand-cyan/20 active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                <Plus size={16} />
                Add Custom Step
              </button>
            </div>

            {/* List of Steps (Interactive Tree Layout) */}
            <div className="relative pl-6 md:pl-10 ml-4 md:ml-6 flex-1 py-4">
              
              {/* Visual vertical tree line */}
              <div className="absolute left-[-2px] top-0 bottom-0 w-1 bg-gradient-to-b from-brand-cyan via-brand-purple to-brand-blue rounded-full"></div>

              <div className="space-y-6">
                <AnimatePresence initial={false}>
                  {steps.map((step, index) => {
                    const isDraggedOver = draggedOverIndex === index
                    return (
                      <React.Fragment key={step.id}>
                        {/* Drag and Drop Insert Zone */}
                        {isDragging && (
                          <div 
                            onDragOver={(e) => handleDragOverNode(e, index)}
                            onDragLeave={() => setDraggedOverIndex(null)}
                            onDrop={(e) => handleDropNode(e, index)}
                            className={`relative h-6 flex items-center justify-center transition-all ${
                              isDraggedOver 
                                ? 'h-14 bg-brand-cyan/10 border-2 border-dashed border-brand-cyan rounded-2xl' 
                                : 'h-6 bg-transparent'
                            }`}
                          >
                            {isDraggedOver ? (
                              <p className="text-[10px] uppercase font-black text-brand-cyan tracking-wider flex items-center gap-1">
                                <Plus size={12} /> Drop to insert course as step {index + 1}
                              </p>
                            ) : (
                              <div className="absolute left-[-24px] md:left-[-35px] w-[9px] h-[9px] rounded-full bg-slate-300 dark:bg-white/20 border-2 border-bg-page dark:border-[#0a0f29]"></div>
                            )}
                          </div>
                        )}

                        {/* Step Card */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="p-5 bg-slate-50/50 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col md:flex-row gap-4 items-start relative group/step hover:border-brand-purple/30 transition-all"
                        >
                          {/* Horizontal Connector Line to vertical trunk */}
                          <div className="absolute -left-6 md:-left-10 top-10 h-0.5 w-6 md:w-10 bg-slate-200 dark:bg-white/10"></div>

                          {/* Circular Tree Node Badge */}
                          <div className="absolute -left-[35px] md:-left-[47px] top-6 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-blue border-4 border-bg-page dark:border-[#0a0f29] flex items-center justify-center text-bg-deep text-[10px] md:text-xs font-black shadow-md shadow-brand-cyan/20 group-hover/step:scale-110 transition-transform">
                            {index + 1}
                          </div>

                          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Step Title */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Step Title</label>
                              <input 
                                type="text" 
                                value={step.title} 
                                onChange={(e) => updateStepField(step.id, 'title', e.target.value)} 
                                placeholder="e.g. Master Flexbox Layouts"
                                className="w-full bg-white dark:bg-[#0a0f29]/80 border border-slate-200 dark:border-white/10 focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple outline-none rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all font-bold"
                              />
                            </div>

                            {/* Link to Course */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Link Course (Optional)</label>
                              <select 
                                value={step.courseId || ''} 
                                onChange={(e) => updateStepField(step.id, 'courseId', e.target.value)} 
                                className="w-full bg-white dark:bg-[#0a0f29]/80 border border-slate-200 dark:border-white/10 focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple outline-none rounded-lg p-2.5 text-xs text-slate-900 dark:text-white font-bold"
                              >
                                <option value="">None (Custom Goal Only)</option>
                                {dbCourses.map(course => (
                                  <option key={course.id} value={course.slug || course.id} className="bg-white dark:bg-[#020617] text-slate-900 dark:text-white">
                                    [{course.difficulty || 'Beginner'}] {course.title?.en || course.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Step Description */}
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">Short Description</label>
                              <input 
                                type="text" 
                                value={step.description} 
                                onChange={(e) => updateStepField(step.id, 'description', e.target.value)} 
                                placeholder="What skills are developed in this step?"
                                className="w-full bg-white dark:bg-[#0a0f29]/80 border border-slate-200 dark:border-white/10 focus:border-brand-purple/50 focus:ring-1 focus:ring-brand-purple outline-none rounded-lg p-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all"
                              />
                            </div>

                            {/* XP Points (Calculated & Read-only) */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40 flex items-center gap-1">
                                <Award size={12} className="text-brand-purple" /> Reward XP
                              </label>
                              <div className="w-full bg-slate-100 dark:bg-[#0a0f29] border border-slate-200 dark:border-white/10 rounded-lg p-2.5 text-xs text-slate-700 dark:text-white/80 font-bold">
                                {(() => {
                                  if (step.courseId) {
                                    const course = dbCourses.find(c => c.id === step.courseId || c.slug === step.courseId)
                                    const lessonCount = course?.chapters?.length || 0
                                    return lessonCount > 0 ? `${lessonCount * 50} XP (${lessonCount} lessons)` : '100 XP'
                                  }
                                  return '100 XP (Custom Goal)'
                                })()}
                              </div>
                            </div>

                            {/* Step Control Buttons (Move Up/Down, Remove) */}
                            <div className="flex items-end gap-2 md:col-span-2 justify-end">
                              <button
                                type="button"
                                onClick={() => moveStep(index, 'up')}
                                disabled={index === 0}
                                className={`p-2 rounded-xl border transition-all ${
                                  index === 0 
                                    ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300 dark:text-white/10 cursor-not-allowed'
                                    : 'bg-white hover:bg-slate-50 dark:bg-[#0a0f29]/80 dark:hover:bg-[#0a0f29] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 dark:hover:text-white'
                                }`}
                                title="Move Step Up"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveStep(index, 'down')}
                                disabled={index === steps.length - 1}
                                className={`p-2 rounded-xl border transition-all ${
                                  index === steps.length - 1
                                    ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-300 dark:text-white/10 cursor-not-allowed'
                                    : 'bg-white hover:bg-slate-50 dark:bg-[#0a0f29]/80 dark:hover:bg-[#0a0f29] border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60 dark:hover:text-white'
                                }`}
                                title="Move Step Down"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button 
                                type="button" 
                                onClick={() => removeStep(step.id)}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors hover:text-red-400 flex items-center justify-center gap-1 text-xs font-bold border border-red-500/20"
                                title="Remove Step"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                          </div>
                        </motion.div>
                      </React.Fragment>
                    )
                  })}
                </AnimatePresence>

                {/* Drag and Drop Append Zone at the bottom */}
                <div 
                  onDragOver={handleDragOverBottom}
                  onDragLeave={() => setIsDraggingBottom(false)}
                  onDrop={handleDropBottom}
                  className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                    isDraggingBottom 
                      ? 'border-brand-cyan bg-brand-cyan/15 scale-[1.01]' 
                      : isDragging 
                        ? 'border-brand-cyan/40 bg-brand-cyan/5 border-dashed'
                        : 'border-slate-200 dark:border-white/10 bg-transparent opacity-60'
                  }`}
                >
                  <Plus size={24} className={`mb-2 transition-transform ${isDraggingBottom ? 'scale-125 text-brand-cyan' : 'text-slate-400 dark:text-white/40'}`} />
                  <p className="text-xs font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider">
                    {isDraggingBottom ? 'Drop to Add Course' : isDragging ? 'Drop here to append course to end' : 'Drag courses here to build your path'}
                  </p>
                </div>

              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
