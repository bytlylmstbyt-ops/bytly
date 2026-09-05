import { createClient } from '@supabase/supabase-js';

// These are Supabase publishable client settings. They are safe to be present
// in the browser; database protection is enforced by Supabase Auth + RLS.
// Keep Vercel env vars as an override when they are configured.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wbqtgdkubrocnqnykhlt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_8dsKwVbalFlUNA65FJaWlA_1ch0TKfw';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
