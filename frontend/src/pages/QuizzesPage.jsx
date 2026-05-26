import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardCheck, 
  Settings2, 
  Clock, 
  HelpCircle, 
  Zap, 
  ShieldAlert, 
  BarChart3,
  ChevronRight,
  Sparkles,
  Trophy,
  AlertCircle
} from 'lucide-react'
import AnswerReview from '../components/assessment/AnswerReview'
import QuizScreen from '../components/assessment/QuizScreen'
import ResultScreen from '../components/assessment/ResultScreen'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'

const COUNT_OPTIONS = [10, 20, 30, 40, 50]
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60]
const AUTO_ADVANCE_DELAY_MS = 5000
const DIFFICULTY_MAP = {
  mixed: null,
  low: 'low',
  medium: 'medium',
  high: 'high',
}

function getQuestionsBySubject(courseQuizzes, subjectId) {
  return courseQuizzes[subjectId] || []
}

function normalizeAnswerIndex(answer, optionCount) {
  if (!Number.isFinite(optionCount) || optionCount <= 0) return -1
  if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < optionCount) return answer
  if (typeof answer === 'string') {
    const trimmed = answer.trim()
    if (!trimmed) return -1
    if (/^\d+$/.test(trimmed)) {
      const numericIndex = Number(trimmed)
      if (numericIndex >= 0 && numericIndex < optionCount) return numericIndex
    }
    if (/^[A-Za-z]$/.test(trimmed)) {
      const alphabetIndex = trimmed.toUpperCase().charCodeAt(0) - 65
      if (alphabetIndex >= 0 && alphabetIndex < optionCount) return alphabetIndex
    }
  }
  return -1
}

function normalizeQuestion(question, subject, index, language = 'en') {
  if (!question || typeof question !== 'object') return null
  let prompt = ''
  if (typeof question.question === 'string') prompt = question.question.trim()
  else if (question.question?.[language]) prompt = question.question[language].trim()
  else if (question.question?.en) prompt = question.question.en.trim()

  const options = Array.isArray(question.options) ? question.options.map((option) => String(option)) : []
  const answer = normalizeAnswerIndex(question.answer, options.length)
  if (!prompt || options.length < 2 || answer < 0) return null

  return {
    id: `${subject}-${question.id ?? index}-${index}`,
    originalId: question.id ?? index + 1,
    question: prompt,
    options,
    answer,
    category: String(question.category ?? ''),
    difficulty: String(question.difficulty ?? '').trim().toLowerCase(),
    subject,
  }
}

