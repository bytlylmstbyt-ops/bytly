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

// Supabase is authoritative for migrated authentication.
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

// Legacy Agent history is best-effort during migration. Its failure must not
// revoke an already validated Supabase admin session.
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

// Keep legacy page code working while its data source is migrated to Supabase.
const makeSupabaseEntity = ({ table, mapRow = (row) => row, orderBy = 'created_at' }) => ({
  filter: async (filters = {}, sort = null, limit = null) => {
    if (!supabase) return [];
    let query = supabase.from(table).select('*');
    for (const [key, value] of Object.entries(filters || {})) {
      if (value !== undefined && value !== null && value !== '') query = query.eq(key, value);
    }
    if (sort) {
      const descending = String(sort).startsWith('-');
      const column = descending ? String(sort).slice(1) : String(sort);
      query = query.order(column || orderBy, { ascending: !descending });
    } else if (orderBy) {
      query = query.order(orderBy, { ascending: false });
    }
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapRow);
  },
  list: async (sort = null, limit = null) => {
    return makeSupabaseEntity({ table, mapRow, orderBy }).filter({}, sort, limit);
  },
});

try {
  legacyBase44.entities.Engineer = makeSupabaseEntity({
    table: 'engineers',
    orderBy: 'rating',
    mapRow: (row) => ({ ...row, status: row.status || 'approved' }),
  });
  legacyBase44.entities.EngineeringFirm = makeSupabaseEntity({ table: 'engineering_firms', orderBy: 'created_at' });
  legacyBase44.entities.Client = makeSupabaseEntity({ table: 'clients', orderBy: 'created_at' });
  // Portfolio is not yet represented in the migrated schema. Return an empty
  // collection rather than failing Promise.all and hiding the engineer list.
  legacyBase44.entities.Portfolio = {
    filter: async () => [],
    list: async () => [],
  };
} catch (error) {
  console.warn('Could not install Supabase directory entity bridges:', error);
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
