import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShieldAlert, 
  CheckCircle, 
  Trash2, 
  Loader2, 
  AlertTriangle,
  User,
  Flag,
  Info,
  Ban
} from 'lucide-react'
import { moderationService } from '../services/services'

export default function AdminModeration() {
  const queryClient = useQueryClient()
  const [filterStatus, setFilterStatus] = useState('ALL')

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['adminReports'],
    queryFn: moderationService.getReports
  })

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }) => moderationService.resolveReport(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] })
    }
  })

  const deleteContentMutation = useMutation({
    mutationFn: ({ contentType, contentId }) => moderationService.deleteContent(contentType, contentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminReports'] })
      alert('Flagged content handled successfully.')
    }
  })

  const reports = response?.data || []

  const filteredReports = reports.filter(rep => {
    if (filterStatus === 'ALL') return true
    return rep.status === filterStatus
  })

  const handleResolve = (id, title) => {
    if (window.confirm(`Mark report "${title || id}" as resolved?`)) {
      resolveMutation.mutate({ id, status: 'RESOLVED' })
    }
  }

  const handleDeleteContent = (type, contentId) => {
    if (window.confirm(`WARNING: Deleting content of type "${type}" with ID "${contentId}". Proceed?`)) {
      deleteContentMutation.mutate({ contentType: type, contentId })
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={24} /> Security & Moderation Terminal
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Review player reports, resolve content violations, and purge flagged custom assets</p>
        </div>
      </header>

      {/* Filter toolbar */}
      <div className="cyber-panel p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="text-rose-500" size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter Reports:</span>
        </div>
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 bg-[#080912] border border-cyan-500/20 text-xs font-black uppercase rounded-lg text-rose-450 focus:border-rose-500 focus:outline-none"
        >
          <option value="ALL">ALL REPORTS</option>
          <option value="PENDING">PENDING ONLY</option>
          <option value="RESOLVED">RESOLVED ONLY</option>
        </select>
      </div>

      {/* Reports Table Panel */}
      <div className="cyber-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap cyber-table">
            <thead>
              <tr>
                <th className="px-6 py-4">Report Details</th>
                <th className="px-6 py-4">Reported Player</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Reason Statement</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right font-black">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto text-rose-500 mb-2" size={24} />
                    <p className="tracking-widest uppercase font-bold text-[10px]">Scanning security databases...</p>
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                    No Security Reports Registered
                  </td>
                </tr>
              ) : filteredReports.map(rep => (
                <tr key={rep.id} className={rep.status === 'RESOLVED' ? 'opacity-50' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-200">
                      <AlertTriangle size={14} className="text-rose-500" />
                      <div>
                        <div className="font-bold uppercase">ID: {rep.id.substring(0, 8)}...</div>
                        <div className="text-[9px] text-slate-500">Reporter: {rep.reporter?.username || 'System'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-100 uppercase">{rep.reported?.username || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      rep.content_type === 'USER' ? 'cyber-badge-purple' : 'cyber-badge-blue'
                    }`}>
                      {rep.content_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-slate-350 font-medium" title={rep.reason}>
                    {rep.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                      rep.status === 'RESOLVED' ? 'cyber-badge-green' : 'cyber-badge-red'
                    }`}>
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end gap-1.5">
                    {rep.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleResolve(rep.id, rep.content_id)}
                          className="p-1.5 bg-[#080912] hover:bg-emerald-500 hover:text-[#05060b] border border-slate-800 hover:border-emerald-500 rounded text-slate-400 transition-all"
                          title="Mark Resolved"
                        >
                          <CheckCircle size={12} />
                        </button>
                        <button 
                          onClick={() => handleDeleteContent(rep.content_type, rep.content_id)}
                          className="p-1.5 bg-[#080912] hover:bg-rose-600 hover:text-white border border-slate-800 hover:border-rose-500 rounded text-slate-400 transition-all"
                          title="Purge Violated Content"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
