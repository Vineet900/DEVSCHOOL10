export const USERNAME_REGISTRY_KEY = 'devschool-usernames'
export const PASSWORD_MIN_LENGTH = 8
export const XP_PER_LEVEL = 120
export const DAILY_GOAL_LIMITS = { min: 1, max: 12 }
export const FOCUS_DURATION_LIMITS = { min: 15, max: 90 }

const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'contact',
  'dashboard',
  'devschool',
  'devschoolpro',
  'help',
  'login',
  'me',
  'mentor',
  'null',
  'privacy',
  'root',
  'settings',
  'support',
  'system',
  'terms',
  'undefined',
])

export function clampNumber(value, min, max, fallback = min) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, Math.round(parsed)))
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

export function isValidPhone(value) {
  return /^[+]?[0-9()\-\s]{7,20}$/.test(String(value || '').trim())
}

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 24)
}

export function deriveFallbackUsername({ name, email } = {}) {
  const fromEmail = String(email || '').trim().split('@')[0]
  const fromName = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
  return normalizeUsername(fromEmail || fromName || 'learner') || 'learner'
}

export function sanitizeProfileInput(profile = {}) {
  return {
    name: String(profile.name || '')
      .trim()
      .replace(/\s+/g, ' '),
    username: normalizeUsername(profile.username),
    email: String(profile.email || '').trim().toLowerCase(),
    phone: String(profile.phone || '').trim(),
    bio: String(profile.bio || '')
      .trim()
      .slice(0, 240),
    avatar: String(profile.avatar || ''),
  }
}

function readUsernameRegistry() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERNAME_REGISTRY_KEY) || '{}')
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed
    }
    return {}
  } catch {
    return {}
  }
}

function writeUsernameRegistry(registry) {
  try {
    localStorage.setItem(USERNAME_REGISTRY_KEY, JSON.stringify(registry))
  } catch {
    // Ignore storage failures. The main profile save still succeeds.
  }
}

export function getProfileOwnerKey(user = {}) {
  if (user?.id) return `user:${user.id}`
  return `guest:${normalizeUsername(user?.name) || 'learner'}`
}

export function isUsernameReserved(username) {
  return RESERVED_USERNAMES.has(normalizeUsername(username))
}

export function isUsernameAvailable(username, ownerKey) {
  const normalized = normalizeUsername(username)
  if (!normalized || isUsernameReserved(normalized)) return false
  const registry = readUsernameRegistry()
  return !registry[normalized] || registry[normalized] === ownerKey
}

export function reserveUsername(username, ownerKey, previousUsername = '') {
  const normalized = normalizeUsername(username)
  const previous = normalizeUsername(previousUsername)
  const registry = readUsernameRegistry()

  if (previous && previous !== normalized && registry[previous] === ownerKey) {
    delete registry[previous]
  }

  if (normalized) {
    registry[normalized] = ownerKey
  }

  writeUsernameRegistry(registry)
}

export function releaseUsername(username, ownerKey) {
  const normalized = normalizeUsername(username)
  if (!normalized) return
  const registry = readUsernameRegistry()
  if (registry[normalized] === ownerKey) {
    delete registry[normalized]
    writeUsernameRegistry(registry)
  }
}

export function resolveThemePreference(themePreference, systemPrefersDark = false) {
  if (themePreference === 'dark') return true
  if (themePreference === 'light') return false
  return Boolean(systemPrefersDark)
}

export function getLevelFromXp(xp) {
  return Math.max(1, Math.floor(Math.max(0, Number(xp || 0)) / XP_PER_LEVEL) + 1)
}

export function getLevelProgress(xp) {
  const normalizedXp = Math.max(0, Number(xp || 0))
  const current = normalizedXp % XP_PER_LEVEL
  const level = getLevelFromXp(normalizedXp)
  const percent = Math.round((current / XP_PER_LEVEL) * 100)

  return {
    level,
    current,
    required: XP_PER_LEVEL,
    percent,
  }
}

export function getWeeklyPoints(pointsHistory = [], now = Date.now()) {
  const weekAgo = now - 1000 * 60 * 60 * 24 * 7
  return pointsHistory.reduce((sum, entry) => {
    const amount = Number(entry?.amount || 0)
    const timestamp = Number(entry?.timestamp || 0)
    return timestamp >= weekAgo ? sum + amount : sum
  }, 0)
}

export function formatFocusDurationLabel(minutes) {
  const wholeMinutes = clampNumber(minutes, FOCUS_DURATION_LIMITS.min, FOCUS_DURATION_LIMITS.max, 25)
  if (wholeMinutes >= 60 && wholeMinutes % 60 === 0) {
    return `${wholeMinutes / 60} hr`
  }
  return `${wholeMinutes} min`
}
