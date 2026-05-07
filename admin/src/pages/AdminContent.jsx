import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit2, Trash2, LayoutGrid, List, FileVideo, BookText, Languages, Loader2, X } from 'lucide-react'
import { coursesService } from '../services/services'

export default function AdminContent() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('courses')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('html')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)

  const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: coursesService.getCourses
  })

  const { data: lessonsResponse, isLoading: lessonsLoading } = useQuery({
    queryKey: ['adminLessons', selectedCourseId],
    queryFn: () => coursesService.getLessons(selectedCourseId),
    enabled: activeTab === 'lessons'
  })

  const saveLessonMutation = useMutation({
    mutationFn: (lesson) => {
      if (lesson.id) return coursesService.updateLesson(lesson.id, lesson)
      return coursesService.createLesson(selectedCourseId, lesson)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons', selectedCourseId] })
      setIsModalOpen(false)
      setEditingLesson(null)
    }
  })

  const deleteLessonMutation = useMutation({
    mutationFn: (id) => coursesService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons', selectedCourseId] })
    }
  })

  const courses = coursesResponse?.data || []
  const lessons = lessonsResponse?.data || []

  const filteredCourses = courses.filter(c => (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
  const filteredLessons = lessons.filter(l => (l.title || '').toLowerCase().includes(searchTerm.toLowerCase()))

  const handleEdit = (lesson) => {
    setEditingLesson(lesson)
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingLesson(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Content Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage courses, lessons, and language options.</p>
        </div>
        {activeTab === 'lessons' && (
          <button 
            onClick={handleAddNew}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm shadow-blue-500/20 w-full md:w-auto justify-center">
            <Plus size={16} /> Add Lesson
          </button>
        )}
        {activeTab === 'courses' && (
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm shadow-blue-500/20 w-full md:w-auto justify-center">
            <Plus size={16} /> Add Course
          </button>
        )}
      </header>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex bg-slate-100 p-1 rounded-xl dark:bg-slate-900 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'courses' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            <BookText size={16} /> Courses
          </button>
          <button 
            onClick={() => setActiveTab('lessons')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'lessons' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            <FileVideo size={16} /> Lessons
          </button>
          <button 
            onClick={() => setActiveTab('languages')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'languages' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            <Languages size={16} /> Languages
          </button>
        </div>
        
        {activeTab === 'lessons' && (
          <select 
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          >
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="javascript">JavaScript</option>
          </select>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 dark:border-slate-800">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}...`} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="p-2.5 text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
              <List size={18} />
            </button>
            <button className="p-2.5 text-slate-400 rounded-lg hover:bg-slate-50 hover:text-slate-600 border border-transparent dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
        
        {activeTab === 'courses' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/20 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Course Title</th>
                  <th className="px-6 py-4 font-medium">Language</th>
                  <th className="px-6 py-4 font-medium">Lessons</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {coursesLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto text-blue-500" size={24} />
                    </td>
                  </tr>
                ) : filteredCourses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No courses found.</td>
                  </tr>
                ) : filteredCourses.map(course => (
                  <tr key={course.id} className="hover:bg-slate-50/50 transition-colors group dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{course.title || 'Untitled'}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{course.author || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-semibold dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {course.language || 'EN'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{course.lessons || 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        course.status === 'Published' ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400' : 
                        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {course.status || 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/20 dark:hover:text-blue-400"><Edit2 size={16} /></button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/20 dark:hover:text-red-400"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'lessons' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/20 dark:border-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Chapter</th>
                  <th className="px-6 py-4 font-medium">Lesson Title</th>
                  <th className="px-6 py-4 font-medium">Level</th>
                  <th className="px-6 py-4 font-medium">Time</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {lessonsLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto text-blue-500" size={24} />
                    </td>
                  </tr>
                ) : filteredLessons.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No lessons found. Please ensure DB table exists.</td>
                  </tr>
                ) : filteredLessons.map(lesson => (
                  <tr key={lesson.id} className="hover:bg-slate-50/50 transition-colors group dark:hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-slate-500">{lesson.chapter_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{lesson.title}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-semibold dark:bg-slate-800 dark:text-slate-300">
                        {lesson.level || 'Beginner'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{lesson.estimated_time}</td>
                    <td className="px-6 py-4 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(lesson)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-500/20 dark:hover:text-blue-400"><Edit2 size={16} /></button>
                      <button onClick={() => { if(window.confirm('Delete lesson?')) deleteLessonMutation.mutate(lesson.id) }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/20 dark:hover:text-red-400"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'languages' && (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
              <Languages size={24} className="text-slate-400" />
            </div>
            <p className="text-center font-medium capitalize">Languages coming soon...</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <LessonModal 
          lesson={editingLesson} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(data) => saveLessonMutation.mutate(data)}
          isLoading={saveLessonMutation.isPending}
        />
      )}
    </div>
  )
}

function LessonModal({ lesson, onClose, onSave, isLoading }) {
  const [formData, setFormData] = useState(lesson || {
    title: '', slug: '', chapter_number: 1, level: 'beginner', estimated_time: '10 min',
    theory: {}, examples: [], exercises: [], quiz: [], summary: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleJsonChange = (e, field) => {
    try {
      const parsed = JSON.parse(e.target.value)
      setFormData(prev => ({ ...prev, [field]: parsed }))
    } catch (err) {
      // ignore parse errors while typing, but maybe show indicator in real app
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl mt-20 md:mt-0 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">{lesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Slug</label>
              <input type="text" name="slug" value={formData.slug} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chapter Number</label>
              <input type="number" name="chapter_number" value={formData.chapter_number} onChange={handleChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Level</label>
              <input type="text" name="level" value={formData.level} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Estimated Time</label>
              <input type="text" name="estimated_time" value={formData.estimated_time} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Theory (JSON)</label>
            <textarea defaultValue={JSON.stringify(formData.theory, null, 2)} onBlur={(e) => handleJsonChange(e, 'theory')} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Examples (JSON Array)</label>
            <textarea defaultValue={JSON.stringify(formData.examples, null, 2)} onBlur={(e) => handleJsonChange(e, 'examples')} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exercises (JSON Array)</label>
            <textarea defaultValue={JSON.stringify(formData.exercises, null, 2)} onBlur={(e) => handleJsonChange(e, 'exercises')} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quiz (JSON Array)</label>
            <textarea defaultValue={JSON.stringify(formData.quiz, null, 2)} onBlur={(e) => handleJsonChange(e, 'quiz')} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary</label>
            <textarea name="summary" value={formData.summary} onChange={handleChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg dark:text-slate-300 dark:hover:bg-slate-800">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Save Lesson
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
