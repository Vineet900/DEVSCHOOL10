import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { 
  Bell, 
  Send, 
  Users, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react'
import { usersService, notificationsService } from '../services/services'

export default function AdminNotifications() {
  const [targetType, setTargetType] = useState('ALL')
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [notifType, setNotifType] = useState('ANNOUNCEMENT')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  
  // Scheduling parameters
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduleTime, setScheduleTime] = useState('')

  // Toast / status logs
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch users for targeted list
  const { data: usersResponse, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: usersService.getUsers,
    enabled: targetType === 'SELECTED'
  })

  const users = usersResponse?.data || []

  const sendMutation = useMutation({
    mutationFn: (payload) => notificationsService.sendNotification(payload),
    onSuccess: (res) => {
      setSuccessMsg(res.message || 'Notification broadcast successfully!')
      setTitle('')
      setMessage('')
      setSelectedUserIds([])
      setIsScheduled(false)
      setScheduleTime('')
      setTimeout(() => setSuccessMsg(''), 5000)
    },
    onError: (err) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Transmission failed')
      setTimeout(() => setErrorMsg(''), 5000)
    }
  })

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (targetType === 'SELECTED' && selectedUserIds.length === 0) {
      setErrorMsg('Please select at least one recipient user.')
      return
    }

    sendMutation.mutate({
      targetType,
      userIds: targetType === 'SELECTED' ? selectedUserIds : [],
      title,
      message,
      type: notifType,
      scheduleTime: isScheduled ? scheduleTime : null
    })
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="border-b border-cyan-500/10 pb-5">
        <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <Bell className="text-[#00f0ff]" size={24} /> Notification Broadcaster
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Broadcast alerts, trigger rewards notifications, or program scheduled announcements</p>
      </header>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Broadcaster form & targeted list container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Editor Form */}
        <div className="lg:col-span-2 cyber-panel p-6 rounded-2xl relative">
          <div className="absolute top-0 left-6 h-1 w-20 bg-cyan-500"></div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Draft Transmission Payload</h3>

            {/* Target Select */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Target Audience</label>
                <select 
                  value={targetType} 
                  onChange={e => setTargetType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-black uppercase rounded-lg text-[#00f0ff] focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ALL">BROADCAST TO ALL USERS</option>
                  <option value="SELECTED">TARGET SPECIFIC USERS</option>
                </select>
              </div>

              {/* Alert Type */}
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Alert Classification</label>
                <select 
                  value={notifType} 
                  onChange={e => setNotifType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-black uppercase rounded-lg text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="ANNOUNCEMENT">SYSTEM ANNOUNCEMENT</option>
                  <option value="SYSTEM">SYSTEM ALERT</option>
                  <option value="REWARD">REWARD UPDATE</option>
                  <option value="STREAK">STREAK CONGRATS</option>
                  <option value="COURSE">NEW COURSE MODULE</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Alert Title Header</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="SYSTEM OVERRIDE ACTIVE"
                className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg uppercase tracking-wide" 
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Announcement Message Body</label>
              <textarea 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                required
                rows={5}
                placeholder="Write message contents here..."
                className="w-full px-3 py-2 cyber-input text-xs font-medium rounded-lg" 
              />
            </div>

            {/* Scheduling setup */}
            <div className="border-t border-cyan-500/10 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule Delivery Options</span>
                <button 
                  type="button" 
                  onClick={() => setIsScheduled(!isScheduled)}
                  className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded transition-all ${
                    isScheduled 
                      ? 'border-[#bd00ff] bg-[#bd00ff]/10 text-purple-400' 
                      : 'border-slate-800 text-slate-500 hover:border-slate-700'
                  }`}
                >
                  {isScheduled ? 'SCHEDULED' : 'SEND INSTANTLY'}
                </button>
              </div>

              {isScheduled && (
                <div className="flex items-center gap-3">
                  <Calendar size={14} className="text-purple-500" />
                  <input 
                    type="datetime-local" 
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    required
                    className="px-3 py-1.5 bg-[#080912] border border-[#bd00ff]/20 text-xs font-bold rounded-lg text-slate-200 focus:border-[#bd00ff] focus:outline-none" 
                  />
                </div>
              )}
            </div>

            {/* Dispatch button */}
            <button 
              type="submit" 
              disabled={sendMutation.isPending}
              className="w-full py-3 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {sendMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {isScheduled ? 'Queue Broadcast Schedule' : 'Initialize Transmission Broadcast'}
            </button>

          </form>
        </div>

        {/* Right side: Recipient user picker (Only visible if targeted list selected) */}
        <div className="cyber-panel p-6 rounded-2xl relative">
          <div className="absolute top-0 right-4 w-4 h-4 border-t-2 border-r-2 border-cyan-500/25"></div>
          
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <Users size={16} className="text-[#00f0ff]" /> Targeted Recipients
          </h3>

          {targetType === 'ALL' ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
              <Sparkles size={28} className="text-cyan-500/40 animate-pulse mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest">Global Broadcast Engaged</p>
              <p className="text-[9px] text-slate-600 mt-1 uppercase">Every user receives this transmission</p>
            </div>
          ) : usersLoading ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">Loading targets...</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-3">Checked Recipients ({selectedUserIds.length})</p>
              {users.map(u => {
                const isSelected = selectedUserIds.includes(u.user_id || u.id)
                return (
                  <div 
                    key={u.id}
                    onClick={() => handleToggleUser(u.user_id || u.id)}
                    className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                      isSelected 
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' 
                        : 'border-slate-800 hover:border-slate-700 text-slate-450'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">{u.username}</span>
                    <span className="text-[8px] font-bold opacity-60">LVL {u.level || 1}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
