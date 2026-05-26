import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// ─── Single Supabase Client ───────────────────────────────────────────────────
// ONE client with Service Role Key for all backend operations.
// Service Role bypasses RLS — this is intentional for server-side logic.
// RLS still protects at the DB policy level when using anon key from frontend.
//
// SECURITY NOTE: This client must NEVER be exposed to the frontend or mobile app.
// It is strictly server-side only.

if (!config.supabase.url || !config.supabase.serviceRoleKey) {
  throw new Error('[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'x-application-name': 'devschool-backend',
      },
    },
  }
);
