import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Star, ArrowUpRight, ArrowDownRight, History, Gift, Loader2 } from 'lucide-react'
import { pointsService } from '../services/services'

export default function AdminStudyPoints() {
  const [searchTerm, setSearchTerm] = useState('')

  const { data: response, isLoading } = useQuery({
    queryKey: ['adminPoints'],
    queryFn: pointsService.getTransactions
  })

  const transactions = response?.data || []
  const filteredTransactions = transactions.filter(tx => 
    (tx.profiles?.name || tx.user_id || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Study Points</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track user points and manually adjust balances.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-sm shadow-blue-500/20 w-full md:w-auto justify-center">
          <Gift size={16} /> Adjust Points
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Points Issued', value: '1.2M', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
          { label: 'Points Spent', value: '450K', icon: History, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { label: 'Avg Points/User', value: '850', icon: Plus, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4 dark:bg-slate-900 dark:border-slate-800">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search user..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white transition-all text-sm" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 dark:bg-slate-800/20 dark:border-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto text-blue-500" size={24} />
                    <p className="mt-2">Loading transactions...</p>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : filteredTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group dark:hover:bg-slate-800/30">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                        {(tx.profiles?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      {tx.profiles?.name || tx.user_id}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {tx.type === 'credit' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {tx.amount || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{tx.reason || 'Unknown'}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {tx.created_at ? new Date(tx.created_at).toLocaleString() : 'N/A'}
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
