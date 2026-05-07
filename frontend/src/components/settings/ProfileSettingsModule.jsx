import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Bell,
  BookOpenCheck,
  ChevronRight,
  CircleHelp,
  FileText,
  Flame,
  Globe,
  KeyRound,
  LogOut,
  Menu,
  MoonStar,
  RotateCcw,
  Save,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Target,
  Trash2,
  Trophy,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { userAPI } from '../../lib/api'
import { legalDocs } from '../../data/legalDocs'
import {
  clampNumber,
  DAILY_GOAL_LIMITS,
  deriveFallbackUsername,
  formatFocusDurationLabel,
  getLevelProgress,
  getProfileOwnerKey,
  getWeeklyPoints,
  isUsernameAvailable,
  isValidEmail,
  isValidPhone,
  normalizeUsername,
  PASSWORD_MIN_LENGTH,
  sanitizeProfileInput,
} from '../../utils/profileSettings'
import AppLogo from '../AppLogo'

const SECTION_ITEMS = [
  { id: 'overview', title: 'Profile Overview', icon: UserRound },
  { id: 'account', title: 'Account Settings', icon: Settings2 },
  { id: 'security', title: 'Security', icon: ShieldCheck },
  { id: 'preferences', title: 'Preferences', icon: MoonStar },
  { id: 'learning', title: 'Learning Settings', icon: BookOpenCheck },
  { id: 'earn', title: 'Study & Earn', icon: WalletCards },
  { id: 'privacy', title: 'Privacy', icon: Globe },
  { id: 'notifications', title: 'Notifications', icon: Bell },
  { id: 'support', title: 'Support', icon: CircleHelp },
  { id: 'legal', title: 'Legal', icon: FileText },
  { id: 'danger', title: 'Danger Zone', icon: ShieldAlert, tone: 'danger' },
]

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: MoonStar },
  { value: 'system', label: 'System', icon: Sparkles },
]

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hinglish', label: 'Hinglish' },
]

const FOCUS_DURATION_OPTIONS = [15, 25, 45, 60, 90]

