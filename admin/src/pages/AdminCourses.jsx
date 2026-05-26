import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X, 
  BookOpen, 
  Eye, 
  Tag, 
  Calendar,
  Globe,
  CornerDownRight,
  Sparkles,
  ArrowUpDown
} from 'lucide-react'
import { coursesService } from '../services/services'

export default function AdminCourses() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: coursesService.getCourses
  })

  const saveCourseMutation = useMutation({
    mutationFn: (course) => {
      if (course.id) return coursesService.updateCourse(course.id, course)
      return coursesService.createCourse(course)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] })
      setIsModalOpen(false)
      setEditingCourse(null)
    }
  })

  const deleteCourseMutation = useMutation({
    mutationFn: (id) => coursesService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCourses'] })
    }
  })

  const courses = response?.data || []
  
  const filteredCourses = courses.filter(c => 
    (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.slug || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (course) => {
    setEditingCourse(course)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingCourse(null)
    setIsModalOpen(true)
  }

  const handleDelete = (id, title) => {
    if (window.confirm(`Are you sure you want to delete course "${title}"? This will delete all chapters and lessons linked to it.`)) {
      deleteCourseMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="text-[#00f0ff]" size={24} /> Course Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Deploy new curricula, set prerequisites, and edit catalog tags</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="py-2.5 px-4 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2"
        >
          <Plus size={14} /> Add New Course
        </button>
      </header>

      {/* Search Toolbar */}
      <div className="cyber-panel p-4 rounded-xl flex items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH COURSES BY TITLE OR SLUG..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg cyber-input text-xs tracking-widest uppercase font-bold" 
          />
        </div>
      </div>

      {/* Courses Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            <Loader2 className="animate-spin mx-auto text-[#00f0ff] mb-2" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest">Querying Courses Library...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
            No courses matching search parameters
          </div>
        ) : filteredCourses.map(course => (
          <div key={course.id} className="cyber-panel rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-[#00f0ff]/30 transition-all duration-300 relative">
            {/* Thumbnail Header */}
            <div className="relative h-40 bg-slate-900 overflow-hidden flex items-center justify-center border-b border-cyan-500/10">
              {course.thumbnail_url ? (
                <img 
                  src={course.thumbnail_url} 
                  alt={course.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
              ) : (
                <div className="text-center p-6 text-slate-700">
                  <Globe size={40} className="mx-auto opacity-20 mb-2" />
                  <span className="text-[9px] uppercase font-black tracking-wider">No Matrix Visual Available</span>
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-3 left-3">
                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                  course.is_published 
                    ? 'cyber-badge-green' 
                    : 'bg-slate-900/80 border-slate-700 text-slate-400'
                }`}>
                  {course.is_published ? 'PUBLISHED' : 'DRAFT'}
                </span>
              </div>

              {/* Category Badge */}
              <div className="absolute top-3 right-3">
                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cyber-badge-blue">
                  {course.category || 'Core'}
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest line-clamp-1">{course.title}</h3>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{course.description || 'No description provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-cyan-500/5 pt-3">
                <div className="flex items-center gap-1.5 text-slate-450">
                  <Tag size={12} className="text-cyan-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{course.difficulty || 'Beginner'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-450 justify-end">
                  <ArrowUpDown size={12} className="text-cyan-400" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{course.slug}</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-cyan-500/10 bg-[#070912]/50 flex gap-2">
              <button 
                onClick={() => handleEdit(course)}
                className="flex-1 py-1.5 bg-[#080912] border border-cyan-500/20 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#05060b] text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 rounded"
              >
                <Edit2 size={12} /> Edit Details
              </button>
              <button 
                onClick={() => handleDelete(course.id, course.title)}
                className="px-2 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-[#fff] text-[10px] rounded transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="cyber-panel-glow p-6 rounded-2xl w-full max-w-lg relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
                <BookOpen size={16} /> {editingCourse ? 'Modify Course Parameters' : 'Deploy New Course Module'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const data = Object.fromEntries(new FormData(e.currentTarget))
                saveCourseMutation.mutate({
                  ...editingCourse,
                  title: data.title,
                  slug: data.slug,
                  description: data.description,
                  thumbnail_url: data.thumbnail_url,
                  difficulty: data.difficulty,
                  category: data.category,
                  is_published: data.is_published === 'true'
                })
              }}
              className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Course Title</label>
                  <input 
                    type="text" 
                    name="title" 
                    defaultValue={editingCourse?.title || ''} 
                    required 
                    className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Unique Slug</label>
                  <input 
                    type="text" 
                    name="slug" 
                    defaultValue={editingCourse?.slug || ''} 
                    required 
                    className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Difficulty Tag</label>
                  <select 
                    name="difficulty" 
                    defaultValue={editingCourse?.difficulty || 'Beginner'}
                    className="w-full px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-bold uppercase rounded-lg text-slate-100 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Category Tab</label>
                  <input 
                    type="text" 
                    name="category" 
                    placeholder="Frontend, Backend, etc."
                    defaultValue={editingCourse?.category || ''} 
                    className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Description Matrix</label>
                <textarea 
                  name="description" 
                  defaultValue={editingCourse?.description || ''} 
                  rows={3}
                  className="w-full px-3 py-2 cyber-input text-xs font-medium rounded-lg" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Thumbnail Media URL</label>
                <input 
                  type="text" 
                  name="thumbnail_url" 
                  defaultValue={editingCourse?.thumbnail_url || ''} 
                  className="w-full px-3 py-2 cyber-input text-xs font-semibold rounded-lg" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Deployment Status</label>
                <select 
                  name="is_published" 
                  defaultValue={editingCourse?.is_published ? 'true' : 'false'}
                  className="w-full px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-bold uppercase rounded-lg text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="false">Draft Mode (Locked)</option>
                  <option value="true">Published (Visible to Students)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
                >
                  Abord Mission
                </button>
                <button 
                  type="submit" 
                  disabled={saveCourseMutation.isPending}
                  className="flex-1 py-2 cyber-btn rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5"
                >
                  {saveCourseMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
