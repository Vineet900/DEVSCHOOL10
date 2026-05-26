import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles, Play, Shield, Zap, Target } from 'lucide-react'

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
      {/* Glow Orbs */}
      <div className="absolute top-[20%] left-[10%] w-64 h-64 bg-brand-cyan/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[20%] right-[10%] w-64 h-64 bg-brand-purple/20 rounded-full blur-[100px] animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan text-xs font-bold mb-6 tracking-wider uppercase">
              <Sparkles size={14} />
              The Future of Learning
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 leading-[1.1]">
              Courses to <br />
              <span className="bg-gradient-to-r from-brand-cyan via-brand-blue to-brand-purple bg-clip-text text-transparent">
                Level Up
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 mb-10 max-w-lg leading-relaxed">
              Step-by-step courses designed to take you from zero to job-ready. Master the modern stack with interactive roadmaps.
            </p>
            
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/courses" className="px-8 py-4 rounded-2xl bg-brand-cyan text-bg-deep font-bold flex items-center gap-2 hover:bg-white transition-all shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)]">
                Start Learning <ArrowRight size={20} />
              </Link>
              <Link to="/home#roadmaps" className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-900 dark:text-white font-bold flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                Explore Roadmaps
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              {[
                { label: 'Courses', value: '50+', icon: Zap, color: 'text-brand-cyan' },
                { label: 'Students', value: '10k+', icon: Shield, color: 'text-brand-purple' },
                { label: 'Projects', value: '100+', icon: Target, color: 'text-brand-blue' },
              ].map((stat, i) => (
                <div key={i}>
                  <div className={`flex items-center gap-2 ${stat.color} mb-2`}>
                    <stat.icon size={18} />
                    <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                  </div>
                  <p className="text-xs font-bold text-white/30 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Visual Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "backOut" }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 p-8 glass-card rounded-[3rem] border-white/10 shadow-2xl bg-mesh">
              {/* Abstract Roadmap Illustration */}
              <div className="aspect-square relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-[80%] h-[80%] border-[1px] border-dashed border-white/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
                  <div className="absolute w-[60%] h-[60%] border-[1px] border-dashed border-brand-cyan/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                </div>

                {/* Nodes */}
                {[
                  { top: '15%', left: '20%', icon: '🚀', color: 'bg-brand-cyan' },
                  { top: '40%', right: '10%', icon: '💻', color: 'bg-brand-purple' },
                  { bottom: '20%', left: '30%', icon: '⚡', color: 'bg-brand-blue' },
                  { center: true, icon: 'Pro', color: 'bg-white' }
                ].map((node, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 0.5 }}
                    className={`absolute ${node.center ? 'w-24 h-24 text-xl' : 'w-16 h-16 text-lg'} rounded-3xl ${node.color} flex items-center justify-center shadow-2xl z-20`}
                    style={node.center ? {} : { top: node.top, left: node.left, right: node.right, bottom: node.bottom }}
                  >
                    <span className={node.center ? 'font-black text-bg-deep' : ''}>{node.icon}</span>
                    <div className={`absolute inset-0 rounded-3xl ${node.color} blur-xl opacity-40`}></div>
                  </motion.div>
                ))}

                {/* Connection lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <path d="M 120 100 Q 200 150 350 200" stroke="white" strokeWidth="2" fill="transparent" strokeDasharray="5,5" />
                  <path d="M 350 200 Q 300 300 150 350" stroke="white" strokeWidth="2" fill="transparent" strokeDasharray="5,5" />
                  <path d="M 150 350 Q 50 250 120 100" stroke="white" strokeWidth="2" fill="transparent" strokeDasharray="5,5" />
                </svg>
              </div>
            </div>

            {/* Floating Tech Icons */}
            {[
              { icon: 'React', color: 'from-brand-cyan', top: '-20px', left: '20%' },
              { icon: 'Node', color: 'from-green-500', bottom: '-10px', right: '15%' },
              { icon: 'Next', color: 'from-white', top: '40%', left: '-30px' }
            ].map((tech, i) => (
              <motion.div
                key={i}
                animate={{ y: [0, 15, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity, delay: i * 0.7 }}
                className={`absolute px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold backdrop-blur-xl z-30 flex items-center gap-2`}
                style={{ top: tech.top, left: tech.left, bottom: tech.bottom, right: tech.right }}
              >
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${tech.color} to-transparent shadow-lg`}></div>
                {tech.icon}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
