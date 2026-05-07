import { createClient } from '@supabase/supabase-js'

// Vite only exposes env vars prefixed with VITE_. (Next.js uses NEXT_PUBLIC_* — not loaded here.)
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null

