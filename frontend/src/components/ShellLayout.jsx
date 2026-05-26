import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import Navbar from './Navbar'

export default function ShellLayout() {
  const location = useLocation()
  const { assessmentMode, dbError } = useApp()

  const isEditorRoute = location.pathname.startsWith('/editor')
  const isChapterRoute = location.pathname.startsWith('/chapter/')

  return (
    <div className="min-h-screen bg-bg-deep text-slate-900 dark:text-white selection:bg-brand-cyan/30 transition-colors duration-300">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-cyan/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-brand-purple/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <Navbar />

      <main className={`relative z-10 pt-20 ${isEditorRoute || isChapterRoute ? 'h-[calc(100vh-80px)] overflow-hidden' : 'min-h-screen'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {/* Database Connection Failure Banner */}
            {dbError && (
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-6">
                <div className="glass-card border-red-500/30 bg-red-500/5 px-8 py-4 rounded-[1.5rem] flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">
                      Database Connection Failure
                    </span>
                  </div>
                  <div className="flex-1 text-right ml-4">
                    <span className="text-xs font-bold text-red-400">
                      {dbError}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Mission Active Banner */}
            {assessmentMode.isActive && (
              <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 mb-6">
                <div className="glass-card border-brand-cyan/30 bg-brand-cyan/5 px-8 py-4 rounded-[1.5rem] flex items-center justify-between shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-ping" />
                    <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.2em]">
                      Live Assessment Protocol
                    </span>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-[10px] text-white/30 uppercase font-black">Time Remaining</p>
                       <p className="text-xl font-mono font-black text-slate-900 dark:text-white">
                          {Math.floor(assessmentMode.timerRemaining / 60).toString().padStart(2, '0')}:{String(assessmentMode.timerRemaining % 60).padStart(2, '0')}
                       </p>
                    </div>
                    {assessmentMode.violations > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] text-red-400 uppercase font-black">Violations</p>
                        <p className="text-xl font-mono font-black text-red-500">-{assessmentMode.deductions} XP</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      {!isEditorRoute && !isChapterRoute && (
        <footer className="relative z-10 py-16 border-t border-white/5 bg-bg-deep/80 backdrop-blur-md transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
              <div className="col-span-1 md:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-md bg-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
                  </div>
                  <span className="text-2xl font-black">DevSchool <span className="text-brand-cyan">Pro</span></span>
                </div>
                <p className="text-white/40 text-sm max-w-sm leading-relaxed">
                  The mission-critical learning platform for the next generation of interstellar developers. 
                  Master the stack, earn clearance, and build the future.
                </p>
              </div>
              
              {['Platform', 'Company'].map(group => (
                <div key={group}>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8">{group}</h4>
                  <ul className="space-y-4">
                    {(group === 'Platform' 
                      ? ['Roadmaps', 'Assessments', 'Sandboxes', 'Certificates']
                      : ['About Mission', 'Intel', 'Careers', 'Terminal']
                    ).map(item => (
                      <li key={item}>
                        <a href="#" className="text-sm text-white/40 hover:text-brand-cyan transition-colors font-medium">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] font-black uppercase tracking-widest text-white/20">
              <p>© 2026 DevSchool Pro Intelligence Agency.</p>
              <div className="flex items-center gap-8">
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Privacy Protocol</a>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">Service Terms</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
