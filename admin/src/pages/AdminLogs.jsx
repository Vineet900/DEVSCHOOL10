import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Terminal, 
  Loader2, 
  Search, 
  RefreshCw, 
  ShieldAlert, 
  UserX, 
  Activity,
  Calendar
} from 'lucide-react'
import { logsService } from '../services/services'

export default function AdminLogs() {
  const [activeTab, setActiveTab] = useState('admin')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: response, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['adminLogs'],
    queryFn: logsService.getLogs
  })

  const logsData = response?.data || { adminLogs: [], failedLogins: [] }

  const handleRefresh = () => {
    refetch()
  }

  // Filter logs based on active tab and search term
  const getFilteredLogs = () => {
    const term = searchTerm.toLowerCase()
    if (activeTab === 'admin') {
      return (logsData.adminLogs || []).filter(log => 
        (log.action || '').toLowerCase().includes(term) ||
        (log.target_id || '').toLowerCase().includes(term) ||
        (log.profiles?.username || '').toLowerCase().includes(term)
      )
    } else {
      return (logsData.failedLogins || []).filter(log => 
        (log.properties?.email || '').toLowerCase().includes(term) ||
        (log.properties?.ip || '').toLowerCase().includes(term)
      )
    }
  }

  const filteredLogs = getFilteredLogs()

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Terminal className="text-[#00f0ff]" size={24} /> System Activity Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Track database operations, administrative overrides, and failed security attempts</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={isFetching}
          className="py-2.5 px-4 bg-[#0d0f19] border border-cyan-500/20 hover:border-cyan-500 text-slate-350 hover:text-slate-100 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          {isFetching ? 'Syncing...' : 'Sync Logs'}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex bg-[#0d0f19] p-1 rounded-lg border border-cyan-500/10 overflow-x-auto w-fit">
        <button 
          onClick={() => { setActiveTab('admin'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'admin' 
              ? 'bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity size={14} /> Admin Activity
        </button>
        <button 
          onClick={() => { setActiveTab('security'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'security' 
              ? 'bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserX size={14} /> Failed Logins
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="cyber-panel p-4 rounded-xl flex items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder={activeTab === 'admin' ? "SEARCH ACTION OR TARGET..." : "SEARCH BY IP OR EMAIL..."} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg cyber-input text-xs tracking-widest uppercase font-bold" 
          />
        </div>
      </div>

      {/* Logs Table Panel */}
      <div className="cyber-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'admin' ? (
            <table className="w-full text-left text-xs whitespace-nowrap cyber-table">
              <thead>
                <tr>
                  <th className="px-6 py-4">Action Code</th>
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Target Ident</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Details payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" size={24} />
                      <p className="tracking-widest uppercase font-bold text-[10px]">Accessing Audit registers...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                      No Audit logs recorded
                    </td>
                  </tr>
                ) : filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cyber-badge-purple">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-300 uppercase">{log.profiles?.username || 'System'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-500 font-mono text-[10px]">{log.target_id || 'N/A'}</td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-cyan-500" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[200px] truncate text-slate-450 font-mono text-[9px]" title={JSON.stringify(log.details)}>
                      {log.details ? JSON.stringify(log.details) : '{}'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs whitespace-nowrap cyber-table">
              <thead>
                <tr>
                  <th className="px-6 py-4">Alert Level</th>
                  <th className="px-6 py-4">Attempted Email</th>
                  <th className="px-6 py-4">Origin IP address</th>
                  <th className="px-6 py-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto text-rose-500 mb-2" size={24} />
                      <p className="tracking-widest uppercase font-bold text-[10px]">Accessing security logs...</p>
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                      No security breaches recorded
                    </td>
                  </tr>
                ) : filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider cyber-badge-red">
                        <ShieldAlert size={10} /> SECURITY WARN
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-350">{log.properties?.email || 'N/A'}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 font-bold">{log.properties?.ip || '127.0.0.1'}</td>
                    <td className="px-6 py-4 text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-rose-500" />
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
