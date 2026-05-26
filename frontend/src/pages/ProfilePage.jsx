import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Settings, 
  Code2, 
  UserCheck, 
  Share2, 
  Video, 
  Globe, 
  MapPin, 
  ExternalLink, 
  ShieldCheck, 
  ChevronRight,
  Bell,
  Terminal,
  Cpu,
  Workflow,
  Cloud,
  Database,
  Award,
  BookOpen,
  Activity as ActivityIcon,
  Search,
  Plus,
  Coins,
  RefreshCw
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import AppLogo from '../components/AppLogo'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { userAPI, uploadAPI } from '../lib/api'

const TABS = [
  { id: 'about', label: 'About', icon: User },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'progress', label: 'Progress', icon: Workflow },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'certificates', label: 'Certificates', icon: BookOpen },
]

const TECH_STACK = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 
  'Next.js', 'Tailwind CSS', 'PostgreSQL', 'MongoDB', 'AWS'
]

const LEARNING_GOALS = [
  { title: 'Master System Design', progress: 65, color: 'brand-cyan' },
  { title: 'Learn DevOps & Cloud', progress: 42, color: 'brand-purple' },
  { title: 'Contribute to Open Source', progress: 88, color: 'green-400' },
]

export default function ProfilePage() {
  const { state, actions } = useApp()
  const [activeTab, setActiveTab] = useState('about')
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [convertAmount, setConvertAmount] = useState(100)
  const [isConverting, setIsConverting] = useState(false)
  const user = state.user || {}

  const handleConvert = async () => {
    if (state.xp < convertAmount) return
    setIsConverting(true)
    try {
      const res = await actions.convertXPToRP(convertAmount)
      if (res.success) {
        toast.success('Conversion successful!')
        setShowConvertModal(false)
      } else {
        toast.error(res.error || 'Conversion failed')
      }
    } catch (err) {
      toast.error('Conversion failed')
    } finally {
      setIsConverting(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('image', file)
    try {
      const { data } = await uploadAPI.uploadAvatar(formData)
      if (data.success) {
        if (state.user?.loggedIn && state.user?.id) {
          await userAPI.updateProfile({ avatar_url: data.url })
        }
        actions.setProfileAvatar(data.url)
        toast.success('Avatar updated!')
      } else {
        toast.error('Upload failed')
      }
    } catch (err) {
      toast.error('Upload failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg-page text-slate-900 dark:text-white selection:bg-brand-cyan/30 transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-cyan/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-purple/5 blur-[120px] rounded-full animate-pulse-slow" />
      </div>



      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Profile Card */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent opacity-50" />
              
              {/* Avatar Section */}
              <div className="relative inline-block mb-6">
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-cyan animate-spin-slow">
                  <div className="w-full h-full rounded-full bg-bg-deep p-1">
                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-800">
                       <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => document.getElementById('avatar-input').click()}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-brand-cyan text-bg-deep border-4 border-bg-deep flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Plus size={20} />
                </button>
                <input 
                  id="avatar-input" 
                  type="file" 
                  hidden 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                />
              </div>

              <div className="space-y-2 mb-8">
                <div className="flex flex-col items-center gap-1">
                  <h2 className="text-2xl font-black flex items-center justify-center gap-2">
                    {user.name || 'Elite Learner'}
                    <ShieldCheck size={20} className="text-brand-cyan" />
                  </h2>
                  {user.is_premium && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                      Premium Member
                    </span>
                  )}
                </div>
                <p className="text-brand-cyan font-mono text-sm">@{user.username || 'coder_01'}</p>
                {user.bio ? (
                  <p className="text-white/60 text-sm italic font-medium px-4">
                    {user.bio}
                  </p>
                ) : (
                  <div className="px-4 py-2">
                    <p className="text-white/30 text-xs italic">No bio added yet.</p>
                    <Link to="/settings?tab=account" className="text-xs text-brand-cyan hover:underline font-bold mt-1 inline-block">
                      + Add Bio
                    </Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 relative group">
                  <p className="text-[10px] text-white/30 uppercase font-black mb-1">XP Points</p>
                  <p className="text-xl font-black text-brand-cyan">{state.xp || 0}</p>
                  {state.xp >= 100 && (
                    <button 
                      onClick={() => setShowConvertModal(true)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-brand-cyan/10 text-brand-cyan opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-cyan hover:text-bg-deep"
                      title="Convert to SP"
                    >
                      <RefreshCw size={12} />
                    </button>
                  )}
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-white/30 uppercase font-black mb-1">Study Points (SP)</p>
                  <p className="text-xl font-black text-brand-purple">{state.studyPoints || 0}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mb-8 text-left px-2">
                {user.location ? (
                  <div className="flex items-center gap-3 text-sm text-white/40">
                    <MapPin size={16} />
                    <span>{user.location}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-sm text-white/30">
                    <MapPin size={16} className="text-white/20" />
                    <Link to="/settings?tab=account" className="hover:text-brand-cyan hover:underline transition-colors text-xs font-bold">
                      + Add Location
                    </Link>
                  </div>
                )}
                {user.portfolio ? (
                  <div className="flex items-center gap-3 text-brand-cyan">
                    <Globe size={16} />
                    <a href={user.portfolio.startsWith('http') ? user.portfolio : `https://${user.portfolio}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {user.portfolio.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-white/30">
                    <Globe size={16} className="text-white/20" />
                    <Link to="/settings?tab=account" className="hover:text-brand-cyan hover:underline transition-colors text-xs font-bold">
                      + Add Portfolio
                    </Link>
                  </div>
                )}
              </div>

              {/* Socials */}
              <div className="flex justify-center gap-4">
                {[Code2, UserCheck, Share2, Video].map((Icon, i) => (
                  <button key={i} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-brand-cyan hover:bg-brand-cyan/10 border border-white/10 transition-all">
                    <Icon size={18} />
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02]"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
                <Target size={16} /> Learning Goals
              </h3>
              {user.learningGoals && user.learningGoals.filter(Boolean).length > 0 ? (
                <div className="space-y-6">
                  {user.learningGoals.filter(Boolean).map((goal, i) => {
                    const colors = ['brand-cyan', 'brand-purple', 'green-400']
                    const color = colors[i % colors.length]
                    const progresses = [65, 42, 88]
                    const progress = progresses[i % progresses.length]
                    
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-white/80">{goal}</span>
                          <span className={`text-${color}`}>{progress}%</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                            className={`h-full bg-${color} rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-white/30 text-xs font-medium">No learning goals added yet.</p>
                  <Link to="/settings?tab=account" className="text-xs text-brand-cyan hover:underline font-bold mt-2 inline-block">
                    + Set Goals
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 p-2 bg-white/[0.03] border border-white/5 rounded-[2rem] overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all whitespace-nowrap ${
                      active 
                      ? 'bg-brand-cyan text-bg-deep shadow-lg shadow-brand-cyan/20' 
                      : 'text-slate-600 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {activeTab === 'about' && (
                  <div className="space-y-8">
                    {/* Bio Card */}
                    <div className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                      <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                        <Terminal size={24} className="text-brand-cyan" /> About Me
                      </h3>
                      {user.bio ? (
                        <div className="space-y-4 text-white/60 leading-relaxed font-medium">
                          {user.bio.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-white/30 text-sm font-medium">Tell your learning story by adding an 'About Me' description in settings.</p>
                          <Link to="/settings?tab=account" className="mt-4 px-6 py-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 text-brand-cyan font-bold text-xs inline-block hover:bg-brand-cyan/20 transition-all">
                            + Add About Me
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Tech Stack Card */}
                    <div className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
                      <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                        <Code2 size={24} className="text-brand-purple" /> Tech Stack
                      </h3>
                      {user.techStack && user.techStack.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                          {user.techStack.map((tech, i) => (
                            <motion.div
                              key={tech}
                              whileHover={{ y: -5, scale: 1.05 }}
                              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:border-brand-cyan hover:text-brand-cyan transition-colors flex items-center gap-2 group"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan group-hover:animate-ping" />
                              {tech}
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <p className="text-white/30 text-sm font-medium">No technologies added yet.</p>
                          <Link to="/settings?tab=account" className="mt-4 px-6 py-3 rounded-xl bg-brand-purple/10 border border-brand-purple/30 text-brand-purple font-bold text-xs inline-block hover:bg-brand-purple/20 transition-all">
                            + Add Tech Stack
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Stats/Metrics Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                       <MetricBox icon={<Cpu size={24}/>} title="System Design" desc="Architected 12 scalable services" color="brand-cyan" />
                       <MetricBox icon={<Database size={24}/>} title="Data Mastery" desc="Optimized 50+ DB queries" color="brand-purple" />
                    </div>
                  </div>
                )}

                {activeTab !== 'about' && (
                  <div className="glass-card p-20 rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 text-white/20">
                      <BookOpen size={40} />
                    </div>
                    <h3 className="text-xl font-black mb-2 text-white/80">Coming Soon to Your Orbit</h3>
                    <p className="text-white/40 text-sm max-w-xs">We are calibrating this section to show your live interstellar progress.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Conversion Modal */}
      <AnimatePresence>
        {showConvertModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isConverting && setShowConvertModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md glass-card p-10 rounded-[3rem] border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent" />
              
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan mx-auto shadow-lg shadow-brand-cyan/10">
                  <RefreshCw size={40} className={isConverting ? 'animate-spin' : ''} />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-black">Convert XP to SP</h3>
                  <p className="text-white/40 text-sm font-medium">100 XP = 1 Study Point (SP)</p>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-black uppercase tracking-widest text-white/30">Conversion Amount</span>
                    <span className="text-xs font-bold text-brand-cyan">{convertAmount} XP</span>
                  </div>
                  
                  <input 
                    type="range"
                    min="100"
                    max={Math.floor((state.xp || 0) / 100) * 100}
                    step="100"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(Number(e.target.value))}
                    disabled={isConverting}
                    className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-brand-cyan"
                  />

                  <div className="flex items-center justify-center gap-4 text-sm font-black">
                    <span className="text-white/40">{convertAmount} XP</span>
                    <ChevronRight size={16} className="text-brand-cyan" />
                    <span className="text-brand-purple">{convertAmount / 100} SP</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowConvertModal(false)}
                    disabled={isConverting}
                    className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-black hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConvert}
                    disabled={isConverting || state.xp < convertAmount}
                    className="px-6 py-4 rounded-2xl bg-brand-cyan text-bg-deep text-sm font-black hover:shadow-lg hover:shadow-brand-cyan/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isConverting ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      'Convert Now'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MetricBox({ icon, title, desc, color }) {
  return (
    <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.02] group hover:bg-white/[0.05] transition-all">
      <div className={`w-12 h-12 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color} mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.3)]`}>
        {icon}
      </div>
      <h4 className="text-lg font-black mb-2">{title}</h4>
      <p className="text-white/40 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  )
}

function Target({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  )
}