function createEmptySecurityForm() {
  return {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

export default function ProfileSettingsModule({
  defaultSectionId = 'account',
  pageTitle = 'Profile & Settings',
  pageIntro = '',
  compactCopy = false,
  showBackButton = false,
  backFallbackPath = '/home',
}) {
  const { state, actions } = useApp()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState(defaultSectionId)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [accountErrors, setAccountErrors] = useState({})
  const [securityErrors, setSecurityErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [securityPending, setSecurityPending] = useState(false)
  const [pendingDialog, setPendingDialog] = useState(null)

  const currentUser = state.user
  const ownerKey = useMemo(() => getProfileOwnerKey(currentUser), [currentUser])
  const xpProgress = useMemo(() => getLevelProgress(state.xp), [state.xp])
  const weeklyPoints = useMemo(() => getWeeklyPoints(state.pointsHistory), [state.pointsHistory])
  const profileSnapshot = useMemo(
    () => ({
      name: currentUser.name || '',
      username: currentUser.username || deriveFallbackUsername(currentUser),
      email: currentUser.email || '',
      phone: currentUser.phone || '',
      bio: state.profileBio || '',
      avatar: currentUser.avatar || '',
    }),
    [currentUser, state.profileBio],
  )
  const [accountForm, setAccountForm] = useState(() => profileSnapshot)
  const [securityForm, setSecurityForm] = useState(createEmptySecurityForm)

  useEffect(() => {
    setAccountForm(profileSnapshot)
  }, [profileSnapshot])

  // Load user profile from API on mount if logged in
  useEffect(() => {
    const loadUserProfile = async () => {
      const supabaseConfigured = currentUser.loggedIn && currentUser.id
      if (!supabaseConfigured) return

      const { data: apiUser, error } = await userAPI.getProfile()

      if (!error && apiUser) {
        setAccountForm({
          name: apiUser.name || '',
          username: apiUser.username || '',
          email: apiUser.email || '',
          phone: apiUser.phone || '',
          bio: apiUser.bio || '',
          avatar: apiUser.avatar || '',
        })
      }
    }

    loadUserProfile()
  }, [currentUser.loggedIn, currentUser.id])

  const selectedSection = SECTION_ITEMS.find((item) => item.id === activeSection) || SECTION_ITEMS[1]
  const initials = useMemo(() => getInitials(currentUser.name), [currentUser.name])
  const normalizedUsername = normalizeUsername(accountForm.username)
  const usernameStatus = getUsernameStatus({
    normalizedUsername,
    currentUsername: currentUser.username,
    ownerKey,
  })
  const verifiedEmail = Boolean(currentUser.email)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(backFallbackPath)
  }


  const handleAccountChange = (field, value) => {
    setAccountForm((prev) => ({ ...prev, [field]: value }))
    setAccountErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleAccountSave = async () => {
    const sanitized = sanitizeProfileInput(accountForm)
    const nextErrors = {}

    if (!sanitized.name) nextErrors.name = 'Name is required.'
    if (!sanitized.username) nextErrors.username = 'Username is required.'
    if (sanitized.email && !isValidEmail(sanitized.email)) nextErrors.email = 'Enter a valid email address.'
    if (sanitized.phone && !isValidPhone(sanitized.phone)) nextErrors.phone = 'Use a valid phone number format.'

    if (Object.keys(nextErrors).length > 0) {
      setAccountErrors(nextErrors)
      setFeedback({ type: 'error', message: 'Please fix the highlighted profile fields.' })
      return
    }

    // Use API to update profile if user is logged in and Supabase is configured
    const supabaseConfigured = currentUser.loggedIn && currentUser.id
    
    if (supabaseConfigured) {
      const { data: apiResponse, error: apiError } = await userAPI.updateProfile({
        name: sanitized.name,
        email: sanitized.email,
        phone: sanitized.phone,
        username: sanitized.username,
        bio: sanitized.bio,
        avatar: sanitized.avatar,
      })

      if (apiError) {
        setFeedback({ type: 'error', message: apiError.error || 'Failed to save profile to server.' })
        return
      }

      setAccountErrors({})
      setAccountForm(apiResponse)
      // Also update local state
      actions.saveAccountProfile(sanitized)
      setFeedback({ type: 'success', message: 'Account settings saved successfully.' })
      return
    }

    // Fallback to local state only
    const result = actions.saveAccountProfile(sanitized)
    if (!result.ok) {
      setAccountErrors(result.errors || {})
      setFeedback({ type: 'error', message: result.message || 'Profile settings could not be saved.' })
      return
    }

    setAccountErrors({})
    setAccountForm(result.profile)
    setFeedback({ type: 'success', message: 'Account settings saved successfully.' })
  }

  const handleAccountCancel = () => {
    setAccountErrors({})
    setAccountForm(profileSnapshot)
    setFeedback(null)
  }

  const handleSecuritySubmit = async () => {
    const nextErrors = {}

    if (!securityForm.oldPassword.trim()) nextErrors.oldPassword = 'Enter your current password.'
    if (securityForm.newPassword.length < PASSWORD_MIN_LENGTH) {
      nextErrors.newPassword = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
    }
    if (securityForm.confirmPassword !== securityForm.newPassword) {
      nextErrors.confirmPassword = 'New password and confirmation must match.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setSecurityErrors(nextErrors)
      setFeedback({ type: 'error', message: 'Please fix the password form before continuing.' })
      return
    }

    setSecurityPending(true)

    // Use API if user is logged in
    const supabaseConfigured = currentUser.loggedIn && currentUser.id
    
    if (supabaseConfigured) {
      const { data: apiResponse, error: apiError } = await userAPI.changePassword(
        securityForm.oldPassword,
        securityForm.newPassword,
      )

      setSecurityPending(false)

      if (apiError) {
        setSecurityErrors({ oldPassword: apiError.error || 'Password change failed.' })
        setFeedback({ type: 'error', message: 'Could not change password. Check your current password and try again.' })
        return
      }

      setSecurityErrors({})
      setSecurityForm(createEmptySecurityForm())
      setFeedback({ type: 'success', message: 'Password updated successfully.' })
      return
    }

    // Fallback to local auth action
    const result = await actions.changePassword(securityForm.oldPassword, securityForm.newPassword)
    setSecurityPending(false)

    if (!result.ok) {
      setFeedback({ type: result.placeholder ? 'info' : 'error', message: result.message })
      return
    }

    setSecurityErrors({})
    setSecurityForm(createEmptySecurityForm())
    setFeedback({ type: 'success', message: 'Password updated successfully.' })
  }

  const handleResetPassword = async () => {
    const email = accountForm.email || currentUser.email
    if (!email) {
      setFeedback({ type: 'info', message: 'Add an email address first to use password reset.' })
      return
    }

    const result = await actions.resetPassword(email)
    if (result?.error) {
      const fallbackMessage =
        result.error.message === 'Supabase is not configured.'
          ? 'Password reset will be available when the authentication backend is connected.'
          : result.error.message
      setFeedback({ type: 'info', message: fallbackMessage })
      return
    }

    setFeedback({ type: 'success', message: `Password reset instructions were sent to ${email}.` })
  }

  const handleNotificationsToggle = async () => {
    if (state.remindersEnabled) {
      actions.setRemindersEnabled(false)
      setFeedback({ type: 'success', message: 'Study notifications turned off.' })
      return
    }

    if (!('Notification' in window)) {
      setFeedback({ type: 'error', message: 'Notifications are not supported on this device.' })
      return
    }

    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    actions.setRemindersEnabled(granted)
    setFeedback({
      type: granted ? 'success' : 'error',
      message: granted ? 'Study notifications enabled.' : 'Notification permission was denied.',
    })
  }

  const handleDialogConfirm = async () => {
    const dialogId = pendingDialog
    setPendingDialog(null)

    if (dialogId === 'logout') {
      await actions.logout()
      return
    }

    if (dialogId === 'reset-progress') {
      actions.resetProgress()
      setFeedback({ type: 'success', message: 'Learning progress was reset successfully.' })
      return
    }

    if (dialogId === 'delete-account') {
      await actions.deleteAccountData()
    }
  }

  const renderDynamicPanel = () => {
    if (activeSection === 'overview') {
      return (
        <PanelShell title="Profile Overview" description={compactCopy ? '' : 'A quick snapshot of your learner identity, stats, and next actions.'}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MetricCard label="Level" value={`Lv. ${xpProgress.level}`} icon={Trophy} />
            <MetricCard label="Study Points" value={state.studyPoints.toLocaleString()} icon={Star} />
            <MetricCard label="Weekly Points" value={weeklyPoints.toLocaleString()} icon={WalletCards} />
            <MetricCard label="Streak" value={`${state.streak} days`} icon={Flame} />
            <MetricCard label="Daily Goal" value={`${state.dailyGoal} chapters`} icon={Target} />
            <MetricCard label="Focus Session" value={formatFocusDurationLabel(state.focusDurationMinutes)} icon={BookOpenCheck} />
          </div>
          <div className="mt-6 rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Progress Snapshot</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Your profile is ready for progress tracking, course milestones, and future earnings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="interactive-strong inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
              >
                <Trophy size={16} />
                <span>View My Progress</span>
              </button>
            </div>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'account') {
      return (
        <PanelShell title="Account Settings" description="">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Name"
              required
              value={accountForm.name}
              onChange={(value) => handleAccountChange('name', value)}
              error={accountErrors.name}
              placeholder="Your name"
            />
            <FormField
              label="Username"
              required
              value={accountForm.username}
              onChange={(value) => handleAccountChange('username', value)}
              error={accountErrors.username}
              placeholder="learner.dev"
              badge={<StatusBadge tone={usernameStatus.tone}>{usernameStatus.label}</StatusBadge>}
            />
            <FormField
              label="Email"
              type="email"
              value={accountForm.email}
              onChange={(value) => handleAccountChange('email', value)}
              error={accountErrors.email}
              placeholder="you@example.com"
              badge={verifiedEmail ? <StatusBadge tone="success">Verified</StatusBadge> : null}
            />
            <FormField
              label="Phone"
              value={accountForm.phone}
              onChange={(value) => handleAccountChange('phone', value)}
              error={accountErrors.phone}
              placeholder="+91 98765 43210"
            />
            <FormField
              label="Bio"
              as="textarea"
              value={accountForm.bio}
              onChange={(value) => handleAccountChange('bio', value)}
              placeholder="Tell your learning story in a short bio."
              className="md:col-span-2"
            />
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAccountSave}
              className="interactive-strong inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Save size={16} />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={handleAccountCancel}
              className="interactive-chip inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw size={16} />
              <span>Cancel</span>
            </button>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'security') {
      return (
        <PanelShell title="Security" description="">
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              label="Current Password"
              type="password"
              value={securityForm.oldPassword}
              onChange={(value) => {
                setSecurityForm((prev) => ({ ...prev, oldPassword: value }))
                setSecurityErrors((prev) => ({ ...prev, oldPassword: '' }))
              }}
              error={securityErrors.oldPassword}
            />
            <div className="hidden md:block" />
            <FormField
              label="New Password"
              type="password"
              value={securityForm.newPassword}
              onChange={(value) => {
                setSecurityForm((prev) => ({ ...prev, newPassword: value }))
                setSecurityErrors((prev) => ({ ...prev, newPassword: '' }))
              }}
              error={securityErrors.newPassword}
            />
            <FormField
              label="Confirm Password"
              type="password"
              value={securityForm.confirmPassword}
              onChange={(value) => {
                setSecurityForm((prev) => ({ ...prev, confirmPassword: value }))
                setSecurityErrors((prev) => ({ ...prev, confirmPassword: '' }))
              }}
              error={securityErrors.confirmPassword}
            />
          </div>
          <div className="mt-6 flex flex-col gap-3 lg:flex-row">
            <button
              type="button"
              disabled={securityPending}
              onClick={handleSecuritySubmit}
              className="interactive-strong inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <KeyRound size={16} />
              <span>{securityPending ? 'Updating...' : 'Change Password'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSecurityErrors({})
                setSecurityForm(createEmptySecurityForm())
              }}
              className="interactive-chip inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw size={16} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="interactive-chip inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <CircleHelp size={16} />
              <span>Reset Password</span>
            </button>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'preferences') {
      return (
        <PanelShell title="Preferences" description="">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Theme</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const active = state.themePreference === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => actions.setThemePreference(option.value)}
                      className={`interactive-card flex items-center justify-between rounded-2xl border px-4 py-4 text-left ${
                        active
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-100'
                          : 'border-slate-200 bg-white/80 text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{option.label}</p>
                        <p className="mt-1 text-xs opacity-70">{option.value === 'system' ? 'Follows device appearance.' : `${option.label} mode`}</p>
                      </div>
                      <Icon size={18} />
                    </button>
                  )
                })}
              </div>
            </div>

            <DashboardCard>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Language</span>
                <select
                  value={state.language}
                  onChange={(event) => actions.setLanguage(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </DashboardCard>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'learning') {
      return (
        <PanelShell title="Learning Settings" description="">
          <div className="grid gap-5 lg:grid-cols-2">
            <DashboardCard>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Daily Goal</span>
                <input
                  type="number"
                  min={DAILY_GOAL_LIMITS.min}
                  max={DAILY_GOAL_LIMITS.max}
                  value={state.dailyGoal}
                  onChange={(event) =>
                    actions.setDailyGoal(
                      clampNumber(event.target.value, DAILY_GOAL_LIMITS.min, DAILY_GOAL_LIMITS.max, state.dailyGoal),
                    )
                  }
                  className="mt-3 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
                />
              </label>
            </DashboardCard>

            <DashboardCard>
              <ToggleSetting
                icon={Target}
                title="Focus Mode"
                description="Keep study sessions disciplined with stricter learning behavior."
                checked={state.strictMode}
                onChange={() => actions.setStrictMode(!state.strictMode)}
              />
            </DashboardCard>
          </div>

          <div className="mt-5">
            <DashboardCard>
              <label className="block">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">Focus Session Duration</span>
                <select
                  value={state.focusDurationMinutes}
                  onChange={(event) => actions.setFocusDurationMinutes(Number(event.target.value))}
                  className="mt-3 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white"
                >
                  {FOCUS_DURATION_OPTIONS.map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {formatFocusDurationLabel(minutes)}
                    </option>
                  ))}
                </select>
              </label>
            </DashboardCard>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'earn') {
      return (
        <PanelShell title="Study & Earn" description="">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Total Points" value={state.studyPoints.toLocaleString()} icon={Star} />
            <MetricCard label="Weekly Points" value={weeklyPoints.toLocaleString()} icon={WalletCards} />
            <MetricCard label="Current Streak" value={`${state.streak} days`} icon={Flame} />
          </div>
          <div className="mt-6 rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Points Overview</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Rewards are being prepared. Your points, streak, and progress are already tracked live.
                </p>
              </div>
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-2xl border border-slate-300 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
              >
                Redeem (Coming Soon)
              </button>
            </div>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'privacy') {
      return (
        <PanelShell title="Privacy" description="">
          <div className="space-y-5">
            <DashboardCard>
              <ToggleSetting
                icon={Globe}
                title="Profile Visibility"
                description={state.profileVisible ? 'Your profile is visible inside the app.' : 'Your profile is currently hidden.'}
                checked={state.profileVisible}
                onChange={() => actions.setProfileVisibility(!state.profileVisible)}
              />
            </DashboardCard>

            <DashboardCard tone="danger">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-200">Delete Account</p>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    Remove your local DevSchool Pro profile, stored settings, and progress from this device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDialog('delete-account')}
                  className="interactive-chip inline-flex items-center justify-center gap-2 rounded-2xl border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={16} />
                  <span>Delete Account</span>
                </button>
              </div>
            </DashboardCard>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'notifications') {
      return (
        <PanelShell title="Notifications" description="">
          <div className="space-y-5">
            <DashboardCard>
              <ToggleSetting
                icon={Bell}
                title="Study Notifications"
                description={state.remindersEnabled ? 'Browser reminders are enabled for study sessions.' : 'Turn on browser reminders for your study routine.'}
                checked={state.remindersEnabled}
                onChange={handleNotificationsToggle}
              />
            </DashboardCard>
            <DashboardCard>
              <div className="flex items-start gap-3">
                <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  <Bell size={18} />
                </span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Reminder Schedule</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    When enabled, DevSchool Pro sends a gentle browser reminder every few hours to help you stay consistent.
                  </p>
                </div>
              </div>
            </DashboardCard>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'support') {
      return (
        <PanelShell title="Support" description="">
          <div className="grid gap-5 lg:grid-cols-2">
            <DashboardCard>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Help Center</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Onboarding guides, FAQs, and learning tips can live here as the app grows.
              </p>
              <button
                type="button"
                onClick={() => setFeedback({ type: 'info', message: 'Help center placeholder is ready for future content.' })}
                className="interactive-chip mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <CircleHelp size={16} />
                <span>Open Help</span>
              </button>
            </DashboardCard>

            <DashboardCard>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Contact Support</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Reach out for account help, technical support, or product feedback.
              </p>
              <button
                type="button"
                onClick={() => setFeedback({ type: 'info', message: 'Support placeholder: support@devschool.pro' })}
                className="interactive-chip mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                <CircleHelp size={16} />
                <span>Contact</span>
              </button>
            </DashboardCard>
          </div>
        </PanelShell>
      )
    }

    if (activeSection === 'legal') {
      return (
        <PanelShell title="Legal" description="">
          <div className="grid gap-5 lg:grid-cols-2">
            {Object.values(legalDocs).map((document) => (
              <Link
                key={document.slug}
                to={`/settings/${document.slug}`}
                className="interactive-card block rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    <FileText size={18} />
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{document.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{document.summary}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </PanelShell>
      )
    }

    return (
      <PanelShell title="Danger Zone" description="">
        <div className="grid gap-5 lg:grid-cols-2">
          <ActionCard
            icon={LogOut}
            title="Logout"
            description="Sign out of the current DevSchool Pro session."
            actionLabel="Logout"
            actionTone="warning"
            onClick={() => setPendingDialog('logout')}
          />
          <ActionCard
            icon={RotateCcw}
            title="Reset Progress"
            description="Clear course progress, streak, points, and XP while keeping your profile settings."
            actionLabel="Reset Progress"
            actionTone="danger"
            onClick={() => setPendingDialog('reset-progress')}
          />
        </div>
      </PanelShell>
    )
  }

  return (
    <section className="h-full bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f4f7fb_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <div className="hidden h-full xl:grid xl:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="h-screen border-r border-slate-200/80 bg-white/86 px-5 py-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
          <DesktopSectionNavigation
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            pageTitle={pageTitle}
            pageIntro={pageIntro}
          />
        </aside>

        <section className="h-screen overflow-y-auto bg-transparent">
          <div className="mx-auto max-w-5xl px-6 py-6">
            <StickyPanelHeader
              showBackButton={showBackButton}
              onBack={handleBack}
              title={selectedSection.title}
              subtitle={compactCopy ? '' : pageIntro}
            />
            {feedback ? <InlineAlert type={feedback.type} message={feedback.message} className="mt-5" /> : null}
            <div className="mt-5">{renderDynamicPanel()}</div>
          </div>
        </section>

        <aside className="h-screen border-l border-slate-200/80 bg-slate-50/75 px-5 py-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/60">
          <div className="sticky top-0">
            <ProfileSummaryCard
              currentUser={currentUser}
              initials={initials}
              xpProgress={xpProgress}
              weeklyPoints={weeklyPoints}
              streak={state.streak}
              studyPoints={state.studyPoints}
              onViewProgress={() => navigate('/home')}
            />
          </div>
        </aside>
      </div>

      <div className="hidden h-full md:grid xl:hidden md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-screen border-r border-slate-200/80 bg-white/86 px-5 py-6 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
          <DesktopSectionNavigation
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            pageTitle={pageTitle}
            pageIntro={pageIntro}
          />
        </aside>

        <section className="h-screen overflow-y-auto">
          <div className="mx-auto max-w-3xl px-5 py-5">
            <StickyPanelHeader
              showBackButton={showBackButton}
              onBack={handleBack}
              title={selectedSection.title}
              subtitle={compactCopy ? '' : pageIntro}
            />
            <div className="mt-5">
              <ProfileSummaryCard
                currentUser={currentUser}
                initials={initials}
                xpProgress={xpProgress}
                weeklyPoints={weeklyPoints}
                streak={state.streak}
                studyPoints={state.studyPoints}
                onViewProgress={() => navigate('/home')}
                compact
              />
            </div>
            {feedback ? <InlineAlert type={feedback.type} message={feedback.message} className="mt-5" /> : null}
            <div className="mt-5">{renderDynamicPanel()}</div>
          </div>
        </section>
      </div>

      <div className="h-full overflow-y-auto md:hidden">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95">
          <div className="flex items-center justify-between gap-3 px-4 py-4">
            <button
              type="button"
              onClick={handleBack}
              className="interactive-chip inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{selectedSection.title}</p>
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="interactive-chip inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <Menu size={16} />
              <span>Sections</span>
            </button>
          </div>
        </header>

        <div className="space-y-4 p-4">
          <ProfileSummaryCard
            currentUser={currentUser}
            initials={initials}
            xpProgress={xpProgress}
            weeklyPoints={weeklyPoints}
            streak={state.streak}
            studyPoints={state.studyPoints}
            onViewProgress={() => navigate('/home')}
            compact
          />
          {feedback ? <InlineAlert type={feedback.type} message={feedback.message} /> : null}
          {renderDynamicPanel()}
        </div>

        <MobileSectionDrawer
          open={drawerOpen}
          activeSection={activeSection}
          onClose={() => setDrawerOpen(false)}
          onSelectSection={(sectionId) => {
            setActiveSection(sectionId)
            setDrawerOpen(false)
          }}
        />
      </div>

      <ConfirmDialog
        open={pendingDialog === 'logout'}
        title="Logout of DevSchool Pro?"
        description="You will be signed out of this session and sent back to the login screen."
        confirmLabel="Logout"
        tone="warning"
        onCancel={() => setPendingDialog(null)}
        onConfirm={handleDialogConfirm}
      />
      <ConfirmDialog
        open={pendingDialog === 'reset-progress'}
        title="Reset your learning progress?"
        description="This clears streak, points, XP, completed chapters, quiz history, and project completion for this device profile."
        confirmLabel="Reset Progress"
        tone="danger"
        onCancel={() => setPendingDialog(null)}
        onConfirm={handleDialogConfirm}
      />
      <ConfirmDialog
        open={pendingDialog === 'delete-account'}
        title="Delete local account data?"
        description="This removes your stored profile, settings, and progress from this device and logs you out."
        confirmLabel="Delete Account"
        tone="danger"
        onCancel={() => setPendingDialog(null)}
        onConfirm={handleDialogConfirm}
      />
    </section>
  )
}

function DesktopSectionNavigation({ activeSection, onSelectSection, pageTitle, pageIntro }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center gap-3">
        <AppLogo size={34} />
        <div>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{pageTitle}</p>
          {pageIntro ? <p className="text-xs text-slate-500 dark:text-slate-400">{pageIntro}</p> : null}
        </div>
      </div>

      <nav className="space-y-2">
        {SECTION_ITEMS.map((section) => {
          const Icon = section.icon
          const active = activeSection === section.id
          const danger = section.tone === 'danger'

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelectSection(section.id)}
              className={`interactive-card flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                active
                  ? danger
                    ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
                    : 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-100'
                  : danger
                    ? 'border-transparent bg-transparent text-red-600 dark:text-red-300'
                    : 'border-transparent bg-transparent text-slate-700 dark:text-slate-100'
              }`}
            >
              <span className="inline-flex items-center gap-3">
                <span
                  className={`rounded-2xl p-2 ${
                    active
                      ? danger
                        ? 'bg-red-100 dark:bg-red-950/60'
                        : 'bg-white shadow-sm dark:bg-slate-900/70'
                      : 'bg-slate-100 dark:bg-slate-900/70'
                  }`}
                >
                  <Icon size={16} />
                </span>
                <span className="text-sm font-semibold">{section.title}</span>
              </span>
              <ChevronRight size={15} className="opacity-60" />
            </button>
          )
        })}
      </nav>
    </div>
  )
}

function MobileSectionDrawer({ open, activeSection, onClose, onSelectSection }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/55 backdrop-blur-sm">
      <button type="button" aria-label="Close drawer" className="flex-1" onClick={onClose} />
      <div className="h-full w-[86vw] max-w-[320px] border-l border-slate-200 bg-white px-4 py-5 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AppLogo size={28} />
            <p className="text-base font-semibold text-slate-900 dark:text-white">Sections</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="interactive-chip rounded-2xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"
          >
            Close
          </button>
        </div>

        <nav className="space-y-2">
          {SECTION_ITEMS.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            const danger = section.tone === 'danger'
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onSelectSection(section.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                  active
                    ? danger
                      ? 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200'
                      : 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/40 dark:text-blue-100'
                    : danger
                      ? 'border-transparent text-red-600 dark:text-red-300'
                      : 'border-transparent text-slate-700 dark:text-slate-100'
                }`}
              >
                <span className="inline-flex items-center gap-3">
                  <Icon size={16} />
                  <span className="text-sm font-semibold">{section.title}</span>
                </span>
                <ChevronRight size={15} className="opacity-60" />
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

function StickyPanelHeader({ showBackButton, onBack, title, subtitle }) {
  return (
    <div className="sticky top-0 z-20 rounded-[28px] border border-slate-200/80 bg-white/92 px-5 py-4 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-950/88">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              type="button"
              onClick={onBack}
              className="interactive-chip inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
          ) : null}
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">{title}</p>
            {subtitle ? <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileSummaryCard({
  currentUser,
  initials,
  xpProgress,
  weeklyPoints,
  streak,
  studyPoints,
  onViewProgress,
  compact = false,
}) {
  return (
    <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-5 shadow-[0_24px_48px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/75">
      <div className="flex items-start justify-between gap-3">
        <div className="relative">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={`${currentUser.name} avatar`}
              className={`${compact ? 'h-18 w-18' : 'h-20 w-20'} rounded-[24px] border border-white object-cover shadow-lg dark:border-slate-950`}
            />
          ) : (
            <div
              className={`${compact ? 'h-18 w-18 text-2xl' : 'h-20 w-20 text-3xl'} flex items-center justify-center rounded-[24px] bg-linear-to-br from-blue-600 via-indigo-500 to-cyan-400 font-bold text-white shadow-lg`}
            >
              {initials}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <StatusBadge tone="brand">Level {xpProgress.level}</StatusBadge>
        </div>
      </div>

      <div className="mt-5">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentUser.name || 'Learner'}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">@{currentUser.username || deriveFallbackUsername(currentUser)}</p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          <span>XP Progress</span>
          <span>
            {xpProgress.current}/{xpProgress.required}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full rounded-full bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-400"
            style={{ width: `${Math.max(8, xpProgress.percent || 0)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3">
        <ProfileStat label="Study Points" value={studyPoints.toLocaleString()} icon={Star} />
        <ProfileStat label="Weekly Points" value={weeklyPoints.toLocaleString()} icon={WalletCards} />
        <ProfileStat label="Streak" value={`${streak} days`} icon={Flame} />
      </div>

      <button
        type="button"
        onClick={onViewProgress}
        className="interactive-strong mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
      >
        <Trophy size={16} />
        <span>View My Progress</span>
      </button>
    </div>
  )
}

function ProfileStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-950/60">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
        <Icon size={15} className="text-amber-500" />
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function PanelShell({ title, description, children }) {
  return (
    <article className="rounded-[30px] border border-slate-200 bg-white/94 p-5 shadow-[0_24px_48px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-900/78">
      <div className="border-b border-slate-200/80 pb-4 dark:border-slate-800">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
      </div>
      <div className="pt-5">{children}</div>
    </article>
  )
}

function DashboardCard({ children, tone = 'default' }) {
  const toneClassName =
    tone === 'danger'
      ? 'border-red-200 bg-red-50/85 dark:border-red-900/60 dark:bg-red-950/20'
      : 'border-slate-200 bg-white/86 dark:border-slate-700 dark:bg-slate-950/45'

  return <div className={`rounded-[26px] border p-5 shadow-sm ${toneClassName}`}>{children}</div>
}

function FormField({
  label,
  value,
  onChange,
  error,
  type = 'text',
  as = 'input',
  placeholder = '',
  required = false,
  className = '',
  badge = null,
}) {
  const fieldClassName = `mt-3 w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-400 dark:bg-slate-950/60 dark:text-white ${
    error ? 'border-red-400 bg-red-50/70 dark:border-red-500 dark:bg-red-950/30' : 'border-slate-300 bg-white/92 dark:border-slate-700'
  }`

  return (
    <label className={`block ${className}`}>
      <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-900 dark:text-white">
        <span>
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </span>
        {badge}
      </span>
      {as === 'textarea' ? (
        <textarea
          rows={4}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${fieldClassName} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={fieldClassName}
        />
      )}
      {error ? <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-300">{error}</p> : null}
    </label>
  )
}

function ToggleSetting({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <Icon size={17} />
        </span>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>

      <button
        type="button"
        aria-pressed={checked}
        onClick={onChange}
        className={`interactive-chip relative inline-flex h-8 w-14 shrink-0 rounded-full border transition ${
          checked
            ? 'border-blue-500 bg-blue-600'
            : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-950/50">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
        <Icon size={16} className="text-amber-500" />
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function ActionCard({ icon: Icon, title, description, actionLabel, onClick, actionTone = 'warning' }) {
  const toneClassName =
    actionTone === 'danger'
      ? 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-950/40'
      : 'border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-200 dark:hover:bg-amber-950/30'

  return (
    <div className="rounded-[26px] border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950/45">
      <div className="flex items-start gap-3">
        <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
          <Icon size={18} />
        </span>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`interactive-chip mt-5 inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${toneClassName}`}
      >
        <Icon size={16} />
        <span>{actionLabel}</span>
      </button>
    </div>
  )
}

function InlineAlert({ type = 'info', message, className = '' }) {
  const colorClassName =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200'
      : type === 'error'
        ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200'
        : 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100'

  return <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${colorClassName} ${className}`}>{message}</div>
}

function StatusBadge({ children, tone = 'neutral' }) {
  const toneClassName =
    tone === 'success'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200'
      : tone === 'error'
        ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-200'
        : tone === 'brand'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-100'
          : tone === 'warning'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClassName}`}>
      {children}
    </span>
  )
}

function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel, tone = 'warning' }) {
  if (!open) return null

  const buttonClassName = tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 text-slate-950 hover:bg-amber-400'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[30px] border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <h4 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h4>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="interactive-chip rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`interactive-strong rounded-2xl px-4 py-3 text-sm font-semibold text-white ${buttonClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function getInitials(name) {
  const parts = String(name || 'Learner')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) return 'L'

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function getUsernameStatus({ normalizedUsername, currentUsername, ownerKey }) {
  if (!normalizedUsername) {
    return { label: 'Required', tone: 'warning' }
  }

  if (normalizedUsername === currentUsername) {
    return { label: 'Current', tone: 'neutral' }
  }

  if (isUsernameAvailable(normalizedUsername, ownerKey)) {
    return { label: 'Available', tone: 'success' }
  }

  return { label: 'Taken', tone: 'error' }
}
