import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { supabase } from '@/lib/supabaseClient';

const { appId, token } = appParams;
const PLATFORM_OWNER_EMAIL = 'bytlylmstbyt@gmail.com';
const PLATFORM_OWNER_ID = '2d1b547d-ba5d-4cdc-a39c-cfb60d2f52bc';

const base44BackendUrl = import.meta.env.DEV
  ? 'http://localhost:4400'
  : (import.meta.env.VITE_BASE44_APP_BASE_URL || 'https://bytly.base44.app');

const base44Config = { appId, token, requiresAuth: false, serverUrl: base44BackendUrl, appBaseUrl: base44BackendUrl };
const legacyBase44 = createClient(base44Config);
const legacyAuthMe = legacyBase44.auth.me.bind(legacyBase44.auth);

// Supabase is authoritative for migrated authentication. Validate the user with
// getUser() first so admin pages do not race the local session cache.
legacyBase44.auth.me = async () => {
  try {
    if (supabase) {
      let sessionUser = null;
      try {
        const { data } = await supabase.auth.getUser();
        sessionUser = data?.user || null;
      } catch {}
      if (!sessionUser) {
        const { data } = await supabase.auth.getSession();
        sessionUser = data?.session?.user || null;
      }
      if (sessionUser) {
        const email = (sessionUser.email || '').trim().toLowerCase();
        const isOwner = sessionUser.id === PLATFORM_OWNER_ID || email === PLATFORM_OWNER_EMAIL;
        let profile = null;
        try {
          const { data } = await supabase.from('profiles').select('role,email,full_name').eq('id', sessionUser.id).maybeSingle();
          profile = data || null;
        } catch {}
        return {
          id: sessionUser.id,
          user_id: sessionUser.id,
          email: sessionUser.email,
          full_name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || '',
          role: isOwner || profile?.role === 'admin' ? 'admin' : (profile?.role || 'user'),
          profile,
        };
      }
    }
  } catch (error) {
    console.warn('Supabase auth bridge failed; falling back to legacy auth.', error);
  }
  return legacyAuthMe();
};

// The Agent page must never lose admin access just because its legacy
// conversation-history entity is unavailable during migration. Keep the
// history feature best-effort while auth remains authoritative in Supabase.
try {
  const legacyAgentConversation = legacyBase44.entities.AIAgentConversation;
  if (legacyAgentConversation?.filter) {
    const legacyAgentFilter = legacyAgentConversation.filter.bind(legacyAgentConversation);
    legacyAgentConversation.filter = async (...args) => {
      try {
        return await legacyAgentFilter(...args);
      } catch (error) {
        console.warn('AIAgentConversation history unavailable during migration:', error?.message || error);
        return [];
      }
    };
  }
} catch (error) {
  console.warn('Could not install AIAgentConversation compatibility guard:', error);
}

legacyBase44.integrations.Core.UploadFile = async ({ file }) => {
  if (!supabase) throw new Error('Supabase غير مهيأ');
  if (!file) throw new Error('لم يتم اختيار ملف');
  const safeName = String(file.name || 'asset').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `platform/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { data, error } = await supabase.storage.from('platform-assets').upload(path, file, {
    upsert: false,
    contentType: file.type || 'application/octet-stream',
    cacheControl: '3600',
  });
  if (error) {
    console.error('Supabase platform asset upload failed:', error);
    throw new Error(`فشل رفع الملف إلى التخزين: ${error.message || 'خطأ غير معروف'}`);
  }
  const { data: publicData } = supabase.storage.from('platform-assets').getPublicUrl(data?.path || path);
  return { file_url: publicData.publicUrl };
};

const legacyPlatformSettings = legacyBase44.entities.PlatformSettings;
legacyBase44.entities.PlatformSettings = {
  ...legacyPlatformSettings,
  list: async () => {
    const { data, error } = await supabase.from('platform_settings').select('*').order('updated_at', { ascending: false }).limit(1);
    if (error) throw error;
    return data || [];
  },
  create: async (payload) => {
    const { data, error } = await supabase.from('platform_settings').insert(payload).select('*').single();
    if (error) throw error;
    return data;
  },
  update: async (id, payload) => {
    const { data, error } = await supabase.from('platform_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
    if (error) throw error;
    return data;
  },
};

export const base44 = legacyBase44;
