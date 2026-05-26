import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  Settings as SettingsIcon, 
  Bell, 
  ShieldCheck, 
  KeyRound, 
  Globe, 
  Trash2, 
  ChevronRight,
  ArrowLeft,
  Smartphone,
  Mail,
  Zap,
  CreditCard,
  Moon,
  Eye,
  Lock,
  Share2
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import AppLogo from '../components/AppLogo'
import ProfileSettingsModule from '../components/settings/ProfileSettingsModule'

const SETTINGS_CATEGORIES = [
  { 
    id: 'account', 
    title: 'Account Settings', 
    subtitle: 'Manage your profile and primary account data', 
    icon: User,
    color: 'brand-cyan'
  },
  { 
    id: 'preferences', 
    title: 'Learning Preferences', 
    subtitle: 'Customize theme and language settings', 
    icon: Zap,
    color: 'yellow-400'
  },
  { 
    id: 'learning', 
    title: 'Learning Settings', 
    subtitle: 'Configure daily goals, focus mode, and session durations', 
    icon: SettingsIcon,
    color: 'brand-cyan'
  },
  { 
    id: 'earn', 
    title: 'Study & Earn', 
    subtitle: 'Check your streak, points, and convert XP to SP', 
    icon: CreditCard,
    color: 'brand-purple'
  },
  { 
    id: 'notifications', 
    title: 'Notification Settings', 
    subtitle: 'Control how and when we contact you', 
    icon: Bell,
    color: 'brand-purple'
  },
  { 
    id: 'privacy', 
    title: 'Privacy Settings', 
    subtitle: 'Control your visibility and data sharing', 
    icon: Eye,
    color: 'green-400'
  },
  { 
    id: 'security', 
    title: 'Security & Auth', 
    subtitle: 'Change password and reset options', 
    icon: Lock,
    color: 'red-400'
  },
  { 
    id: 'danger', 
    title: 'Danger Zone', 
    subtitle: 'Permanently delete your account and data', 
    icon: Trash2,
    color: 'red-600',
    tone: 'danger'
  }
]


export default function SettingsPage() {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeTab = searchParams.get('tab')

  if (activeTab) {
    return (
      <div className="min-h-screen bg-bg-page text-slate-900 dark:text-white selection:bg-brand-cyan/30 transition-colors duration-300">
        {/* Background Decor */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-cyan/5 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/5 blur-[120px] rounded-full" />
        </div>

        <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
          <ProfileSettingsModule 
            defaultSectionId={activeTab} 
            showBackButton={true} 
            backFallbackPath="/settings" 
            pageTitle="Settings"
            standalone={true}
          />
        </main>
      </div>
    )
  }

  const user = state.user || {}

  return (
    <div className="min-h-screen bg-bg-page text-slate-900 dark:text-white selection:bg-brand-cyan/30 transition-colors duration-300">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-cyan/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-purple/5 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="flex items-center justify-between mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/profile" className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-4xl font-black">Settings</h1>
            </div>
            <p className="text-slate-500 dark:text-white/40 font-medium ml-14">Configure your interstellar developer environment.</p>
          </div>
          
          <Link to="/profile" className="hidden sm:flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-black text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all group">
             View Account
             <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </header>

        {/* Settings List */}
        <div className="space-y-4">
          {SETTINGS_CATEGORIES.map((cat, i) => {
            const Icon = cat.icon
            const isDanger = cat.tone === 'danger'
            
            return (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/settings?tab=${cat.id}`)}
                className={`w-full text-left glass-card p-6 rounded-[2rem] border-white/5 flex items-center justify-between group relative overflow-hidden transition-all hover:bg-white/[0.04] ${isDanger ? 'hover:border-red-500/30' : 'hover:border-brand-cyan/30'}`}
              >
                {/* Hover Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-${cat.color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    isDanger 
                    ? 'bg-red-500/10 text-red-500' 
                    : `bg-${cat.color}/10 text-${cat.color}`
                  } group-hover:scale-110 shadow-lg`}>
                    <Icon size={28} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-black ${isDanger ? 'text-red-400' : 'text-slate-900 dark:text-white'}`}>{cat.title}</h3>
                    <p className="text-slate-500 dark:text-white/40 text-sm font-medium mt-1">{cat.subtitle}</p>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 dark:text-white/20 group-hover:text-slate-900 dark:group-hover:text-white group-hover:bg-slate-100 dark:group-hover:bg-white/5 transition-all relative z-10">
                  <ChevronRight size={20} />
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Footer info */}
        <footer className="mt-16 text-center space-y-4">
          <div className="flex justify-center gap-8 text-slate-400 dark:text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
             <span>Version 2.4.0</span>
             <span>System Status: Online</span>
             <span>Region: US-East-1</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
