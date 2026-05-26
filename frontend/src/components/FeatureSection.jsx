import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Award, 
  Code, 
  TrendingUp, 
  Zap, 
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react'

const features = [
  {
    title: '50+ Premium Courses',
    description: 'Extensive library of deep-dive courses covering the entire modern developer ecosystem.',
    icon: BookOpen,
    color: 'from-blue-500 to-cyan-500',
    delay: 0.1
  },
  {
    title: 'Beginner to Advanced',
    description: 'Curated paths that take you from absolute zero to architectural mastery.',
    icon: Layers,
    color: 'from-purple-500 to-pink-500',
    delay: 0.2
  },
  {
    title: 'Project-based Learning',
    description: 'Build real-world applications and portfolio-worthy projects in every roadmap.',
    icon: Code,
    color: 'from-orange-500 to-amber-500',
    delay: 0.3
  },
  {
    title: 'Verified Certificates',
    description: 'Earn industry-recognized certificates for every path and milestone you complete.',
    icon: Award,
    color: 'from-emerald-500 to-teal-500',
    delay: 0.4
  },
  {
    title: 'Learn & Earn XP',
    description: 'Gamified experience where learning earns you XP, rewards, and leaderboard status.',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    delay: 0.5
  },
  {
    title: 'Career-focused Paths',
    description: 'Job-ready roadmaps designed based on current industry hiring standards.',
    icon: Briefcase,
    color: 'from-indigo-500 to-violet-500',
    delay: 0.6
  }
]

export default function FeatureSection() {
  return (
    <div className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-cyan text-xs font-black uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} />
            Why Choose DevSchool Pro
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6"
          >
            Designed for the <span className="text-brand-cyan">Modern</span> Developer
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/40 max-w-2xl mx-auto text-lg"
          >
            A platform that understands how developers actually learn. Interactive, project-driven, and purely practical.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: feature.delay, duration: 0.5 }}
              whileHover={{ y: -10 }}
              className="glass-card p-8 rounded-[2.5rem] border-white/5 group transition-all relative overflow-hidden"
            >
              {/* Glow background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 shadow-lg shadow-black/20 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500`}>
                <feature.icon size={28} className="text-white" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 group-hover:text-brand-cyan transition-colors">{feature.title}</h3>
              <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
                {feature.description}
              </p>

              {/* Decorative corner element */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.color} opacity-0 blur-3xl group-hover:opacity-20 transition-opacity duration-500`}></div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
    </div>
  )
}
