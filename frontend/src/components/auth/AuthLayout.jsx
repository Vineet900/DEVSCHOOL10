import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Terminal, Cpu, Globe } from 'lucide-react';
import AppLogo from '../AppLogo';

/**
 * AuthLayout - Split-screen layout for authentication pages
 * LEFT: Branding & Marketing
 * RIGHT: Auth Forms
 */
const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg-page text-slate-900 dark:text-white flex flex-col lg:row overflow-hidden font-sans selection:bg-brand-cyan/30 transition-colors duration-300">
      {/* BACKGROUND DECORATION */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-brand-cyan/5 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-brand-purple/5 blur-[120px]" style={{ animationDuration: '8s' }} />
      </div>

      <div className="flex min-h-screen w-full relative z-10">
        {/* LEFT SIDE: BRANDING & ILLUSTRATION (Hidden on mobile) */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative z-10 border-r border-white/5 bg-white/[0.01] backdrop-blur-3xl"
        >
          <div className="space-y-12">
            {/* Logo & Slogan */}
            <div className="flex items-center gap-4">
              <AppLogo size={48} />
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                  DevSchool <span className="text-brand-cyan">Pro</span>
                </h1>
                <p className="text-[10px] font-black text-white/30 tracking-[0.3em] uppercase">Enterprise Learning Ecosystem</p>
              </div>
            </div>

            {/* Value Propositions */}
            <div className="space-y-8">
              <h2 className="text-5xl font-black text-slate-900 dark:text-white leading-tight">
                Master the <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-cyan via-brand-purple to-brand-pink">Future Architecture.</span>
              </h2>
              <p className="text-white/50 text-lg max-w-md leading-relaxed">
                Join the elite circle of 10x developers. Access production-grade roadmaps, AI-powered mentoring, and institutional-level certifications.
              </p>
            </div>

            {/* Feature List */}
            <div className="grid grid-cols-2 gap-6 max-w-lg">
              <FeatureItem icon={<Terminal size={20} />} title="Real-World Ops" desc="Docker, K8s, CI/CD" color="text-brand-cyan" />
              <FeatureItem icon={<Cpu size={20} />} title="AI Mentorship" desc="24/7 Neural Support" color="text-brand-purple" />
              <FeatureItem icon={<Globe size={20} />} title="Global Network" desc="Elite Dev Community" color="text-brand-pink" />
              <FeatureItem icon={<Sparkles size={20} />} title="Career OS" desc="Job Placement Engine" color="text-white" />
            </div>
          </div>

          {/* Stats Section */}
          <div className="flex items-center gap-12 pt-12 border-t border-white/5">
            <StatBox label="Active Agents" value="42.5K+" />
            <StatBox label="Certifications" value="128K+" />
            <StatBox label="Success Rate" value="98.4%" />
          </div>

          {/* Floating Cyberpunk Glow */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-brand-cyan/10 blur-[100px] rounded-full"></div>
        </motion.div>

        {/* RIGHT SIDE: AUTH FORM */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-20"
        >
          <div className="w-full max-w-md">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const FeatureItem = ({ icon, title, desc, color }) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group cursor-default">
    <div className={`mt-1 ${color}`}>{icon}</div>
    <div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-cyan transition-colors">{title}</h4>
      <p className="text-[10px] text-white/30 font-medium">{desc}</p>
    </div>
  </div>
);

const StatBox = ({ label, value }) => (
  <div>
    <div className="text-xl font-black text-slate-900 dark:text-white">{value}</div>
    <div className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</div>
  </div>
);

export default AuthLayout;
