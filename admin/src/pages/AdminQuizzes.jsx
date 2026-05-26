import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ClipboardList, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  X, 
  Award, 
  Clock, 
  ListPlus, 
  PlusCircle, 
  MinusCircle, 
  HelpCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { quizzesService } from '../services/services'

export default function AdminQuizzes() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuiz, setEditingQuiz] = useState(null)

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['adminQuizzes'],
    queryFn: quizzesService.getQuizzes
  })

  const saveMutation = useMutation({
    mutationFn: (quiz) => {
      if (quiz.id) return quizzesService.updateQuiz(quiz.id, quiz)
      return quizzesService.createQuiz(quiz)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuizzes'] })
      setIsModalOpen(false)
      setEditingQuiz(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => quizzesService.deleteQuiz(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminQuizzes'] })
    }
  })

  const quizzes = response?.data || []

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete quiz "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (quiz) => {
    let parsedQuestions = quiz.questions
    if (typeof parsedQuestions === 'string') {
      try { parsedQuestions = JSON.parse(parsedQuestions); } catch (e) { parsedQuestions = []; }
    }
    setEditingQuiz({
      ...quiz,
      questions: parsedQuestions || [],
      passing_score: quiz.passing_score || 70,
      xp_reward: quiz.xp_reward || 100,
      time_limit: quiz.time_limit || 15,
      negative_marking: quiz.negative_marking || false
    })
    setIsModalOpen(true)
  }

  const handleAddNew = () => {
    setEditingQuiz({
      title: '',
      questions: [],
      passing_score: 70,
      xp_reward: 100,
      time_limit: 15,
      negative_marking: false
    })
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="text-[#00f0ff]" size={24} /> Assessment Matrix (Quizzes)
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Build MCQ exams, configure strict passing scores, and toggle negative grading rules</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="py-2.5 px-4 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2"
        >
          <Plus size={14} /> Add New Quiz
        </button>
      </header>

      {/* Quizzes List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" size={24} />
            <p className="text-[10px] font-black uppercase tracking-widest">Querying Assessments File...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 font-black uppercase tracking-widest text-xs">
            No Quizzes Registered in Database
          </div>
        ) : quizzes.map(quiz => {
          let qCount = 0;
          try {
            const qs = typeof quiz.questions === 'string' ? JSON.parse(quiz.questions) : quiz.questions;
            qCount = Array.isArray(qs) ? qs.length : 0;
          } catch(e) {}

          return (
            <div key={quiz.id} className="cyber-panel p-5 rounded-2xl flex flex-col justify-between hover:border-cyan-500/35 transition-all duration-300 relative group">
              <div className="absolute top-0 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/25"></div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cyber-badge-blue">
                    {qCount} Questions Registered
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                    <Award size={12} /> +{quiz.xp_reward || 100} XP
                  </span>
                </div>
                
                <h3 className="text-sm font-black text-slate-100 uppercase tracking-widest line-clamp-1">{quiz.title}</h3>
                
                {/* Specs list */}
                <div className="grid grid-cols-3 gap-2 bg-[#080912] p-2.5 rounded-lg border border-cyan-500/5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <div className="text-center">
                    <span className="block text-slate-500 text-[8px]">Passing Grade</span>
                    <span className="text-slate-200">{quiz.passing_score || 70}%</span>
                  </div>
                  <div className="text-center border-x border-cyan-500/10">
                    <span className="block text-slate-500 text-[8px]">Time limit</span>
                    <span className="text-slate-200">{quiz.time_limit || 15} Mins</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-slate-500 text-[8px]">Neg marking</span>
                    <span className={quiz.negative_marking ? 'text-rose-450' : 'text-slate-500'}>
                      {quiz.negative_marking ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-5 border-t border-cyan-500/5 pt-4 flex gap-2">
                <button 
                  onClick={() => handleEdit(quiz)}
                  className="flex-1 py-1.5 bg-[#080912] border border-cyan-500/20 text-[#00f0ff] hover:bg-[#00f0ff] hover:text-[#05060b] text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 rounded"
                >
                  <Edit2 size={12} /> Edit Quiz Bank
                </button>
                <button 
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  className="px-2 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-[10px] rounded transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quiz Modal Editor */}
      {isModalOpen && editingQuiz && (
        <QuizModal 
          quiz={editingQuiz} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(data) => saveMutation.mutate(data)}
          isLoading={saveMutation.isPending}
        />
      )}
    </div>
  )
}

