import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  PlayCircle, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X, 
  Eye, 
  FileText, 
  Video, 
  Code, 
  BookOpen, 
  Settings,
  ArrowUp,
  ArrowDown,
  Award,
  Clock
} from 'lucide-react'
import { coursesService } from '../services/services'

export default function AdminLessons() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [editingLesson, setEditingLesson] = useState(null)
  const [previewingLesson, setPreviewingLesson] = useState(null)

  // Fetch courses list
  const { data: coursesResponse, isLoading: coursesLoading } = useQuery({
    queryKey: ['adminCourses'],
    queryFn: coursesService.getCourses
  })
  
  const courses = coursesResponse?.data || []

  // Auto-select first course when loaded
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, selectedCourseId])

  // Fetch lessons for selected course
  const { data: lessonsResponse, isLoading: lessonsLoading } = useQuery({
    queryKey: ['adminLessons', selectedCourseId],
    queryFn: () => coursesService.getLessons(selectedCourseId),
    enabled: !!selectedCourseId
  })

  const lessons = lessonsResponse?.data || []

  const saveMutation = useMutation({
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

  const deleteMutation = useMutation({
    mutationFn: (id) => coursesService.deleteLesson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLessons', selectedCourseId] })
    }
  })

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete lesson "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  // Handle reordering shifts
  const handleShiftOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === lessons.length - 1) return

    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const currentLesson = lessons[index]
    const swapLesson = lessons[targetIdx]

    const currentOrder = currentLesson.chapter_number || index + 1
    const swapOrder = swapLesson.chapter_number || targetIdx + 1

    await coursesService.updateLesson(currentLesson.id, { chapter_number: swapOrder })
    await coursesService.updateLesson(swapLesson.id, { chapter_number: currentOrder })
    
    queryClient.invalidateQueries({ queryKey: ['adminLessons', selectedCourseId] })
  }

  const getLessonTypeIcon = (level) => {
    const cleanLevel = (level || '').toLowerCase()
    if (cleanLevel.includes('video')) return <Video size={14} className="text-cyan-400" />
    if (cleanLevel.includes('code') || cleanLevel.includes('challenge')) return <Code size={14} className="text-[#bd00ff]" />
    return <FileText size={14} className="text-slate-400" />
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <PlayCircle className="text-[#00f0ff]" size={24} /> Lesson Matrix
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Program detailed slides, code challenges, assignments, and adjust points rewards</p>
        </div>
        <button 
          onClick={() => { setEditingLesson(null); setIsModalOpen(true); }}
          disabled={!selectedCourseId}
          className="py-2.5 px-4 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
        >
          <Plus size={14} /> Add New Lesson
        </button>
      </header>

      {/* Course Selection bar */}
      <div className="cyber-panel p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-cyan-500" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Curriculum:</span>
        </div>
        <select 
          value={selectedCourseId}
          onChange={e => setSelectedCourseId(e.target.value)}
          className="w-full md:max-w-md px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-black uppercase rounded-lg text-[#00f0ff] focus:border-cyan-500 focus:outline-none"
        >
          {coursesLoading ? (
            <option>Loading courses...</option>
          ) : (
            courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))
          )}
        </select>
      </div>

      {/* Lessons List Table */}
      <div className="cyber-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap cyber-table">
            <thead>
              <tr>
                <th className="px-6 py-4">Index</th>
                <th className="px-6 py-4">Lesson Module</th>
                <th className="px-6 py-4">Difficulty Level</th>
                <th className="px-6 py-4">Estimated Run-Time</th>
                <th className="px-6 py-4">Rewards (XP)</th>
                <th className="px-6 py-4 text-right">Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {lessonsLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" size={24} />
                    <p className="tracking-widest uppercase font-bold text-[10px]">Loading Lesson Blueprints...</p>
                  </td>
                </tr>
              ) : lessons.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                    No Lessons Configured
                  </td>
                </tr>
              ) : lessons.map((lesson, index) => (
                <tr key={lesson.id} className="group">
                  <td className="px-6 py-4 font-black text-cyan-400">{lesson.chapter_number || index + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      {getLessonTypeIcon(lesson.level)}
                      <div>
                        <div className="font-bold text-slate-200 uppercase tracking-wide">{lesson.title}</div>
                        <div className="text-[10px] text-slate-500 lowercase mt-0.5">slug: {lesson.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-800/60 border border-slate-700 text-slate-400">
                      {lesson.level || 'Beginner'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-semibold">{lesson.estimated_time || '10 min'}</td>
                  <td className="px-6 py-4 font-bold text-emerald-400">+{lesson.xp_reward || 50} XP</td>
                  <td className="px-6 py-4 flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleShiftOrder(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 bg-[#080912] hover:bg-[#00f0ff] hover:text-[#05060b] border border-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button 
                      onClick={() => handleShiftOrder(index, 'down')}
                      disabled={index === lessons.length - 1}
                      className="p-1.5 bg-[#080912] hover:bg-[#00f0ff] hover:text-[#05060b] border border-slate-800 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button 
                      onClick={() => { setPreviewingLesson(lesson); setIsPreviewOpen(true); }}
                      className="p-1.5 bg-[#080912] hover:bg-cyan-500 hover:text-slate-950 border border-slate-800 rounded text-slate-400"
                    >
                      <Eye size={12} />
                    </button>
                    <button 
                      onClick={() => { setEditingLesson(lesson); setIsModalOpen(true); }}
                      className="p-1.5 bg-[#080912] hover:bg-cyan-500 hover:text-slate-950 border border-slate-800 rounded text-slate-400"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button 
                      onClick={() => handleDelete(lesson.id, lesson.title)}
                      className="p-1.5 bg-[#080912] hover:bg-red-500 hover:text-white border border-slate-800 rounded text-slate-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Lesson Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="cyber-panel-glow p-6 rounded-2xl w-full max-w-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
                <Settings size={16} /> {editingLesson ? 'Edit Lesson Parameters' : 'Deploy New Lesson'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const data = Object.fromEntries(new FormData(e.currentTarget))
                
                // Parse helper JSON blocks safely
                const parseJSON = (str) => {
                  try { return JSON.parse(str); } catch (e) { return {}; }
                }
                const parseJSONArray = (str) => {
                  try { return JSON.parse(str); } catch (e) { return []; }
                }

                saveMutation.mutate({
                  ...editingLesson,
                  title: data.title,
                  slug: data.slug,
                  chapter_number: Number(data.chapter_number),
                  level: data.level,
                  estimated_time: data.estimated_time,
                  xp_reward: Number(data.xp_reward),
                  video_url: data.video_url,
                  summary: data.summary,
                  theory: parseJSON(data.theory),
                  examples: parseJSONArray(data.examples),
                  exercises: parseJSONArray(data.exercises),
                  quiz: parseJSONArray(data.quiz)
                })
              }}
              className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Title</label>
                  <input type="text" name="title" defaultValue={editingLesson?.title || ''} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Slug URL</label>
                  <input type="text" name="slug" defaultValue={editingLesson?.slug || ''} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Chapter Code Number</label>
                  <input type="number" name="chapter_number" defaultValue={editingLesson?.chapter_number || lessons.length + 1} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">XP Points Reward</label>
                  <input type="number" name="xp_reward" defaultValue={editingLesson?.xp_reward || 50} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Lesson Type / Skill Level</label>
                  <select name="level" defaultValue={editingLesson?.level || 'Beginner'} className="w-full px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-bold uppercase rounded-lg text-slate-100 focus:border-cyan-500 focus:outline-none">
                    <option value="Beginner">Beginner Notes</option>
                    <option value="Intermediate">Intermediate Challenge</option>
                    <option value="Advanced">Advanced Coding</option>
                    <option value="Video Lesson">Video Course</option>
                    <option value="Assignment">Assignment Notes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Estimated Run Time</label>
                  <input type="text" name="estimated_time" defaultValue={editingLesson?.estimated_time || '10 min'} className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Video Stream URL (Optional)</label>
                <input type="text" name="video_url" defaultValue={editingLesson?.video_url || ''} className="w-full px-3 py-2 cyber-input text-xs font-semibold rounded-lg" />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Theory Content Block (JSON)</label>
                <textarea name="theory" defaultValue={JSON.stringify(editingLesson?.theory || { text: "Theory notes here" }, null, 2)} rows={4} className="w-full px-3 py-2 cyber-input font-mono text-[10px] rounded-lg" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Coding Examples (JSON Array)</label>
                  <textarea name="examples" defaultValue={JSON.stringify(editingLesson?.examples || [], null, 2)} rows={4} className="w-full px-3 py-2 cyber-input font-mono text-[10px] rounded-lg" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Exercises (JSON Array)</label>
                  <textarea name="exercises" defaultValue={JSON.stringify(editingLesson?.exercises || [], null, 2)} rows={4} className="w-full px-3 py-2 cyber-input font-mono text-[10px] rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Summary Block</label>
                <textarea name="summary" defaultValue={editingLesson?.summary || ''} rows={2} className="w-full px-3 py-2 cyber-input text-xs font-medium rounded-lg" />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 py-2 cyber-btn rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5">
                  {saveMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  Deploy Lesson Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Preview Modal */}
      {isPreviewOpen && previewingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="cyber-panel p-6 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto relative border-[#00f0ff]/30">
            <div className="flex justify-between items-center mb-6 border-b border-cyan-500/10 pb-4">
              <div>
                <span className="text-[8px] uppercase tracking-widest text-slate-500 font-black">Curriculum Preview Node</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] mt-0.5">{previewingLesson.title}</h3>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-slate-400 uppercase text-[9px]"><Clock size={12} /> {previewingLesson.estimated_time || '10 min'}</span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/20 font-bold text-emerald-400 uppercase text-[9px]"><Award size={12} /> {previewingLesson.xp_reward || 50} XP Reward</span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/5 border border-cyan-500/20 font-bold text-cyan-400 uppercase text-[9px]">{previewingLesson.level || 'Beginner'}</span>
              </div>

              {previewingLesson.video_url && (
                <div className="bg-slate-950/40 p-3 border border-slate-800 rounded-lg">
                  <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-black mb-1">Stream Link:</span>
                  <a href={previewingLesson.video_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline break-all">{previewingLesson.video_url}</a>
                </div>
              )}

              <div className="space-y-2">
                <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-black">Theory Synopsis</span>
                <div className="bg-[#080912] p-4 border border-cyan-500/5 rounded-xl font-medium text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                  {previewingLesson.theory?.text || JSON.stringify(previewingLesson.theory)}
                </div>
              </div>

              {previewingLesson.summary && (
                <div className="space-y-1">
                  <span className="block text-[8px] uppercase tracking-widest text-slate-500 font-black">Chapter Summary</span>
                  <p className="text-slate-400 italic leading-relaxed">{previewingLesson.summary}</p>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-cyan-500/10 pt-4 flex justify-end">
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="py-2 px-6 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
