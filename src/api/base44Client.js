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

legacyBase44.auth.me = async () => {
  try {
    if (supabase) {
      let sessionUser = null;
      try { sessionUser = (await supabase.auth.getUser()).data?.user || null; } catch {}
      if (!sessionUser) {
        try { sessionUser = (await supabase.auth.getSession()).data?.session?.user || null; } catch {}
      }
      if (sessionUser) {
        const email = (sessionUser.email || '').trim().toLowerCase();
        const isOwner = sessionUser.id === PLATFORM_OWNER_ID || email === PLATFORM_OWNER_EMAIL;
        let profile = null;
        try { profile = (await supabase.from('profiles').select('role,email,full_name').eq('id', sessionUser.id).maybeSingle()).data || null; } catch {}
        return { id: sessionUser.id, user_id: sessionUser.id, email: sessionUser.email,
          full_name: profile?.full_name || sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || '',
          role: isOwner || profile?.role === 'admin' ? 'admin' : (profile?.role || 'user'), profile };
      }
    }
  } catch (error) { console.warn('Supabase auth bridge failed; falling back to legacy auth.', error); }
  return legacyAuthMe();
};

try {
  const legacyAgentConversation = legacyBase44.entities.AIAgentConversation;
  if (legacyAgentConversation?.filter) {
    const legacyAgentFilter = legacyAgentConversation.filter.bind(legacyAgentConversation);
    legacyAgentConversation.filter = async (...args) => {
      try { return await legacyAgentFilter(...args); }
      catch (error) { console.warn('AIAgentConversation history unavailable during migration:', error?.message || error); return []; }
    };
  }
} catch (error) { console.warn('Could not install AIAgentConversation compatibility guard:', error); }

const makeSupabaseEntity = ({ table, mapRow = (row) => row, orderBy = 'created_at', writeFields = null }) => {
  const cleanPayload = (payload = {}) => {
    if (!writeFields) return payload;
    return Object.fromEntries(Object.entries(payload).filter(([key]) => writeFields.includes(key) && payload[key] !== undefined));
  };
  const entity = {
    filter: async (filters = {}, sort = null, limit = null) => {
      if (!supabase) return [];
      let query = supabase.from(table).select('*');
      for (const [key, value] of Object.entries(filters || {})) {
        if (value !== undefined && value !== null && value !== '') query = query.eq(key, value);
      }
      if (sort) {
        const descending = String(sort).startsWith('-');
        let column = descending ? String(sort).slice(1) : String(sort);
        if (column === 'created_date') column = 'created_at';
        if (column === 'updated_date') column = 'updated_at';
        query = query.order(column || orderBy, { ascending: !descending });
      } else if (orderBy) query = query.order(orderBy, { ascending: false });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    list: async (sort = null, limit = null) => entity.filter({}, sort, limit),
    get: async (id) => {
      const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
    create: async (payload = {}) => {
      if (!supabase) throw new Error('Supabase غير مهيأ');
      const row = cleanPayload(payload);
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (writeFields?.includes('user_id') && authUser?.id && !row.user_id) row.user_id = authUser.id;
      if (writeFields?.includes('source') && !row.source) row.source = 'supabase_registration';
      const { data, error } = await supabase.from(table).insert(row).select('*').single();
      if (error) throw error;
      return mapRow(data);
    },
    update: async (id, payload = {}) => {
      const row = cleanPayload(payload);
      const { data, error } = await supabase.from(table).update(row).eq('id', id).select('*').single();
      if (error) throw error;
      return mapRow(data);
    },
  };
  return entity;
};

try {
  legacyBase44.entities.Engineer = makeSupabaseEntity({
    table: 'engineers', orderBy: 'rating',
    mapRow: (row) => ({ ...row, status: row.status || 'approved' }),
    writeFields: ['base44_id','full_name','email','phone','city','specialization','bio','is_verified','is_real','status','rating','user_id','source','created_at','updated_at']
  });
  legacyBase44.entities.EngineeringFirm = makeSupabaseEntity({
    table: 'engineering_firms', orderBy: 'created_at',
    writeFields: ['base44_id','company_name','email','phone','commercial_registration','municipality_license','city','country','website','team_size','specializations','is_verified','status','total_projects','active_projects','wallet_balance','is_real','owner_user_id','source','created_at','updated_at']
  });
  legacyBase44.entities.Client = makeSupabaseEntity({
    table: 'clients', orderBy: 'created_at',
    writeFields: ['base44_id','full_name','email','phone','city','country','client_type','company_name','trust_score','wallet_balance','total_projects','subscription_type','is_subscription_active','is_real','user_id','source','created_at','updated_at']
  });
  legacyBase44.entities.Portfolio = { filter: async () => [], list: async () => [] };
} catch (error) { console.warn('Could not install Supabase directory entity bridges:', error); }

legacyBase44.integrations.Core.UploadFile = async ({ file }) => {
  if (!supabase) throw new Error('Supabase غير مهيأ');
  if (!file) throw new Error('لم يتم اختيار ملف');
  const safeName = String(file.name || 'asset').replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `platform/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
  const { data, error } = await supabase.storage.from('platform-assets').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream', cacheControl: '3600' });
  if (error) { console.error('Supabase platform asset upload failed:', error); throw new Error(`فشل رفع الملف إلى التخزين: ${error.message || 'خطأ غير معروف'}`); }
  const { data: publicData } = supabase.storage.from('platform-assets').getPublicUrl(data?.path || path);
  return { file_url: publicData.publicUrl };
};

const legacyPlatformSettings = legacyBase44.entities.PlatformSettings;
legacyBase44.entities.PlatformSettings = {
  ...legacyPlatformSettings,
  list: async () => { const { data, error } = await supabase.from('platform_settings').select('*').order('updated_at', { ascending: false }).limit(1); if (error) throw error; return data || []; },
  create: async (payload) => { const { data, error } = await supabase.from('platform_settings').insert(payload).select('*').single(); if (error) throw error; return data; },
  update: async (id, payload) => { const { data, error } = await supabase.from('platform_settings').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select('*').single(); if (error) throw error; return data; },
};

export const base44 = legacyBase44;
