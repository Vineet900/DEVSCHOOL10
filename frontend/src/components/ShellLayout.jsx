import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Coins,
  Dumbbell,
  House,
  NotebookPen,
  Trophy,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import AppLogo from './AppLogo'
import { t } from '../data/i18n'

const navItems = [
  { to: '/home', label: 'Home', icon: House },
  { to: '/courses', label: 'Courses', icon: BookOpen },
  { to: '/exercises', label: 'Practice', icon: Dumbbell },
  { to: '/quizzes', label: 'Assessments', icon: ClipboardCheck },
  { to: '/tutor', label: 'AI Tutor', icon: Bot },

  { to: '/home', label: 'Leaderboard', icon: Trophy, placeholder: true },
  { to: '/home', label: 'Earn', icon: Coins, placeholder: true },
  { to: '/home', label: 'Calendar', icon: CalendarDays, placeholder: true },
  { to: '/home', label: 'Notes', icon: NotebookPen, placeholder: true },
]

function LinkItem({ item, disabled, active, onDisabledClick }) {
  const Icon = item.icon
  if (item.placeholder) {
    return (
      <div
        className={`flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
          active
            ? 'bg-linear-to-r from-violet-500/30 via-blue-500/20 to-orange-500/30 text-white ring-1 ring-violet-400/40'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Icon size={18} />
        <span>{item.label}</span>
      </div>
    )
  }

  return disabled ? (
    <button
      type="button"
      aria-disabled="true"
      onClick={onDisabledClick}
      className={`flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium ${
        active
          ? 'bg-linear-to-r from-violet-500/30 via-blue-500/20 to-orange-500/30 text-white ring-1 ring-violet-400/40'
          : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </button>
  ) : (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `interactive-chip flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? 'bg-linear-to-r from-violet-500/40 via-blue-500/30 to-orange-500/40 text-white ring-1 ring-violet-400/40'
            : 'text-slate-700 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800/70'
        }`
      }
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export default function ShellLayout() {
  const location = useLocation()
  const { state, actions, notice } = useApp()
  const isChapterRoute = location.pathname.startsWith('/chapter/')
  const isProfileRoute = location.pathname.startsWith('/profile')
  const isSettingsWorkspaceRoute = location.pathname.startsWith('/settings')
  const isFocusedWorkspaceRoute = isProfileRoute || isSettingsWorkspaceRoute
  const profileActive = location.pathname.startsWith('/profile')
  const isAssessmentNavLocked = state.assessmentMode.active
  const handleAssessmentNavAttempt = () => actions.registerAssessmentViolation('navigation')

  return (
    <div className="app-shell h-screen overflow-hidden text-slate-900 transition-colors dark:text-white">
      <div className={`relative h-full ${isFocusedWorkspaceRoute ? 'pb-0' : 'pb-20 md:pb-0'}`}>
        {!isFocusedWorkspaceRoute ? (
          <aside className="app-sidebar fixed inset-y-0 left-0 z-20 hidden h-screen w-[240px] border-r p-4 backdrop-blur-xl md:block">
            <div className="mb-4 flex items-center gap-2">
              <AppLogo size={30} />
              <h1 className="text-2xl font-bold">DevSchool Pro</h1>
            </div>
            <ProfileShortcutCard
              state={state}
              profileActive={profileActive}
              disabled={isAssessmentNavLocked}
              onDisabledClick={handleAssessmentNavAttempt}
            />
            <label className="mb-4 block">
              <span className="text-xs text-slate-500 dark:text-slate-400">{t(state.language, 'language')}</span>
              <select
                value={state.language}
                onChange={(event) => actions.setLanguage(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 shadow-sm dark:border-white/20 dark:bg-slate-900/60 dark:text-white"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </label>
            <nav className="space-y-2">
              {navItems.map((item) => {
                const active = location.pathname.startsWith(item.to) && !item.placeholder
                const disabled = isAssessmentNavLocked && item.to !== '/quizzes'
                return (
                  <LinkItem
                    key={`${item.label}-${item.to}`}
                    item={item}
                    active={active}
                    disabled={disabled}
                    onDisabledClick={handleAssessmentNavAttempt}
                  />
                )
              })}
            </nav>
          </aside>
        ) : null}
        <main
          className={`flex flex-col h-full w-full ${isFocusedWorkspaceRoute ? '' : 'md:pl-[248px]'} ${
            isFocusedWorkspaceRoute || isChapterRoute ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6'
          }`}
        >
          {(state.focusMode.sessionActive || state.assessmentMode.active) && (
            <div className="sticky top-0 z-30 mb-3 rounded-xl border border-amber-400/50 bg-amber-100/90 px-3 py-2 text-sm font-semibold text-amber-900 shadow-sm dark:bg-amber-500/15 dark:text-amber-100">
              {state.focusMode.sessionActive
                ? `Focus Mode Active - ${Math.floor(state.focusMode.timerRemaining / 60)
                    .toString()
                    .padStart(2, '0')}:${String(state.focusMode.timerRemaining % 60).padStart(2, '0')}`
                : `Assessment Active - ${Math.floor(state.assessmentMode.timerRemaining / 60)
                    .toString()
                    .padStart(2, '0')}:${String(state.assessmentMode.timerRemaining % 60).padStart(2, '0')}`}
            </div>
          )}
          {!isFocusedWorkspaceRoute ? (
            <>
              <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
                <div className="flex items-center gap-2">
                  <AppLogo size={24} />
                  <h1 className="text-lg font-bold">DevSchool Pro</h1>
                </div>
              </div>
              <div className="mb-4 md:hidden">
                <ProfileShortcutCard
                  compact
                  state={state}
                  profileActive={profileActive}
                  disabled={isAssessmentNavLocked}
                  onDisabledClick={handleAssessmentNavAttempt}
                />
              </div>
            </>
          ) : null}
          <Outlet />
        </main>
      </div>

      {!isFocusedWorkspaceRoute ? (
        <nav className="app-mobile-nav fixed inset-x-0 bottom-0 z-20 border-t p-2 backdrop-blur-xl md:hidden">
          <ul className="grid grid-cols-5 gap-1">
            {navItems.slice(0, 5).map((item) => {
              const Icon = item.icon
              const active = location.pathname.startsWith(item.to)
              const disabled = isAssessmentNavLocked && item.to !== '/quizzes'
              return (
                <li key={`${item.label}-${item.to}`}>
                  {disabled ? (
                    <button
                      type="button"
                      aria-disabled="true"
                      onClick={handleAssessmentNavAttempt}
                      className={`flex w-full flex-col items-center rounded-lg py-2 text-xs ${
                        active
                          ? 'bg-linear-to-r from-violet-500/40 via-blue-500/30 to-orange-500/40 text-white'
                          : 'cursor-not-allowed text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  ) : (
                    <NavLink
                      to={item.to}
                      className={`interactive-chip flex flex-col items-center rounded-lg py-2 text-xs ${
                        active
                          ? 'bg-linear-to-r from-violet-500/40 via-blue-500/30 to-orange-500/40 text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}
      {notice ? (
        <div className="pointer-events-none fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          {notice.message}
        </div>
      ) : null}
    </div>
  )
}

function ProfileShortcutCard({ state, profileActive, compact = false, disabled = false, onDisabledClick }) {
  const baseClassName = compact
    ? 'rounded-2xl border border-slate-200/80 bg-white/75 p-3 shadow-sm dark:border-white/10 dark:bg-white/5'
    : 'mb-5 rounded-2xl border border-slate-200/80 bg-white/70 p-3 shadow-sm dark:border-white/10 dark:bg-white/5'

  const profileCardClassName = profileActive
    ? 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-500/50 dark:bg-violet-500/10 dark:text-violet-100'
    : 'border-slate-200 bg-white/80 text-slate-700 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100'

  const content = (
    <>
      <div className="flex items-center gap-3">
        {state.user.avatar ? (
          <img src={state.user.avatar} alt={`${state.user.name} avatar`} className="h-10 w-10 rounded-full object-cover shadow-sm" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-blue-500 text-sm font-bold text-white">
            {(state.user.name || 'L').slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{state.user.name || 'Learner'}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            Level {Math.max(1, Math.floor((state.xp || 0) / 120) + 1)} - Full Stack Track
          </p>
        </div>
        <ChevronRight size={16} className="shrink-0 opacity-70" />
      </div>
    </>
  )

  return disabled ? (
    <button
      type="button"
      aria-disabled="true"
      onClick={onDisabledClick}
      className={`block w-full cursor-not-allowed text-left ${baseClassName} ${profileCardClassName}`}
    >
      {content}
    </button>
  ) : (
    <NavLink to="/profile" className={`interactive-card block ${baseClassName} ${profileCardClassName}`}>
      {content}
    </NavLink>
  )
}
