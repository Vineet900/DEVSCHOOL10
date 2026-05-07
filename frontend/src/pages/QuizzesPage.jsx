import { useEffect, useMemo, useRef, useState } from 'react'
import AnswerReview from '../components/assessment/AnswerReview'
import QuizScreen from '../components/assessment/QuizScreen'
import ResultScreen from '../components/assessment/ResultScreen'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'
import { getCourseQuizzes, getCourses } from '../content/lessonStore'

const COUNT_OPTIONS = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60]
const AUTO_ADVANCE_DELAY_MS = 5000
const DIFFICULTY_MAP = {
  mixed: null,
  low: 'low',
  medium: 'medium',
  high: 'high',
}

function getQuestionsBySubject(subjectId) {
  const quizzes = getCourseQuizzes()
  return quizzes[subjectId] || []
}

function normalizeAnswerIndex(answer, optionCount) {
  if (!Number.isFinite(optionCount) || optionCount <= 0) return -1

  if (typeof answer === 'number' && Number.isInteger(answer) && answer >= 0 && answer < optionCount) {
    return answer
  }

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
  if (typeof question.question === 'string') {
    prompt = question.question.trim()
  } else if (question.question && question.question[language]) {
    prompt = question.question[language].trim()
  } else if (question.question && question.question.en) {
    prompt = question.question.en.trim()
  }

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

function filterQuestionsByLevel(questions, selectedLevel) {
  const targetDifficulty = DIFFICULTY_MAP[selectedLevel] ?? null
  if (!targetDifficulty) return questions
  return questions.filter((question) => question.difficulty === targetDifficulty)
}

function calculateResultStats(questions, userAnswers) {
  const answerMap = new Map(userAnswers.map((entry) => [entry.questionId, entry]))
  const correctCount = questions.reduce((total, question) => {
    const userAnswer = answerMap.get(question.id)
    return userAnswer && userAnswer.selectedOption === question.answer ? total + 1 : total
  }, 0)
  const totalQuestions = questions.length
  const wrongCount = Math.max(0, totalQuestions - correctCount)
  const rawScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  return { correctCount, rawScore, totalQuestions, wrongCount }
}

function safeFullscreenRequest() {
  document.documentElement.requestFullscreen?.().catch(() => {})
}

function safeFullscreenExit(suppressViolationRef) {
  if (!document.fullscreenElement) return
  suppressViolationRef.current = true
  document.exitFullscreen()
    .catch(() => {})
    .finally(() => {
      window.setTimeout(() => {
        suppressViolationRef.current = false
      }, 250)
    })
}

export default function QuizzesPage() {
  const { state, actions } = useApp()
  const language = state.language
  const courses = useMemo(() => getCourses(), [])
  const subjectOptions = useMemo(() => courses.map(c => ({ id: c.id, title: c.title[language] || c.title.en })), [courses, language])
  const [assessmentSubject, setAssessmentSubject] = useState(subjectOptions[0]?.id || 'html')

  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.find(s => s.id === assessmentSubject)) {
      setAssessmentSubject(subjectOptions[0].id)
    }
  }, [subjectOptions, assessmentSubject])
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
    () =>
      getQuestionsBySubject(assessmentSubject)
        .map((question, index) => normalizeQuestion(question, assessmentSubject, index, language))
        .filter(Boolean),
    [assessmentSubject, language],
  )

  const availableQuestions = useMemo(
    () => filterQuestionsByLevel(normalizedSubjectQuestions, assessmentLevel),
    [assessmentLevel, normalizedSubjectQuestions],
  )

  const selectedQuestion = assessmentQuestions[currentQuestionIndex] ?? null

  const answerMap = useMemo(() => new Map(userAnswers.map((entry) => [entry.questionId, entry])), [userAnswers])
  const selectedAnswer = selectedQuestion ? answerMap.get(selectedQuestion.id)?.selectedOption ?? null : null

  const resultStats = useMemo(
    () => calculateResultStats(assessmentQuestions, userAnswers),
    [assessmentQuestions, userAnswers],
  )

  const netScore = Math.max(0, resultStats.rawScore - state.assessmentMode.deductions)
  const availableCount = availableQuestions.length
  const selectedCount = Math.min(assessmentCount, availableCount || assessmentCount)

  useEffect(() => {
    assessmentActiveRef.current = state.assessmentMode.active
  }, [state.assessmentMode.active])

  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex
  }, [currentQuestionIndex])

  useEffect(() => {
    userAnswersRef.current = userAnswers
  }, [userAnswers])

  useEffect(() => {
    assessmentQuestionsRef.current = assessmentQuestions
  }, [assessmentQuestions])

  useEffect(() => {
    if (!autoAdvanceDeadline) {
      setAutoAdvanceRemaining(0)
      return undefined
    }

    const updateRemaining = () => {
      setAutoAdvanceRemaining(Math.max(0, Math.ceil((autoAdvanceDeadline - Date.now()) / 1000)))
    }

    updateRemaining()
    const intervalId = window.setInterval(() => {
      if (Date.now() >= autoAdvanceDeadline) {
        window.clearInterval(intervalId)
        setAutoAdvanceRemaining(0)
      } else {
        updateRemaining()
      }
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [autoAdvanceDeadline])

  useEffect(() => {
    if (assessmentView !== 'quiz' || !state.assessmentMode.active) return
    actions.updateAssessmentScore(resultStats.rawScore)
  }, [actions, assessmentView, resultStats.rawScore, state.assessmentMode.active])

  useEffect(() => {
    if (assessmentView !== 'quiz') return
    if (state.assessmentMode.active) return
    if (!state.assessmentMode.submitted) return

    clearAutoAdvance()
    submissionRef.current = true
    safeFullscreenExit(suppressFullscreenViolationRef)
    setAssessmentView('result')
  }, [assessmentView, state.assessmentMode.active, state.assessmentMode.submitted])

  useEffect(() => {
    if (!state.assessmentMode.active) return undefined

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        actions.registerAssessmentViolation()
      }
    }

    const onBlur = () => actions.registerAssessmentViolation()

    const onFullscreenChange = () => {
      if (suppressFullscreenViolationRef.current) return
      if (!document.fullscreenElement && assessmentActiveRef.current) {
        actions.registerAssessmentViolation()
      }
    }

    const onContextMenu = (event) => event.preventDefault()

    const onKeyDown = (event) => {
      const isModifierPressed = event.ctrlKey || event.metaKey
      if (isModifierPressed && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase())) {
        event.preventDefault()
        actions.registerAssessmentViolation()
      }
    }

    const onBeforeUnload = () => actions.registerAssessmentViolation()

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [actions, state.assessmentMode.active])

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        window.clearTimeout(autoAdvanceTimeoutRef.current)
      }
    }
  }, [])

  function clearAutoAdvance() {
    if (autoAdvanceTimeoutRef.current) {
      window.clearTimeout(autoAdvanceTimeoutRef.current)
      autoAdvanceTimeoutRef.current = null
    }
    setAutoAdvanceDeadline(null)
    setAutoAdvanceRemaining(0)
  }

  function scheduleAutoAdvance(questionId) {
    clearAutoAdvance()
    const deadline = Date.now() + AUTO_ADVANCE_DELAY_MS
    setAutoAdvanceDeadline(deadline)
    autoAdvanceTimeoutRef.current = window.setTimeout(() => {
      autoAdvanceTimeoutRef.current = null
      setAutoAdvanceDeadline(null)
      setAutoAdvanceRemaining(0)

      if (!assessmentActiveRef.current || submissionRef.current) return

      const activeQuestion = assessmentQuestionsRef.current[currentQuestionIndexRef.current]
      if (!activeQuestion || activeQuestion.id !== questionId) return

      if (currentQuestionIndexRef.current >= assessmentQuestionsRef.current.length - 1) {
        handleSubmitAssessment()
        return
      }

      setCurrentQuestionIndex((previousIndex) => previousIndex + 1)
    }, AUTO_ADVANCE_DELAY_MS)
  }

  function resetAssessmentState() {
    clearAutoAdvance()
    submissionRef.current = false
    setAssessmentQuestions([])
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setAssessmentView('setup')
    setShowDetailedResult(false)
    setSetupMessage('')
  }

  function handleStartAssessment() {
    const filteredQuestions = filterQuestionsByLevel(normalizedSubjectQuestions, assessmentLevel)
    if (filteredQuestions.length === 0) {
      setSetupMessage('No questions are available for the selected subject and difficulty.')
      return
    }

    const shuffledQuestions = [...filteredQuestions].sort(() => 0.5 - Math.random())
    const nextQuestions = shuffledQuestions.slice(0, Math.min(assessmentCount, shuffledQuestions.length))

    submissionRef.current = false
    clearAutoAdvance()
    setSetupMessage(
      filteredQuestions.length < assessmentCount
        ? `Only ${filteredQuestions.length} questions are available for this setup, so all of them will be used.`
        : '',
    )
    setAssessmentQuestions(nextQuestions)
    setCurrentQuestionIndex(0)
    setUserAnswers([])
    setShowDetailedResult(false)
    setAssessmentView('quiz')
    actions.startAssessment(assessmentSubject.toLowerCase(), assessmentDurationMinutes * 60)
    safeFullscreenRequest()
  }

  function handleSelectOption(optionIndex) {
    if (!selectedQuestion || submissionRef.current) return
    if (answerMap.has(selectedQuestion.id)) return

    setUserAnswers((previousAnswers) => [
      ...previousAnswers,
      {
        questionId: selectedQuestion.id,
        selectedOption: optionIndex,
        correctAnswer: selectedQuestion.answer,
      },
    ])

    scheduleAutoAdvance(selectedQuestion.id)
  }

  function handleSubmitAssessment() {
    if (submissionRef.current) return
    submissionRef.current = true
    clearAutoAdvance()
    const latestStats = calculateResultStats(assessmentQuestionsRef.current, userAnswersRef.current)
    actions.submitAssessment(latestStats.rawScore)
    safeFullscreenExit(suppressFullscreenViolationRef)
    setAssessmentView('result')
  }

  function handleQuitAssessment() {
    if (submissionRef.current) return
    submissionRef.current = true
    clearAutoAdvance()
    actions.quitAssessment(5)
    safeFullscreenExit(suppressFullscreenViolationRef)
    setAssessmentView('result')
  }

  function handleRestartAssessment() {
    actions.clearAssessment()
    resetAssessmentState()
  }

  return (
    <section className="premium-bg space-y-3 rounded-3xl p-3 md:p-4">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold">{t(language, 'quizzes')}</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">{t(language, 'assessmentSetupIntro')}</p>
      </header>

      {assessmentView === 'setup' ? (
        <section className="space-y-4">
          <article className="glass-card rounded-[1.5rem] p-4 md:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  {t(language, 'assessmentSetupLabel')}
                </p>
                <h3 className="mt-2 text-2xl font-bold">{t(language, 'assessmentSetupTitle')}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t(language, 'assessmentSetupDescription')}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                  {t(language, 'assessmentSelectionSummary')}
                </p>
                <div className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-200">
                  <p>Subject: {subjectOptions.find(s => s.id === assessmentSubject)?.title || assessmentSubject}</p>
                  <p>Difficulty: {assessmentLevel === 'mixed' ? t(language, 'levelMixed') : assessmentLevel}</p>
                  <p>Questions: {selectedCount || availableCount || 0}</p>
                  <p>Timing: {assessmentDurationMinutes} {t(language, 'minutesLabel')}</p>
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
            <article className="glass-card rounded-[1.5rem] p-4 md:p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Subject</span>
                  <select
                    value={assessmentSubject}
                    onChange={(event) => setAssessmentSubject(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    {subjectOptions.map((subjectOption) => (
                      <option key={subjectOption.id} value={subjectOption.id}>
                        {subjectOption.title}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold">{t(language, 'questionLevel')}</span>
                  <select
                    value={assessmentLevel}
                    onChange={(event) => setAssessmentLevel(event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    <option value="mixed">{t(language, 'levelMixed')}</option>
                    <option value="low">{t(language, 'levelLow')}</option>
                    <option value="medium">{t(language, 'levelMedium')}</option>
                    <option value="high">{t(language, 'levelHigh')}</option>
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold">{t(language, 'questionCount')}</span>
                  <select
                    value={assessmentCount}
                    onChange={(event) => setAssessmentCount(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    {COUNT_OPTIONS.map((countOption) => (
                      <option key={countOption} value={countOption} disabled={availableCount > 0 && countOption > availableCount}>
                        {countOption}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold">{t(language, 'assessmentDuration')}</span>
                  <select
                    value={assessmentDurationMinutes}
                    onChange={(event) => setAssessmentDurationMinutes(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-300 bg-white/80 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-900/70"
                  >
                    {DURATION_OPTIONS.map((durationOption) => (
                      <option key={durationOption} value={durationOption}>
                        {durationOption} {t(language, 'minutesLabel')}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-semibold">{t(language, 'questionType')}</span>
                  <select
                    value="mcq"
                    disabled
                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="mcq">{t(language, 'questionTypeMcq')}</option>
                  </select>
                </label>

                <label className="space-y-3 rounded-2xl border border-slate-200 bg-white/75 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{t(language, 'requireAnswerBeforeNext')}</span>
                    <input
                      type="checkbox"
                      checked={requireAnswerBeforeNext}
                      onChange={(event) => setRequireAnswerBeforeNext(event.target.checked)}
                      className="h-4 w-4"
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Exam mode locks skipping and moves to the next question automatically after you answer.
                  </p>
                </label>
              </div>

              <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/75 p-4 dark:border-slate-700 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                    {t(language, 'questionBankAvailable')}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{availableCount}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t(language, 'assessmentReadyHint')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartAssessment}
                  disabled={availableCount === 0 || state.assessmentMode.active}
                  className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t(language, 'startAssessmentNow')}
                </button>
              </div>

              {setupMessage ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  {setupMessage}
                </div>
              ) : null}
            </article>

            <article className="glass-card rounded-[1.5rem] p-4 md:p-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                    {t(language, 'assessmentRulesTitle')}
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    <li>{t(language, 'assessmentRuleFullscreen')}</li>
                    <li>{t(language, 'assessmentRuleNavbar')}</li>
                    <li>{t(language, 'assessmentRuleViolations')}</li>
                    <li>{t(language, 'assessmentRuleQuit')}</li>
                    <li>{t(language, 'assessmentRuleTimer')}</li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                    {t(language, 'assessmentConditionsTitle')}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {t(language, 'assessmentConditionsBody')}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>
      ) : null}

      {assessmentView === 'quiz' && selectedQuestion ? (
        <QuizScreen
          autoAdvanceRemaining={autoAdvanceRemaining}
          currentIndex={currentQuestionIndex}
          deductions={state.assessmentMode.deductions}
          onQuit={handleQuitAssessment}
          onSelectOption={handleSelectOption}
          question={selectedQuestion}
          selectedOption={selectedAnswer}
          subject={subjectOptions.find(s => s.id === assessmentSubject)?.title || assessmentSubject}
          timeRemaining={state.assessmentMode.timerRemaining}
          totalQuestions={assessmentQuestions.length}
          violations={state.assessmentMode.violations}
        />
      ) : null}

      {assessmentView === 'result' ? (
        <section className="space-y-4">
          <ResultScreen
            correctCount={resultStats.correctCount}
            deductions={state.assessmentMode.deductions}
            onRestart={handleRestartAssessment}
            onToggleDetailedResult={() => setShowDetailedResult((previousValue) => !previousValue)}
            score={netScore}
            showDetailedResult={showDetailedResult}
            subject={subjectOptions.find(s => s.id === assessmentSubject)?.title || assessmentSubject}
            totalQuestions={resultStats.totalQuestions}
            violations={state.assessmentMode.violations}
            wrongCount={resultStats.wrongCount}
          />

          {showDetailedResult ? <AnswerReview questions={assessmentQuestions} userAnswers={userAnswers} /> : null}
        </section>
      ) : null}
    </section>
  )
}