function QuizModal({ quiz, onClose, onSave, isLoading }) {
  const [title, setTitle] = useState(quiz.title || '')
  const [sectionId, setSectionId] = useState(quiz.section_id || '')
  const [passingScore, setPassingScore] = useState(quiz.passing_score || 70)
  const [xpReward, setXpReward] = useState(quiz.xp_reward || 100)
  const [timeLimit, setTimeLimit] = useState(quiz.time_limit || 15)
  const [negativeMarking, setNegativeMarking] = useState(quiz.negative_marking || false)
  const [questions, setQuestions] = useState(quiz.questions || [])

  // Question editing state
  const [activeQIndex, setActiveQIndex] = useState(0)

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: 'New Question text?',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
        answer: 0,
        explanation: 'Explanation of correct answer.'
      }
    ])
    setActiveQIndex(questions.length)
  }

  const handleRemoveQuestion = (idx) => {
    if (questions.length <= 1) return
    const filtered = questions.filter((_, i) => i !== idx)
    setQuestions(filtered)
    setActiveQIndex(Math.max(0, idx - 1))
  }

  const updateQuestionField = (field, value) => {
    setQuestions(prev => {
      const copy = [...prev]
      copy[activeQIndex] = { ...copy[activeQIndex], [field]: value }
      return copy
    })
  }

  const updateOptionText = (optIdx, text) => {
    setQuestions(prev => {
      const copy = [...prev]
      const opts = [...copy[activeQIndex].options]
      opts[optIdx] = text
      copy[activeQIndex].options = opts
      return copy
    })
  }

  const handleSave = (e) => {
    e.preventDefault()
    onSave({
      ...quiz,
      title,
      section_id: sectionId || null,
      passing_score: Number(passingScore),
      xp_reward: Number(xpReward),
      time_limit: Number(timeLimit),
      negative_marking: negativeMarking,
      questions: questions // Saved directly as JSON array (controller will serialize if needed)
    })
  }

  const activeQ = questions[activeQIndex]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="cyber-panel-glow p-6 rounded-2xl w-full max-w-4xl relative">
        <div className="flex justify-between items-center mb-6 border-b border-cyan-500/10 pb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
            <ClipboardList size={16} /> Exam Configuration Terminal
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Core rules config */}
          <div className="space-y-4 bg-[#080912]/50 p-4 border border-cyan-500/5 rounded-xl">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Core parameters</h4>
            
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Quiz Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Passing %</label>
                <input type="number" value={passingScore} onChange={e => setPassingScore(e.target.value)} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Time Limit (Min)</label>
                <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">XP Reward</label>
                <input type="number" value={xpReward} onChange={e => setXpReward(e.target.value)} required className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" />
              </div>
              
              {/* Negative Marking toggle */}
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Neg Marking</label>
                <button 
                  type="button"
                  onClick={() => setNegativeMarking(!negativeMarking)}
                  className="w-full py-2 px-3 bg-[#080912] border border-cyan-500/20 text-xs font-black uppercase rounded-lg text-slate-100 flex items-center justify-between"
                >
                  <span>{negativeMarking ? 'ACTIVE' : 'OFF'}</span>
                  {negativeMarking ? <ToggleRight className="text-[#00f0ff]" size={20} /> : <ToggleLeft className="text-slate-600" size={20} />}
                </button>
              </div>
            </div>

            {/* Question selection sidebar */}
            <div className="border-t border-cyan-500/10 pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Question Timeline</span>
                <button 
                  type="button" 
                  onClick={handleAddQuestion}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[9px] font-black uppercase"
                >
                  <PlusCircle size={12} /> Add
                </button>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {questions.length === 0 ? (
                  <p className="text-[10px] text-slate-600 italic uppercase">No questions added yet</p>
                ) : (
                  questions.map((q, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setActiveQIndex(idx)}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer border text-[10px] uppercase font-bold tracking-wider ${
                        activeQIndex === idx 
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                          : 'border-slate-800 hover:border-slate-700 text-slate-500'
                      }`}
                    >
                      <span className="truncate max-w-[150px]">{idx + 1}. {q.question}</span>
                      {questions.length > 1 && (
                        <button 
                          type="button" 
                          onClick={(e) => { e.stopPropagation(); handleRemoveQuestion(idx); }}
                          className="text-red-500 hover:text-red-400 ml-2"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right/Center: Interactive Question Editor */}
          <div className="lg:col-span-2 space-y-4 bg-[#080912]/20 p-4 border border-cyan-500/5 rounded-xl">
            {activeQ ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-cyan-500/5 pb-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00f0ff]">Question #{activeQIndex + 1} Parameters</h4>
                  <span className="text-[8px] text-slate-500 uppercase font-bold">MCQ Options</span>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Question Prompt</label>
                  <input 
                    type="text" 
                    value={activeQ.question} 
                    onChange={e => updateQuestionField('question', e.target.value)} 
                    required 
                    className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">MCQ Options (Mark correct selection)</label>
                  {activeQ.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={() => updateQuestionField('answer', oIdx)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center border font-black text-[10px] ${
                          activeQ.answer === oIdx 
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                            : 'border-slate-800 hover:border-slate-700 text-slate-500'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}
                      </button>
                      <input 
                        type="text" 
                        value={opt} 
                        onChange={e => updateOptionText(oIdx, e.target.value)} 
                        required 
                        className="flex-1 px-3 py-1.5 cyber-input text-xs font-semibold rounded-lg" 
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Explanatory logic</label>
                  <textarea 
                    value={activeQ.explanation || ''} 
                    onChange={e => updateQuestionField('explanation', e.target.value)} 
                    required 
                    rows={3}
                    className="w-full px-3 py-2 cyber-input text-xs font-medium rounded-lg" 
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-650 py-16">
                <HelpCircle size={40} className="text-slate-800 animate-pulse mb-3" />
                <p className="text-[10px] font-black uppercase tracking-widest">Create question blueprint to edit</p>
              </div>
            )}
          </div>

          {/* Form Actions footer */}
          <div className="col-span-full border-t border-cyan-500/10 pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="py-2 px-6 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || questions.length === 0}
              className="py-2 px-6 cyber-btn rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLoading && <Loader2 size={12} className="animate-spin" />}
              Deploy Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