export default function QuizzesPage() {
  const { state, actions, metadata } = useApp()
  const language = state.language
  
  const courses = metadata?.courses || []
  const courseQuizzes = metadata?.courseQuizzes || {}
  
  const subjectOptions = useMemo(() => courses.map(c => {
    const titleStr = typeof c.title === 'string' ? c.title : (c.title?.[language] || c.title?.en || c.id)
    return { id: c.id, title: titleStr }
  }), [courses, language])

  const [assessmentSubject, setAssessmentSubject] = useState(subjectOptions[0]?.id || 'html')
  const [assessmentLevel, setAssessmentLevel] = useState('mixed')
  const [assessmentCount, setAssessmentCount] = useState(10)
  const [assessmentDurationMinutes, setAssessmentDurationMinutes] = useState(15)
  const [requireAnswerBeforeNext, setRequireAnswerBeforeNext] = useState(true)
  const [assessmentQuestions, setAssessmentQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState([])
  const [assessmentView, setAssessmentView] = useState('setup')
  const [showDetailedResult, setShowDetailedResult] = useState(false)
  const [autoAdvanceDeadline, setAutoAdvanceDeadline] = useState(null)
  const [autoAdvanceRemaining, setAutoAdvanceRemaining] = useState(0)
  const [setupMessage, setSetupMessage] = useState('')

  const assessmentActiveRef = useRef(false)
  const currentQuestionIndexRef = useRef(0)
  const autoAdvanceTimeoutRef = useRef(null)
  const suppressFullscreenViolationRef = useRef(false)
  const submissionRef = useRef(false)
  const userAnswersRef = useRef([])
  const assessmentQuestionsRef = useRef([])

  const normalizedSubjectQuestions = useMemo(
    () => getQuestionsBySubject(courseQuizzes, assessmentSubject)
        .map((question, index) => normalizeQuestion(question, assessmentSubject, index, language))
        .filter(Boolean),
    [assessmentSubject, language, courseQuizzes],
  )

  const availableCount = normalizedSubjectQuestions.length

  const handleStartAssessment = () => {
    if (availableCount === 0) {
      setSetupMessage('No questions available for this subject.')
      return
    }

    const shuffled = [...normalizedSubjectQuestions].sort(() => 0.5 - Math.random())
    const nextQuestions = shuffled.slice(0, Math.min(assessmentCount, shuffled.length))

    submissionRef.current = false
    setAssessmentQuestions(nextQuestions)
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setAssessmentView('quiz')
    actions.startAssessment(assessmentSubject.toLowerCase(), assessmentDurationMinutes * 60)
    
    // Request Fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const handleSelectOption = (optionIndex) => {
    if (submissionRef.current) return
    const selectedQuestion = assessmentQuestions[currentQuestionIndex]
    
    const newAnswers = [
      ...userAnswers,
      {
        questionId: selectedQuestion.id,
        selectedOption: optionIndex,
        correctAnswer: selectedQuestion.answer,
      }
    ]
    setUserAnswers(newAnswers)
    userAnswersRef.current = newAnswers

    // Auto Advance logic
    if (currentQuestionIndex < assessmentQuestions.length - 1) {
      setTimeout(() => setCurrentQuestionIndex(prev => prev + 1), 600)
    } else {
      setTimeout(handleSubmitAssessment, 600)
    }
  }

  const handleSubmitAssessment = async () => {
    submissionRef.current = true
    
    // Calculate final stats
    const timeTaken = (assessmentDurationMinutes * 60) - state.assessmentMode.timerRemaining
    const quizId = assessmentQuestions[0]?.quizId || 'general' // We should fetch actual quiz ID
    const answers = userAnswers.map(a => a.selectedOption)

    await actions.submitAssessment(quizId, answers, timeTaken, state.assessmentMode.violations)
    
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setAssessmentView('result')
  }

  return (
    <div className="min-h-screen bg-bg-deep pt-24 pb-12 px-4 md:px-6 lg:px-8">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-cyan/5 blur-[150px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-purple/5 blur-[150px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {assessmentView === 'setup' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header Section */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-[10px] font-black uppercase tracking-[0.2em] mb-4 w-fit">
                    <Sparkles size={14} /> Knowledge Check
                  </div>
                  <h1 className="text-5xl font-black text-white">Skill <span className="text-brand-cyan">Assessment</span></h1>
                  <p className="mt-4 text-lg text-white/40 max-w-2xl">
                    Challenge yourself with timed evaluations designed to validate your mastery and unlock advanced roadmap milestones.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-3xl">
                  <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Available XP</p>
                    <p className="text-xl font-black text-white">Up to 500 XP</p>
                  </div>
                </div>
              </div>

              {/* Setup Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Card */}
                <div className="lg:col-span-8 glass-card p-10 rounded-[3rem] border-white/5 bg-mesh">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40">
                      <Settings2 size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">Configure Session</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-white/30 uppercase tracking-widest pl-1">Select Subject</label>
                        <select 
                          value={assessmentSubject}
                          onChange={(e) => setAssessmentSubject(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 transition-all appearance-none cursor-pointer"
                        >
                          {subjectOptions.map(opt => <option key={opt.id} value={opt.id} className="bg-bg-deep">{opt.title}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black text-white/30 uppercase tracking-widest pl-1">Difficulty Level</label>
                        <div className="grid grid-cols-2 gap-3">
                          {['mixed', 'low', 'medium', 'high'].map(lvl => (
                            <button
                              key={lvl}
                              onClick={() => setAssessmentLevel(lvl)}
                              className={`py-3 rounded-xl text-xs font-bold uppercase transition-all border ${
                                assessmentLevel === lvl 
                                ? 'bg-brand-cyan text-bg-deep border-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]' 
                                : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-xs font-black text-white/30 uppercase tracking-widest pl-1">Question Count</label>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                          {COUNT_OPTIONS.map(cnt => (
                            <button
                              key={cnt}
                              onClick={() => setAssessmentCount(cnt)}
                              className={`flex-shrink-0 w-12 h-12 rounded-xl text-sm font-bold transition-all border ${
                                assessmentCount === cnt 
                                ? 'bg-brand-purple text-white border-brand-purple shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                : 'bg-white/5 text-white/40 border-white/5'
                              }`}
                            >
                              {cnt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-black text-white/30 uppercase tracking-widest pl-1">Timer (Minutes)</label>
                        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                          {DURATION_OPTIONS.map(dur => (
                            <button
                              key={dur}
                              onClick={() => setAssessmentDurationMinutes(dur)}
                              className={`flex-shrink-0 w-12 h-12 rounded-xl text-sm font-bold transition-all border ${
                                assessmentDurationMinutes === dur 
                                ? 'bg-brand-blue text-white border-brand-blue shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                                : 'bg-white/5 text-white/40 border-white/5'
                              }`}
                            >
                              {dur}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-12 p-8 rounded-3xl bg-brand-cyan/5 border border-brand-cyan/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">
                        <HelpCircle size={24} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{availableCount} Questions Ready</p>
                        <p className="text-xs text-white/40">Verified from official roadmap bank</p>
                      </div>
                    </div>

                    <button
                      onClick={handleStartAssessment}
                      className="w-full md:w-auto px-10 py-4 rounded-2xl bg-brand-cyan text-bg-deep font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center justify-center gap-3"
                    >
                      START NOW <ChevronRight size={20} />
                    </button>
                  </div>
                </div>

                {/* Rules Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                      <ShieldAlert size={20} className="text-brand-purple" />
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Integrity Rules</h4>
                    </div>
                    <ul className="space-y-4">
                      {[
                        'Fullscreen mode is mandatory',
                        'Tab switching results in deduction',
                        'Timer cannot be paused',
                        'Results are permanent'
                      ].map((rule, i) => (
                        <li key={i} className="flex items-start gap-3 text-xs text-white/50 leading-relaxed">
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-purple mt-1 flex-shrink-0"></div>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-brand-purple/10 to-transparent">
                    <div className="flex items-center gap-3 mb-6">
                      <Trophy size={20} className="text-brand-cyan" />
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Achievements</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                          <Zap size={18} className="text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Speedster</p>
                          <p className="text-[10px] text-white/30">Finish in half time: +100 XP</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                          <ClipboardCheck size={18} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Perfectionist</p>
                          <p className="text-[10px] text-white/30">100% Accuracy: +200 XP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {assessmentView === 'quiz' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="h-[calc(100vh-160px)]"
            >
              <QuizScreen
                autoAdvanceRemaining={autoAdvanceRemaining}
                currentIndex={currentQuestionIndex}
                deductions={state.assessmentMode.deductions}
                onQuit={() => setAssessmentView('setup')}
                onSelectOption={handleSelectOption}
                question={assessmentQuestions[currentQuestionIndex]}
                selectedOption={userAnswers.find(a => a.questionId === assessmentQuestions[currentQuestionIndex]?.id)?.selectedOption}
                subject={subjectOptions.find(s => s.id === assessmentSubject)?.title || assessmentSubject}
                timeRemaining={state.assessmentMode.timerRemaining}
                totalQuestions={assessmentQuestions.length}
                violations={state.assessmentMode.violations}
              />
            </motion.div>
          )}

          {assessmentView === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <ResultScreen
                correctCount={userAnswers.filter(a => a.selectedOption === a.correctAnswer).length}
                deductions={state.assessmentMode.deductions}
                onRestart={() => setAssessmentView('setup')}
                onToggleDetailedResult={() => setShowDetailedResult(!showDetailedResult)}
                score={Math.round((userAnswers.filter(a => a.selectedOption === a.correctAnswer).length / assessmentQuestions.length) * 100)}
                showDetailedResult={showDetailedResult}
                subject={subjectOptions.find(s => s.id === assessmentSubject)?.title || assessmentSubject}
                totalQuestions={assessmentQuestions.length}
                violations={state.assessmentMode.violations}
                wrongCount={assessmentQuestions.length - userAnswers.filter(a => a.selectedOption === a.correctAnswer).length}
              />
              
              {showDetailedResult && (
                <div className="mt-8">
                  <AnswerReview questions={assessmentQuestions} userAnswers={userAnswers} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
