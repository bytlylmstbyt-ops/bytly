import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabase } from '@/lib/supabaseClient';

const { appId, token } = appParams;

// Base44 remains available for legacy features during the migration.
const base44BackendUrl = import.meta.env.DEV
  ? 'http://localhost:4400'
  : (import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://bytly.base44.app');

const base44Config = {
  appId,
  token,
  requiresAuth: false,
  serverUrl: base44BackendUrl,
  appBaseUrl: base44BackendUrl,
};

const legacyBase44 = createClient(base44Config);
const legacyAuthMe = legacyBase44.auth.me.bind(legacyBase44.auth);

// During the migration, old admin pages still call Base44's auth.me().
// Resolve the logged-in Supabase user first so the migration is invisible to them.
legacyBase44.auth.me = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role,email,full_name')
        .eq('id', user.id)
        .maybeSingle();

      const email = (user.email || '').trim().toLowerCase();
      const isOwner = email === 'bytlylmstbyt@gmail.com';
      return {
        id: user.id,
        user_id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '',
        role: isOwner || profile?.role === 'admin' ? 'admin' : (profile?.role || 'user'),
        profile,
      };
    }
  } catch (error) {
    console.warn('Supabase auth bridge failed; falling back to legacy auth.', error);
  }
  return legacyAuthMe();
};

// The platform-settings screen used Base44 UploadFile. Route that upload to
// Supabase Storage so the old "App not found" upload error disappears.
legacyBase44.integrations.Core.UploadFile = async ({ file }) => {
  if (!file) throw new Error('لم يتم اختيار ملف');
  const safeName = String(file.name || 'asset').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `platform/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from('platform-assets')
    .upload(path, file, { upsert: true, contentType: file.type || undefined, cacheControl: '3600' });
  if (error) throw error;
  const { data } = supabase.storage.from('platform-assets').getPublicUrl(path);
  return { file_url: data.publicUrl };
};

// Keep the existing AdminPlatformSettings UI while moving its PlatformSettings
// entity reads/writes to Supabase.
const legacyPlatformSettings = legacyBase44.entities.PlatformSettings;
legacyBase44.entities.PlatformSettings = {
  ...legacyPlatformSettings,
  list: async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) throw error;
    return data || [];
  },
  create: async (payload) => {
    const { data, error } = await supabase
      .from('platform_settings')
      .insert(payload)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
  update: async (id, payload) => {
    const { data, error } = await supabase
      .from('platform_settings')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};

export const base44 = legacyBase44;
