import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ShieldAlert, Key, Mail, Loader2, AlertCircle } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const cleanBase = apiBase.replace(/\/$/, '')
    const loginUrl = cleanBase.endsWith('/api') ? `${cleanBase}/auth/login` : `${cleanBase}/api/auth/login`
    const meUrl = cleanBase.endsWith('/api') ? `${cleanBase}/auth/me` : `${cleanBase}/api/auth/me`

    try {
      // 1. Authenticate with backend
      const loginRes = await axios.post(loginUrl, { email, password })
      const dataPayload = loginRes.data?.data
      const token = dataPayload?.token || dataPayload?.session?.access_token

      if (!token) {
        throw new Error('Invalid credentials or session mapping failed.')
      }

      // 2. Query profile using token to check role
      const profileRes = await axios.get(meUrl, {
        headers: { Authorization: `Bearer ${token}` }
      })

      const userObj = profileRes.data?.data?.user
      const userRole = userObj?.profile?.role || userObj?.role || profileRes.data?.data?.role || profileRes.data?.data?.profile?.role

      if (userRole !== 'ADMIN') {
        throw new Error('ACCESS DENIED: Insufficient clearance level.')
      }

      // 3. Store valid session token under required local storage key
      localStorage.setItem('sb-localhost-auth-token', JSON.stringify({
        access_token: token,
        user: profileRes.data?.data
      }))

      // Redirect to admin overview
      navigate('/admin')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || err.message || 'Authentication link failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#05060b] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background neon flares */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full filter blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full filter blur-[80px] animate-pulse"></div>

      <div className="w-full max-w-sm cyber-panel-glow p-8 rounded-2xl relative bg-[#0d0f19]/90 backdrop-blur-md">
        {/* Top corner cyber accent */}
        <div className="absolute top-0 right-6 w-10 h-1 bg-cyan-400"></div>

        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-[0_0_15px_rgba(0,240,255,0.2)] mb-3">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-sm font-black tracking-widest text-slate-100 uppercase">DevSchool<span className="text-[#00f0ff]">Pro</span></h2>
          <p className="text-[9px] text-cyan-500/60 font-bold tracking-widest uppercase mt-0.5">Admin Security Console</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[8px] uppercase tracking-widest font-black text-slate-500 mb-1">Authorization Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="admin@devschoolpro.com"
                className="w-full pl-9 pr-3 py-2 cyber-input text-xs font-semibold rounded-lg" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[8px] uppercase tracking-widest font-black text-slate-500 mb-1">Access Keycode</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 cyber-input text-xs font-semibold rounded-lg" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 mt-2 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1.5"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Synchronize Link
          </button>
        </form>
      </div>
    </div>
  )
}
