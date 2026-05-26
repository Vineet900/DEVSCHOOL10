import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  BrainCircuit, 
  Info,
  RotateCcw,
  MessageSquareCode,
  Zap,
  BookOpen,
  Award,
  Trophy,
  Play,
  CheckCircle2,
  XCircle,
  Plus,
  Trash,
  Compass,
  Code,
  Calendar,
  Activity,
  ChevronRight,
  ChevronDown,
  Clipboard,
  Check,
  HelpCircle,
  ArrowRight,
  Cpu
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { teacherAPI } from '../lib/api'
import { AI_MODELS, DEFAULT_MODEL_ID, getModelById } from '../lib/aiModels'
import { useAiQuota } from '../hooks/useAiQuota'
import toast from 'react-hot-toast'

// Parsing assistant text to extract text and code blocks
const parseMessageContent = (content) => {
  const parts = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      parts.push({ type: 'text', value: textBefore });
    }
    parts.push({ type: 'code', language: match[1] || 'code', value: match[2] });
    lastIndex = regex.lastIndex;
  }

  const textAfter = content.substring(lastIndex);
  if (textAfter) {
    parts.push({ type: 'text', value: textAfter });
  }

  if (parts.length === 0) {
    return [{ type: 'text', value: content }];
  }
  return parts;
};

