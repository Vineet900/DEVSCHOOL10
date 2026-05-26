import { useState, useCallback, useEffect } from 'react'
import { getModelById } from '../lib/aiModels'

const STORAGE_PREFIX = 'devschoolpro-ai-quota-'

/**
 * Read quota record from localStorage for a given model.
 * Returns { count, date } where date is today's dateString.
 */
function readQuota(modelId) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + modelId)
    if (raw) {
      const parsed = JSON.parse(raw)
      const today = new Date().toDateString()
      if (parsed.date === today) {
        return { count: parsed.count ?? 0, date: today }
      }
    }
  } catch (_) {
    // ignore parse errors
  }
  return { count: 0, date: new Date().toDateString() }
}

/**
 * Write quota record to localStorage.
 */
function writeQuota(modelId, count) {
  const today = new Date().toDateString()
  localStorage.setItem(STORAGE_PREFIX + modelId, JSON.stringify({ count, date: today }))
}

/**
 * useAiQuota — track daily AI request usage per model.
 *
 * @param {string} modelId  — currently selected model ID
 * @returns {{
 *   used: number,
 *   remaining: number,
 *   limit: number,
 *   pct: number,
 *   status: 'ok' | 'warning' | 'danger' | 'exhausted',
 *   increment: () => void,
 *   reset: () => void
 * }}
 */
export function useAiQuota(modelId) {
  const model = getModelById(modelId)
  const [used, setUsed] = useState(() => readQuota(modelId).count)

  // When model changes, reload quota from storage
  useEffect(() => {
    setUsed(readQuota(modelId).count)
  }, [modelId])

  const increment = useCallback(() => {
    setUsed((prev) => {
      const next = prev + 1
      writeQuota(modelId, next)
      return next
    })
  }, [modelId])

  const reset = useCallback(() => {
    writeQuota(modelId, 0)
    setUsed(0)
  }, [modelId])

  const limit = model?.dailyLimit ?? 1500
  const remaining = Math.max(0, limit - used)
  const pct = Math.min(100, Math.round((used / limit) * 100))

  let status = 'ok'
  if (pct >= 100) status = 'exhausted'
  else if (pct >= 85) status = 'danger'
  else if (pct >= 60) status = 'warning'

  return { used, remaining, limit, pct, status, increment, reset }
}
