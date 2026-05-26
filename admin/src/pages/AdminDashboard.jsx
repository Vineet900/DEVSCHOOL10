import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Activity, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Gift, 
  Coins, 
  AlertCircle,
  TrendingUp,
  UserPlus
} from 'lucide-react'
import { dashboardService } from '../services/services'

export default function AdminDashboard() {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: dashboardService.getOverview
  })

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-pulse">
        <header className="mb-8">
          <div className="h-8 w-64 bg-slate-800 rounded-lg mb-2"></div>
          <div className="h-4 w-96 bg-slate-800 rounded-lg"></div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="bg-[#0d0f19] border border-cyan-500/10 h-28 rounded-xl"></div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl">
        <AlertCircle className="mx-auto mb-3 text-red-500" size={32} />
        <h3 className="font-bold text-lg mb-1">Terminal connection failed</h3>
        <p className="text-sm text-slate-400">Failed to load core dashboard analytics. Ensure the DevSchoolPro backend is running.</p>
      </div>
    )
  }

  const backendData = response?.data || {
    totalUsers: 0, 
    activeUsers: 0, 
    newUsers: 0, 
    totalCourses: 0, 
    totalLessons: 0, 
    totalQuizzes: 0, 
    totalStudyHours: 0, 
    totalStudyPoints: 0, 
    pendingRequests: 0, 
    pendingRedeems: 0, 
    totalRedeemRequests: 0, 
    completionRate: 0, 
    recentUsers: [], 
    recentActivities: [], 
    chartData: [], 
    courseEngagement: []
  }

  const metrics = [
    { label: 'Total Users', value: (backendData.totalUsers || 0).toLocaleString(), icon: Users, change: '100% database', color: 'text-cyan-400' },
    { label: 'Active Users Today', value: (backendData.activeUsers || 0).toLocaleString(), icon: Activity, change: 'Active in 24h', color: 'text-emerald-400' },
    { label: 'New Users', value: (backendData.newUsers || 0).toString(), icon: UserPlus, change: 'Joined 7d', color: 'text-violet-400' },
    { label: 'Total Courses', value: (backendData.totalCourses || 0).toLocaleString(), icon: BookOpen, change: 'Total Published', color: 'text-indigo-400' },
    { label: 'Total Study Hours', value: `${(backendData.totalStudyHours || 0).toLocaleString()} hrs`, icon: Clock, change: 'Platform Total', color: 'text-[#00f0ff]' },
    { label: 'Course Completion %', value: `${backendData.completionRate || 0}%`, icon: CheckCircle, change: 'Avg Progress', color: 'text-emerald-400' },
    { label: 'Total Redeem Requests', value: (backendData.totalRedeemRequests || 0).toLocaleString(), icon: Gift, change: `Pending: ${backendData.pendingRedeems || 0}`, color: 'text-amber-400' },
    { label: 'Total Study Points', value: `${(backendData.totalStudyPoints || 0).toLocaleString()} SP`, icon: Coins, change: 'Distributed', color: 'text-purple-400' },
    { label: 'Pending Requests', value: (backendData.pendingRequests || 0).toString(), icon: AlertCircle, change: 'Action Required', color: 'text-rose-400' }
  ]

  const recentActivities = backendData.recentActivities || []

  // Dynamic Chart calculations
  const chartData = backendData.chartData || []
  const maxGrowth = Math.max(...chartData.map(c => c.growth), 10)
  const maxActives = Math.max(...chartData.map(c => c.actives), 10)

  const growthPoints = chartData.map((c, i) => ({
    x: i * (500 / 6),
    y: 170 - ((c.growth / maxGrowth) * 140)
  }))

  const activesPoints = chartData.map((c, i) => ({
    x: i * (500 / 6),
    y: 170 - ((c.actives / maxActives) * 140)
  }))

  const growthPath = growthPoints.length > 0 ? growthPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : 'M 0 160'
  const activesPath = activesPoints.length > 0 ? activesPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') : 'M 0 180'

  const growthAreaPath = growthPoints.length > 0 ? `${growthPath} L 500 180 L 0 180 Z` : 'M 0 180'
  const activesAreaPath = activesPoints.length > 0 ? `${activesPath} L 500 180 L 0 180 Z` : 'M 0 180'

  // Course Engagement
  const courseEngagement = backendData.courseEngagement || []
  const maxEngagement = Math.max(...courseEngagement.map(c => c.value), 1)


  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-cyan-500/10 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="text-[#00f0ff]" size={24} /> Dashboard Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Live status metrics of DevSchoolPro database</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-[#0d0f19] px-3 py-1.5 rounded-lg border border-cyan-500/20 shadow-[0_0_10px_rgba(0,240,255,0.05)]">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-[#00f0ff]">Operations System Live</span>
        </div>
      </header>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon
          return (
            <div key={idx} className="cyber-panel p-4 rounded-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300">
              {/* Card Corner Trim */}
              <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-500/30 transform rotate-45 translate-x-1 -translate-y-1"></div>
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{metric.label}</span>
                <Icon size={16} className={`${metric.color} opacity-80`} />
              </div>
              <div className="mt-3">
                <h3 className="text-xl font-black text-slate-100 tracking-tight">{metric.value}</h3>
                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-widest">{metric.change}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Graphs & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Left: Custom SVG Graphs (User Growth / Engagement / Retention) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* User Growth & Active User Chart */}
          <div className="cyber-panel p-6 rounded-2xl relative">
            <div className="absolute top-0 left-6 h-1 w-20 bg-cyan-500"></div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 bg-[#00f0ff] rounded-full"></span>
              Daily Growth & Active Users Graph
            </h3>
            
            {/* Custom SVG Line Graph */}
            <div className="relative h-60 w-full">
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="blueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bd00ff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#bd00ff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />
                <line x1="0" y1="160" x2="500" y2="160" stroke="rgba(255,255,255,0.03)" strokeDasharray="3,3" />

                {/* Area under curves */}
                <path d={growthAreaPath} fill="url(#blueGlow)" />
                <path d={activesAreaPath} fill="url(#purpleGlow)" />

                {/* Growth Line */}
                <path 
                  d={growthPath} 
                  fill="none" 
                  stroke="#00f0ff" 
                  strokeWidth="3"
                  className="drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]"
                />

                {/* Active Users Line */}
                <path 
                  d={activesPath} 
                  fill="none" 
                  stroke="#bd00ff" 
                  strokeWidth="2"
                  className="drop-shadow-[0_0_6px_rgba(189,0,255,0.4)]"
                />

                {/* Dots on points */}
                {growthPoints.map((p, i) => (
                  <circle key={`g-${i}`} cx={p.x} cy={p.y} r="4" fill="#00f0ff" className="transition-all duration-300" />
                ))}
                {activesPoints.map((p, i) => (
                  <circle key={`a-${i}`} cx={p.x} cy={p.y} r="3" fill="#bd00ff" className="transition-all duration-300" />
                ))}
              </svg>

              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4">
                {chartData.map((c, idx) => (
                  <span key={idx}>{c.day}</span>
                ))}
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 bg-[#00f0ff] rounded-full"></div>
                <span className="text-[10px] font-semibold text-slate-400">User Growth</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1 bg-[#bd00ff] rounded-full"></div>
                <span className="text-[10px] font-semibold text-slate-400">Active Sessions</span>
              </div>
            </div>
          </div>

          {/* Lower Chart Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Course Engagement Graph */}
            <div className="cyber-panel p-5 rounded-2xl">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">Course Engagement</h3>
              <div className="h-40 flex items-end justify-between gap-3">
                {courseEngagement.length === 0 ? (
                  <div className="w-full text-center text-[10px] text-slate-500 pb-12 uppercase tracking-widest font-black">
                    No active progress data
                  </div>
                ) : (
                  courseEngagement.map((course) => {
                    const heightPercent = Math.max(8, Math.round((course.value / maxEngagement) * 100))
                    return (
                      <div key={course.id} className="w-full flex flex-col items-center gap-2" title={`${course.title}: ${course.value} progress counts`}>
                        <div className="w-full bg-[#111322] border border-cyan-500/10 rounded-lg h-28 relative overflow-hidden">
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all duration-700 ease-out"
                            style={{ height: `${heightPercent}%` }}
                          >
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-200"></div>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{course.code}</span>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* User Retention & Top Course Stats */}
            <div className="cyber-panel p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">User Retention</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                      <span>Week 1 Return</span>
                      <span className="text-cyan-400">82%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#111322] rounded-full overflow-hidden border border-cyan-500/5">
                      <div className="h-full bg-cyan-400 rounded-full" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                      <span>Month 1 Return</span>
                      <span className="text-purple-400">54%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#111322] rounded-full overflow-hidden border border-purple-500/5">
                      <div className="h-full bg-purple-400 rounded-full" style={{ width: '54%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                      <span>Cohort Growth</span>
                      <span className="text-emerald-400">38%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#111322] rounded-full overflow-hidden border border-emerald-500/5">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '38%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-cyan-500/10 pt-3 mt-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Fastest Growing Path</p>
                <p className="text-xs font-bold text-[#00f0ff] uppercase mt-0.5">Frontend Developer Core</p>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="cyber-panel p-6 rounded-2xl relative">
          <div className="absolute top-0 left-6 h-1 w-20 bg-purple-500"></div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping"></span>
            System Activity Feed
          </h3>

          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className="border-b border-slate-800/60 pb-3 last:border-0 last:pb-0 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${act.badge}`}>
                    {act.type}
                  </span>
                  <span className="text-[9px] text-slate-500 font-semibold">{act.time}</span>
                </div>
                <p className="text-xs text-slate-300 font-medium tracking-wide">{act.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-cyan-500/10 pt-4 text-center">
            <button className="text-[10px] font-black tracking-widest text-[#00f0ff] uppercase hover:underline">
              View All Logs
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
