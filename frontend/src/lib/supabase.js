import { createClient } from '@supabase/supabase-js'

export const customMockStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      try {
        const value = "; " + document.cookie;
        const parts = value.split("; " + encodeURIComponent(key) + "=");
        if (parts.length === 2) {
          return decodeURIComponent(parts.pop().split(";").shift());
        }
      } catch (cookieErr) {
        console.warn('Cookie read blocked:', cookieErr.message);
      }
      if (!globalThis.__memStore) globalThis.__memStore = {};
      return globalThis.__memStore[key] || null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {
      try {
        document.cookie = encodeURIComponent(key) + "=" + encodeURIComponent(value) + "; path=/; max-age=31536000; SameSite=Lax";
      } catch (cookieErr) {
        console.warn('Cookie write blocked:', cookieErr.message);
      }
      if (!globalThis.__memStore) globalThis.__memStore = {};
      globalThis.__memStore[key] = String(value);
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      try {
        document.cookie = encodeURIComponent(key) + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      } catch (cookieErr) {
        console.warn('Cookie remove blocked:', cookieErr.message);
      }
      if (!globalThis.__memStore) globalThis.__memStore = {};
      delete globalThis.__memStore[key];
    }
  }
};

// Vite only exposes env vars prefixed with VITE_.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

// Storage key derived from Supabase project ref
const projectRef = url ? new URL(url).hostname.split('.')[0] : 'devschool'
export const SUPABASE_STORAGE_KEY = `sb-${projectRef}-auth-token`

export const supabase = isSupabaseConfigured 
  ? createClient(url, anonKey, {
      auth: {
        storage: customMockStorage,
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true
      }
    }) 
  : null
