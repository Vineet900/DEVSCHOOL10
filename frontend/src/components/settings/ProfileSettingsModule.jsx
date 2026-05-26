import { useEffect, useMemo, useRef, useState } from 'react'
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
  standalone = false,
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
  // Track whether API has already populated the form so we don't overwrite it
  const apiDataLoadedRef = useRef(false)
  
  useEffect(() => {
    if (feedback && feedback.type !== 'error') {
      const timer = setTimeout(() => setFeedback(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const currentUser = state.user
  const ownerKey = useMemo(() => getProfileOwnerKey(currentUser), [currentUser])
  const xpProgress = useMemo(() => getLevelProgress(state.xp), [state.xp])
  const weeklyPoints = useMemo(() => getWeeklyPoints(state.pointsHistory), [state.pointsHistory])
  const profileSnapshot = useMemo(
    () => ({
      name: currentUser.name || '',
      username: currentUser.username || deriveFallbackUsername(currentUser),
      email: currentUser.email || state.profileEmail || '',
      phone: currentUser.phone || state.profilePhone || '',
      bio: state.profileBio || '',
      avatar: currentUser.avatar || '',
      location: state.profileLocation || '',
      portfolio: state.profilePortfolio || '',
      techStack: state.profileTechStack || [],
      learningGoals: state.profileLearningGoals || [],
    }),
    [currentUser, state.profileBio, state.profileEmail, state.profilePhone, state.profileLocation, state.profilePortfolio, state.profileTechStack, state.profileLearningGoals],
  )
  const [accountForm, setAccountForm] = useState(() => profileSnapshot)
  const [securityForm, setSecurityForm] = useState(createEmptySecurityForm)

  useEffect(() => {
    // If API has already loaded fresh data, only sync non-contact fields
    // to avoid overwriting email/phone that came from the server
    if (apiDataLoadedRef.current) {
      setAccountForm(prev => ({
        ...profileSnapshot,
        // Preserve email and phone loaded from API (don't overwrite with stale auth data)
        email: prev.email || profileSnapshot.email,
        phone: prev.phone || profileSnapshot.phone,
      }))
    } else {
      setAccountForm(profileSnapshot)
    }
  }, [profileSnapshot])

  // Load user profile from API on mount if logged in
  useEffect(() => {
    apiDataLoadedRef.current = false
    const loadUserProfile = async () => {
      const supabaseConfigured = currentUser.loggedIn && currentUser.id
      if (!supabaseConfigured) return

      try {
        const { data: responseData, error } = await userAPI.getProfile()

        if (!error && responseData?.data) {
          const userObj = responseData.data;
          const profileObj = userObj.profile || {};
          let parsedBio = { text: '', location: '', portfolio: '', techStack: [], learningGoals: [] }
          try {
            if (profileObj.bio && profileObj.bio.trim().startsWith('{')) {
              const json = JSON.parse(profileObj.bio)
              parsedBio.text = json.bio || ''
              parsedBio.location = json.location || ''
              parsedBio.portfolio = json.portfolio || ''
              parsedBio.techStack = Array.isArray(json.techStack) ? json.techStack : []
              parsedBio.learningGoals = Array.isArray(json.learningGoals) ? json.learningGoals : []
            } else {
              parsedBio.text = profileObj.bio || ''
            }
          } catch (e) {
            parsedBio.text = profileObj.bio || ''
          }

          // Mark that we've loaded fresh data from API — prevents profileSnapshot
          // effect from overwriting these values on subsequent auth re-renders
          apiDataLoadedRef.current = true
          setAccountForm({
            name: profileObj.full_name || userObj.name || '',
            username: profileObj.username || userObj.username || '',
            email: userObj.email || '',
            phone: userObj.phone || '',
            bio: parsedBio.text,
            location: parsedBio.location,
            portfolio: parsedBio.portfolio,
            techStack: parsedBio.techStack,
            learningGoals: parsedBio.learningGoals,
            avatar: profileObj.avatar_url || '',
          })
        }
      } catch (err) {
        console.warn('Failed to load user profile from API:', err.message || err)
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
      try {
        const bioPayload = JSON.stringify({
          bio: sanitized.bio,
          location: sanitized.location || '',
          portfolio: sanitized.portfolio || '',
          techStack: sanitized.techStack || [],
          learningGoals: sanitized.learningGoals || [],
        })

        const { data: apiResponse } = await userAPI.updateProfile({
          full_name: sanitized.name,
          username: sanitized.username,
          bio: bioPayload,
          avatar_url: sanitized.avatar,
        })

        if (!apiResponse || !apiResponse.success) {
          throw new Error('Failed to save profile to server.')
        }

        const updatedProfile = apiResponse.data || {}
        setAccountErrors({})
        setAccountForm({
          name: updatedProfile.full_name || sanitized.name,
          username: updatedProfile.username || sanitized.username,
          email: sanitized.email,
          phone: sanitized.phone,
          bio: sanitized.bio,
          location: sanitized.location,
          portfolio: sanitized.portfolio,
          techStack: sanitized.techStack,
          learningGoals: sanitized.learningGoals,
          avatar: updatedProfile.avatar_url || '',
        })
        
        // Also update local state
        actions.saveAccountProfile(sanitized)
        setFeedback({ type: 'success', message: 'Account settings saved successfully.' })
      } catch (err) {
        setFeedback({ type: 'error', message: err.message || 'Failed to save profile to server.' })
      }
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
    setAccountForm({
      ...result.profile,
      bio: result.profile.bio || '',
      location: result.profile.location || '',
      portfolio: result.profile.portfolio || '',
      techStack: result.profile.techStack || [],
      learningGoals: result.profile.learningGoals || [],
    })
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
            <MetricCard label="Level" value={`Lv. ${xpProgress?.level || 1}`} icon={Trophy} />
            <MetricCard label="Study Points" value={(state.studyPoints || 0).toLocaleString()} icon={Star} />
            <MetricCard label="Weekly Points" value={(weeklyPoints || 0).toLocaleString()} icon={WalletCards} />
            <MetricCard label="Streak" value={`${state.streak} days`} icon={Flame} />
            <MetricCard label="Daily Goal" value={`${state.dailyGoal} chapters`} icon={Target} />
            <MetricCard label="Focus Session" value={formatFocusDurationLabel(state.focusDurationMinutes)} icon={BookOpenCheck} />
          </div>
          <div className="mt-6 rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-extrabold text-white">Progress Snapshot</p>
                <p className="mt-1 text-sm text-white/40 font-medium">
                  Your profile is ready for progress tracking, course milestones, and future earnings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/home')}
                className="px-6 py-3.5 rounded-2xl bg-brand-cyan text-bg-deep font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center gap-2"
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
              label="Location"
              value={accountForm.location || ''}
              onChange={(value) => handleAccountChange('location', value)}
              placeholder="e.g. New Delhi, India"
            />
            <FormField
              label="Portfolio URL"
              value={accountForm.portfolio || ''}
              onChange={(value) => handleAccountChange('portfolio', value)}
              placeholder="e.g. https://myportfolio.dev"
            />
            <FormField
              label="Tech Stack (comma-separated)"
              value={Array.isArray(accountForm.techStack) ? accountForm.techStack.join(', ') : ''}
              onChange={(value) => handleAccountChange('techStack', value.split(',').map(s => s.trim()))}
              placeholder="e.g. React, Node.js, TypeScript"
              className="md:col-span-2"
            />
            <FormField
              label="Learning Goal 1"
              value={accountForm.learningGoals?.[0] || ''}
              onChange={(value) => {
                const goals = [...(accountForm.learningGoals || [])]
                goals[0] = value
                handleAccountChange('learningGoals', goals)
              }}
              placeholder="e.g. Master System Design"
            />
            <FormField
              label="Learning Goal 2"
              value={accountForm.learningGoals?.[1] || ''}
              onChange={(value) => {
                const goals = [...(accountForm.learningGoals || [])]
                goals[1] = value
                handleAccountChange('learningGoals', goals)
              }}
              placeholder="e.g. Learn DevOps & Cloud"
            />
            <FormField
              label="Learning Goal 3"
              value={accountForm.learningGoals?.[2] || ''}
              onChange={(value) => {
                const goals = [...(accountForm.learningGoals || [])]
                goals[2] = value
                handleAccountChange('learningGoals', goals)
              }}
              placeholder="e.g. Contribute to Open Source"
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
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAccountSave}
              className="px-6 py-3.5 rounded-2xl bg-brand-cyan text-bg-deep font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] flex items-center justify-center gap-2"
            >
              <Save size={16} />
              <span>Save Changes</span>
            </button>
            <button
              type="button"
              onClick={handleAccountCancel}
              className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-900 dark:text-white font-bold hover:bg-white/10 text-sm transition-all flex items-center justify-center gap-2"
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
          <div className="mt-8 flex flex-col gap-3 lg:flex-row">
            <button
              type="button"
              disabled={securityPending}
              onClick={handleSecuritySubmit}
              className="px-6 py-3.5 rounded-2xl bg-brand-cyan text-bg-deep font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
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
              className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-900 dark:text-white font-bold hover:bg-white/10 text-sm transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleResetPassword}
              className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-900 dark:text-white font-bold hover:bg-white/10 text-sm transition-all flex items-center justify-center gap-2"
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
          <div className="space-y-8">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/30 mb-4 pl-1">Theme Appearance</p>
              <div className="grid gap-4 sm:grid-cols-3">
                {THEME_OPTIONS.map((option) => {
                  const Icon = option.icon
                  const active = state.themePreference === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => actions.setThemePreference(option.value)}
                      className={`flex items-center justify-between rounded-2xl border p-5 text-left transition-all ${
                        active
                          ? 'border-brand-cyan bg-brand-cyan/10 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(34,211,238,0.15)]'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div>
                        <p className="font-extrabold text-sm">{option.label}</p>
                        <p className="mt-1 text-[10px] text-slate-500 dark:text-white/40">{option.value === 'system' ? 'Follow system settings' : `${option.label} mode`}</p>
                      </div>
                      <Icon size={18} className={active ? 'text-brand-cyan' : 'text-slate-400 dark:text-white/40'} />
                    </button>
                  )
                })}
              </div>
            </div>

            <DashboardCard>
              <label className="block">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/30 pl-1">Language</span>
                <select
                  value={state.language}
                  onChange={(event) => actions.setLanguage(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-6 py-4 text-sm text-slate-900 dark:text-white outline-none focus:border-brand-cyan/50 transition-all appearance-none cursor-pointer"
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
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/30 pl-1">Daily Goal</span>
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
                  className="mt-3 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-6 py-4 text-sm text-slate-900 dark:text-white outline-none focus:border-brand-cyan/50 transition-all"
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
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/30 pl-1">Focus Session Duration</span>
                <select
                  value={state.focusDurationMinutes}
                  onChange={(event) => actions.setFocusDurationMinutes(Number(event.target.value))}
                  className="mt-3 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-6 py-4 text-sm text-slate-900 dark:text-white outline-none focus:border-brand-cyan/50 transition-all appearance-none cursor-pointer"
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
            <MetricCard label="Total Points" value={(state.studyPoints || 0).toLocaleString()} icon={Star} />
            <MetricCard label="Weekly Points" value={(weeklyPoints || 0).toLocaleString()} icon={WalletCards} />
            <MetricCard label="Current Streak" value={`${state.streak || 0} days`} icon={Flame} />
          </div>
          <div className="mt-6 rounded-[2rem] border border-white/5 bg-white/[0.02] p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-extrabold text-white">Convert XP to SP</p>
                <p className="mt-1 text-sm text-white/40 font-medium">
                  Exchange your hard-earned XP for Study Points (SP). 
                  <span className="ml-1 font-bold text-brand-cyan">100 XP = 1 SP</span>.
                </p>
                <p className="mt-2 text-xs font-bold text-brand-purple">
                  Current Study Points Balance: <span className="font-bold">{state.studyPoints || 0} SP</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  id="xp-convert-amount"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-brand-cyan/50 transition-all cursor-pointer"
                  defaultValue="100"
                >
                  <option value="100" className="bg-[#020617] text-white">100 XP → 1 SP</option>
                  <option value="500" className="bg-[#020617] text-white">500 XP → 5 SP</option>
                  <option value="1000" className="bg-[#020617] text-white">1000 XP → 10 SP</option>
                  <option value="5000" className="bg-[#020617] text-white">5000 XP → 50 SP</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    const select = document.getElementById('xp-convert-amount');
                    const amount = parseInt(select.value);
                    if (state.xp < amount) {
                      setFeedback({ type: 'error', message: 'Insufficient XP for this conversion.' });
                      return;
                    }
                    setFeedback({ type: 'info', message: 'Processing conversion...' });
                    const res = await actions.convertXPToRP(amount);
                    if (res.success) {
                      setFeedback({ type: 'success', message: `Successfully converted ${amount} XP to RP!` });
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-brand-cyan text-bg-deep font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                >
                  Convert Now
                </button>
              </div>
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
                  <p className="font-extrabold text-red-400">Delete Account</p>
                  <p className="mt-1 text-xs text-white/40 font-medium leading-relaxed">
                    Remove your local DevSchool Pro profile, stored settings, and progress from this device.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDialog('delete-account')}
                  className="px-6 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bold hover:bg-red-500/20 text-sm transition-all flex items-center justify-center gap-2"
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
              <div className="flex items-start gap-4">
                <span className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-brand-cyan flex-shrink-0">
                  <Bell size={20} />
                </span>
                <div>
                  <p className="font-extrabold text-white">Reminder Schedule</p>
                  <p className="mt-1 text-xs text-white/40 font-medium leading-relaxed">
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
              <p className="font-extrabold text-white">Help Center</p>
              <p className="mt-1 text-xs text-white/40 font-medium leading-relaxed">
                Onboarding guides, FAQs, and learning tips can live here as the app grows.
              </p>
              <button
                type="button"
                onClick={() => setFeedback({ type: 'info', message: 'Help center placeholder is ready for future content.' })}
                className="mt-6 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <CircleHelp size={16} />
                <span>Open Help</span>
              </button>
            </DashboardCard>

            <DashboardCard>
              <p className="font-extrabold text-white">Contact Support</p>
              <p className="mt-1 text-xs text-white/40 font-medium leading-relaxed">
                Reach out for account help, technical support, or product feedback.
              </p>
              <button
                type="button"
                onClick={() => setFeedback({ type: 'info', message: 'Support placeholder: support@devschool.pro' })}
                className="mt-6 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
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
                className="glass-card block rounded-3xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.05] transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-brand-cyan flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </span>
                  <div>
                    <p className="font-extrabold text-white group-hover:text-brand-cyan transition-colors">{document.title}</p>
                    <p className="mt-1 text-xs text-white/40 font-medium leading-relaxed">{document.summary}</p>
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

  if (standalone) {
    return (
      <div className="space-y-6">
        <StickyPanelHeader
          showBackButton={showBackButton}
          onBack={handleBack}
          title={selectedSection.title}
          subtitle={compactCopy ? '' : pageIntro}
        />
        {feedback ? <InlineAlert type={feedback.type} message={feedback.message} className="mt-5" /> : null}
        <div className="mt-5">{renderDynamicPanel()}</div>

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
      </div>
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
    <div className="flex items-center gap-4 mb-8">
      {showBackButton && (
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500 dark:text-white/40 font-semibold uppercase tracking-widest mt-1">{subtitle}</p> : null}
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
    <div className="rounded-[30px] border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-5 shadow-[0_24px_48px_rgba(15,23,42,0.08)]">
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
              className={`${compact ? 'h-18 w-18 text-2xl' : 'h-20 w-20 text-3xl'} flex items-center justify-center rounded-[24px] bg-gradient-to-br from-blue-600 via-indigo-500 to-cyan-400 font-bold text-white shadow-lg`}
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
        <p className="mt-1 text-sm text-slate-500 dark:text-white/40">@{currentUser.username || deriveFallbackUsername(currentUser)}</p>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/40">
          <span>XP Progress</span>
          <span>
            {xpProgress.current}/{xpProgress.required}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400"
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
        className="px-6 py-3.5 rounded-2xl bg-brand-cyan text-bg-deep font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)] mt-5 w-full flex items-center justify-center gap-2"
      >
        <Trophy size={16} />
        <span>View My Progress</span>
      </button>
    </div>
  )
}

function ProfileStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30">{label}</p>
        <Icon size={15} className="text-amber-500" />
      </div>
      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function PanelShell({ title, description, children }) {
  return (
    <article className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent">
      <div className="border-b border-slate-200 dark:border-white/5 pb-4 mb-6">
        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</h3>
        {description ? <p className="mt-2 text-sm text-slate-500 dark:text-white/40 font-medium">{description}</p> : null}
      </div>
      <div>{children}</div>
    </article>
  )
}

function DashboardCard({ children, tone = 'default' }) {
  const toneClassName =
    tone === 'danger'
      ? 'border-red-500/20 bg-red-500/5'
      : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]'

  return <div className={`rounded-[2rem] border p-6 ${toneClassName}`}>{children}</div>
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
  const fieldClassName = `mt-3 w-full rounded-2xl border px-6 py-4 text-sm text-slate-900 dark:text-white outline-none transition focus:border-brand-cyan/50 dark:focus:bg-white/10 bg-slate-50 dark:bg-white/5 ${
    error ? 'border-red-500 bg-red-500/10' : 'border-slate-200 dark:border-white/10'
  }`

  return (
    <label className={`block ${className}`}>
      <span className="flex items-center justify-between gap-3 text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/30 pl-1">
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
      {error ? <p className="mt-2 text-xs font-bold text-red-400 pl-1">{error}</p> : null}
    </label>
  )
}

function ToggleSetting({ icon: Icon, title, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-start gap-4">
        <span className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-brand-cyan flex-shrink-0">
          <Icon size={20} />
        </span>
        <div>
          <p className="font-extrabold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-white/40 font-medium leading-relaxed">{description}</p>
        </div>
      </div>

      <button
        type="button"
        aria-pressed={checked}
        onClick={onChange}
        className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border transition-all ${
          checked
            ? 'border-brand-cyan bg-brand-cyan shadow-[0_0_15px_rgba(34,211,238,0.3)]'
            : 'border-white/10 bg-white/5'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full transition-all ${
            checked ? 'left-8 bg-[#020617]' : 'left-1 bg-white/30'
          }`}
        />
      </button>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30">{label}</p>
        <Icon size={18} className="text-brand-purple" />
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function ActionCard({ icon: Icon, title, description, actionLabel, onClick, actionTone = 'warning' }) {
  const isDanger = actionTone === 'danger'
  const buttonStyle = isDanger
    ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
    : 'bg-white/5 border border-white/10 text-slate-900 dark:text-white hover:bg-white/10'

  return (
    <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
      <div className="flex items-start gap-4">
        <span className="rounded-2xl bg-white/5 border border-white/10 p-3.5 text-slate-600 dark:text-white/60 flex-shrink-0">
          <Icon size={20} />
        </span>
        <div>
          <p className="font-extrabold text-slate-900 dark:text-white">{title}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-white/40 font-medium leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest ${buttonStyle} transition-all`}
      >
        <Icon size={14} />
        <span>{actionLabel}</span>
      </button>
    </div>
  )
}

function InlineAlert({ type = 'info', message, className = '' }) {
  const colorClassName =
    type === 'success'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      : type === 'error'
        ? 'border-red-500/20 bg-red-500/10 text-red-400'
        : 'border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan'

  return <div className={`rounded-2xl border px-6 py-4 text-sm font-bold ${colorClassName} ${className}`}>{message}</div>
}

function StatusBadge({ children, tone = 'neutral' }) {
  const toneClassName =
    tone === 'success'
      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
      : tone === 'error'
        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
        : tone === 'brand'
          ? 'bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan'
          : tone === 'warning'
            ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
            : 'bg-white/5 border border-white/10 text-white/40'

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClassName}`}>
      {children}
    </span>
  )
}

function ConfirmDialog({ open, title, description, confirmLabel, onConfirm, onCancel, tone = 'warning' }) {
  if (!open) return null

  const isDanger = tone === 'danger'
  const buttonClassName = isDanger 
    ? 'bg-red-500 text-white hover:bg-red-600' 
    : 'bg-brand-cyan text-bg-deep hover:shadow-lg hover:shadow-brand-cyan/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-bg-deep/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-gradient-to-b dark:from-white/[0.05] dark:to-transparent p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-cyan to-transparent" />
        <h4 className="text-xl font-black text-slate-900 dark:text-white">{title}</h4>
        <p className="mt-4 text-sm text-slate-500 dark:text-white/40 font-medium leading-relaxed">{description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/10 text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-3.5 rounded-2xl font-black text-sm transition-all ${buttonClassName}`}
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
