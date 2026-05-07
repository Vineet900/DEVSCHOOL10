import { useQuery } from '@tanstack/react-query'
import { BarChart3, TrendingUp, Users, BookOpen, Clock, Download, Loader2 } from 'lucide-react'
import { analyticsService } from '../services/services'

export default function AdminAnalytics() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['analyticsStats'],
    queryFn: analyticsService.getStats
  })

  const stats = response?.data?.stats || [
    { label: 'Total Sessions', value: '0', change: '0%', icon: TrendingUp },
    { label: 'Avg Session Time', value: '0', change: '0%', icon: Clock },
    { label: 'Course Completions', value: '0', change: '0%', icon: BookOpen },
    { label: 'New Registrations', value: '0', change: '0%', icon: Users },
  ]

  const chartData = response?.data?.chartData || {
    bars: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }

  const topCourses = response?.data?.topCourses || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View user activity and course usage metrics.</p>
        </div>
        <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center gap-2 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 w-full md:w-auto justify-center">
          <Download size={16} /> Export Report
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 flex items-center justify-center dark:bg-slate-800 dark:text-slate-400">
                {stat.label === 'Total Sessions' && <TrendingUp size={20} />}
                {stat.label === 'Avg Session Time' && <Clock size={20} />}
                {stat.label === 'Course Completions' && <BookOpen size={20} />}
                {stat.label === 'New Registrations' && <Users size={20} />}
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 dark:text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Monthly Active Users</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-3 py-1.5 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
              <option>2026</option>
              <option>2025</option>
            </select>
          </div>
          <div className="h-72 flex items-end justify-between gap-1 md:gap-2">
            {chartData.bars.map((height, i) => (
              <div key={i} className="w-full flex flex-col items-center gap-2 group cursor-pointer">
                <div className="w-full bg-slate-50 rounded-t flex items-end relative dark:bg-slate-800/50" style={{ height: '100%' }}>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 dark:bg-white dark:text-slate-900">
                    {height * 100} users
                  </div>
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-500 group-hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs text-slate-400 font-medium hidden md:block">{chartData.months[i]}</span>
                <span className="text-[10px] text-slate-400 font-medium md:hidden">{chartData.months[i].charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 mb-6 dark:text-white">Top Courses</h3>
          <div className="space-y-6">
            {topCourses.map((course, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{course.name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{course.views}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800">
                  <div className={`${course.color} h-2 rounded-full`} style={{ width: `${course.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

