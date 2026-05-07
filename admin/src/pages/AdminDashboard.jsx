import { useQuery } from '@tanstack/react-query'
import { Users, BookOpen, ClipboardList, Activity } from 'lucide-react'
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
          <div className="h-8 w-48 bg-slate-200 rounded-lg dark:bg-slate-800 mb-2"></div>
          <div className="h-4 w-64 bg-slate-200 rounded-lg dark:bg-slate-800"></div>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-32 dark:bg-slate-900 dark:border-slate-800"></div>
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl border border-red-100 dark:bg-red-500/10 dark:border-red-500/20">
        Failed to load dashboard data. Please make sure the backend is running and you are logged in.
      </div>
    )
  }

  const backendData = response?.data || {
    totalUsers: 0, activeUsers: 0, totalCourses: 0, totalLessons: 0, totalQuizzes: 0, completionRate: 0, aiUsage: 0
  }

  const stats = [
    { label: 'Total Users', value: backendData.totalUsers.toLocaleString(), icon: Users, change: '+12%', color: 'bg-blue-500' },
    { label: 'Active Learners', value: backendData.activeUsers.toLocaleString(), icon: Activity, change: '+5%', color: 'bg-green-500' },
    { label: 'Total Courses', value: backendData.totalCourses.toLocaleString(), icon: BookOpen, change: '0%', color: 'bg-violet-500' },
    { label: 'Quizzes Taken', value: backendData.totalQuizzes.toLocaleString(), icon: ClipboardList, change: '+24%', color: 'bg-orange-500' },
  ]

  const chartData = [60, 45, 80, 50, 75, 90, 65]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Welcome to the DevSchool Pro admin panel.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-${stat.color.replace('bg-', '')}`}>
                  <Icon size={24} className={stat.color.replace('bg-', 'text-')} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1 dark:text-white">{stat.value}</h3>
                </div>
              </div>
              <div className="mt-4 text-sm font-medium">
                <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-slate-500'}>{stat.change}</span>
                <span className="text-slate-400 ml-2">from last month</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 mb-6 dark:text-white">User Activity (Last 7 Days)</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {chartData.map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2">
                <div className="w-full bg-blue-100 rounded-t-sm relative group dark:bg-blue-900/30" style={{ height: '100%' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-500 font-medium">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 mb-6 dark:text-white">Recent Signups</h3>
          <div className="space-y-4">
            {(backendData.recentUsers || []).length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No recent signups</p>
            ) : (
              backendData.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 border-b border-slate-50 pb-3 last:border-0 last:pb-0 dark:border-slate-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name || 'Learner'}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[150px]">{user.email || 'No email'}</p>
                  </div>
                  <div className="ml-auto text-[10px] text-slate-400">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Just now'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
