import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Menu, 
  X, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Layout,
  BookOpen,
  ClipboardCheck,
  Dumbbell,
  Bot
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import AppLogo from './AppLogo'

const navLinks = [
  { to: '/home', label: 'Roadmaps', icon: Layout },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/practice', label: 'Practice', icon: Dumbbell },
  { to: '/quizzes', label: 'Assessments', icon: ClipboardCheck },
  { to: '/tutor', label: 'AI Tutor', icon: Bot },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { state, actions } = useApp()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setIsUserMenuOpen(false)
  }, [location])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'nav-blur py-2' : 'bg-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-cyan/20 blur-lg rounded-lg group-hover:bg-brand-cyan/40 transition-all"></div>
              <AppLogo size={32} className="relative z-10" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-white/70 bg-clip-text text-transparent group-hover:to-brand-cyan transition-all">
              DevSchool <span className="text-brand-cyan">Pro</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-md">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
                  px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2
                  ${isActive 
                    ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                    : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }
                `}
              >
                <link.icon size={16} />
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex relative group">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-brand-cyan transition-colors" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 focus:bg-white/10 transition-all w-32 lg:w-48 text-slate-900 dark:text-white"
              />
            </div>

            <button className="p-2 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-brand-cyan rounded-full border border-bg-deep"></span>
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1 pr-2 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-cyan to-brand-purple flex items-center justify-center text-xs font-bold text-white shadow-lg overflow-hidden">
                  {state.user?.avatar ? (
                    <img src={state.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    (state.user?.name || 'L').slice(0, 1).toUpperCase()
                  )}
                </div>
                <ChevronDown size={14} className={`text-white/40 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 glass-dark rounded-2xl overflow-hidden shadow-2xl z-50 p-1"
                  >
                    <div className="p-3 border-b border-white/5 mb-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{state.user?.name || 'Guest'}</p>
                      <p className="text-xs text-slate-500 dark:text-white/40 truncate">Level {Math.max(1, Math.floor((state.xp || 0) / 120) + 1)} Learner</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                      <User size={16} /> Profile
                    </Link>
                    <Link to="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all">
                      <Settings size={16} /> Settings
                    </Link>
                    <button 
                      onClick={() => actions.logout()}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-bg-deep border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium
                    ${isActive 
                      ? 'bg-brand-cyan/10 text-brand-cyan' 
                      : 'text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/5'
                    }
                  `}
                >
                  <link.icon size={20} />
                  {link.label}
                </NavLink>
              ))}
              <div className="pt-4 border-t border-white/5">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Search anything..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-cyan/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
