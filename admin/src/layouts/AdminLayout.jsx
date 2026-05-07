import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Sparkles,
  Users,
  Wallet
} from 'lucide-react'
import AppLogo from '../components/AppLogo'

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/content', label: 'Content', icon: BookOpen },
  { to: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/assessments', label: 'Assessments', icon: FileText },
  { to: '/admin/points', label: 'Study Points', icon: Wallet },
  { to: '/admin/ai', label: 'AI Settings', icon: Sparkles },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white shadow-sm flex flex-col z-20 dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2 dark:border-slate-800">
          <AppLogo size={28} />
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Admin Panel</h1>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <nav className="space-y-1">
            {adminNavItems.map((item) => {
              const active = item.exact 
                ? location.pathname === item.to 
                : location.pathname.startsWith(item.to)

              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon size={18} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <NavLink
            to="/home"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ChevronLeft size={16} />
            Back to App
          </NavLink>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
