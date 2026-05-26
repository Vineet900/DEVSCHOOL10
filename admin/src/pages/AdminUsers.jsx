import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  Ban, 
  ShieldAlert, 
  Star, 
  Coins, 
  Loader2, 
  X, 
  Trash2, 
  UserCheck, 
  RefreshCw, 
  Award,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react'
import { usersService, pointsService } from '../services/services'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)
  
  // Modals state
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false)
  const [pointsAmount, setPointsAmount] = useState(100)
  const [pointsReason, setPointsReason] = useState('Reward for active contribution')
  
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: usersService.getUsers
  })

  const banMutation = useMutation({
    mutationFn: ({ id, banned }) => usersService.banUser(id, banned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      if (selectedUser) {
        setSelectedUser(prev => ({ ...prev, is_banned: !prev.is_banned }))
      }
    }
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ id, updates }) => usersService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      setSelectedUser(null)
    }
  })

  const adjustPointsMutation = useMutation({
    mutationFn: (payload) => pointsService.adjustPoints(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] })
      setIsPointsModalOpen(false)
      setSelectedUser(null)
    }
  })

  const users = response?.data || []

  // Filter users logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.username || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'BANNED' && u.is_banned) || 
                          (statusFilter === 'ACTIVE' && !u.is_banned) ||
                          (statusFilter === 'PREMIUM' && u.is_premium);

    return matchesSearch && matchesRole && matchesStatus;
  })

  const handleBanToggle = (user) => {
    if (window.confirm(`Are you sure you want to ${user.is_banned ? 'Unban' : 'Ban'} user "${user.username}"?`)) {
      banMutation.mutate({ id: user.id, banned: !user.is_banned })
    }
  }

  const handleRoleChange = (user, newRole) => {
    if (window.confirm(`Change role of "${user.username}" to ${newRole}?`)) {
      updateUserMutation.mutate({ id: user.id, updates: { role: newRole } })
    }
  }

  const handleResetProgress = (user) => {
    if (window.confirm(`WARNING: Reset all progress stats for "${user.username}" to 0? This cannot be undone.`)) {
      updateUserMutation.mutate({ 
        id: user.id, 
        updates: { 
          progress: {}, 
          xp: 0, 
          level: 1, 
          study_hours: 0, 
          study_time_minutes: 0,
          streak: 0
        } 
      })
    }
  }

  const handleTogglePremium = (user) => {
    updateUserMutation.mutate({ id: user.id, updates: { is_premium: !user.is_premium } })
  }

  const handleAdjustPointsSubmit = (e) => {
    e.preventDefault()
    adjustPointsMutation.mutate({
      userId: selectedUser.user_id || selectedUser.id, // using foreign key to auth.users if profiles has user_id
      amount: Number(pointsAmount),
      reason: pointsReason,
      type: Number(pointsAmount) >= 0 ? 'CREDIT' : 'DEBIT'
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="border-b border-cyan-500/10 pb-5">
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="text-[#00f0ff]" size={24} /> User Account Control
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Inspect credentials, moderate levels, adjust rewards, and ban players</p>
      </header>

      {/* Filter Toolbar */}
      <div className="cyber-panel p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="SEARCH ACCESS CODES OR NAMES..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg cyber-input text-xs tracking-widest uppercase font-bold" 
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select 
            value={roleFilter} 
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-[#080912] border border-cyan-500/20 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-350 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">ALL ROLES</option>
            <option value="STUDENT">STUDENT</option>
            <option value="INSTRUCTOR">INSTRUCTOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          {/* Status Filter */}
          <select 
            value={statusFilter} 
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#080912] border border-cyan-500/20 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-350 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">ALL STATUSES</option>
            <option value="ACTIVE">ACTIVE ONLY</option>
            <option value="BANNED">BANNED ONLY</option>
            <option value="PREMIUM">PREMIUM ONLY</option>
          </select>
        </div>
      </div>

      {/* Main Grid: list + profile details split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left/Center: Users List Table */}
        <div className="xl:col-span-2 cyber-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap cyber-table">
              <thead>
                <tr>
                  <th className="px-6 py-4">User Ident</th>
                  <th className="px-6 py-4">Security Clearence</th>
                  <th className="px-6 py-4">XP Points</th>
                  <th className="px-6 py-4">Study Points</th>
                  <th className="px-6 py-4">Streak</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" size={24} />
                      <p className="tracking-widest uppercase font-bold text-[10px]">Accessing Database Records...</p>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                      No Records Registered
                    </td>
                  </tr>
                ) : filteredUsers.map(user => (
                  <tr 
                    key={user.id} 
                    onClick={() => setSelectedUser(user)}
                    className={`cursor-pointer transition-colors ${selectedUser?.id === user.id ? 'bg-cyan-500/5 border-l-2 border-cyan-500' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm uppercase">
                          {(user.username || 'U').charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                            {user.username}
                            {user.is_premium && <Sparkles size={12} className="text-[#00f0ff]" />}
                          </div>
                          <div className="text-[10px] text-slate-500 lowercase">{user.full_name || 'No Name Set'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        user.role === 'ADMIN' ? 'cyber-badge-purple' : 
                        user.role === 'INSTRUCTOR' ? 'cyber-badge-blue' : 
                        'bg-slate-800/50 border border-slate-700 text-slate-400'
                      }`}>
                        {user.role || 'STUDENT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-300">{(user.xp || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 font-black text-cyan-400">{(user.study_points || 0).toLocaleString()} SP</td>
                    <td className="px-6 py-4 text-slate-400 font-semibold">{user.streak || 0} Days</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                        !user.is_banned ? 'cyber-badge-green' : 'cyber-badge-red'
                      }`}>
                        {user.is_banned ? 'BANNED' : 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel: Detail Card View */}
        <div className="cyber-panel p-6 rounded-2xl flex flex-col justify-between relative">
          <div className="absolute top-0 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/30"></div>
          {selectedUser ? (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="text-center pb-4 border-b border-cyan-500/10">
                <div className="w-16 h-16 rounded-full bg-cyan-500/5 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 font-black text-2xl uppercase mx-auto shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  {(selectedUser.username || 'U').charAt(0)}
                </div>
                <h3 className="text-base font-black text-slate-100 uppercase tracking-widest mt-3 flex items-center justify-center gap-1.5">
                  {selectedUser.username}
                  {selectedUser.is_premium && <Sparkles size={14} className="text-[#00f0ff] animate-pulse" />}
                </h3>
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Player Card ID: {selectedUser.id.substring(0, 8)}...</span>
              </div>

              {/* Stats Lists */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#080912] p-3 rounded-lg border border-cyan-500/5">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">Study Time</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block flex items-center gap-1">
                    <Clock size={12} className="text-cyan-400" />
                    {selectedUser.study_hours || 0} Hrs
                  </span>
                </div>
                <div className="bg-[#080912] p-3 rounded-lg border border-cyan-500/5">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">Streak</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block flex items-center gap-1">
                    <Calendar size={12} className="text-cyan-400" />
                    {selectedUser.streak || 0} Days
                  </span>
                </div>
                <div className="bg-[#080912] p-3 rounded-lg border border-cyan-500/5">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">Rank Level</span>
                  <span className="text-xs font-bold text-slate-200 mt-1 block flex items-center gap-1">
                    <Award size={12} className="text-cyan-400" />
                    LVL {selectedUser.level || 1}
                  </span>
                </div>
                <div className="bg-[#080912] p-3 rounded-lg border border-cyan-500/5">
                  <span className="text-[8px] uppercase tracking-widest text-slate-500 block font-bold">Last Activity</span>
                  <span className="text-[10px] font-bold text-slate-350 mt-1 block">
                    {selectedUser.last_active_date || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Moderation Controls Area */}
              <div className="space-y-2 border-t border-cyan-500/10 pt-4">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500">Security Override Operations</h4>
                
                {/* Adjust Points Button */}
                <button 
                  onClick={() => setIsPointsModalOpen(true)}
                  className="w-full py-2 cyber-btn rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                >
                  <Coins size={12} /> Award / Deduct Study Points
                </button>

                {/* Reset Progress Button */}
                <button 
                  onClick={() => handleResetProgress(selectedUser)}
                  className="w-full py-2 bg-slate-800/40 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                >
                  <RefreshCw size={12} /> Reset Course Progress
                </button>

                {/* Toggle Premium Access */}
                <button 
                  onClick={() => handleTogglePremium(selectedUser)}
                  className="w-full py-2 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-cyan-400/25 hover:from-blue-600/50 hover:to-purple-600/50 text-[#00f0ff] rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2"
                >
                  <Sparkles size={12} /> {selectedUser.is_premium ? 'Revoke Premium Access' : 'Activate Premium Manually'}
                </button>

                {/* Role Adjust Selector */}
                <div className="flex gap-2 items-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Change Role:</span>
                  {['STUDENT', 'INSTRUCTOR', 'ADMIN'].map((rl) => (
                    <button
                      key={rl}
                      onClick={() => handleRoleChange(selectedUser, rl)}
                      className={`px-2 py-1 rounded text-[8px] font-bold uppercase border ${
                        selectedUser.role === rl 
                          ? 'border-cyan-500 bg-cyan-500/10 text-[#00f0ff]' 
                          : 'border-slate-800 hover:border-slate-600 text-slate-450'
                      }`}
                    >
                      {rl.replace('STUDENT', 'USER')}
                    </button>
                  ))}
                </div>

                {/* Ban/Unban Button */}
                <button 
                  onClick={() => handleBanToggle(selectedUser)}
                  disabled={banMutation.isPending}
                  className={`w-full py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 border transition-all ${
                    selectedUser.is_banned
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950'
                      : 'bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500 hover:text-[#fff]'
                  }`}
                >
                  {banMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                  {selectedUser.is_banned ? 'Revoke Ban (Unban Player)' : 'Access Denied (Ban User)'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <ShieldAlert className="text-slate-700 animate-pulse mb-3" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">Select Player Profile to Inspect</p>
            </div>
          )}
        </div>
      </div>

      {/* Adjust Points Modal */}
      {isPointsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="cyber-panel-glow p-6 rounded-2xl w-full max-w-sm relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
                <Coins size={16} /> Points Modification
              </h3>
              <button onClick={() => setIsPointsModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAdjustPointsSubmit} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Target Account</label>
                <input 
                  type="text" 
                  value={selectedUser.username} 
                  disabled 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg cursor-not-allowed uppercase" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Adjustment Amount (positive or negative)</label>
                <input 
                  type="number" 
                  value={pointsAmount} 
                  onChange={e => setPointsAmount(e.target.value)}
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Override Description</label>
                <textarea 
                  value={pointsReason} 
                  onChange={e => setPointsReason(e.target.value)}
                  required 
                  rows={3}
                  className="w-full px-3 py-2 cyber-input text-xs font-medium rounded-lg" 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsPointsModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={adjustPointsMutation.isPending}
                  className="flex-1 py-2 cyber-btn rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5"
                >
                  {adjustPointsMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  Apply Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
