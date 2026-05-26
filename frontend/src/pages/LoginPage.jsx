import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Lock, 
  User, 
  ShieldCheck, 
  ArrowRight, 
  ChevronLeft,
  Sparkles,
  Fingerprint,
  Smartphone,
  Eye,
  EyeOff,
  MessageSquare,
  Code
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { toast } from 'react-hot-toast'
import AuthLayout from '../components/auth/AuthLayout'
import { AuthInput, AuthButton } from '../components/auth/AuthComponents'
import OTPInput from '../components/auth/OTPInput'

export default function LoginPage() {
  const { actions } = useApp()
  const [tab, setTab] = useState('signIn') // 'signIn' or 'signUp'
  const [loginMethod, setLoginMethod] = useState('password') // 'password' or 'otp'
  const [step, setStep] = useState('info') // 'info' or 'verify'
  const [showPassword, setShowPassword] = useState(false)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    name: '',
    phone: '',
    otp: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError(null)
  }

  const onSignIn = async (e) => {
    e.preventDefault()
    if (!formData.email || (loginMethod === 'password' && !formData.password)) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (loginMethod === 'password') {
        const res = await actions.signIn(formData.email, formData.password)
        if (res.error) setError(res.error)
        else toast.success('Access Granted. Welcome back, Agent.')
      } else {
        // OTP Login Logic (Magic Link or similar)
        toast.success('Synchronization code dispatched.')
        setStep('verify')
      }
    } catch (err) {
      setError('Neural link failure. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const onSignUp = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.username) {
      setError('Registration requires email, password, and username')
      return
    }

    setLoading(true)
    setError(null)
    const res = await actions.signUp(formData)
    if (res.error) setError(res.error)
    else {
      if (res.data?.session) {
        toast.success('Identity established. Welcome back, Agent.')
      } else {
        toast.success('Identity established. Verification required.')
        setStep('verify')
      }
    }
    setLoading(false)
  }

  const onVerify = async (e) => {
    e?.preventDefault()
    if (formData.otp.length < 6) return

    setLoading(true)
    setError(null)
    const res = await actions.verifyOTP(formData.email, formData.otp)
    if (res.error) setError(res.error)
    else {
      toast.success('Clearance granted. Identity verified.')
      // Redirect happens via App.jsx
    }
    setLoading(false)
  }

  // Handle Enter key for OTP
  useEffect(() => {
    if (step === 'verify' && formData.otp.length === 6) {
      onVerify()
    }
  }, [formData.otp, step])

  return (
    <AuthLayout>
      <div className="w-full">
        {/* TAB SWITCHER */}
        <div className="flex p-1 bg-white/5 rounded-2xl mb-10 border border-white/5">
          <button 
            onClick={() => { setTab('signIn'); setStep('info'); }} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'signIn' ? 'bg-brand-cyan text-bg-deep shadow-lg shadow-brand-cyan/20' : 'text-slate-500 dark:text-white/40'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setTab('signUp'); setStep('info'); }} 
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'signUp' ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' : 'text-slate-500 dark:text-white/40'}`}
          >
            Join Orbit
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'info' ? (
            <motion.div 
              key={`${tab}-info`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  {tab === 'signIn' ? 'Welcome Back' : 'Establish Identity'}
                </h2>
                <p className="text-white/40 text-sm">
                  {tab === 'signIn' ? 'Secure neural uplink initialized.' : 'Register your credentials in the ecosystem.'}
                </p>
              </div>

              {/* LOGIN METHOD TOGGLE (Only for SignIn) */}
              {tab === 'signIn' && (
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => setLoginMethod('password')}
                    className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${loginMethod === 'password' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-white/20'}`}
                  >
                    Master Key
                  </button>
                  <button 
                    onClick={() => setLoginMethod('otp')}
                    className={`text-[10px] font-bold uppercase tracking-widest pb-1 border-b-2 transition-all ${loginMethod === 'otp' ? 'border-brand-cyan text-brand-cyan' : 'border-transparent text-white/20'}`}
                  >
                    One-Time Link
                  </button>
                </div>
              )}

              <form onSubmit={tab === 'signIn' ? onSignIn : onSignUp} className="space-y-5">
                {tab === 'signUp' && (
                  <div className="grid grid-cols-2 gap-4">
                    <AuthInput 
                      label="Username" 
                      name="username" 
                      placeholder="agent_zero" 
                      icon={<User size={18} />} 
                      value={formData.username} 
                      onChange={handleInputChange} 
                    />
                    <AuthInput 
                      label="Full Name" 
                      name="name" 
                      placeholder="John Wick" 
                      icon={<Fingerprint size={18} />} 
                      value={formData.name} 
                      onChange={handleInputChange} 
                    />
                  </div>
                )}

                <AuthInput 
                  label="Email Address" 
                  name="email" 
                  type="email" 
                  placeholder="agent@devschool.pro" 
                  icon={<Mail size={18} />} 
                  value={formData.email} 
                  onChange={handleInputChange} 
                />

                {tab === 'signUp' && (
                  <AuthInput 
                    label="Phone (Optional)" 
                    name="phone" 
                    placeholder="+1 555 0000" 
                    icon={<Smartphone size={18} />} 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                  />
                )}

                {loginMethod === 'password' && (
                  <div className="relative">
                    <AuthInput 
                      label="Master Password" 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      icon={<Lock size={18} />} 
                      value={formData.password} 
                      onChange={handleInputChange} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-[38px] text-white/20 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-brand-cyan focus:ring-brand-cyan/20 transition-all" />
                    <span className="text-[10px] font-bold text-white/30 group-hover:text-white/50 uppercase tracking-widest transition-colors">Remember Session</span>
                  </label>
                  <button type="button" className="text-[10px] font-bold text-brand-cyan hover:text-brand-purple uppercase tracking-widest transition-colors">Recover Key?</button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3"
                  >
                    <ShieldCheck size={16} /> {error}
                  </motion.div>
                )}

                <AuthButton loading={loading} variant={tab === 'signIn' ? 'primary' : 'secondary'}>
                  {tab === 'signIn' ? 'Initiate Session' : 'Establish Identity'}
                  {!loading && <ArrowRight size={18} />}
                </AuthButton>
              </form>

              {/* SOCIAL LOGINS */}
              <div className="pt-6">
                <div className="relative mb-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                  <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest text-white/20"><span className="bg-bg-page px-4">Secure Neural Links</span></div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <SocialButton onClick={() => actions.signInWithGoogle()} icon={<svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>} />
                  <SocialButton 
                    onClick={() => {}} 
                    icon={
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                      </svg>
                    } 
                  />
                  <SocialButton onClick={() => {}} icon={<MessageSquare size={20} />} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="verify"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-brand-cyan/10 flex items-center justify-center mx-auto mb-6 text-brand-cyan border border-brand-cyan/20 relative">
                  <ShieldCheck size={40} />
                  <div className="absolute inset-0 rounded-full border border-brand-cyan animate-ping opacity-20"></div>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Neural Handshake</h2>
                <p className="text-white/40 text-xs px-8 leading-relaxed">
                  A synchronization code has been transmitted to <span className="text-brand-cyan font-bold">{formData.email}</span>.
                </p>
              </div>

              <div className="space-y-6">
                <OTPInput value={formData.otp} onChange={(val) => setFormData({ ...formData, otp: val })} />
                
                <AuthButton loading={loading} onClick={onVerify}>
                  Finalize Verification
                </AuthButton>

                <div className="text-center space-y-4">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
                    Didn't receive code? <button className="text-brand-cyan hover:text-brand-purple transition-colors ml-1">Resend in 0:59</button>
                  </p>
                  <button 
                    onClick={() => setStep('info')}
                    className="flex items-center justify-center gap-2 text-slate-500 dark:text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-slate-900 dark:hover:text-white mx-auto transition-all"
                  >
                    <ChevronLeft size={14} /> Correct Information
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthLayout>
  )
}

const SocialButton = ({ icon, onClick }) => (
  <button 
    type="button"
    onClick={onClick}
    className="flex items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all active:scale-95 group"
  >
    <div className="group-hover:scale-110 transition-transform">{icon}</div>
  </button>
);
