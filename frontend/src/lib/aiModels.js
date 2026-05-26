/**
 * Available Gemini AI Models for the Tutor page.
 * Free-tier limits sourced from: https://ai.google.dev/gemini-api/docs/rate-limits
 */
export const AI_MODELS = [
  {
    id: 'gemini-2.0-flash',
    label: 'Gemini 2.0 Flash',
    shortLabel: '2.0 Flash',
    badge: 'Standard',
    badgeColor: 'cyan',
    dailyLimit: 1500,
    rpm: 15,
    speed: 'fast',
    speedLabel: '⚡ Fast',
    description: 'Best all-rounder — great speed and quality for daily use',
    icon: '⚡',
  },
  {
    id: 'gemini-3-flash',
    label: 'Gemini 3.0 Flash',
    shortLabel: '3.0 Flash',
    badge: 'Next Gen',
    badgeColor: 'green',
    dailyLimit: 1500,
    rpm: 15,
    speed: 'fastest',
    speedLabel: '⚡⚡ Faster',
    description: 'Next-generation Gemini 3.0 Flash — smarter and faster',
    icon: '🚀',
  },
  {
    id: 'gemini-3.1-flash-live-preview',
    label: 'Gemini 3.1 Flash Live',
    shortLabel: '3.1 Live',
    badge: 'Real-time',
    badgeColor: 'cyan',
    dailyLimit: 1000,
    rpm: 10,
    speed: 'live',
    speedLabel: '🎙️ Live API',
    description: 'Gemini 3.1 Flash Live — optimized for low-latency interactive dialogue',
    icon: '🎙️',
  },
  {
    id: 'gemini-3.5-flash',
    label: 'Gemini 3.5 Flash',
    shortLabel: '3.5 Flash',
    badge: 'Recommended',
    badgeColor: 'purple',
    dailyLimit: 1500,
    rpm: 15,
    speed: 'fastest',
    speedLabel: '🧠 Smartest',
    description: "Google's newest high-efficiency model — near Pro-tier intelligence",
    icon: '🧠',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    shortLabel: '2.5 Pro',
    badge: 'Powerful',
    badgeColor: 'gold',
    dailyLimit: 50,
    rpm: 5,
    speed: 'slow',
    speedLabel: '💎 Premium',
    description: 'Highest quality — use sparingly (50 req/day only)',
    icon: '💎',
  },
]

export const DEFAULT_MODEL_ID = 'gemini-2.0-flash'

export function getModelById(id) {
  return AI_MODELS.find((m) => m.id === id) ?? AI_MODELS[0]
}
