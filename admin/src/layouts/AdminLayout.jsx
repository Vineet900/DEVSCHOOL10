import { NavLink, Outlet, useLocation, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderOpen,
  PlayCircle,
  ClipboardList,
  Gift,
  Bell,
  ShieldAlert,
  Terminal,
  Settings,
  ChevronLeft
} from 'lucide-react'

// AppLogo fallback/mock inside or import
function AppLogo({ size = 24 }) {
  return (
    <div className="flex items-center justify-center rounded-lg bg-cyan-500/10 p-1.5 border border-cyan-500/30">
      <div 
        className="rounded-md bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-slate-950"
        style={{ width: size, height: size, fontSize: size * 0.6 }}
      >
        D
      </div>
    </div>
  )
}

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/chapters', label: 'Chapters', icon: FolderOpen },
  { to: '/admin/lessons', label: 'Lessons', icon: PlayCircle },
  { to: '/admin/quizzes', label: 'Quizzes', icon: ClipboardList },
  { to: '/admin/rewards', label: 'Rewards', icon: Gift },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/moderation', label: 'Moderation', icon: ShieldAlert },
  { to: '/admin/logs', label: 'Logs', icon: Terminal },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const location = useLocation()
  const token = localStorage.getItem('sb-localhost-auth-token')

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="flex h-screen w-full bg-[#05060b] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-cyan-500/10 bg-[#0d0f19]/90 backdrop-blur-md flex flex-col z-20 shrink-0">
        {/* Header Branding */}
        <div className="p-4 border-b border-cyan-500/10 flex items-center gap-3">
          <AppLogo size={24} />
          <div>
            <h1 className="text-sm font-black tracking-widest text-slate-100 uppercase">DevSchool<span className="text-[#00f0ff]">Pro</span></h1>
            <p className="text-[10px] text-cyan-500/60 font-semibold tracking-wider uppercase">Admin Terminal</p>
          </div>
        </div>
        
        {/* Navigation Items */}
        <div className="p-3 flex-1 overflow-y-auto space-y-1">
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                    active
                      ? 'bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
                      : 'text-slate-400 border border-transparent hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-[#00f0ff]' : 'text-slate-450'} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* Back to App Link */}
        <div className="p-4 border-t border-cyan-500/10">
          <a
            href="http://localhost:5173/home" // Redirect directly to local app
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-[#00f0ff] transition-colors"
          >
            <ChevronLeft size={14} />
            Back to App
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-8 bg-transparent">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
