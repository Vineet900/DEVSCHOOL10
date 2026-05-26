import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  FolderOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  CornerDownRight,
  BookOpen
} from 'lucide-react'
import { coursesService, chaptersService } from '../services/services'

export default function AdminChapters() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isBulkOpen, setIsBulkOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState(null)
  
  // Bulk upload text and drag-and-drop states
  const [bulkText, setBulkText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const [loadedFileName, setLoadedFileName] = useState('')

  // Fetch courses list for selector
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

  // Fetch chapters for selected course
  const { data: chaptersResponse, isLoading: chaptersLoading } = useQuery({
    queryKey: ['adminChapters', selectedCourseId],
    queryFn: () => chaptersService.getChapters(selectedCourseId),
    enabled: !!selectedCourseId
  })

  const chapters = chaptersResponse?.data || []

  const saveMutation = useMutation({
    mutationFn: (chapter) => {
      if (chapter.id) return chaptersService.updateChapter(chapter.id, { title: chapter.title, sort_order: Number(chapter.sort_order) })
      return chaptersService.createChapter(selectedCourseId, { title: chapter.title, sort_order: Number(chapter.sort_order) })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminChapters', selectedCourseId] })
      setIsModalOpen(false)
      setEditingChapter(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => chaptersService.deleteChapter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminChapters', selectedCourseId] })
    }
  })

  const bulkMutation = useMutation({
    mutationFn: (sections) => chaptersService.bulkUploadChapters(selectedCourseId, { sections }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminChapters', selectedCourseId] })
      setIsBulkOpen(false)
      setBulkText('')
      setLoadedFileName('')
    }
  })

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete chapter "${title}"? All lessons inside this chapter will be orphaned or deleted.`)) {
      deleteMutation.mutate(id)
    }
  }

  // Handle reordering using buttons
  const handleShiftOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === chapters.length - 1) return

    const targetIdx = direction === 'up' ? index - 1 : index + 1
    const currentChapter = chapters[index]
    const swapChapter = chapters[targetIdx]

    // Swap their sort orders
    const currentOrder = currentChapter.sort_order || index + 1
    const swapOrder = swapChapter.sort_order || targetIdx + 1

    await chaptersService.updateChapter(currentChapter.id, { sort_order: swapOrder })
    await chaptersService.updateChapter(swapChapter.id, { sort_order: currentOrder })
    
    queryClient.invalidateQueries({ queryKey: ['adminChapters', selectedCourseId] })
  }

  const handleBulkSubmit = (e) => {
    e.preventDefault()
    // Split by newlines, clean up whitespace, remove empty items
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean)
    const sectionsPayload = lines.map((title, idx) => ({
      title,
      sort_order: chapters.length + idx + 1
    }))
    bulkMutation.mutate(sectionsPayload)
  }

  const handleFileRead = (file) => {
    if (!file) return
    setLoadedFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      let parsedText = ''
      
      if (file.name.endsWith('.json')) {
        try {
          const json = JSON.parse(text)
          if (Array.isArray(json)) {
            parsedText = json.map(item => typeof item === 'string' ? item : item.title || item.name || '').filter(Boolean).join('\n')
          } else if (typeof json === 'object') {
            const keys = Object.keys(json)
            const targetKey = keys.find(k => Array.isArray(json[k]))
            if (targetKey) {
              parsedText = json[targetKey].map(item => typeof item === 'string' ? item : item.title || item.name || '').filter(Boolean).join('\n')
            } else {
              parsedText = Object.values(json).map(v => String(v)).join('\n')
            }
          }
        } catch (err) {
          alert('Invalid JSON file format')
          return
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n')
        parsedText = lines.map(line => {
          const cols = line.split(',')
          return cols[0]?.replace(/^["']|["']$/g, '').trim() || ''
        }).filter(Boolean).join('\n')
      } else {
        parsedText = text
      }
      
      setBulkText(parsedText)
    }
    reader.readAsText(file)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileRead(e.dataTransfer.files[0])
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <FolderOpen className="text-[#00f0ff]" size={24} /> Chapter Blueprint
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Structure course modules, order chapters, and upload lists in bulk</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => setIsBulkOpen(true)}
            disabled={!selectedCourseId}
            className="py-2.5 px-4 bg-slate-900 border border-purple-500/35 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload size={14} /> Bulk Load List
          </button>
          <button 
            onClick={() => { setEditingChapter(null); setIsModalOpen(true); }}
            disabled={!selectedCourseId}
            className="py-2.5 px-4 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
          >
            <Plus size={14} /> Create Chapter
          </button>
        </div>
      </header>

      {/* Course Selector bar */}
      <div className="cyber-panel p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <BookOpen className="text-cyan-500" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Target Subject:</span>
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
              <option key={course.id} value={course.id}>{course.title} ({course.slug})</option>
            ))
          )}
        </select>
      </div>

      {/* Chapters Timeline List */}
      <div className="cyber-panel rounded-2xl p-6 relative">
        <div className="absolute top-0 left-6 h-1 w-20 bg-cyan-500"></div>

        {chaptersLoading ? (
          <div className="py-12 text-center text-slate-500">
            <Loader2 className="animate-spin mx-auto text-[#00f0ff] mb-2" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest">Constructing Module Nodes...</p>
          </div>
        ) : chapters.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
            No Chapters Mapped under this Curriculum.
          </div>
        ) : (
          <div className="space-y-4 relative before:absolute before:left-[17px] before:top-4 before:bottom-4 before:w-[2px] before:bg-cyan-500/10">
            {chapters.map((chap, index) => (
              <div 
                key={chap.id}
                className="flex items-center justify-between bg-[#080912]/40 border border-slate-800/80 rounded-xl p-4 pl-3 hover:border-cyan-500/20 transition-all duration-300 relative group"
              >
                <div className="flex items-center gap-3">
                  {/* Node Circle */}
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center text-[10px] font-black text-cyan-400 z-10 shadow-[0_0_8px_rgba(0,240,255,0.15)]">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-200 uppercase tracking-widest">{chap.title}</h4>
                    <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider mt-0.5">Database Order Code: {chap.sort_order || index + 1}</span>
                  </div>
                </div>

                {/* Operations Area */}
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleShiftOrder(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 bg-[#080912] hover:bg-cyan-500 hover:text-slate-950 border border-slate-800 hover:border-cyan-400 rounded text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button 
                    onClick={() => handleShiftOrder(index, 'down')}
                    disabled={index === chapters.length - 1}
                    className="p-1.5 bg-[#080912] hover:bg-cyan-500 hover:text-slate-950 border border-slate-800 hover:border-cyan-400 rounded text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button 
                    onClick={() => { setEditingChapter(chap); setIsModalOpen(true); }}
                    className="p-1.5 bg-[#080912] hover:bg-cyan-500 hover:text-slate-950 border border-slate-800 hover:border-cyan-400 rounded text-slate-400 transition-all ml-2"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button 
                    onClick={() => handleDelete(chap.id, chap.title)}
                    className="p-1.5 bg-[#080912] hover:bg-red-500 hover:text-white border border-slate-800 hover:border-red-500 rounded text-slate-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Chapter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="cyber-panel-glow p-6 rounded-2xl w-full max-w-sm relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
                <FolderOpen size={16} /> {editingChapter ? 'Modify Node Specs' : 'Initialize Node'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const data = Object.fromEntries(new FormData(e.currentTarget))
                saveMutation.mutate({
                  ...editingChapter,
                  title: data.title,
                  sort_order: data.sort_order || (chapters.length + 1)
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Chapter Title</label>
                <input 
                  type="text" 
                  name="title" 
                  defaultValue={editingChapter?.title || ''} 
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Sort order Index</label>
                <input 
                  type="number" 
                  name="sort_order" 
                  defaultValue={editingChapter?.sort_order || chapters.length + 1} 
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saveMutation.isPending}
                  className="flex-1 py-2 cyber-btn rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5"
                >
                  {saveMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="cyber-panel-glow p-6 rounded-2xl w-full max-w-md relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#bd00ff] flex items-center gap-2">
                <Upload size={16} /> Bulk Chapter Loader
              </h3>
              <button onClick={() => { setIsBulkOpen(false); setLoadedFileName(''); }} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              {/* Drag & Drop File Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 ${
                  dragActive 
                    ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_15px_rgba(189,0,255,0.2)] animate-pulse' 
                    : loadedFileName
                      ? 'border-cyan-500/50 bg-cyan-500/5'
                      : 'border-slate-800 hover:border-purple-500/40 bg-slate-900/40 hover:bg-slate-900/60'
                }`}
              >
                <input 
                  type="file" 
                  id="bulk-file-upload" 
                  multiple={false} 
                  accept=".txt,.csv,.json"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileRead(e.target.files[0])
                    }
                  }}
                  className="hidden" 
                />
                <label htmlFor="bulk-file-upload" className="cursor-pointer block space-y-2">
                  <div className="flex justify-center text-slate-400 group-hover:scale-110 transition-transform">
                    <Upload className={`w-8 h-8 ${loadedFileName ? 'text-cyan-400' : 'text-purple-400'}`} />
                  </div>
                  {loadedFileName ? (
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-cyan-400 tracking-widest">✓ File Loaded Successfully</p>
                      <p className="text-[11px] font-bold text-slate-300 font-mono truncate max-w-[280px] mx-auto">{loadedFileName}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-slate-200">Drag & Drop file here</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Supports .txt, .csv, or .json</p>
                      <span className="inline-block mt-2 px-3 py-1 bg-slate-950 border border-slate-800 rounded-md text-[9px] font-black uppercase tracking-widest text-[#bd00ff] hover:border-purple-500/50 hover:bg-purple-950/20">Browse Files</span>
                    </div>
                  )}
                </label>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">
                  Or Paste/Edit Titles below (One Title per Line)
                </label>
                <textarea 
                  value={bulkText} 
                  onChange={e => setBulkText(e.target.value)}
                  placeholder="Module 1: Introduction to Web&#10;Module 2: Setting up local environment&#10;Module 3: Code Compilation Rules"
                  required 
                  rows={6}
                  className="w-full px-3 py-2 cyber-input text-xs font-semibold rounded-lg font-mono" 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setIsBulkOpen(false); setLoadedFileName(''); }}
                  className="flex-1 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
                >
                  Abort
                </button>
                <button 
                  type="submit" 
                  disabled={bulkMutation.isPending}
                  className="flex-1 py-2 cyber-btn-purple rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5"
                >
                  {bulkMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  Deploy List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
