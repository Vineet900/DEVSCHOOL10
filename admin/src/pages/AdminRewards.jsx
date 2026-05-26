import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Gift, 
  Plus, 
  Trash2, 
  Loader2, 
  X, 
  Check, 
  Ban, 
  Coins, 
  Ticket,
  DollarSign
} from 'lucide-react'
import { rewardsService } from '../services/services'

export default function AdminRewards() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('requests')
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)

  // Fetch redeem requests
  const { data: requestsResponse, isLoading: requestsLoading } = useQuery({
    queryKey: ['adminRedeems'],
    queryFn: rewardsService.getRedeemRequests
  })

  // Fetch coupons
  const { data: couponsResponse, isLoading: couponsLoading } = useQuery({
    queryKey: ['adminCoupons'],
    queryFn: rewardsService.getCoupons
  })

  const requests = requestsResponse?.data || []
  const coupons = couponsResponse?.data || []

  // Status mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => rewardsService.updateRedeemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminRedeems'] })
    }
  })

  // Coupon mutations
  const createCouponMutation = useMutation({
    mutationFn: (coupon) => rewardsService.createCoupon(coupon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] })
      setIsCouponModalOpen(false)
    }
  })

  const deleteCouponMutation = useMutation({
    mutationFn: (id) => rewardsService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCoupons'] })
    }
  })

  const handleStatusChange = (id, title, status) => {
    if (window.confirm(`${status === 'APPROVED' ? 'Approve' : 'Reject'} redeem request for "${title}"?`)) {
      statusMutation.mutate({ id, status })
    }
  }

  const handleDeleteCoupon = (id, code) => {
    if (window.confirm(`Delete coupon code "${code}"?`)) {
      deleteCouponMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Gift className="text-[#00f0ff]" size={24} /> Rewards & Store Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Process points redemption claims, configure promo coupons, and adjust exchange rates</p>
        </div>
        {activeTab === 'coupons' && (
          <button 
            onClick={() => setIsCouponModalOpen(true)}
            className="py-2.5 px-4 cyber-btn rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={14} /> Create Coupon Code
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex bg-[#0d0f19] p-1 rounded-lg border border-cyan-500/10 overflow-x-auto w-fit">
        <button 
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'requests' 
              ? 'bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift size={14} /> Claim Requests
        </button>
        <button 
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === 'coupons' 
              ? 'bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Ticket size={14} /> Coupon Codes
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="cyber-panel rounded-2xl overflow-hidden">
        {activeTab === 'requests' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap cyber-table">
              <thead>
                <tr>
                  <th className="px-6 py-4">Player Ident</th>
                  <th className="px-6 py-4">Reward Product</th>
                  <th className="px-6 py-4">Points Cost</th>
                  <th className="px-6 py-4">Date Claimed</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Approve / Reject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {requestsLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" size={24} />
                      <p className="tracking-widest uppercase font-bold text-[10px]">Accessing Claim Archives...</p>
                    </td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                      No Claims Pending Processing
                    </td>
                  </tr>
                ) : requests.map(req => (
                  <tr key={req.id}>
                    <td className="px-6 py-4 font-bold text-slate-255 uppercase">{req.profiles?.username || 'Unknown'}</td>
                    <td className="px-6 py-4 font-bold text-slate-100 uppercase tracking-wide">{req.reward_title}</td>
                    <td className="px-6 py-4 font-black text-cyan-400">{req.points_cost} SP</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(req.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        req.status === 'APPROVED' ? 'cyber-badge-green' :
                        req.status === 'REJECTED' ? 'cyber-badge-red' :
                        'cyber-badge-yellow'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      {req.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(req.id, req.reward_title, 'APPROVED')}
                            className="p-1 bg-[#080912] hover:bg-emerald-500 hover:text-[#05060b] border border-slate-800 hover:border-emerald-500 rounded transition-all"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(req.id, req.reward_title, 'REJECTED')}
                            className="p-1 bg-[#080912] hover:bg-red-500 hover:text-white border border-slate-800 hover:border-red-500 rounded transition-all"
                          >
                            <Ban size={14} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap cyber-table">
              <thead>
                <tr>
                  <th className="px-6 py-4">Promo Code</th>
                  <th className="px-6 py-4">Study Points Gift</th>
                  <th className="px-6 py-4">Max Redeems</th>
                  <th className="px-6 py-4">Times Redeemed</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {couponsLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      <Loader2 className="animate-spin mx-auto text-cyan-400 mb-2" size={24} />
                      <p className="tracking-widest uppercase font-bold text-[10px]">Accessing Coupon Inventory...</p>
                    </td>
                  </tr>
                ) : coupons.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 font-bold uppercase tracking-widest">
                      No Coupon codes active
                    </td>
                  </tr>
                ) : coupons.map(coup => (
                  <tr key={coup.id}>
                    <td className="px-6 py-4 font-black text-[#00f0ff] uppercase tracking-widest">{coup.code}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">+{coup.points_reward} SP</td>
                    <td className="px-6 py-4 font-semibold text-slate-350">{coup.max_uses} Limits</td>
                    <td className="px-6 py-4 text-slate-500">{coup.used_count || 0} Uses</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                        coup.is_active ? 'cyber-badge-green' : 'bg-slate-800/50 border-slate-700 text-slate-400'
                      }`}>
                        {coup.is_active ? 'ACTIVE' : 'EXPIRED'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex justify-end">
                      <button 
                        onClick={() => handleDeleteCoupon(coup.id, coup.code)}
                        className="p-1.5 bg-[#080912] hover:bg-red-500 hover:text-white border border-slate-800 hover:border-red-500 rounded text-slate-400 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="cyber-panel-glow p-6 rounded-2xl w-full max-w-sm relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00f0ff] flex items-center gap-2">
                <Ticket size={16} /> Deploy Promo Code
              </h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                const data = Object.fromEntries(new FormData(e.currentTarget))
                createCouponMutation.mutate({
                  code: data.code.toUpperCase(),
                  points_reward: Number(data.points_reward),
                  max_uses: Number(data.max_uses),
                  is_active: true
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Coupon Code</label>
                <input 
                  type="text" 
                  name="code" 
                  placeholder="DEVANNIVERSARY50"
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-black uppercase rounded-lg tracking-widest" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Gift Amount (SP)</label>
                <input 
                  type="number" 
                  name="points_reward" 
                  defaultValue={200}
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-widest font-black text-slate-500 mb-1">Max Redemptions</label>
                <input 
                  type="number" 
                  name="max_uses" 
                  defaultValue={100}
                  required 
                  className="w-full px-3 py-2 cyber-input text-xs font-bold rounded-lg" 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCouponModalOpen(false)}
                  className="flex-1 py-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-[10px] uppercase font-bold tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createCouponMutation.isPending}
                  className="flex-1 py-2 cyber-btn rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center justify-center gap-1.5"
                >
                  {createCouponMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                  Deploy Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
