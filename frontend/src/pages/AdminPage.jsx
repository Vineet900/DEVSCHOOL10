import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Shield, 
  Search, 
  ChevronRight, 
  ArrowLeft,
  LayoutDashboard,
  Wallet,
  Zap,
  RefreshCw,
  Trophy,
  Edit2,
  X,
  Activity,
  ShieldAlert,
  Ban,
  CheckCircle,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Cpu,
  Layers,
  Sparkles,
  FileText,
  Clock
} from 'lucide-react'
import { adminAPI } from '../lib/api'
import { Link } from 'react-router-dom'
import AppLogo from '../components/AppLogo'
import { toast } from 'react-hot-toast'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [health, setHealth] = useState(null)
  const [logs, setLogs] = useState([])
  const [courses, setCourses] = useState([])
  const [redeems, setRedeems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [editForm, setEditForm] = useState({ xp: 0, sp: 0 })
  const [isSaving, setIsSaving] = useState(false)

  // Course CRUD states
  const [editingCourse, setEditingCourse] = useState(null)
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [courseForm, setCourseForm] = useState({ title: '', description: '', slug: '', category: 'Frontend', is_published: true })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes, healthRes, logsRes, coursesRes, redeemsRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getStats(),
        adminAPI.getHealth(),
        adminAPI.getAuditLogs(1),
        adminAPI.getCourses(1),
        adminAPI.getRedeems()
      ])
      
      if (usersRes.data) setUsers(usersRes.data.data || [])
      if (statsRes.data) setStats(statsRes.data.data)
      if (healthRes.data) setHealth(healthRes.data.data)
      if (logsRes.data) setLogs(logsRes.data.data || [])
      if (coursesRes.data) setCourses(coursesRes.data.data || [])
      if (redeemsRes.data) setRedeems(redeemsRes.data.data || [])
    } catch (err) {
      console.error('Failed to sync admin console:', err)
      toast.error('Failed to sync admin data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (user) => {
    setEditingUser(user)
    setEditForm({
      xp: user.profiles?.[0]?.xp || 0,
      sp: user.wallets?.[0]?.balance || 0
    })
  }

  const handleSaveStats = async () => {
    if (!editingUser) return
    setIsSaving(true)
    try {
      const currentXP = editingUser.profiles?.[0]?.xp || 0
      const currentSP = editingUser.wallets?.[0]?.balance || 0
      if (editForm.sp !== currentSP) {
        await adminAPI.adjustPoints(editingUser.id, editForm.sp - currentSP, 'Admin Adjustment')
      }
      await adminAPI.manageUser(editingUser.id, { xp: editForm.xp })
      toast.success('User metrics synchronized')
      fetchData()
      setEditingUser(null)
    } catch (err) {
      toast.error('Sync failed')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleBan = async (user) => {
    const isBanned = user.profiles?.[0]?.is_verified === false
    try {
      await adminAPI.banUser(user.id, !isBanned)
      toast.success(isBanned ? 'User unbanned' : 'User banned')
      fetchData()
    } catch (err) {
      toast.error('Action failed')
    }
  }

  // Course management logic
  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.slug) {
      toast.error('Title and Slug are required!')
      return
    }
    setIsSaving(true)
    try {
      await adminAPI.createCourse(courseForm)
      toast.success('Course created successfully! 📦')
      setCourseForm({ title: '', description: '', slug: '', category: 'Frontend', is_published: true })
      setIsCreatingCourse(false)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateCourse = async () => {
    if (!editingCourse) return
    setIsSaving(true)
    try {
      await adminAPI.updateCourse(editingCourse.id, courseForm)
      toast.success('Course updated successfully! 📝')
      setEditingCourse(null)
      setCourseForm({ title: '', description: '', slug: '', category: 'Frontend', is_published: true })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update course')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteCourse = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this course? This will remove all nested sections and lessons!')) return
    try {
      await adminAPI.deleteCourse(id)
      toast.success('Course deleted')
      fetchData()
    } catch (err) {
      toast.error('Failed to delete course')
    }
  }

  const handleStartEditCourse = (course) => {
    setEditingCourse(course)
    setCourseForm({
      title: course.title || '',
      description: course.description || '',
      slug: course.slug || '',
      category: course.category || 'Frontend',
      is_published: course.is_published ?? true
    })
  }

  // Shop Redeem Requests processing
  const handleProcessRedeem = async (id, status) => {
    try {
      await adminAPI.updateRedeem(id, status)
      toast.success(`Redemption request ${status.toLowerCase()}!`)
      fetchData()
    } catch (err) {
      toast.error('Failed to update redeem status')
    }
  }

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.profiles?.[0]?.username?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredLogs = logs.filter(l =>
    l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.details?.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(l.target_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-brand-cyan/30 flex">
      {/* Sidebar navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl z-50 hidden lg:block">
        <div className="p-8"><AppLogo size={32} /></div>
        <nav className="px-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="Overview" active={activeTab === 'Overview'} onClick={() => { setActiveTab('Overview'); setSearchTerm(''); }} />
          <NavItem icon={Users} label="Users" active={activeTab === 'Users'} onClick={() => { setActiveTab('Users'); setSearchTerm(''); }} />
          <NavItem icon={Layers} label="Courses" active={activeTab === 'Courses'} onClick={() => { setActiveTab('Courses'); setSearchTerm(''); }} />
          <NavItem icon={Trophy} label="Redeems" active={activeTab === 'Redeems'} onClick={() => { setActiveTab('Redeems'); setSearchTerm(''); }} />
          <NavItem icon={ShieldAlert} label="Security" active={activeTab === 'Security'} onClick={() => { setActiveTab('Security'); setSearchTerm(''); }} />
          <NavItem icon={Activity} label="System Health" active={activeTab === 'Health'} onClick={() => { setActiveTab('Health'); setSearchTerm(''); }} />
        </nav>
        <div className="absolute bottom-8 left-8 right-8">
          <Link to="/home" className="flex items-center gap-2 text-white/40 hover:text-white transition-all text-sm font-bold">
            <ArrowLeft size={16} /> Exit to Platform
          </Link>
        </div>
      </aside>

      {/* Main console area */}
      <main className="lg:ml-64 flex-1 p-8 lg:p-12 min-h-screen overflow-x-hidden">
        {/* Glow behind title */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-cyan/5 blur-[120px] pointer-events-none"></div>

        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <span className="text-[10px] font-black text-brand-cyan uppercase tracking-[0.3em] flex items-center gap-1.5 mb-2">
              <Shield size={14} /> Systems Override Active
            </span>
            <h1 className="text-4xl font-black tracking-tight">Admin HQ / {activeTab}</h1>
            <p className="text-white/40 font-medium">Interstellar command console and core metrics.</p>
          </div>
          <div className="flex items-center gap-4">
             {(activeTab === 'Users' || activeTab === 'Security' || activeTab === 'Courses') && (
               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                  <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeTab.toLowerCase()}...`} 
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:border-brand-cyan outline-none transition-all w-full md:w-64"
                  />
               </div>
             )}
             
             {activeTab === 'Courses' && (
               <button 
                 onClick={() => { setIsCreatingCourse(true); setCourseForm({ title: '', description: '', slug: '', category: 'Frontend', is_published: true }); }}
                 className="px-5 py-3 rounded-2xl bg-brand-cyan text-bg-deep font-black hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all flex items-center gap-2 cursor-pointer text-sm"
               >
                 <Plus size={18} /> New Course
               </button>
             )}

             <button onClick={fetchData} className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
             </button>
          </div>
        </header>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           <StatBox title="Platform Users" value={stats?.totalUsers || 0} icon={<Users/>} color="brand-cyan" trend="+12% this week" />
           <StatBox title="Total Lessons" value={stats?.totalLessons || 0} icon={<Zap/>} color="yellow-400" trend="Active" />
           <StatBox title="CPU Averages" value={`${health?.cpu ? Math.round(health.cpu[0] * 100) / 100 : '0.05'} load`} icon={<Activity/>} color="brand-purple" trend="Stable" />
           <StatBox title="System Uptime" value={`${health?.uptime ? Math.round(health.uptime / 3600) : '0'} hrs`} icon={<Shield/>} color="green-400" trend="99.9% SLA" />
        </div>

        {/* Active Tab rendering */}
        <AnimatePresence mode="wait">
          {activeTab === 'Overview' && (
            <motion.div key="Overview" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              {/* Alert for Pending redeems */}
              {redeems.filter(r => r.status === 'PENDING').length > 0 && (
                <div className="bg-brand-purple/10 border border-brand-purple/20 rounded-3xl p-6 flex items-center justify-between shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-brand-purple/10 text-brand-purple shrink-0">
                      <Trophy size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Pending Redemption Requests</h4>
                      <p className="text-xs text-white/50">There are {redeems.filter(r => r.status === 'PENDING').length} learners waiting to claim shop rewards.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('Redeems')} className="px-4 py-2 rounded-xl bg-brand-purple text-white text-xs font-black uppercase tracking-wider hover:shadow-lg transition-all cursor-pointer">
                    Manage
                  </button>
                </div>
              )}

              {/* Uptime widgets */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Health Overview */}
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01]">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Cpu className="text-brand-cyan" size={20} /> Interstellar Telemetry</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-white/50 font-semibold">
                      <span>Node Engine</span>
                      <span className="text-emerald-400 flex items-center gap-1.5"><CheckCircle size={12} /> Status Healthy</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/50 font-semibold">
                      <span>Uptime Uuid</span>
                      <span className="font-mono text-brand-cyan">UP: {health?.uptime ? `${Math.round(health.uptime / 3600)}h ${Math.round((health.uptime % 3600) / 60)}m` : 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/50 font-semibold">
                      <span>Memory RSS</span>
                      <span className="font-mono text-brand-purple">{health?.memory ? `${Math.round(health.memory.rss / (1024 * 1024))} MB` : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Database state */}
                <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01]">
                  <h3 className="text-lg font-black mb-6 flex items-center gap-2"><Shield size={20} className="text-brand-purple" /> Database Aggregations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-white/50 font-semibold">
                      <span>User Completions</span>
                      <span className="font-bold text-brand-cyan">{stats?.totalCompletions || 0} chapters complete</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/50 font-semibold">
                      <span>Pending Redeems</span>
                      <span className="font-bold text-brand-purple">{redeems.filter(r => r.status === 'PENDING').length} requests</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Short User list */}
              <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden bg-white/[0.01]">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-lg font-black">Interstellar Learners Overview</h3>
                  <button onClick={() => setActiveTab('Users')} className="text-brand-cyan hover:underline text-xs font-black uppercase tracking-wider flex items-center gap-1">
                    View All <ChevronRight size={16} />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">Identity</th>
                        <th className="px-8 py-6">Authority</th>
                        <th className="px-8 py-6">Telemetry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.slice(0, 5).map((user) => (
                        <tr key={user.id} className="group hover:bg-white/[0.02] transition-all">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden border border-white/10">
                                <img src={user.profiles?.[0]?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-white">{user.profiles?.[0]?.username || 'Anonymous'}</p>
                                <p className="text-xs text-white/30">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-6">
                               <div><p className="text-[10px] text-white/20 uppercase font-black">XP</p><p className="text-xs font-bold text-brand-cyan">{user.profiles?.[0]?.xp || 0}</p></div>
                               <div><p className="text-[10px] text-white/20 uppercase font-black">SP</p><p className="text-xs font-bold text-brand-purple">{user.wallets?.[0]?.balance || 0}</p></div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Users' && (
            <motion.div key="Users" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden bg-white/[0.01]">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-black">Registered Learners</h2>
                  <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">{filteredUsers.length} total</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">Identity</th>
                        <th className="px-8 py-6">Authority</th>
                        <th className="px-8 py-6">Telemetry</th>
                        <th className="px-8 py-6 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.map((user) => {
                        const isBanned = user.profiles?.[0]?.is_verified === false
                        return (
                          <tr key={user.id} className="group hover:bg-white/[0.02] transition-all">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 overflow-hidden border border-white/10">
                                  <img src={user.profiles?.[0]?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="" />
                                </div>
                                <div>
                                  <p className={`font-bold text-sm ${isBanned ? 'text-red-400 line-through' : 'text-white'}`}>{user.profiles?.[0]?.username || 'Anonymous'}</p>
                                  <p className="text-xs text-white/30">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-cyan/10 text-brand-cyan'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-6">
                                 <div><p className="text-[10px] text-white/20 uppercase font-black">XP</p><p className="text-xs font-bold text-brand-cyan">{user.profiles?.[0]?.xp || 0}</p></div>
                                 <div><p className="text-[10px] text-white/20 uppercase font-black">SP</p><p className="text-xs font-bold text-brand-purple">{user.wallets?.[0]?.balance || 0}</p></div>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right space-x-2">
                              <button onClick={() => handleEditClick(user)} className="p-2 text-white/20 hover:text-brand-cyan transition-all cursor-pointer"><Edit2 size={18}/></button>
                              <button onClick={() => handleToggleBan(user)} className={`p-2 transition-all cursor-pointer ${isBanned ? 'text-green-500 hover:text-green-400' : 'text-red-500/20 hover:text-red-500'}`}>
                                 {isBanned ? <CheckCircle size={18}/> : <Ban size={18}/>}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Security' && (
            <motion.div key="Security" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden bg-white/[0.01]">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-black">Audit Trail Logs</h2>
                  <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">{filteredLogs.length} entries</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">Action</th>
                        <th className="px-8 py-6">Admin ID</th>
                        <th className="px-8 py-6">Target ID</th>
                        <th className="px-8 py-6">Details</th>
                        <th className="px-8 py-6">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-all font-mono text-xs">
                          <td className="px-8 py-5">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              log.action?.includes('BAN') ? 'bg-red-500/10 text-red-400' :
                              log.action?.includes('REFILL') ? 'bg-blue-500/10 text-blue-400' :
                              log.action?.includes('REDEEM_APPROVED') ? 'bg-green-500/10 text-green-400' :
                              'bg-white/5 text-white/60'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-white/40 truncate max-w-[120px]">{log.admin_id}</td>
                          <td className="px-8 py-5 text-brand-cyan truncate max-w-[120px]">{log.target_id || '-'}</td>
                          <td className="px-8 py-5 text-white/70 max-w-[200px] truncate">{JSON.stringify(log.details || {})}</td>
                          <td className="px-8 py-5 text-white/30 flex items-center gap-1"><Clock size={12} /> {new Date(log.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-white/20 font-bold">No audit entries found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Health' && (
            <motion.div key="Health" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* CPU widgets */}
                <div className="glass-card p-8 rounded-[2rem] border-white/5 bg-white/[0.01]">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">CPU load (1 min avg)</h4>
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-5xl font-black text-brand-cyan">{health?.cpu ? Math.round(health.cpu[0] * 100) / 100 : '0.02'}</span>
                    <span className="text-xs text-white/40 font-bold mb-1">load</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-cyan" style={{ width: `${Math.min(100, (health?.cpu?.[0] || 0.05) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] border-white/5 bg-white/[0.01]">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">CPU load (5 min avg)</h4>
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-5xl font-black text-brand-purple">{health?.cpu ? Math.round(health.cpu[1] * 100) / 100 : '0.04'}</span>
                    <span className="text-xs text-white/40 font-bold mb-1">load</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-purple" style={{ width: `${Math.min(100, (health?.cpu?.[1] || 0.05) * 100)}%` }}></div>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[2rem] border-white/5 bg-white/[0.01]">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">System Memory Footprint</h4>
                  <div className="flex items-end gap-3 mb-6">
                    <span className="text-5xl font-black text-emerald-400">{health?.memory ? Math.round(health.memory.rss / (1024 * 1024)) : '142'}</span>
                    <span className="text-xs text-white/40 font-bold mb-1">MB RSS</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, ((health?.memory?.rss || 142000000) / 1000000000) * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Memory heaps deep dive */}
              <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01]">
                <h3 className="text-lg font-black mb-6">Process Heap Metrics</h3>
                {health?.memory ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-white/40 mb-2 font-bold">
                          <span>Heap Total</span>
                          <span>{Math.round(health.memory.heapTotal / (1024 * 1024))} MB</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-cyan" style={{ width: '80%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-white/40 mb-2 font-bold">
                          <span>Heap Used</span>
                          <span>{Math.round(health.memory.heapUsed / (1024 * 1024))} MB</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-purple" style={{ width: `${(health.memory.heapUsed / health.memory.heapTotal) * 100}%` }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 font-mono text-xs text-white/50">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>External Allocations:</span>
                        <span className="text-white font-bold">{Math.round(health.memory.external / (1024 * 1024))} MB</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>ArrayBuffers Memory:</span>
                        <span className="text-white font-bold">{Math.round((health.memory.arrayBuffers || 0) / (1024 * 1024))} MB</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/20 font-bold">Memory heaps metadata not fetched.</p>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'Courses' && (
            <motion.div key="Courses" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <div key={course.id} className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-white/[0.01] hover:bg-white/[0.02] flex flex-col justify-between group relative overflow-hidden transition-all shadow-md">
                    {/* Background glow hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <div className="relative z-10 space-y-4">
                      <span className="px-3 py-1 rounded-full bg-brand-cyan/10 text-brand-cyan text-[9px] font-black uppercase tracking-wider border border-brand-cyan/20">
                        {course.category}
                      </span>
                      <h3 className="text-2xl font-black truncate text-white">{course.title}</h3>
                      <p className="text-sm text-white/50 line-clamp-3 leading-relaxed">{course.description || 'Master learning paths.'}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-8 pt-4 border-t border-white/5">
                      <span className="text-xs font-bold text-white/30">{course.is_published ? '🟢 Published' : '🔴 Draft'}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleStartEditCourse(course)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:text-brand-cyan text-white/60 transition-all cursor-pointer">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-500 text-white/60 transition-all cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredCourses.length === 0 && (
                  <div className="col-span-full text-center py-20 text-white/20 font-bold border border-dashed border-white/10 rounded-[2.5rem]">
                    No courses available in this module view.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'Redeems' && (
            <motion.div key="Redeems" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              <div className="glass-card rounded-[2.5rem] border-white/5 overflow-hidden bg-white/[0.01]">
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <h2 className="text-xl font-black">Learner Reward Redeems</h2>
                  <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest">{redeems.length} requests</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <th className="px-8 py-6">User Email</th>
                        <th className="px-8 py-6">Reward Title</th>
                        <th className="px-8 py-6">SP Cost</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-8 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {redeems.map((redeem) => (
                        <tr key={redeem.id} className="hover:bg-white/[0.02] transition-all">
                          <td className="px-8 py-5">
                            <div>
                              <p className="font-bold text-sm text-white">{redeem.user_email || 'Anonymous Learner'}</p>
                              <p className="text-[10px] text-white/30 font-mono truncate max-w-[150px]">{redeem.user_id}</p>
                            </div>
                          </td>
                          <td className="px-8 py-5 font-bold text-sm text-white">{redeem.reward_title || 'Interstellar merch'}</td>
                          <td className="px-8 py-5 font-mono text-sm text-brand-purple">{redeem.sp_cost || 0} SP</td>
                          <td className="px-8 py-5">
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              redeem.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                              redeem.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400' :
                              'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {redeem.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right">
                            {redeem.status === 'PENDING' ? (
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => handleProcessRedeem(redeem.id, 'APPROVED')} className="p-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all cursor-pointer">
                                  <Check size={16} />
                                </button>
                                <button onClick={() => handleProcessRedeem(redeem.id, 'REJECTED')} className="p-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all cursor-pointer">
                                  <X size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-white/20 font-semibold select-none">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {redeems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-white/20 font-bold">No shop claims pending</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div onClick={() => !isSaving && setEditingUser(null)} className="absolute inset-0 bg-black/85 backdrop-blur-xl" />
           <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-md glass-card p-10 rounded-[3rem] border-white/10 bg-[#0a0f1e] z-10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-2xl font-black">Override Metrics</h3>
                 <button onClick={() => setEditingUser(null)} className="cursor-pointer"><X size={24}/></button>
              </div>
              <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">XP (Points)</label><input type="number" value={editForm.xp} onChange={e => setEditForm({...editForm, xp: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-brand-cyan text-white font-bold"/></div>
                    <div><label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">SP (Shop Points)</label><input type="number" value={editForm.sp} onChange={e => setEditForm({...editForm, sp: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-brand-purple text-white font-bold"/></div>
                 </div>
                 <button onClick={handleSaveStats} disabled={isSaving} className="w-full py-4 rounded-2xl bg-brand-cyan text-bg-deep font-black hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs">
                    {isSaving ? <RefreshCw className="animate-spin"/> : 'Commit Overrides'}
                 </button>
              </div>
           </motion.div>
        </div>
      )}

      {/* Create / Edit Course Modal */}
      {(isCreatingCourse || editingCourse) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
           <div onClick={() => !isSaving && (isCreatingCourse ? setIsCreatingCourse(false) : setEditingCourse(null))} className="absolute inset-0 bg-black/85 backdrop-blur-xl" />
           <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative w-full max-w-lg glass-card p-10 rounded-[3rem] border-white/10 bg-[#0a0f1e] z-10 shadow-2xl space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <h3 className="text-2xl font-black">{isCreatingCourse ? 'New Learning Course' : 'Modify Course'}</h3>
                 <button onClick={() => { isCreatingCourse ? setIsCreatingCourse(false) : setEditingCourse(null) }} className="cursor-pointer"><X size={24}/></button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Course Title</label>
                    <input 
                      value={courseForm.title} 
                      onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} 
                      placeholder="e.g. Next.js Master"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-brand-cyan text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Unique Slug</label>
                    <input 
                      value={courseForm.slug} 
                      onChange={e => setCourseForm({ ...courseForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} 
                      placeholder="e.g. nextjs-master"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-brand-cyan text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Category</label>
                  <select 
                    value={courseForm.category}
                    onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-brand-cyan text-white text-sm appearance-none"
                  >
                    <option value="Frontend" className="bg-[#0a0f1e]">Frontend</option>
                    <option value="Backend" className="bg-[#0a0f1e]">Backend</option>
                    <option value="DevOps" className="bg-[#0a0f1e]">DevOps</option>
                    <option value="CS Fundamentals" className="bg-[#0a0f1e]">CS Fundamentals</option>
                    <option value="AI & Data" className="bg-[#0a0f1e]">AI & Data</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Course Description</label>
                  <textarea 
                    value={courseForm.description} 
                    onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} 
                    placeholder="Short course brief summary..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-brand-cyan text-white text-sm resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    id="is_published"
                    checked={courseForm.is_published}
                    onChange={e => setCourseForm({ ...courseForm, is_published: e.target.checked })}
                    className="w-5 h-5 rounded-md border-white/10 bg-white/5 text-brand-cyan accent-brand-cyan"
                  />
                  <label htmlFor="is_published" className="text-xs text-white/70 font-semibold cursor-pointer">Publish Course to Roadmap Catalog</label>
                </div>

                <button 
                  onClick={isCreatingCourse ? handleCreateCourse : handleUpdateCourse} 
                  disabled={isSaving} 
                  className="w-full py-4 rounded-2xl bg-brand-cyan text-bg-deep font-black hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-xs"
                >
                  {isSaving ? <RefreshCw className="animate-spin"/> : isCreatingCourse ? 'Create Module' : 'Save Changes'}
                </button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  )
}

function NavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-black text-sm transition-all cursor-pointer ${active ? 'bg-brand-cyan/10 text-brand-cyan' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
      <Icon size={20} /> {label}
    </button>
  )
}

function StatBox({ title, value, icon, color, trend }) {
  return (
    <div className="glass-card p-8 rounded-[2rem] border border-white/5 bg-white/[0.01] group hover:bg-white/[0.03] transition-all relative overflow-hidden">
      <div className={`w-12 h-12 rounded-2xl bg-${color}/10 flex items-center justify-center text-${color} mb-6 group-hover:rotate-6 transition-transform shadow-inner`}>{icon}</div>
      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black mb-2">{value}</p>
      <p className={`text-[10px] font-bold text-white/20`}>{trend}</p>
    </div>
  )
}
