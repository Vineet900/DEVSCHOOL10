import { supabase } from '../lib/supabase.js';
import { logger } from '../lib/logger.js';

// ─── DB-Based Settings Service ────────────────────────────────────────────────
// FIX #3: .env Runtime Mutation — settingsController was writing to .env file
//
// THE PROBLEM:
//   - Writing to .env at runtime causes container crashes (ephemeral FS)
//   - process.env mutation doesn't propagate across Node.js worker threads
//   - Any admin with access could inject malicious values into .env
//   - Race conditions possible with concurrent writes
//
// THE FIX:
//   - All settings stored in `app_settings` table in Supabase
//   - Protected by RLS (ADMIN write only)
//   - Loaded at request time, not at boot
//   - Simple in-memory cache (60s TTL) for performance
//   - process.env is NEVER mutated at runtime
//
// PREREQUISITE: Create the `app_settings` table in Supabase.
// See: sql/rls_policies.sql

interface SettingRow {
  key: string;
  value: string;
  updated_at: string;
}

// Simple in-memory cache to avoid DB hit on every AI request
const cache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 60 seconds

export class SettingsService {
  /**
   * Get a setting value by key.
   * Returns the cached value if fresh, otherwise fetches from DB.
   */
  async get(key: string): Promise<string | null> {
    // Check cache first
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      logger.warn('[SettingsService] Failed to fetch setting', { key, error: error.message });
      return null;
    }

    if (!data) return null;

    const row = data as SettingRow;

    // Cache the result
    cache.set(key, {
      value: row.value,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return row.value;
  }

  /**
   * Set a setting value. ONLY callable with admin-level service role.
   * Invalidates cache after update.
   * NEVER writes to .env or mutates process.env.
   */
  async set(
    key: string,
    value: string,
    adminId: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { key, value, updated_by: adminId, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      logger.error('[SettingsService] Failed to update setting', {
        key,
        adminId,
        error: error.message,
      });
      return false;
    }

    // Invalidate cache
    cache.delete(key);
    logger.info('[SettingsService] Setting updated', { key, adminId });
    return true;
  }

  /**
   * Get all settings (for admin panel).
   * Sensitive keys like API keys have their value masked.
   */
  async getAll(): Promise<Array<{ key: string; value: string; isSensitive: boolean }>> {
    const SENSITIVE_KEYS = ['GEMINI_API_KEY', 'OPENROUTER_API_KEY', 'SMTP_PASS'];

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, updated_at')
      .order('key');

    if (error || !data) return [];

    return (data as SettingRow[]).map((row) => ({
      key: row.key,
      // Mask sensitive values — show only last 4 chars
      value: SENSITIVE_KEYS.includes(row.key)
        ? `****${row.value.slice(-4)}`
        : row.value,
      isSensitive: SENSITIVE_KEYS.includes(row.key),
    }));
  }

  /** Invalidate entire cache — call after bulk updates */
  invalidateAll(): void {
    cache.clear();
  }
}

export const settingsService = new SettingsService();
