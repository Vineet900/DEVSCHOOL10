import { useState } from 'react'
import AppLogo from '../components/AppLogo'
import { useApp } from '../context/AppContext'
import { t } from '../data/i18n'
import { isSupabaseConfigured } from '../lib/supabase'

export default function LoginPage() {
  const { state, actions } = useApp()
  const language = state.language
  const [method, setMethod] = useState('email')
  const [tab, setTab] = useState('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [guestName, setGuestName] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState('enterPhone')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const clearFeedback = () => {
    setError(null)
    setMessage(null)
  }

  const switchMethod = (next) => {
    setMethod(next)
    clearFeedback()
    setPhoneStep('enterPhone')
    setPhoneOtp('')
  }

  const switchTab = (next) => {
    setTab(next)
    clearFeedback()
    setPhoneStep('enterPhone')
    setPhoneOtp('')
  }

  const onSignIn = async (event) => {
    event.preventDefault()
    if (!isSupabaseConfigured) return
    clearFeedback()
    setLoading(true)
    const { error: err } = await actions.signInWithPassword(email, password)
    setLoading(false)
    if (err) setError(err.message)
  }

  const onSignUp = async (event) => {
    event.preventDefault()
    if (!isSupabaseConfigured) return
    clearFeedback()
    setLoading(true)
    const { data, error: err } = await actions.signUp(email, password, displayName)
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    if (data.session) {
      setMessage(t(language, 'welcomeSignedIn'))
    } else {
      setMessage(t(language, 'checkEmailConfirm'))
    }
  }

  const onGuestContinue = (event) => {
    event.preventDefault()
    clearFeedback()
    actions.guestLogin(guestName)
  }

  const onForgotPassword = async () => {
    if (!isSupabaseConfigured) return
    clearFeedback()
    if (!email.trim()) {
      setError(t(language, 'enterEmailFirst'))
      return
    }
    setLoading(true)
    const { error: err } = await actions.resetPassword(email)
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setMessage(t(language, 'resetLinkSent'))
  }

  const onGoogle = async () => {
    if (!isSupabaseConfigured) return
    clearFeedback()
    setLoading(true)
    const { data, error: err } = await actions.signInWithGoogle()
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    if (data?.url) {
      window.location.assign(data.url)
    }
  }

  const onSendPhoneCode = async (event) => {
    event.preventDefault()
    if (!isSupabaseConfigured) return
    clearFeedback()
    const rawPhone = phone.trim().replace(/^\+/, '')
    const normalized = rawPhone.startsWith(countryCode.replace('+', '')) 
      ? `+${rawPhone}` 
      : `${countryCode}${rawPhone}`
    
    if (normalized.length < 10) {
      setError(t(language, 'phoneE164Hint'))
      return
    }
    setLoading(true)
    const fullName = tab === 'signUp' ? displayName : ''
    const { error: err } = await actions.sendPhoneOtp(normalized, { fullName })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setPhoneStep('verifyOtp')
    setMessage(t(language, 'smsCodeSent'))
  }

  const onVerifyPhoneOtp = async (event) => {
    event.preventDefault()
    if (!isSupabaseConfigured) return
    clearFeedback()
    const rawPhone = phone.trim().replace(/^\+/, '')
    const normalized = rawPhone.startsWith(countryCode.replace('+', '')) 
      ? `+${rawPhone}` 
      : `${countryCode}${rawPhone}`
    const code = phoneOtp.trim()
    if (code.length < 4) {
      setError(t(language, 'enterOtp'))
      return
    }
    setLoading(true)
    const { error: err } = await actions.verifyPhoneOtp(normalized, code)
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setMessage(t(language, 'welcomeSignedIn'))
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-900">
      <div className="w-full max-w-sm space-y-8">
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800">
          <div className="mb-6 flex items-center gap-3">
            <AppLogo size={36} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">DevSchool Pro</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t(language, 'loginSync')}</p>
            </div>
          </div>

          {!isSupabaseConfigured ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
              {t(language, 'supabaseOptionalA')}{' '}
              <a href="https://supabase.com/dashboard/project/_/settings/api" className="font-semibold underline">
                {t(language, 'supabaseApiSettings')}
              </a>{' '}
              {t(language, 'supabaseOptionalB')}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onGoogle}
                disabled={loading}
                className="interactive-chip flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
              >
                <GoogleGlyph />
                {loading ? t(language, 'pleaseWait') : t(language, 'continueWithGoogle')}
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center" aria-hidden>
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-wide">
                  <span className="bg-white px-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {t(language, 'orContinueWith')}
                  </span>
                </div>
              </div>

              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                <TabButton active={method === 'email'} onClick={() => switchMethod('email')}>
                  {t(language, 'email')}
                </TabButton>
                <TabButton active={method === 'phone'} onClick={() => switchMethod('phone')}>
                  {t(language, 'phone')}
                </TabButton>
              </div>

              <div className="mt-4 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
                <TabButton active={tab === 'signIn'} onClick={() => switchTab('signIn')}>
                  {t(language, 'signIn')}
                </TabButton>
                <TabButton active={tab === 'signUp'} onClick={() => switchTab('signUp')}>
                  {t(language, 'signUp')}
                </TabButton>
              </div>

              {method === 'email' ? (
                <form className="mt-5 space-y-4" onSubmit={tab === 'signIn' ? onSignIn : onSignUp}>
                  {tab === 'signUp' ? (
                    <Field
                      label={t(language, 'displayName')}
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t(language, 'greetLabel')}
                    />
                  ) : null}
                  <Field
                    label={t(language, 'email')}
                    type="email"
                    autoComplete={tab === 'signIn' ? 'email' : 'username'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <Field
                    label={t(language, 'password')}
                    type="password"
                    autoComplete={tab === 'signIn' ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t(language, 'minChars')}
                  />
                  {tab === 'signIn' ? (
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      disabled={loading}
                      className="interactive-chip rounded-lg border border-transparent px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
                    >
                      {t(language, 'forgotPassword')}
                    </button>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="interactive-strong w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? t(language, 'pleaseWait') : tab === 'signIn' ? t(language, 'signIn') : t(language, 'createAccount')}
                  </button>
                </form>
              ) : phoneStep === 'enterPhone' ? (
                <form className="mt-5 space-y-4" onSubmit={onSendPhoneCode}>
                  {tab === 'signUp' ? (
                    <Field
                      label={t(language, 'displayName')}
                      type="text"
                      autoComplete="name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t(language, 'greetLabel')}
                    />
                  ) : null}
                  <div className="block">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t(language, 'phoneNumber')}</span>
                    <div className="mt-2 flex gap-2">
                      <select 
                        value={countryCode} 
                        onChange={e => setCountryCode(e.target.value)}
                        className="w-[110px] rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+81">🇯🇵 +81</option>
                        <option value="+971">🇦🇪 +971</option>
                      </select>
                      <input
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t(language, 'phoneE164Hint')}</p>
                  <button
                    type="submit"
                    disabled={loading}
                    className="interactive-strong w-full rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {loading ? t(language, 'pleaseWait') : t(language, 'sendSmsCode')}
                  </button>
                </form>
              ) : (
                <form className="mt-5 space-y-4" onSubmit={onVerifyPhoneOtp}>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t(language, 'smsSentTo')} <span className="font-medium text-slate-900 dark:text-white">
                      {phone.trim().startsWith(countryCode.replace('+', '')) ? `+${phone.trim().replace(/^\+/, '')}` : `${countryCode}${phone.trim().replace(/^\+/, '')}`}
                    </span>
                  </p>
                  <Field
                    label={t(language, 'smsCode')}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={10}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        clearFeedback()
                        setPhoneStep('enterPhone')
                        setPhoneOtp('')
                      }}
                      className="interactive-chip flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                    >
                      {t(language, 'changeNumber')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="interactive-strong flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {loading ? t(language, 'pleaseWait') : t(language, 'verifyAndContinue')}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {error ? (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950/40 dark:text-green-300">
              {message}
            </p>
          ) : null}
        </div>

        {!isSupabaseConfigured ? (
          <form
            onSubmit={onGuestContinue}
            className="rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 dark:border-slate-600 dark:bg-slate-800/80"
          >
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t(language, 'continueOffline')}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t(language, 'practiceWithoutAccount')}</p>
            <label className="mt-4 block text-sm font-medium">{t(language, 'yourName')}</label>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t(language, 'learner')}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="interactive-strong mt-4 w-full rounded-xl bg-slate-800 px-4 py-3 text-base font-semibold text-white hover:bg-slate-900 dark:bg-blue-900 dark:hover:bg-blue-950"
            >
              {t(language, 'startLearning')}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}

function GoogleGlyph() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`interactive-chip flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-600 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, ...inputProps }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <input
        {...inputProps}
        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
      />
    </label>
  )
}