// Copyable Code block component
function MessagePart({ part }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(part.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (part.type === 'code') {
    return (
      <div className="my-3 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden bg-slate-950">
        <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] font-bold text-white/50 uppercase tracking-wider">
          <span>{part.language}</span>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Clipboard size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-[11px] md:text-xs font-mono text-cyan-300/90 leading-relaxed whitespace-pre">
          <code>{part.value.trim()}</code>
        </pre>
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap leading-relaxed text-xs md:text-sm text-slate-800 dark:text-white/90">
      {part.value}
    </p>
  );
}

// Interactive Quiz Card Component
function InteractiveQuiz({ quiz, onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  const currentQuestion = quiz.questions[currentIdx];

  const handleSelect = (idx) => {
    if (showExplanation) return;
    setSelectedOpt(idx);
  };

  const handleCheck = () => {
    if (selectedOpt === null) return;
    const isCorrect = selectedOpt === currentQuestion.answerIndex;
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
    }
    setAnswers(prev => [...prev, { selected: selectedOpt, correct: isCorrect }]);
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedOpt(null);
    if (currentIdx + 1 < quiz.questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setQuizDone(true);
      if (onComplete) onComplete(quizScore + (selectedOpt === currentQuestion.answerIndex ? 1 : 0));
    }
  };

  if (quizDone) {
    const finalScore = Math.round((quizScore / quiz.questions.length) * 100);
    return (
      <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center space-y-4 shadow-xl">
        <Trophy size={40} className="mx-auto text-amber-400 animate-bounce" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Quiz Completed!</h3>
        <p className="text-xs text-slate-500 dark:text-white/60">Your Result: <span className="text-brand-cyan font-black">{finalScore}%</span> ({quizScore}/{quiz.questions.length})</p>
        <div className="flex gap-2 justify-center">
          {answers.map((ans, idx) => (
            <span key={idx} className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              ans.correct ? 'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
            }`}>
              Q{idx+1}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 text-left shadow-lg">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider border-b border-slate-200 dark:border-white/5 pb-2">
        <span>{quiz.title || 'Interactive Quiz'}</span>
        <span>Question {currentIdx + 1} of {quiz.questions.length}</span>
      </div>
      
      <p className="text-slate-850 dark:text-white text-xs font-bold leading-relaxed">{currentQuestion.question}</p>

      <div className="space-y-2">
        {currentQuestion.options.map((opt, idx) => {
          let optStyle = "bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80";
          if (selectedOpt === idx) {
            optStyle = "bg-brand-cyan/20 border-brand-cyan/40 text-slate-900 dark:text-brand-cyan font-bold";
          }
          if (showExplanation) {
            if (idx === currentQuestion.answerIndex) {
              optStyle = "bg-green-500/25 border-green-500/40 text-green-600 dark:text-green-400 font-bold";
            } else if (selectedOpt === idx) {
              optStyle = "bg-red-500/25 border-red-500/40 text-red-600 dark:text-red-400 font-bold";
            } else {
              optStyle = "bg-slate-100/50 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-400 dark:text-white/40 pointer-events-none";
            }
          }

          return (
            <button
              key={idx}
              disabled={showExplanation}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-3 rounded-xl border text-[11px] transition-all flex items-center justify-between ${optStyle}`}
            >
              <span>{opt}</span>
              {showExplanation && idx === currentQuestion.answerIndex && <CheckCircle2 size={14} className="text-green-500 dark:text-green-400" />}
              {showExplanation && selectedOpt === idx && idx !== currentQuestion.answerIndex && <XCircle size={14} className="text-red-500 dark:text-red-400" />}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="bg-brand-cyan/10 dark:bg-brand-cyan/5 border border-brand-cyan/20 dark:border-brand-cyan/10 rounded-xl p-3 text-[11px] text-slate-700 dark:text-white/70 leading-relaxed">
          <span className="font-black text-brand-cyan uppercase tracking-wider block mb-1">Explanation:</span>
          {currentQuestion.explanation}
        </div>
      )}

      <div className="flex justify-end">
        {!showExplanation ? (
          <button
            disabled={selectedOpt === null}
            onClick={handleCheck}
            className="px-4 py-2 rounded-xl bg-brand-cyan text-slate-900 font-black text-[10px] uppercase tracking-wider hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-350 dark:hover:bg-white/20 border border-slate-300 dark:border-white/10 text-slate-800 dark:text-white font-black text-[10px] uppercase tracking-wider hover:scale-105 active:scale-95 transition-all"
          >
            {currentIdx + 1 === quiz.questions.length ? 'Finish Quiz' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}

// Vertical Roadmap Visualizer
function RoadmapVisualizer({ roadmap }) {
  const { actions, metadata } = useApp();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddToMyPaths = async () => {
    if (isSaving || isSaved) return;
    setIsSaving(true);
    try {
      const formattedSteps = roadmap.steps.map((step, idx) => {
        // Try to match step title with an existing course to link it
        const matchingCourse = metadata?.courses?.find(c => {
          const kw = c.slug || c.id || '';
          const title = c.title?.en || c.title || '';
          const stepTitleLower = (step.title || '').toLowerCase();
          return stepTitleLower.includes(kw.toLowerCase()) || 
                 stepTitleLower.includes(title.toLowerCase()) ||
                 title.toLowerCase().includes(stepTitleLower);
        });

        return {
          id: step.id || `step-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
          title: step.title,
          description: step.description || '',
          xp: step.xp || 100,
          courseId: matchingCourse ? (matchingCourse.slug || matchingCourse.id) : undefined
        };
      });

      const payload = {
        title: roadmap.title,
        description: roadmap.description || '',
        steps: formattedSteps
      };

      const res = await actions.createCustomRoadmap(payload);
      if (res?.success) {
        toast.success('Roadmap added to your Custom courses!');
        setIsSaved(true);
      } else {
        toast.error(res?.error || 'Failed to add roadmap');
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while saving the roadmap.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4 text-left relative overflow-hidden shadow-lg">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-full blur-xl pointer-events-none"></div>
      
      <div className="border-b border-slate-200 dark:border-white/5 pb-2 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Compass size={16} className="text-brand-cyan animate-pulse" />
            {roadmap.title}
          </h3>
          {roadmap.description && (
            <p className="text-[10px] text-slate-500 dark:text-white/50 mt-1">{roadmap.description}</p>
          )}
        </div>
        <button
          onClick={handleAddToMyPaths}
          disabled={isSaving || isSaved}
          className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all select-none hover:scale-105 active:scale-95 cursor-pointer ${
            isSaved
            ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:scale-100'
            : isSaving
            ? 'bg-brand-cyan/10 border-brand-cyan/20 text-brand-cyan/50 cursor-wait'
            : 'bg-brand-cyan text-slate-900 border-brand-cyan hover:shadow-[0_0_12px_rgba(0,240,255,0.25)]'
          }`}
        >
          {isSaved ? (
            <>
              <Check size={11} />
              Added
            </>
          ) : isSaving ? (
            <>
              <span className="w-2.5 h-2.5 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></span>
              Saving...
            </>
          ) : (
            <>
              <Plus size={11} />
              Add to Paths
            </>
          )}
        </button>
      </div>

      <div className="relative pl-6 space-y-6 border-l border-brand-cyan/20 ml-2">
        {roadmap.steps.map((step, idx) => (
          <div key={idx} className="relative group">
            {/* Connection Node Indicator */}
            <div className="absolute -left-[30px] top-1.5 w-3 h-3 rounded-full bg-bg-deep border border-brand-cyan flex items-center justify-center group-hover:scale-125 transition-all">
              <span className="w-1 h-1 rounded-full bg-brand-cyan"></span>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-white">{step.title}</span>
                {step.xp && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan font-black">
                    +{step.xp} XP
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-white/60 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TutorPage() {
  const { state, profile, actions } = useApp();
  const navigate = useNavigate();
  
  // Local states
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('devschoolpro-teacher-chat-history');
    return saved ? JSON.parse(saved) : [
      { 
        role: 'assistant', 
        content: "Namaste! 🎓 I am DevSensei, your personal AI Coding Teacher. I've already reviewed your learning profile — courses, quiz results, completed lessons, and study progress.\n\nAsk me anything: explain a concept, generate a quiz, plan your study path, or debug your code. I'm here to guide you step-by-step!",
        id: 1 
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'plan', 'code', 'roadmap'

  // Custom API key states
  const [customKey, setCustomKey] = useState(() => {
    return localStorage.getItem('devschoolpro-custom-gemini-key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);

  // AI Model selection — persisted to localStorage
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('devschoolpro-ai-model') || DEFAULT_MODEL_ID;
  });
  const [showModelPicker, setShowModelPicker] = useState(false);
  const quota = useAiQuota(selectedModel);

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    localStorage.setItem('devschoolpro-ai-model', modelId);
    setShowModelPicker(false);
  };

  // Tab Loaders
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryData, setSummaryData] = useState(() => {
    return localStorage.getItem('devschoolpro-teacher-summary') || '';
  });
  
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planData, setPlanData] = useState(() => {
    return localStorage.getItem('devschoolpro-teacher-plan') || '';
  });

  const [loadingCode, setLoadingCode] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeLevel, setCodeLevel] = useState('Beginner');
  const [codeExplanation, setCodeExplanation] = useState('');

  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapLevel, setRoadmapLevel] = useState('Beginner');
  const [generatedRoadmap, setGeneratedRoadmap] = useState(null);
  const [roadmapError, setRoadmapError] = useState(null);

  const chatContainerRef = useRef(null);

  // Sync chat to localStorage and scroll container
  useEffect(() => {
    localStorage.setItem('devschoolpro-teacher-chat-history', JSON.stringify(messages));
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Only restore cached data from localStorage — never auto-call APIs on page load
  // Users must click refresh buttons manually to preserve free API quota
  useEffect(() => {
    const cachedSummaryDate = localStorage.getItem('devschoolpro-teacher-summary-date');
    const cachedPlanDate = localStorage.getItem('devschoolpro-teacher-plan-date');
    const today = new Date().toDateString();

    // Clear stale (yesterday's) cached data
    if (cachedSummaryDate !== today) {
      localStorage.removeItem('devschoolpro-teacher-summary');
      localStorage.removeItem('devschoolpro-teacher-summary-date');
      setSummaryData('');
    }
    if (cachedPlanDate !== today) {
      localStorage.removeItem('devschoolpro-teacher-plan');
      localStorage.removeItem('devschoolpro-teacher-plan-date');
      setPlanData('');
    }
  }, []);

  const handleClearChat = () => {
    const defaultMsg = [
      { 
        role: 'assistant', 
        content: "Namaste! 🎓 I am DevSensei, your personal AI Coding Teacher. I've already reviewed your learning profile — courses, quiz results, completed lessons, and study progress.\n\nAsk me anything: explain a concept, generate a quiz, plan your study path, or debug your code. I'm here to guide you step-by-step!",
        id: Date.now() 
      }
    ];
    setMessages(defaultMsg);
    setSummaryData('');
    setPlanData('');
    localStorage.removeItem('devschoolpro-teacher-summary');
    localStorage.removeItem('devschoolpro-teacher-plan');
  };

  const handleSend = async (customPrompt) => {
    const promptText = typeof customPrompt === 'string' ? customPrompt : input;
    if (!promptText.trim() || isTyping) return;

    const userMessage = { role: 'user', content: promptText, id: Date.now() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await teacherAPI.ask({
        message: promptText,
        course: state.selectedCourseId || "Web Development",
        level: state.learningLevel || "Beginner",
        userId: state.user?.id,
        model: selectedModel,
        customApiKey: localStorage.getItem('devschoolpro-custom-gemini-key') || undefined
      });

      const data = response.data;
      if (data.success) {
        quota.increment();
        actions.refreshProfile(); // Sync token balance from backend
        let answerText = data.answer;
        let extractedQuiz = null;
        let extractedRoadmap = null;
        let textBefore = answerText;

        // Try extracting JSON quiz/roadmap
        try {
          const startBrace = answerText.indexOf('{');
          const endBrace = answerText.lastIndexOf('}');
          if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
            const potentialJson = answerText.substring(startBrace, endBrace + 1);
            const parsed = JSON.parse(potentialJson);
            if (parsed.questions && Array.isArray(parsed.questions)) {
              extractedQuiz = parsed;
              textBefore = answerText.substring(0, startBrace).trim();
            } else if (parsed.steps && Array.isArray(parsed.steps)) {
              extractedRoadmap = parsed;
              textBefore = answerText.substring(0, startBrace).trim();
            }
          }
        } catch (e) {
          // ignore error
        }

        setMessages(prev => [...prev, {
          role: 'assistant',
          content: answerText,
          quiz: extractedQuiz,
          textBeforeQuiz: textBefore,
          roadmap: extractedRoadmap,
          textBeforeRoadmap: textBefore,
          id: Date.now() + 1
        }]);
      } else {
        throw new Error(data.message || "Failed request");
      }
    } catch (error) {
      console.error('Teacher Chat Error:', error);
      const status = error.response?.status;
      const errMsg = error.response?.data?.message || error.message || "I encountered an error trying to process that question.";
      const displayMsg = status === 429
        ? 'Quota exhausted for this model. Switch to another model or wait until tomorrow.'
        : errMsg;
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `⚠️ ${displayMsg}`,
        id: Date.now() + 1
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Get Academic Summary
  const handleGetSummary = async () => {
    if (loadingSummary) return;
    setLoadingSummary(true);
    try {
      const response = await teacherAPI.studySummary({ 
        userId: state.user?.id, 
        model: selectedModel,
        customApiKey: localStorage.getItem('devschoolpro-custom-gemini-key') || undefined
      });
      if (response.data.success) {
        setSummaryData(response.data.answer);
        localStorage.setItem('devschoolpro-teacher-summary', response.data.answer);
        localStorage.setItem('devschoolpro-teacher-summary-date', new Date().toDateString());
        quota.increment();
        actions.refreshProfile(); // Sync token balance
      }
    } catch (error) {
      console.error('Summary error:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to generate summary metrics.';
      setSummaryData(`Error: ${errMsg}. Please check your backend/.env API key configuration.`);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Get Daily Plan
  const handleGetPlan = async () => {
    if (loadingPlan) return;
    setLoadingPlan(true);
    try {
      const response = await teacherAPI.dailyStudyPlan({
        course: state.selectedCourseId || "Web Development",
        level: state.learningLevel || "Beginner",
        userId: state.user?.id,
        model: selectedModel,
        customApiKey: localStorage.getItem('devschoolpro-custom-gemini-key') || undefined
      });
      if (response.data.success) {
        setPlanData(response.data.answer);
        localStorage.setItem('devschoolpro-teacher-plan', response.data.answer);
        localStorage.setItem('devschoolpro-teacher-plan-date', new Date().toDateString());
        quota.increment();
        actions.refreshProfile(); // Sync token balance
      }
    } catch (error) {
      console.error('Plan error:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to generate study plan.';
      setPlanData(`Error: ${errMsg}. Please check your backend/.env API key configuration.`);
    } finally {
      setLoadingPlan(false);
    }
  };

  // Explain Code
  const handleExplainCode = async () => {
    if (!codeSnippet.trim() || loadingCode) return;
    setLoadingCode(true);
    setCodeExplanation('');
    try {
      const response = await teacherAPI.explainCode({
        code: codeSnippet,
        language: codeLanguage,
        level: codeLevel,
        userId: state.user?.id,
        model: selectedModel,
        customApiKey: localStorage.getItem('devschoolpro-custom-gemini-key') || undefined
      });
      if (response.data.success) {
        setCodeExplanation(response.data.answer);
        quota.increment();
        actions.refreshProfile(); // Sync token balance
      }
    } catch (error) {
      console.error('Code explanation error:', error);
      const errMsg = error.response?.data?.message || error.message || 'Failed to explain code snippet.';
      setCodeExplanation(`Error: ${errMsg}. Please check your backend/.env API key configuration.`);
    } finally {
      setLoadingCode(false);
    }
  };

  // Generate Roadmap
  const handleGenerateRoadmap = async () => {
    if (!roadmapTitle.trim() || loadingRoadmap) return;
    setLoadingRoadmap(true);
    setGeneratedRoadmap(null);
    setRoadmapError(null);
    try {
      const response = await teacherAPI.generateRoadmap({
        title: roadmapTitle,
        level: roadmapLevel,
        userId: state.user?.id,
        model: selectedModel,
        customApiKey: localStorage.getItem('devschoolpro-custom-gemini-key') || undefined
      });
      if (response.data.success) {
        setGeneratedRoadmap(response.data.roadmap);
        quota.increment();
        actions.refreshProfile(); // Sync token balance
      } else {
        setRoadmapError(response.data.message || 'Failed to generate roadmap.');
      }
    } catch (error) {
      console.error('Roadmap generate error:', error);
      const status = error.response?.status;
      const msg = error.response?.data?.message || error.message || 'Failed to generate roadmap.';
      if (status === 429) {
        setRoadmapError('AI quota limit reached. Switch to a different model or try again tomorrow.');
      } else {
        setRoadmapError(msg);
      }
    } finally {
      setLoadingRoadmap(false);
    }
  };

  // Quick Action triggers
  const suggestedPrompts = [
    { label: 'Generate C Quiz', text: 'Generate a quiz on C Language basics' },
    { label: 'Explain Pointers', text: 'Act as a tutor: explain Pointers in C with simple analogies and a small challenge.' },
    { label: 'Quiz on Arrays', text: 'Test my knowledge: Create a mini multiple-choice quiz on Arrays.' },
    { label: 'Suggest Next Step', text: 'Based on my weak topics and score, what should I study next?' }
  ];

  const handleContinueLearning = () => {
    if (state.selectedCourseId) {
      navigate('/courses');
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep pt-24 pb-8 px-4 md:px-6 lg:px-8">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-cyan/5 blur-[160px]"></div>
        <div className="absolute bottom-[10%] left-[-10%] w-[45%] h-[45%] rounded-full bg-brand-purple/5 blur-[160px]"></div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan shadow-[0_0_15px_rgba(0,240,255,0.1)]">
              <Bot size={26} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Dev<span className="text-brand-cyan">Sensei</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-brand-purple/20 text-brand-purple border border-brand-purple/30 uppercase tracking-widest font-black">
                  AI Teacher
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                <span className="text-[9px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-widest">Active learning profile connected</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleContinueLearning}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-cyan text-slate-900 font-black text-xs uppercase tracking-wider hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Play size={14} fill="currentColor" /> Continue Learning
            </button>
            <button 
              onClick={handleClearChat}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-xs font-bold uppercase tracking-widest"
            >
              <RotateCcw size={13} /> Clear Chat
            </button>
          </div>
        </div>

        {/* Dashboard Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* LEFT: Tutor Chat area (Colspan 2) */}
          <div className="lg:col-span-2 flex flex-col h-[calc(100vh-230px)] min-h-[500px] glass-card rounded-[2rem] border-slate-200 dark:border-white/5 overflow-hidden bg-mesh">
            
            {/* Messages body */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'} items-start gap-3`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex-shrink-0 flex items-center justify-center text-brand-cyan border border-brand-cyan/20">
                        <Zap size={16} />
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] md:max-w-[75%] p-5 rounded-2xl ${
                      msg.role === 'assistant' 
                      ? 'bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white/95 rounded-tl-none shadow-md space-y-3' 
                      : 'bg-brand-cyan text-slate-900 font-bold rounded-tr-none shadow-[0_0_15px_rgba(0,240,255,0.15)] text-xs md:text-sm'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <>
                          {/* If message has active quiz inside */}
                          {msg.quiz ? (
                            <div className="space-y-3">
                              {msg.textBeforeQuiz && <p className="text-xs md:text-sm text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">{msg.textBeforeQuiz}</p>}
                              <InteractiveQuiz quiz={msg.quiz} />
                            </div>
                          ) : msg.roadmap ? (
                            <div className="space-y-3">
                              {msg.textBeforeRoadmap && <p className="text-xs md:text-sm text-slate-700 dark:text-white/80 leading-relaxed whitespace-pre-wrap">{msg.textBeforeRoadmap}</p>}
                              <RoadmapVisualizer roadmap={msg.roadmap} />
                            </div>
                          ) : (
                            // Standard parsed content
                            parseMessageContent(msg.content).map((part, idx) => (
                              <MessagePart key={idx} part={part} />
                            ))
                          )}
                        </>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-brand-cyan/20 flex-shrink-0 flex items-center justify-center text-brand-cyan border border-brand-cyan/30">
                        <User size={16} />
                      </div>
                    )}
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 flex-shrink-0 flex items-center justify-center text-brand-cyan border border-brand-cyan/20">
                      <Zap size={16} />
                    </div>
                    <div className="bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-brand-cyan rounded-full animate-bounce"></span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Suggested Chips & Input area */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/5 space-y-3">
              {/* Suggested Questions */}
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(prompt.text)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-cyan/40 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div className="relative flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask the AI Teacher about Pointer arrays, recursion, quizzes, etc..."
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl pl-5 pr-14 py-4 text-slate-800 dark:text-white text-xs outline-none focus:border-brand-cyan/40 focus:bg-white dark:focus:bg-white/10 transition-all resize-none max-h-24 no-scrollbar"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-3 w-10 h-10 rounded-xl bg-brand-cyan text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-40 disabled:grayscale cursor-pointer"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Intelligent Console Workspace (Colspan 1) */}
          <div className="flex flex-col h-[calc(100vh-230px)] min-h-[500px] glass-card rounded-[2rem] border-slate-200 dark:border-white/5 overflow-hidden bg-bg-card shadow-lg">

            {/* ── AI Model Selector + Quota Bar ── */}
            <div className="border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-3">
              {/* Model button */}
              <button
                onClick={() => setShowModelPicker(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-cyan/40 transition-all group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Cpu size={13} className="text-brand-cyan flex-shrink-0" />
                  <span className="text-[10px] font-black text-slate-800 dark:text-white truncate">
                    {getModelById(selectedModel).label}
                  </span>
                  {(() => {
                    const m = getModelById(selectedModel);
                    const colors = { cyan: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20', green: 'bg-green-500/10 text-green-400 border-green-500/20', purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20', gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
                    return <span className={`flex-shrink-0 text-[7px] px-1.5 py-0.5 rounded border font-black uppercase tracking-wider ${colors[m.badgeColor] || colors.cyan}`}>{m.badge}</span>;
                  })()}
                </div>
                <ChevronDown size={12} className={`text-slate-400 dark:text-white/30 transition-transform flex-shrink-0 ${showModelPicker ? 'rotate-180' : ''}`} />
              </button>

              {/* Token & Custom Key Panel */}
              <div className="mt-3 px-1 border-t border-slate-250 dark:border-white/5 pt-3 space-y-3">
                {customKey ? (
                  // Custom Key Active View
                  <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl p-3 space-y-1 shadow-[0_0_12px_rgba(245,158,11,0.05)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-400 uppercase tracking-wider">
                        <Sparkles size={11} className="animate-pulse" />
                        Custom API Key Active
                      </div>
                      <button 
                        onClick={() => setShowKeyInput(v => !v)}
                        className="text-[8px] font-black uppercase text-slate-400 hover:text-amber-400 transition-colors"
                      >
                        {showKeyInput ? 'Hide' : 'Configure'}
                      </button>
                    </div>
                    <p className="text-[8px] text-slate-500 dark:text-white/50 leading-relaxed font-bold">
                      Unlimited queries. Using your personal Gemini API key.
                    </p>
                  </div>
                ) : (
                  // Server Token Balance View
                  <div className="bg-slate-100 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 rounded-xl p-3 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] text-slate-400 dark:text-white/30 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Zap size={9} className="text-brand-cyan" />
                        AI Tutor Tokens
                      </span>
                      <span className={`text-[9px] font-black ${
                        (profile?.ai_tokens ?? 50) <= 5 ? 'text-red-400' :
                        (profile?.ai_tokens ?? 50) <= 15 ? 'text-yellow-400' : 'text-brand-cyan'
                      }`}>
                        {profile?.ai_tokens ?? 50} Remaining
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (profile?.ai_tokens ?? 50) <= 5 ? 'bg-red-500' :
                          (profile?.ai_tokens ?? 50) <= 15 ? 'bg-yellow-400' : 'bg-brand-cyan'
                        }`}
                        style={{ width: `${Math.min(100, Math.round(((profile?.ai_tokens ?? 50) / 50) * 100))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[8px] pt-0.5">
                      <span className="text-slate-500 dark:text-white/30 font-bold">
                        Welcome credits
                      </span>
                      <button 
                        onClick={() => setShowKeyInput(v => !v)}
                        className="text-brand-cyan font-black hover:underline tracking-wide uppercase"
                      >
                        + Use own key
                      </button>
                    </div>
                  </div>
                )}

                {/* Key Input Section */}
                {showKeyInput && (
                  <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl p-3 space-y-2.5">
                    <label className="block text-[8px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest">
                      Enter Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={customKey}
                        onChange={(e) => setCustomKey(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[9px] font-mono text-cyan-300 outline-none focus:border-brand-cyan/40 focus:bg-white dark:focus:bg-white/10 transition-all pr-8"
                      />
                      {customKey && (
                        <button
                          onClick={() => {
                            setCustomKey('');
                            localStorage.removeItem('devschoolpro-custom-gemini-key');
                            toast.success('Switched back to Server tokens.');
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase text-red-400 hover:text-red-300"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const trimmed = customKey.trim();
                          if (trimmed) {
                            localStorage.setItem('devschoolpro-custom-gemini-key', trimmed);
                            toast.success('Custom Gemini API Key saved locally!');
                            setShowKeyInput(false);
                          } else {
                            toast.error('Please enter a valid key first.');
                          }
                        }}
                        className="flex-1 py-1 rounded bg-brand-cyan text-slate-900 font-black text-[8px] uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Save Key
                      </button>
                      <button
                        onClick={() => setShowKeyInput(false)}
                        className="px-2.5 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-black text-[8px] uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                    <p className="text-[7.5px] text-slate-500 dark:text-white/30 leading-relaxed font-bold">
                      Your key is saved <b>locally in your browser</b> and sent directly to Google APIs. We never store your personal API keys on our servers.
                    </p>
                  </div>
                )}
              </div>

              {/* Model picker dropdown */}
              {showModelPicker && (
                <div className="mt-2 space-y-1 p-1 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl">
                  {AI_MODELS.map((m) => {
                    const mq = (() => {
                      try {
                        const raw = localStorage.getItem('devschoolpro-ai-quota-' + m.id);
                        if (raw) { const p = JSON.parse(raw); if (p.date === new Date().toDateString()) return p.count ?? 0; }
                      } catch(_) {}
                      return 0;
                    })();
                    const mRemaining = Math.max(0, m.dailyLimit - mq);
                    const mPct = Math.min(100, Math.round((mq / m.dailyLimit) * 100));
                    const badgeColors = { cyan: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20', green: 'bg-green-500/10 text-green-400 border-green-500/20', purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20', gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
                    const isSelected = selectedModel === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleModelChange(m.id)}
                        className={`w-full text-left p-2.5 rounded-lg transition-all ${isSelected ? 'bg-brand-cyan/10 border border-brand-cyan/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base leading-none">{m.icon}</span>
                            <span className={`text-[9px] font-black truncate ${isSelected ? 'text-brand-cyan' : 'text-slate-800 dark:text-white'}`}>{m.label}</span>
                            <span className={`flex-shrink-0 text-[7px] px-1 py-0.5 rounded border font-black uppercase tracking-wider ${badgeColors[m.badgeColor]}`}>{m.badge}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={11} className="text-brand-cyan flex-shrink-0" />}
                        </div>
                        <p className="text-[8px] text-slate-400 dark:text-white/40 mb-1.5 pl-5">{m.description}</p>
                        <div className="pl-5">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[7px] text-slate-400 dark:text-white/30">{m.speedLabel}</span>
                            <span className={`text-[7px] font-bold ${mPct >= 100 ? 'text-red-400' : mPct >= 85 ? 'text-red-400' : mPct >= 60 ? 'text-yellow-400' : 'text-green-400'}`}>{mRemaining}/{m.dailyLimit}</span>
                          </div>
                          <div className="h-0.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${mPct >= 85 ? 'bg-red-500' : mPct >= 60 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${mPct}%` }} />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tabs selector */}
            <div className="grid grid-cols-4 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01]">
              {[
                { id: 'summary', icon: Activity, label: 'Audit' },
                { id: 'plan', icon: Calendar, label: 'Plan' },
                { id: 'code', icon: Code, label: 'Code' },
                { id: 'roadmap', icon: Compass, label: 'Map' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 flex flex-col items-center justify-center gap-1 border-b-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === tab.id 
                    ? 'border-brand-cyan bg-brand-cyan/5 text-brand-cyan' 
                    : 'border-transparent text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70'
                  }`}
                >
                  <tab.icon size={15} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tabs display */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar bg-slate-50/50 dark:bg-transparent">
              
              {/* Tab 1: Academic Summary (Progress Audit) */}
              {activeTab === 'summary' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={15} className="text-brand-purple" />
                      Academic Coach Summary
                    </h3>
                    <button 
                      onClick={handleGetSummary}
                      disabled={loadingSummary}
                      className="text-[9px] font-black text-brand-cyan uppercase tracking-wider hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {loadingSummary ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {loadingSummary ? (
                    <div className="space-y-3 py-6">
                      <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-3/4 animate-pulse"></div>
                      <div className="h-16 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                      <div className="h-12 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                    </div>
                  ) : summaryData ? (
                    <div className="bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 text-[11px] md:text-xs text-slate-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                      {summaryData}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 dark:text-white/30 text-xs">
                      No progress summary generated. Click Refresh to query academic data.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Daily Study Plan */}
              {activeTab === 'plan' && (
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={15} className="text-emerald-500 dark:text-emerald-400" />
                      Personal Daily Study Plan
                    </h3>
                    <button 
                      onClick={handleGetPlan}
                      disabled={loadingPlan}
                      className="text-[9px] font-black text-brand-cyan uppercase tracking-wider hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      {loadingPlan ? 'Loading...' : 'Regen'}
                    </button>
                  </div>

                  {loadingPlan ? (
                    <div className="space-y-3 py-6">
                      <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-1/2 animate-pulse"></div>
                      <div className="h-16 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                      <div className="h-10 bg-slate-200 dark:bg-white/5 rounded animate-pulse"></div>
                    </div>
                  ) : planData ? (
                    <div className="bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 text-[11px] md:text-xs text-slate-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                      {planData}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 dark:text-white/30 text-xs">
                      No plan generated yet. Select Regen to compile from active course.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Code Explainer Workspace */}
              {activeTab === 'code' && (
                <div className="space-y-4 text-left">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-2">
                    <Code size={15} className="text-brand-cyan" />
                    Code Explainer Workspace
                  </h3>

                  <div className="space-y-3">
                    {/* Settings selectors */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wide block mb-1">Language</label>
                        <select 
                          value={codeLanguage} 
                          onChange={(e) => setCodeLanguage(e.target.value)}
                          className="w-full bg-slate-105 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-[10px] text-slate-800 dark:text-white outline-none focus:border-brand-cyan/40"
                        >
                          <option value="javascript">JavaScript</option>
                          <option value="c">C Language</option>
                          <option value="cpp">C++</option>
                          <option value="python">Python</option>
                          <option value="html/css">HTML/CSS</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wide block mb-1">Explanation level</label>
                        <select 
                          value={codeLevel} 
                          onChange={(e) => setCodeLevel(e.target.value)}
                          className="w-full bg-slate-105 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-[10px] text-slate-800 dark:text-white outline-none focus:border-brand-cyan/40"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    {/* Code Snippet input */}
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wide block mb-1">Paste your snippet</label>
                      <textarea
                        value={codeSnippet}
                        onChange={(e) => setCodeSnippet(e.target.value)}
                        placeholder="int *ptr = &val;"
                        className="w-full bg-slate-100 dark:bg-black/45 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-[10px] font-mono text-cyan-700 dark:text-cyan-300 outline-none focus:border-brand-cyan/40"
                        rows={6}
                      />
                    </div>

                    <button
                      onClick={handleExplainCode}
                      disabled={!codeSnippet.trim() || loadingCode}
                      className="w-full py-2.5 rounded-xl bg-brand-cyan text-slate-900 font-black text-[10px] uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {loadingCode ? 'Analyzing Code...' : 'Deconstruct Snippet'}
                    </button>

                    {/* Code explanation result */}
                    {codeExplanation && (
                      <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 mt-3 space-y-2">
                        <span className="text-[10px] font-black text-brand-cyan uppercase tracking-wider block border-b border-slate-200 dark:border-white/5 pb-1">AI Teacher Breakdown</span>
                        <div className="text-[11px] md:text-xs text-slate-700 dark:text-white/70 leading-relaxed whitespace-pre-wrap">
                          {codeExplanation}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Roadmap Generator */}
              {activeTab === 'roadmap' && (
                <div className="space-y-4 text-left">
                  <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-white/5 pb-2">
                    <Compass size={15} className="text-amber-500 dark:text-amber-400" />
                    Custom Roadmap Generator
                  </h3>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wide block mb-1">Roadmap Title</label>
                        <input
                          type="text"
                          value={roadmapTitle}
                          onChange={(e) => setRoadmapTitle(e.target.value)}
                          placeholder="e.g. C pointers or React state"
                          className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-[10px] text-slate-800 dark:text-white outline-none focus:border-brand-cyan/40"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-wide block mb-1">Target Complexity</label>
                        <select 
                          value={roadmapLevel} 
                          onChange={(e) => setRoadmapLevel(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg p-2 text-[10px] text-slate-800 dark:text-white outline-none focus:border-brand-cyan/40"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateRoadmap}
                      disabled={!roadmapTitle.trim() || loadingRoadmap}
                      className="w-full py-2.5 rounded-xl bg-brand-cyan text-slate-900 font-black text-[10px] uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 animate-pulse cursor-pointer"
                    >
                      {loadingRoadmap ? 'Generating Path...' : 'Generate Roadmap'}
                    </button>

                    {/* Generated roadmap display */}
                    {generatedRoadmap && (
                      <div className="mt-3">
                        <RoadmapVisualizer roadmap={generatedRoadmap} />
                      </div>
                    )}

                    {/* Error message */}
                    {roadmapError && !generatedRoadmap && (
                      <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] flex items-start gap-2">
                        <span className="text-base leading-none">⚠️</span>
                        <span>{roadmapError}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
